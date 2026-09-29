const mongoose = require("mongoose");
const { Inventory, InventoryLedger } = require("../models/inventory.model");
const Product = require("../models/product.model");
const { Customer, CustomerLedger } = require("../models/customer.model");
const { Supplier, SupplierLedger } = require("../models/supplier.model");
const { withTransaction } = require("../utils/transaction");

/**
 * Reconciliation Service
 * Detects and repairs state drift across Inventory, Customer, and Supplier ledgers.
 * Ensures the core financial & inventory invariant:
 * Entity.balance / availableStock === SUM(Ledger.movements)
 */
class ReconciliationService {
  /**
   * Reconciles physical Inventory availableStock against the immutable InventoryLedger.
   */
  async reconcileInventory(businessId, autoFix = false, accountId = null, accountName = "") {
    const bId = typeof businessId === "string" ? new mongoose.Types.ObjectId(businessId) : businessId;

    // 1. Fetch all active products
    const products = await Product.find({ businessId: bId, isArchived: false })
      .select("_id name sku sellingPrice costPrice unit")
      .lean();

    const productIds = products.map((p) => p._id);

    // 2. Fetch all current Inventory states
    const inventories = await Inventory.find({ businessId: bId, productId: { $in: productIds } }).lean();
    const inventoryMap = new Map();
    inventories.forEach((inv) => inventoryMap.set(inv.productId.toString(), inv));

    // 3. Aggregate sum(qtyChange) from InventoryLedger
    const ledgerAggregates = await InventoryLedger.aggregate([
      { $match: { businessId: bId, productId: { $in: productIds } } },
      {
        $group: {
          _id: "$productId",
          totalLedgerQuantity: { $sum: "$qtyChange" },
          entriesCount: { $sum: 1 },
          lastEntryDate: { $max: "$createdAt" },
        },
      },
    ]);

    const ledgerMap = new Map();
    ledgerAggregates.forEach((agg) => ledgerMap.set(agg._id.toString(), agg));

    const discrepancies = [];
    let inSyncCount = 0;
    const fixedItems = [];

    for (const product of products) {
      const pIdStr = product._id.toString();
      const currentInv = inventoryMap.get(pIdStr);
      const ledgerData = ledgerMap.get(pIdStr);

      const actualStock = currentInv ? currentInv.availableStock : 0;
      const expectedStock = ledgerData ? ledgerData.totalLedgerQuantity : 0;
      const discrepancy = actualStock - expectedStock;

      if (discrepancy !== 0) {
        const itemReport = {
          productId: product._id,
          productName: product.name,
          sku: product.sku,
          actualStock,
          expectedStockFromLedger: expectedStock,
          discrepancy, // Positive = unbacked surplus, Negative = unrecorded shortage
          ledgerEntriesCount: ledgerData ? ledgerData.entriesCount : 0,
          status: "DISCREPANCY_DETECTED",
        };
        discrepancies.push(itemReport);

        // Auto-fix if requested
        if (autoFix) {
          await withTransaction(async (session) => {
            // Write reconciliation adjustment ledger entry so ledger matches reality, or sync inventory to ledger
            // Here: synchronize physical inventory state to authoritative ledger sum
            const updatedInv = await Inventory.findOneAndUpdate(
              { businessId: bId, productId: product._id },
              {
                $set: {
                  availableStock: expectedStock,
                  lowStockAlert: expectedStock <= (currentInv?.reorderLevel || 5),
                  updatedAt: new Date(),
                },
              },
              { new: true, upsert: true, session }
            );

            fixedItems.push({
              productId: product._id,
              productName: product.name,
              previousStock: actualStock,
              reconciledStock: expectedStock,
              fixedAt: new Date(),
            });
          });
        }
      } else {
        inSyncCount++;
      }
    }

    const totalProductsChecked = products.length;
    const healthScore = totalProductsChecked > 0
      ? Math.round((inSyncCount / totalProductsChecked) * 100)
      : 100;

    return {
      success: true,
      timestamp: new Date(),
      businessId: bId.toString(),
      totalProductsChecked,
      inSyncCount,
      discrepancyCount: discrepancies.length,
      healthScore, // Percentage of products in perfect ledger sync
      isHealthy: discrepancies.length === 0,
      discrepancies,
      autoFixed: autoFix,
      fixedItems: autoFix ? fixedItems : undefined,
    };
  }

  /**
   * Reconciles Customer currentBalance against CustomerLedger audit trail.
   */
  async reconcileCustomers(businessId, autoFix = false) {
    const bId = typeof businessId === "string" ? new mongoose.Types.ObjectId(businessId) : businessId;

    const customers = await Customer.find({ businessId: bId, isArchived: false })
      .select("_id name phone currentBalance creditLimit")
      .lean();

    const customerIds = customers.map((c) => c._id);
    const ledgers = await CustomerLedger.find({ businessId: bId, customerId: { $in: customerIds } }).lean();

    const ledgerMap = new Map();
    ledgers.forEach((lg) => ledgerMap.set(lg.customerId.toString(), lg));

    const discrepancies = [];
    let inSyncCount = 0;
    const fixedCustomers = [];

    for (const customer of customers) {
      const cIdStr = customer._id.toString();
      const ledgerDoc = ledgerMap.get(cIdStr);

      let authoritativeBalance = 0;
      let entriesCount = 0;

      if (ledgerDoc && ledgerDoc.entries && ledgerDoc.entries.length > 0) {
        entriesCount = ledgerDoc.entries.length;
        // Compute running balance: sum of debit amounts (sales/adjustments) minus credit payments
        let running = 0;
        for (const entry of ledgerDoc.entries) {
          if (entry.entryType === "SALE_CREDIT" || (entry.debit && entry.debit > 0)) {
            running += Number(entry.unpaidAmount || entry.debit || 0);
          } else if (entry.entryType === "PAYMENT_RECEIVED" || (entry.credit && entry.credit > 0)) {
            running -= Number(entry.paymentAmount || entry.credit || 0);
          } else if (entry.entryType === "DEBT_INCREASE") {
            running += Number(entry.debit || 0);
          } else if (entry.entryType === "DEBT_DECREASE") {
            running -= Number(entry.credit || 0);
          }
        }
        authoritativeBalance = Math.max(0, Math.round(running * 100) / 100);
      }

      const storedBalance = Number(customer.currentBalance || 0);
      const balanceDelta = Math.round((storedBalance - authoritativeBalance) * 100) / 100;

      if (Math.abs(balanceDelta) > 0.01) {
        discrepancies.push({
          customerId: customer._id,
          customerName: customer.name,
          customerPhone: customer.phone,
          storedBalance,
          authoritativeLedgerBalance: authoritativeBalance,
          discrepancy: balanceDelta,
          entriesCount,
          status: "BALANCE_MISMATCH",
        });

        if (autoFix) {
          await Customer.updateOne(
            { _id: customer._id, businessId: bId },
            { $set: { currentBalance: authoritativeBalance } }
          );
          if (ledgerDoc) {
            await CustomerLedger.updateOne(
              { _id: ledgerDoc._id },
              { $set: { balance: authoritativeBalance } }
            );
          }
          fixedCustomers.push({
            customerId: customer._id,
            customerName: customer.name,
            previousBalance: storedBalance,
            reconciledBalance: authoritativeBalance,
          });
        }
      } else {
        inSyncCount++;
      }
    }

    const totalCustomersChecked = customers.length;
    const healthScore = totalCustomersChecked > 0
      ? Math.round((inSyncCount / totalCustomersChecked) * 100)
      : 100;

    return {
      success: true,
      timestamp: new Date(),
      businessId: bId.toString(),
      totalCustomersChecked,
      inSyncCount,
      discrepancyCount: discrepancies.length,
      healthScore,
      isHealthy: discrepancies.length === 0,
      discrepancies,
      autoFixed: autoFix,
      fixedCustomers: autoFix ? fixedCustomers : undefined,
    };
  }

  /**
   * Reconciles Supplier currentBalance against SupplierLedger accounts payable.
   */
  async reconcileSuppliers(businessId, autoFix = false) {
    const bId = typeof businessId === "string" ? new mongoose.Types.ObjectId(businessId) : businessId;

    const suppliers = await Supplier.find({ businessId: bId, isArchived: false })
      .select("_id company phone currentBalance")
      .lean();

    const supplierIds = suppliers.map((s) => s._id);
    const ledgers = await SupplierLedger.find({ businessId: bId, supplierId: { $in: supplierIds } }).lean();

    const ledgerMap = new Map();
    ledgers.forEach((lg) => ledgerMap.set(lg.supplierId.toString(), lg));

    const discrepancies = [];
    let inSyncCount = 0;
    const fixedSuppliers = [];

    for (const supplier of suppliers) {
      const sIdStr = supplier._id.toString();
      const ledgerDoc = ledgerMap.get(sIdStr);

      let authoritativePayable = 0;
      let entriesCount = 0;

      if (ledgerDoc && ledgerDoc.entries && ledgerDoc.entries.length > 0) {
        entriesCount = ledgerDoc.entries.length;
        let running = 0;
        for (const entry of ledgerDoc.entries) {
          if (entry.entryType === "PURCHASE_CREDIT") {
            running += Number(entry.invoiceValue || 0);
          } else if (entry.entryType === "PAYMENT_MADE") {
            running -= Number(entry.paymentAmount || 0);
          } else if (entry.entryType === "PAYABLE_INCREASE") {
            running += Number(entry.invoiceValue || 0);
          } else if (entry.entryType === "PAYABLE_DECREASE") {
            running -= Number(entry.paymentAmount || 0);
          }
        }
        authoritativePayable = Math.max(0, Math.round(running * 100) / 100);
      }

      const storedBalance = Number(supplier.currentBalance || 0);
      const balanceDelta = Math.round((storedBalance - authoritativePayable) * 100) / 100;

      if (Math.abs(balanceDelta) > 0.01) {
        discrepancies.push({
          supplierId: supplier._id,
          supplierCompany: supplier.company,
          supplierPhone: supplier.phone,
          storedPayable: storedBalance,
          authoritativeLedgerPayable: authoritativePayable,
          discrepancy: balanceDelta,
          entriesCount,
          status: "PAYABLE_MISMATCH",
        });

        if (autoFix) {
          await Supplier.updateOne(
            { _id: supplier._id, businessId: bId },
            { $set: { currentBalance: authoritativePayable } }
          );
          if (ledgerDoc) {
            await SupplierLedger.updateOne(
              { _id: ledgerDoc._id },
              { $set: { balance: authoritativePayable } }
            );
          }
          fixedSuppliers.push({
            supplierId: supplier._id,
            supplierCompany: supplier.company,
            previousPayable: storedBalance,
            reconciledPayable: authoritativePayable,
          });
        }
      } else {
        inSyncCount++;
      }
    }

    const totalSuppliersChecked = suppliers.length;
    const healthScore = totalSuppliersChecked > 0
      ? Math.round((inSyncCount / totalSuppliersChecked) * 100)
      : 100;

    return {
      success: true,
      timestamp: new Date(),
      businessId: bId.toString(),
      totalSuppliersChecked,
      inSyncCount,
      discrepancyCount: discrepancies.length,
      healthScore,
      isHealthy: discrepancies.length === 0,
      discrepancies,
      autoFixed: autoFix,
      fixedSuppliers: autoFix ? fixedSuppliers : undefined,
    };
  }

  /**
   * Complete Cross-System Transaction Integrity Audit & Diagnostics Scan.
   */
  async runFullReconciliation(businessId, autoFix = false, accountId = null, accountName = "") {
    const [inventory, customers, suppliers] = await Promise.all([
      this.reconcileInventory(businessId, autoFix, accountId, accountName),
      this.reconcileCustomers(businessId, autoFix),
      this.reconcileSuppliers(businessId, autoFix),
    ]);

    const totalChecks =
      inventory.totalProductsChecked +
      customers.totalCustomersChecked +
      suppliers.totalSuppliersChecked;

    const totalInSync =
      inventory.inSyncCount +
      customers.inSyncCount +
      suppliers.inSyncCount;

    const overallHealthScore = totalChecks > 0
      ? Math.round((totalInSync / totalChecks) * 100)
      : 100;

    const overallStatus =
      inventory.isHealthy && customers.isHealthy && suppliers.isHealthy
        ? "ALL_SYSTEMS_IN_PERFECT_INTEGRITY"
        : "DISCREPANCIES_DETECTED";

    return {
      success: true,
      timestamp: new Date(),
      overallStatus,
      overallHealthScore,
      isHealthy: overallStatus === "ALL_SYSTEMS_IN_PERFECT_INTEGRITY",
      inventory,
      customers,
      suppliers,
    };
  }
}

module.exports = new ReconciliationService();
