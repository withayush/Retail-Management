const { tool } = require("@langchain/core/tools");
const { z } = require("zod");
const mongoose = require("mongoose");
const {
  Product,
  Inventory,
  Invoice,
  Customer,
  Supplier,
  PurchaseOrder,
  Expense,
  Business,
} = require("../models");

/**
 * Helper to ensure a valid businessId ObjectId exists.
 * Falls back to latest active business if running without explicit session.
 */
async function resolveBusinessId(providedId) {
  if (providedId && mongoose.Types.ObjectId.isValid(providedId)) {
    return new mongoose.Types.ObjectId(providedId);
  }
  const defaultBiz = await Business.findOne().sort({ createdAt: -1 }).select("_id");
  return defaultBiz?._id || null;
}

/**
 * Creates MongoDB-connected tools for LangChain agent
 * All tools are safe, READ-ONLY, and multi-tenant isolated by businessId.
 * @param {string|mongoose.Types.ObjectId} [activeBusinessId]
 */
function createDatabaseTools(activeBusinessId) {
  // ── Tool 1: Inventory & Stock Status ──
  const getStockAndInventoryTool = tool(
    async ({ lowStockOnly = false, search = "", limit = 15 }) => {
      try {
        const bId = await resolveBusinessId(activeBusinessId);
        const query = bId ? { businessId: bId } : {};

        if (lowStockOnly) {
          query.lowStockAlert = true;
        }

        const items = await Inventory.find(query)
          .populate("productId", "name sku sellingPrice costPrice unit barcode")
          .limit(Math.min(limit, 30))
          .lean();

        let filtered = items.filter((item) => item.productId);

        if (search && search.trim()) {
          const s = search.toLowerCase();
          filtered = filtered.filter(
            (item) =>
              item.productId?.name?.toLowerCase().includes(s) ||
              item.productId?.sku?.toLowerCase().includes(s)
          );
        }

        const formatted = filtered.map((item) => ({
          name: item.productId?.name || "Unknown Product",
          sku: item.productId?.sku || "N/A",
          availableStock: item.availableStock,
          reorderLevel: item.reorderLevel,
          status: item.availableStock <= item.reorderLevel ? "LOW_STOCK" : "HEALTHY",
          sellingPrice: item.productId?.sellingPrice || 0,
          unit: item.productId?.unit || "pcs",
        }));

        return JSON.stringify({
          totalFound: formatted.length,
          lowStockOnly,
          products: formatted,
        });
      } catch (err) {
        return JSON.stringify({ error: err.message });
      }
    },
    {
      name: "get_stock_and_inventory",
      description:
        "Fetches live stock and inventory records from MongoDB. Use this tool whenever the user asks about product stock, available inventory, or items running low.",
      schema: z.object({
        lowStockOnly: z
          .boolean()
          .optional()
          .describe("Set to true if user specifically asks for items low on stock or out of stock"),
        search: z
          .string()
          .optional()
          .describe("Search term for product name or SKU (e.g. 'Rice', 'Oil')"),
        limit: z
          .number()
          .optional()
          .describe("Maximum number of products to return (default 15)"),
      }),
    }
  );

  // ── Tool 2: Sales & Invoices ──
  const getSalesAndInvoicesTool = tool(
    async ({ paymentStatus, days = 30, limit = 15 }) => {
      try {
        const bId = await resolveBusinessId(activeBusinessId);
        const query = bId ? { businessId: bId } : {};

        if (paymentStatus && ["PAID", "PENDING", "PARTIAL"].includes(paymentStatus.toUpperCase())) {
          query.paymentStatus = paymentStatus.toUpperCase();
        }

        if (days && days > 0) {
          const sinceDate = new Date();
          sinceDate.setDate(sinceDate.getDate() - days);
          query.createdAt = { $gte: sinceDate };
        }

        const invoices = await Invoice.find(query)
          .sort({ createdAt: -1 })
          .limit(Math.min(limit, 30))
          .select("invoiceNumber customerName total paidAmount dueAmount paymentStatus paymentMode createdAt")
          .lean();

        const summary = invoices.reduce(
          (acc, inv) => {
            acc.totalRevenue += inv.total || 0;
            acc.totalDue += inv.dueAmount || 0;
            return acc;
          },
          { totalRevenue: 0, totalDue: 0 }
        );

        return JSON.stringify({
          periodDays: days,
          invoiceCount: invoices.length,
          totalRevenueSum: summary.totalRevenue,
          totalDueSum: summary.totalDue,
          recentInvoices: invoices.map((inv) => ({
            invoiceNumber: inv.invoiceNumber,
            customerName: inv.customerName,
            total: inv.total,
            dueAmount: inv.dueAmount,
            paymentStatus: inv.paymentStatus,
            paymentMode: inv.paymentMode,
            date: inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : "N/A",
          })),
        });
      } catch (err) {
        return JSON.stringify({ error: err.message });
      }
    },
    {
      name: "get_sales_and_invoices",
      description:
        "Fetches recent sales records, total revenue, pending customer invoices, and POS transactions from the database.",
      schema: z.object({
        paymentStatus: z
          .string()
          .optional()
          .describe("Filter by payment status: 'PAID', 'PENDING', or 'PARTIAL'"),
        days: z
          .number()
          .optional()
          .describe("Number of past days to look back for sales (e.g. 7 for past week, 30 for past month)"),
        limit: z
          .number()
          .optional()
          .describe("Max invoices to retrieve (default 15)"),
      }),
    }
  );

  // ── Tool 3: Customers & Khata (Udhaar) ──
  const getCustomersAndKhataTool = tool(
    async ({ hasOutstandingDue = false, search = "", limit = 15 }) => {
      try {
        const bId = await resolveBusinessId(activeBusinessId);
        const query = bId ? { businessId: bId } : {};

        if (hasOutstandingDue) {
          query.currentBalance = { $gt: 0 };
        }

        if (search && search.trim()) {
          query.$or = [
            { name: { $regex: search.trim(), $options: "i" } },
            { phone: { $regex: search.trim(), $options: "i" } },
          ];
        }

        const customers = await Customer.find(query)
          .sort({ currentBalance: -1 })
          .limit(Math.min(limit, 30))
          .select("name phone currentBalance creditLimit status")
          .lean();

        const totalKhataDebt = customers.reduce(
          (sum, c) => sum + (c.currentBalance > 0 ? c.currentBalance : 0),
          0
        );

        return JSON.stringify({
          count: customers.length,
          totalOutstandingDue: totalKhataDebt,
          customers: customers.map((c) => ({
            name: c.name,
            phone: c.phone || "No phone",
            udhaarDueBalance: c.currentBalance || 0,
            creditLimit: c.creditLimit || 0,
            status: c.status,
          })),
        });
      } catch (err) {
        return JSON.stringify({ error: err.message });
      }
    },
    {
      name: "get_customers_and_khata",
      description:
        "Fetches customers list, customer balances, and pending udhaar / khata debts from the MongoDB database.",
      schema: z.object({
        hasOutstandingDue: z
          .boolean()
          .optional()
          .describe("Set to true if asking for customers who owe money (udhaar / pending balance)"),
        search: z
          .string()
          .optional()
          .describe("Search customer by name or phone number"),
        limit: z
          .number()
          .optional()
          .describe("Max customers to return (default 15)"),
      }),
    }
  );

  // ── Tool 4: Suppliers & Purchase Orders ──
  const getSuppliersAndProcurementTool = tool(
    async ({ pendingOnly = false, limit = 15 }) => {
      try {
        const bId = await resolveBusinessId(activeBusinessId);
        const query = bId ? { businessId: bId } : {};

        const suppliers = await Supplier.find(query)
          .sort({ currentBalance: -1 })
          .limit(Math.min(limit, 20))
          .select("name phone currentBalance")
          .lean();

        const poQuery = bId ? { businessId: bId } : {};
        if (pendingOnly) {
          poQuery.status = { $in: ["PENDING", "APPROVED", "ORDERED", "DRAFT"] };
        }

        const purchaseOrders = await PurchaseOrder.find(poQuery)
          .sort({ createdAt: -1 })
          .limit(Math.min(limit, 10))
          .select("poNumber supplierName totalAmount status expectedDeliveryDate")
          .lean();

        return JSON.stringify({
          suppliersCount: suppliers.length,
          suppliers: suppliers.map((s) => ({
            name: s.name,
            phone: s.phone || "N/A",
            payableDueToSupplier: s.currentBalance || 0,
          })),
          recentPurchaseOrders: purchaseOrders.map((po) => ({
            poNumber: po.poNumber,
            supplierName: po.supplierName,
            totalAmount: po.totalAmount,
            status: po.status,
          })),
        });
      } catch (err) {
        return JSON.stringify({ error: err.message });
      }
    },
    {
      name: "get_suppliers_and_procurement",
      description:
        "Fetches suppliers list, amount owed to suppliers, and purchase orders from the database.",
      schema: z.object({
        pendingOnly: z
          .boolean()
          .optional()
          .describe("True to show only pending/unfulfilled purchase orders"),
        limit: z.number().optional().describe("Max records to fetch"),
      }),
    }
  );

  // ── Tool 5: Expenses Summary ──
  const getExpensesSummaryTool = tool(
    async ({ days = 30, limit = 15 }) => {
      try {
        const bId = await resolveBusinessId(activeBusinessId);
        const query = bId ? { businessId: bId } : {};

        if (days && days > 0) {
          const sinceDate = new Date();
          sinceDate.setDate(sinceDate.getDate() - days);
          query.date = { $gte: sinceDate };
        }

        const expenses = await Expense.find(query)
          .sort({ date: -1 })
          .limit(Math.min(limit, 30))
          .select("expenseNumber categoryName amount paymentMethod notes date")
          .lean();

        const totalExpenseAmount = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

        return JSON.stringify({
          periodDays: days,
          totalExpensesSum: totalExpenseAmount,
          expenses: expenses.map((e) => ({
            number: e.expenseNumber,
            category: e.categoryName,
            amount: e.amount,
            method: e.paymentMethod,
            date: e.date ? new Date(e.date).toLocaleDateString() : "N/A",
          })),
        });
      } catch (err) {
        return JSON.stringify({ error: err.message });
      }
    },
    {
      name: "get_expenses_summary",
      description:
        "Fetches business expenses, operational costs, and expense categories from MongoDB.",
      schema: z.object({
        days: z
          .number()
          .optional()
          .describe("Number of past days to query expenses (e.g. 30)"),
        limit: z.number().optional().describe("Max expense items to return"),
      }),
    }
  );

  // ── Tool 6: Business Health & Store KPI Overview ──
  const getBusinessOverviewMetricsTool = tool(
    async () => {
      try {
        const bId = await resolveBusinessId(activeBusinessId);
        const bQuery = bId ? { businessId: bId } : {};

        const [productCount, lowStockCount, invoiceCount, customerCount, supplierCount] =
          await Promise.all([
            Product.countDocuments(bQuery),
            Inventory.countDocuments({ ...bQuery, lowStockAlert: true }),
            Invoice.countDocuments(bQuery),
            Customer.countDocuments(bQuery),
            Supplier.countDocuments(bQuery),
          ]);

        // Aggregate last 30 days revenue
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const salesAgg = await Invoice.aggregate([
          { $match: { ...bQuery, createdAt: { $gte: thirtyDaysAgo } } },
          { $group: { _id: null, totalRevenue: { $sum: "$total" }, totalDue: { $sum: "$dueAmount" } } },
        ]);

        const customerDueAgg = await Customer.aggregate([
          { $match: { ...bQuery, currentBalance: { $gt: 0 } } },
          { $group: { _id: null, totalUdhaar: { $sum: "$currentBalance" } } },
        ]);

        const businessDoc = bId ? await Business.findById(bId).select("name businessName") : null;

        return JSON.stringify({
          businessName: businessDoc?.businessName || businessDoc?.name || "Vendor Store",
          totalRegisteredProducts: productCount,
          productsLowOnStock: lowStockCount,
          totalInvoicesIssued: invoiceCount,
          totalRegisteredCustomers: customerCount,
          totalSuppliers: supplierCount,
          revenueLast30Days: salesAgg[0]?.totalRevenue || 0,
          pendingCustomerUdhaarTotal: customerDueAgg[0]?.totalUdhaar || 0,
        });
      } catch (err) {
        return JSON.stringify({ error: err.message });
      }
    },
    {
      name: "get_business_overview_metrics",
      description:
        "Fetches comprehensive store KPIs and metrics: total products, low-stock count, 30-day revenue, active customer count, and total pending udhaar balance.",
      schema: z.object({}),
    }
  );

  return [
    getStockAndInventoryTool,
    getSalesAndInvoicesTool,
    getCustomersAndKhataTool,
    getSuppliersAndProcurementTool,
    getExpensesSummaryTool,
    getBusinessOverviewMetricsTool,
  ];
}

module.exports = {
  createDatabaseTools,
};
