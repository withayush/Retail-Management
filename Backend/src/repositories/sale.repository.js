const Invoice = require("../models/invoice.model");
const SaleItem = require("../models/saleItem.model");
const { Customer } = require("../models/customer.model");
const Product = require("../models/product.model");
const { Inventory, InventoryLedger } = require("../models/inventory.model");
const Payment = require("../models/payment.model");
const alertRepo = require("./inventoryAlert.repository");
const customerLedgerRepo = require("./customerLedger.repository");

/**
 * Phase 4 - Tasks T23, T24 & T25: Sale Transaction, Line Items & POS Checkout Repository
 * Atomic transaction execution with pre-flight inventory locks, rollback controls, and ledger audit.
 */

/**
 * Generates the next sequential invoice number for this business (e.g., INV-1001, INV-1002).
 */
const getNextInvoiceNumber = async (businessId, session = null) => {
  const count = await Invoice.countDocuments({ businessId }).session(session);
  let seq = 1001 + count;
  let candidate = `INV-${seq}`;

  // Check if candidate exists (in case of prior deletions or manual numbers)
  while (await Invoice.exists({ businessId, invoiceNumber: candidate }).session(session)) {
    seq++;
    candidate = `INV-${seq}`;
  }

  return candidate;
};

/**
 * Phase 4 - Task T25: Create Sale (POS Checkout) Atomic Database Execution
 */
const createSale = async (businessId, saleData, session = null) => {
  let {
    invoiceNumber,
    customerId,
    customerName,
    customerPhone,
    subtotal,
    discount = 0,
    tax = 0,
    total,
    paidAmount = 0,
    paymentStatus = "PAID",
    paymentMode = "CASH",
    status = "COMPLETED",
    createdBy = null,
    createdByName = "",
    notes = "",
    items = [],
    skipInventoryDeduction = false,
  } = saleData;

  const sessionOpt = session ? { session } : {};

  // Auto-generate invoice number if not provided
  if (!invoiceNumber || !invoiceNumber.trim()) {
    invoiceNumber = await getNextInvoiceNumber(businessId, session);
  } else {
    invoiceNumber = invoiceNumber.trim().toUpperCase();
  }

  // 1. Pre-Flight Verification & Snapshot Processing (T24 & T25)
  let processedItems = [];
  const inventoryUpdates = [];

  if (items && Array.isArray(items) && items.length > 0) {
    const productIds = items
      .map((it) => it.productId)
      .filter((id) => Boolean(id));

    // Fetch master products
    const dbProducts = await Product.find({
      _id: { $in: productIds },
      businessId,
    })
      .session(session)
      .lean();

    const productMap = new Map();
    for (const p of dbProducts) {
      productMap.set(p._id.toString(), p);
    }

    // Fetch existing inventory balances for pre-flight stock validation
    const dbInventories = await Inventory.find({
      businessId,
      productId: { $in: productIds },
    }).session(session);

    const inventoryMap = new Map();
    for (const inv of dbInventories) {
      inventoryMap.set(inv.productId.toString(), inv);
    }

    for (const item of items) {
      const prodIdStr = (item.productId?._id || item.productId || "").toString();
      const product = productMap.get(prodIdStr);

      if (!product) {
        const error = new Error(`Product ${prodIdStr} not found in this store.`);
        error.statusCode = 404;
        error.code = "PRODUCT_NOT_FOUND";
        throw error;
      }

      const resolvedName = (item.name || product.name || "Product Item").trim();
      const resolvedSku = (item.sku || product.sku || "").trim().toUpperCase();
      const resolvedUnit = (item.unit || product.unit || "pcs").trim();
      const resolvedSoldPrice = Number(item.soldPrice ?? item.sellingPrice ?? product.sellingPrice ?? 0);
      const resolvedCostPrice = Number(item.costPrice ?? product.costPrice ?? 0);
      const resolvedQty = Number(item.quantity || item.qty || 1);

      // Pre-Flight Stock Verification (Task T25 Insufficient Stock Guard)
      const existingInv = inventoryMap.get(prodIdStr);
      const currentAvailableStock = existingInv ? existingInv.availableStock : 0;

      if (!skipInventoryDeduction) {
        if (!existingInv || currentAvailableStock < resolvedQty) {
          const error = new Error(
            `Insufficient stock for '${resolvedName}'. Available: ${currentAvailableStock}, Requested: ${resolvedQty}`
          );
          error.statusCode = 400;
          error.code = "INSUFFICIENT_STOCK";
          error.productId = item.productId;
          error.productName = resolvedName;
          error.availableStock = currentAvailableStock;
          error.requestedQuantity = resolvedQty;
          throw error;
        }

        inventoryUpdates.push({
          inventory: existingInv,
          productId: product._id,
          productName: resolvedName,
          quantity: resolvedQty,
          previousStock: currentAvailableStock,
          newStock: currentAvailableStock - resolvedQty,
        });
      }

      const itemTotal = Math.round(resolvedSoldPrice * resolvedQty * 100) / 100;
      const grossProfit = Math.round((resolvedSoldPrice - resolvedCostPrice) * resolvedQty * 100) / 100;

      processedItems.push({
        productId: item.productId,
        name: resolvedName,
        sku: resolvedSku,
        unit: resolvedUnit,
        soldPrice: resolvedSoldPrice,
        costPrice: resolvedCostPrice,
        quantity: resolvedQty,
        totalPrice: itemTotal,
        grossProfit,
      });
    }
  }

  // Calculate clean mathematical totals
  let calcSubtotal = subtotal !== undefined
    ? Math.round(Number(subtotal) * 100) / 100
    : processedItems.reduce((acc, it) => acc + it.totalPrice, 0);
  calcSubtotal = Math.round(calcSubtotal * 100) / 100;

  const calcDiscount = Math.round(Number(discount) * 100) / 100;
  const calcTax = Math.round(Number(tax) * 100) / 100;

  let calcTotal = total !== undefined ? Number(total) : calcSubtotal - calcDiscount + calcTax;
  calcTotal = Math.max(0, Math.round(calcTotal * 100) / 100);

  let calcPaid = Math.round(Number(paidAmount) * 100) / 100;

  // Handle Credit / Udhar checkout mode defaults
  const isCreditMode = paymentMode === "CREDIT" || paymentMode === "CREDIT_UDHAR" || paymentMode === "UDHAR";
  if (isCreditMode) {
    paymentMode = "CREDIT_UDHAR";
    if (paidAmount === undefined || isNaN(calcPaid) || paidAmount === null) {
      calcPaid = 0;
    }
  }

  // If status is PAID and paidAmount was 0 or omitted (and not a credit sale), auto-set paidAmount = total
  if (!isCreditMode && paymentStatus === "PAID" && (calcPaid === 0 || isNaN(calcPaid)) && calcTotal > 0) {
    calcPaid = calcTotal;
  }

  // Auto-resolve payment status from paid amount if not cancelled
  let resolvedPaymentStatus = paymentStatus;
  if (paymentStatus !== "CANCELLED" && paymentStatus !== "FAILED") {
    if (calcPaid >= calcTotal && !isCreditMode) {
      resolvedPaymentStatus = "PAID";
    } else if (calcPaid > 0 && calcPaid < calcTotal) {
      resolvedPaymentStatus = "PARTIAL";
    } else if (calcPaid === 0 || isCreditMode) {
      resolvedPaymentStatus = calcPaid > 0 ? "PARTIAL" : "PENDING";
    }
  }

  const calcDue = Math.max(0, Math.round((calcTotal - calcPaid) * 100) / 100);

  // Validate that credit sales have customer information
  if (isCreditMode && calcDue > 0 && !customerId && (!customerPhone || !customerPhone.trim())) {
    const error = new Error("A registered customer or customer phone number is required for Credit / Udhaar sales.");
    error.statusCode = 400;
    error.code = "CUSTOMER_REQUIRED_FOR_CREDIT";
    throw error;
  }

  // If customerId is provided, enrich name/phone if empty
  if (customerId) {
    const customer = await Customer.findOne({ _id: customerId, businessId })
      .session(session)
      .select("name phone");
    if (customer) {
      if (!customerName || customerName === "Walk-in Customer") {
        customerName = customer.name;
      }
      if (!customerPhone) {
        customerPhone = customer.phone || "";
      }
    }
  }

  // 2. Create primary Sale / Invoice Header (Task T23)
  const [invoice] = await Invoice.create(
    [
      {
        businessId,
        invoiceNumber,
        customerId: customerId || null,
        customerName: customerName || "Walk-in Customer",
        customerPhone: customerPhone || "",
        subtotal: calcSubtotal,
        discount: calcDiscount,
        tax: calcTax,
        total: calcTotal,
        paidAmount: calcPaid,
        dueAmount: calcDue,
        paymentStatus: resolvedPaymentStatus,
        paymentMode,
        status,
        createdBy,
        createdByName,
        notes,
        items: processedItems,
      },
    ],
    sessionOpt
  );

  // 3. Persist granular SaleItem records for high-speed reporting (Task T24)
  if (processedItems.length > 0) {
    const saleItemDocs = processedItems.map((it) => ({
      businessId,
      saleId: invoice._id,
      productId: it.productId,
      name: it.name,
      sku: it.sku,
      unit: it.unit,
      soldPrice: it.soldPrice,
      costPrice: it.costPrice,
      quantity: it.quantity,
      totalPrice: it.totalPrice,
      grossProfit: it.grossProfit,
    }));
    await SaleItem.insertMany(saleItemDocs, sessionOpt);
  }

  // 4. Atomic Inventory Stock Deduction & Immutable Ledger OUT Logging (Task T19 & T16)
  if (!skipInventoryDeduction && inventoryUpdates.length > 0) {
    const ledgerDocs = [];

    for (const update of inventoryUpdates) {
      // Update inventory stock
      update.inventory.availableStock = update.newStock;
      update.inventory.lowStockAlert = update.newStock <= update.inventory.reorderLevel;
      await update.inventory.save(sessionOpt);

      // Create ledger entry
      ledgerDocs.push({
        businessId,
        productId: update.productId,
        qtyChange: -Math.abs(update.quantity),
        balanceAfter: update.newStock,
        type: "OUT",
        source: paymentMode === "CREDIT_UDHAR" ? "SALE" : "POS_CHECKOUT",
        referenceNumber: invoice.invoiceNumber,
        invoiceId: invoice._id,
        reason: `POS Sale Checkout #${invoice.invoiceNumber}`,
        createdBy,
        createdByName,
        notes: notes || `Auto-deducted for Invoice ${invoice.invoiceNumber}`,
      });
    }

    if (ledgerDocs.length > 0) {
      await InventoryLedger.insertMany(ledgerDocs, sessionOpt);
    }
  }

  // 5. Payment Transaction Linking (Task T28)
  if (calcPaid > 0) {
    let paymentMethod = paymentMode;
    if (paymentMode === "CREDIT_UDHAR") paymentMethod = "CASH";

    await Payment.create(
      [
        {
          businessId,
          invoiceId: invoice._id,
          customerId: invoice.customerId || null,
          amount: calcPaid,
          method: paymentMethod,
          referenceId: invoice.invoiceNumber,
          notes: `Initial checkout payment for #${invoice.invoiceNumber}`,
          createdBy,
          createdByName,
        },
      ],
      sessionOpt
    );
  } else if (isCreditMode) {
    await Payment.create(
      [
        {
          businessId,
          invoiceId: invoice._id,
          customerId: invoice.customerId || null,
          amount: calcDue,
          method: "CREDIT",
          referenceId: invoice.invoiceNumber,
          status: "PENDING",
          notes: `Credit / Udhaar purchase for #${invoice.invoiceNumber}`,
          createdBy,
          createdByName,
        },
      ],
      sessionOpt
    );
  }

  // 6. Phase 4 - Task T29: Customer Credit Integration Engine
  // If invoice has an outstanding due amount and customer is attached, route unpaid balance to Customer Ledger
  if (calcDue > 0 && (customerId || (customerPhone && customerPhone.trim()))) {
    const creditResult = await customerLedgerRepo.recordSaleCredit(
      {
        businessId,
        customerId: invoice.customerId,
        customerPhone: invoice.customerPhone,
        customerName: invoice.customerName,
        invoiceId: invoice._id,
        invoiceNumber: invoice.invoiceNumber,
        unpaidAmount: calcDue,
        notes: notes || `Credit sale against Invoice #${invoice.invoiceNumber}`,
        createdBy,
        createdByName,
      },
      session
    );

    if (creditResult.customer?.id && (!invoice.customerId || invoice.customerId.toString() !== creditResult.customer.id.toString())) {
      invoice.customerId = creditResult.customer.id;
      invoice.customerName = creditResult.customer.name;
      invoice.customerPhone = creditResult.customer.phone;
      await invoice.save(sessionOpt);
    }
  }

  // 7. Asynchronous Low-Stock Alerts Evaluation (T22)
  if (!skipInventoryDeduction && inventoryUpdates.length > 0) {
    for (const update of inventoryUpdates) {
      try {
        await alertRepo.evaluateAndSyncProductLowStockAlert({
          businessId,
          productId: update.productId,
          availableStock: update.newStock,
          reorderLevel: update.inventory.reorderLevel,
          productName: update.productName,
        });
      } catch (alertErr) {
        console.warn(`[AlertsSync] Error triggering alert for ${update.productName}:`, alertErr.message);
      }
    }
  }

  return invoice;
};

/**
 * Find sales with multi-filter search, date ranges, and pagination
 */
const findSales = async (businessId, filters = {}, pagination = { page: 1, limit: 20 }) => {
  const query = { businessId };

  // Payment Status filter
  if (filters.paymentStatus && filters.paymentStatus !== "ALL") {
    query.paymentStatus = filters.paymentStatus;
  }

  // Payment Mode filter
  if (filters.paymentMode && filters.paymentMode !== "ALL") {
    query.paymentMode = filters.paymentMode;
  }

  // Customer filter
  if (filters.customerId) {
    query.customerId = filters.customerId;
  }

  // Date Range filter
  if (filters.startDate || filters.endDate) {
    query.createdAt = {};
    if (filters.startDate) query.createdAt.$gte = new Date(filters.startDate);
    if (filters.endDate) query.createdAt.$lte = new Date(filters.endDate);
  }

  // Text Search
  if (filters.search && filters.search.trim()) {
    const term = filters.search.trim();
    query.$or = [
      { invoiceNumber: { $regex: term, $options: "i" } },
      { customerName: { $regex: term, $options: "i" } },
      { customerPhone: { $regex: term, $options: "i" } },
      { notes: { $regex: term, $options: "i" } },
    ];
  }

  const page = Math.max(1, parseInt(pagination.page, 10) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(pagination.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const [sales, total] = await Promise.all([
    Invoice.find(query)
      .populate("customerId", "name phone currentBalance creditLimit")
      .populate("createdBy", "fullName email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Invoice.countDocuments(query),
  ]);

  return {
    data: sales,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

/**
 * Get aggregate sales revenue summary
 */
const getSalesSummary = async (businessId) => {
  const invoices = await Invoice.find({ businessId, status: { $ne: "CANCELLED" } });

  let totalSalesAmount = 0;
  let totalPaidAmount = 0;
  let totalDueAmount = 0;
  let paidCount = 0;
  let pendingCount = 0;
  let partialCount = 0;

  for (const inv of invoices) {
    totalSalesAmount += inv.total || 0;
    totalPaidAmount += inv.paidAmount || 0;
    totalDueAmount += inv.dueAmount || 0;

    if (inv.paymentStatus === "PAID") paidCount++;
    else if (inv.paymentStatus === "PENDING") pendingCount++;
    else if (inv.paymentStatus === "PARTIAL") partialCount++;
  }

  return {
    totalSalesAmount: Math.round(totalSalesAmount * 100) / 100,
    totalPaidAmount: Math.round(totalPaidAmount * 100) / 100,
    totalDueAmount: Math.round(totalDueAmount * 100) / 100,
    totalInvoicesCount: invoices.length,
    paidCount,
    pendingCount,
    partialCount,
  };
};

/**
 * Find single invoice by ID
 */
const findSaleById = async (businessId, saleId) => {
  return await Invoice.findOne({ _id: saleId, businessId })
    .populate("customerId", "name phone currentBalance creditLimit")
    .populate("createdBy", "fullName email")
    .populate("items.productId", "name sku barcode sellingPrice costPrice unit");
};

/**
 * Find individual sale items by sale ID (Task T24)
 */
const findSaleItemsBySaleId = async (businessId, saleId) => {
  return await SaleItem.find({ businessId, saleId })
    .populate("productId", "name sku barcode sellingPrice costPrice unit")
    .sort({ createdAt: 1 });
};

/**
 * Gross Profit & COGS Analytics Report (Task T24)
 */
const getGrossProfitReport = async (businessId, filters = {}) => {
  const match = { businessId };
  if (filters.startDate || filters.endDate) {
    match.createdAt = {};
    if (filters.startDate) match.createdAt.$gte = new Date(filters.startDate);
    if (filters.endDate) match.createdAt.$lte = new Date(filters.endDate);
  }

  const items = await SaleItem.find(match);

  let totalRevenue = 0;
  let totalCostOfGoods = 0;
  let totalGrossProfit = 0;
  let totalUnitsSold = 0;

  const productAggMap = new Map();

  for (const it of items) {
    const rev = it.totalPrice || 0;
    const cost = (it.costPrice || 0) * (it.quantity || 1);
    const profit = it.grossProfit || rev - cost;

    totalRevenue += rev;
    totalCostOfGoods += cost;
    totalGrossProfit += profit;
    totalUnitsSold += it.quantity || 0;

    const prodKey = (it.productId || it.name).toString();
    const existing = productAggMap.get(prodKey) || {
      productId: it.productId,
      name: it.name,
      sku: it.sku,
      unit: it.unit,
      unitsSold: 0,
      revenue: 0,
      cost: 0,
      grossProfit: 0,
    };

    existing.unitsSold += it.quantity || 0;
    existing.revenue += rev;
    existing.cost += cost;
    existing.grossProfit += profit;
    productAggMap.set(prodKey, existing);
  }

  totalRevenue = Math.round(totalRevenue * 100) / 100;
  totalCostOfGoods = Math.round(totalCostOfGoods * 100) / 100;
  totalGrossProfit = Math.round(totalGrossProfit * 100) / 100;
  const overallMarginPercent =
    totalRevenue > 0 ? Math.round((totalGrossProfit / totalRevenue) * 10000) / 100 : 0;

  const productPerformance = Array.from(productAggMap.values())
    .map((p) => ({
      ...p,
      revenue: Math.round(p.revenue * 100) / 100,
      cost: Math.round(p.cost * 100) / 100,
      grossProfit: Math.round(p.grossProfit * 100) / 100,
      marginPercent: p.revenue > 0 ? Math.round((p.grossProfit / p.revenue) * 10000) / 100 : 0,
    }))
    .sort((a, b) => b.grossProfit - a.grossProfit);

  return {
    totalRevenue,
    totalCostOfGoods,
    totalGrossProfit,
    totalUnitsSold,
    overallMarginPercent,
    topProfitableProducts: productPerformance.slice(0, 10),
    allProductsPerformance: productPerformance,
  };
};

/**
 * Update payment status / settlement
 */
const updatePaymentStatus = async (businessId, saleId, updateData) => {
  const invoice = await Invoice.findOne({ _id: saleId, businessId });
  if (!invoice) {
    const error = new Error("Invoice / Sale transaction not found.");
    error.statusCode = 404;
    error.code = "SALE_NOT_FOUND";
    throw error;
  }

  const { paymentStatus, paidAmount, paymentMode, notes } = updateData;

  if (paidAmount !== undefined) {
    const newPaid = Math.round(Number(paidAmount) * 100) / 100;
    const diff = Math.round((newPaid - (invoice.paidAmount || 0)) * 100) / 100;
    if (diff > 0) {
      try {
        await Payment.create({
          businessId,
          invoiceId: invoice._id,
          customerId: invoice.customerId || null,
          amount: diff,
          method: paymentMode || invoice.paymentMode || "CASH",
          referenceId: null,
          notes: notes || `Settlement payment for #${invoice.invoiceNumber}`,
        });
      } catch (pErr) {
        console.warn("[PaymentSync] Warning creating payment record on settlement:", pErr.message);
      }
    }
    invoice.paidAmount = newPaid;
    invoice.dueAmount = Math.max(0, Math.round((invoice.total - newPaid) * 100) / 100);
  }

  if (paymentStatus) {
    invoice.paymentStatus = paymentStatus;
    if (paymentStatus === "PAID" && invoice.paidAmount < invoice.total) {
      const remainingDue = Math.round((invoice.total - invoice.paidAmount) * 100) / 100;
      if (remainingDue > 0) {
        try {
          await Payment.create({
            businessId,
            invoiceId: invoice._id,
            customerId: invoice.customerId || null,
            amount: remainingDue,
            method: paymentMode || invoice.paymentMode || "CASH",
            referenceId: null,
            notes: notes || `Full settlement for #${invoice.invoiceNumber}`,
          });
        } catch (pErr) {
          console.warn("[PaymentSync] Warning creating settlement record:", pErr.message);
        }
      }
      invoice.paidAmount = invoice.total;
      invoice.dueAmount = 0;
    }
  }

  if (paymentMode) invoice.paymentMode = paymentMode;
  if (notes !== undefined) invoice.notes = notes;

  return await invoice.save();
};

module.exports = {
  getNextInvoiceNumber,
  createSale,
  findSales,
  getSalesSummary,
  findSaleById,
  findSaleItemsBySaleId,
  getGrossProfitReport,
  updatePaymentStatus,
};

