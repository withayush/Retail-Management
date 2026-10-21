const mongoose = require("mongoose");
const { Supplier, SupplierLedger } = require("../models/supplier.model");

/**
 * Phase 9 - Task T58: Payables Consolidated Index Service
 * Formula: SUM(All outstanding Supplier Ledger active balances)
 * Consolidates supplier-level outstanding payable balances for the authenticated business.
 * Delivers gross supplier payables, net balances, supplier advances,
 * multi-tier debt aging (0-30d, 31-60d, 61-90d, 90+d), liability risk indicators, and top creditor ranking.
 */
class PayablesAnalyticsService {
  /**
   * Evaluate accounts payable risk & working capital liability profile
   */
  evaluateRiskProfile(aging, totalPayables) {
    if (!totalPayables || totalPayables <= 0) {
      return {
        rating: "NO_PAYABLES",
        label: "Zero Supplier Debt",
        color: "zinc",
        description: "No supplier payables currently outstanding across the business.",
      };
    }

    const ratio90Plus = (aging.bucket90Plus / totalPayables) * 100;
    const ratio61_90 = (aging.bucket61_90 / totalPayables) * 100;
    const ratio0_30 = (aging.bucket0_30 / totalPayables) * 100;

    if (ratio90Plus > 20 || (ratio90Plus + ratio61_90) > 35) {
      return {
        rating: "CRITICAL_OVERDUE",
        label: "Critical Supplier Dues",
        color: "rose",
        description: "Significant overdue supplier payables (> 60 days) require settlement to prevent supply disruptions.",
      };
    }

    if (ratio61_90 > 20 || (aging.bucket31_60 / totalPayables) * 100 > 40) {
      return {
        rating: "ATTENTION_REQUIRED",
        label: "Moderate Due Pressure",
        color: "amber",
        description: "Substantial payables maturing past 30 days. Plan cash disbursements.",
      };
    }

    if (ratio0_30 >= 70) {
      return {
        rating: "HEALTHY_FLOW",
        label: "Healthy Credit Cycle",
        color: "emerald",
        description: "Majority of supplier payables are fresh (0-30 days) and operating within normal procurement terms.",
      };
    }

    return {
      rating: "NORMAL",
      label: "Standard Payables Risk",
      color: "blue",
      description: "Supplier accounts payable are performing within normal retail parameters.",
    };
  }

  /**
   * Primary Consolidated Payables Index Aggregator (T58)
   */
  async getConsolidatedPayablesIndex(businessId, options = {}) {
    if (!businessId) {
      throw new Error("Business ID is required for multi-tenant isolation.");
    }

    const bId = new mongoose.Types.ObjectId(businessId);
    const topLimit = Math.min(100, Math.max(1, Number(options.limit) || 10));

    // 1. Fetch all supplier balance records for the business
    // Include all suppliers regardless of status (ACTIVE, INACTIVE, BLOCKED)
    // so archived suppliers with valid outstanding liabilities are never omitted
    const suppliers = await Supplier.find({ businessId: bId })
      .select("company contactName phone email gstin currentBalance totalPurchases totalOrders lastPaymentDate lastPurchaseDate status notes createdAt updatedAt")
      .lean();

    let grossPayables = 0; // Sum of positive balances (Business owing suppliers)
    let totalSupplierAdvances = 0; // Sum of negative balances (Advances / credit overpayments)
    let totalProcurementSpend = 0;

    let payableSuppliersCount = 0;
    let advanceSuppliersCount = 0;
    let zeroBalanceSuppliersCount = 0;

    const payablesList = [];
    const now = new Date();

    for (const s of suppliers) {
      const bal = Number(s.currentBalance) || 0;
      const purchases = Number(s.totalPurchases) || 0;
      totalProcurementSpend += purchases;

      if (bal > 0) {
        grossPayables += bal;
        payableSuppliersCount += 1;

        const daysSincePayment = s.lastPaymentDate
          ? Math.max(0, Math.floor((now - new Date(s.lastPaymentDate)) / (1000 * 60 * 60 * 24)))
          : null;

        const daysSincePurchase = s.lastPurchaseDate
          ? Math.max(0, Math.floor((now - new Date(s.lastPurchaseDate)) / (1000 * 60 * 60 * 24)))
          : null;

        payablesList.push({
          supplierId: s._id,
          company: s.company,
          contactName: s.contactName || "",
          phone: s.phone || "",
          email: s.email || "",
          gstin: s.gstin || "",
          status: s.status || "ACTIVE",
          currentBalance: Math.round(bal * 100) / 100,
          totalPurchases: Math.round(purchases * 100) / 100,
          totalOrders: s.totalOrders || 0,
          lastPaymentDate: s.lastPaymentDate || null,
          lastPurchaseDate: s.lastPurchaseDate || null,
          daysSincePayment,
          daysSincePurchase,
          supplierSince: s.createdAt,
        });
      } else if (bal < 0) {
        totalSupplierAdvances += Math.abs(bal);
        advanceSuppliersCount += 1;
      } else {
        zeroBalanceSuppliersCount += 1;
      }
    }

    // Sort creditors descending by balance
    payablesList.sort((a, b) => b.currentBalance - a.currentBalance);

    grossPayables = Math.round(grossPayables * 100) / 100;
    totalSupplierAdvances = Math.round(totalSupplierAdvances * 100) / 100;
    const netPayables = Math.round((grossPayables - totalSupplierAdvances) * 100) / 100;
    totalProcurementSpend = Math.round(totalProcurementSpend * 100) / 100;

    const totalSuppliers = suppliers.length;
    const payableSupplierRatio =
      totalSuppliers > 0 ? Math.round(((payableSuppliersCount / totalSuppliers) * 100) * 100) / 100 : 0;

    const averagePayablePerSupplier =
      payableSuppliersCount > 0 ? Math.round((grossPayables / payableSuppliersCount) * 100) / 100 : 0;

    const highestPayableSupplier = payablesList.length > 0 ? payablesList[0] : null;

    // 2. Multi-tier Consolidated Payables Aging (0-30d, 31-60d, 61-90d, 90+d)
    const aging = await this.calculateConsolidatedDebtAging(bId, grossPayables);

    // 3. Risk Profile
    const riskProfile = this.evaluateRiskProfile(aging, grossPayables);

    // 4. Fetch recent disbursement payouts
    const recentDisbursements = await this.getRecentDisbursements(bId, 6);

    return {
      indexName: "Payables Consolidated Index (Phase 9 - T58)",
      formula: "SUM(All outstanding Supplier Ledger active balances)",
      currency: "INR",
      asOfDate: new Date().toISOString(),

      // Canonical Totals (Matching PRD & Acceptance Criteria)
      totalPayables: grossPayables,
      suppliersWithOutstanding: payableSuppliersCount,
      grossPayables,
      netPayables,
      totalSupplierAdvances,

      // Supplier Counts & Demographic Ratios
      totalSuppliers,
      payableSuppliersCount,
      advanceSuppliersCount,
      zeroBalanceSuppliersCount,
      payableSupplierRatio,
      averagePayablePerSupplier,

      // Procurement Spend & Highest Creditor
      totalProcurementSpend,
      highestPayableSupplier,

      // Aging Breakdown
      aging,

      // Risk Health Indicator
      riskProfile,

      // Creditor Rankings & Activity
      topPayables: payablesList.slice(0, topLimit),
      recentDisbursements,

      note: "Payables represent money owed by the store to suppliers for delivered procurement under accrual accounting.",
    };
  }

  /**
   * Consolidated Payables Aging Calculation across supplier ledgers
   */
  async calculateConsolidatedDebtAging(businessId, totalGrossDebt) {
    const aging = {
      bucket0_30: 0,
      bucket31_60: 0,
      bucket61_90: 0,
      bucket90Plus: 0,
      totalAgedDebt: 0,
      shares: {
        share0_30: 0,
        share31_60: 0,
        share61_90: 0,
        share90Plus: 0,
      },
    };

    if (!totalGrossDebt || totalGrossDebt <= 0) {
      return aging;
    }

    const now = new Date();

    try {
      // Find all supplier ledgers for this business that have entries
      const ledgers = await SupplierLedger.find({ businessId })
        .select("supplierId balance entries")
        .lean();

      let allocatedDebtTotal = 0;

      for (const ledger of ledgers) {
        const suppBalance = Number(ledger.balance) || 0;
        if (suppBalance <= 0) continue;

        let remainingBalanceToAge = suppBalance;
        const entries = ledger.entries || [];

        // Traverse entries in reverse chronological order (FIFO debt aging against purchase credits)
        for (let i = entries.length - 1; i >= 0 && remainingBalanceToAge > 0; i--) {
          const entry = entries[i];
          const invoiceVal = Number(entry.invoiceValue) || 0;

          if (
            (entry.entryType === "PURCHASE_CREDIT" || invoiceVal > 0) &&
            invoiceVal > 0
          ) {
            const chunk = Math.min(remainingBalanceToAge, invoiceVal);
            remainingBalanceToAge -= chunk;
            allocatedDebtTotal += chunk;

            const entryDate = entry.createdAt ? new Date(entry.createdAt) : now;
            const ageDays = Math.max(0, Math.floor((now - entryDate) / (1000 * 60 * 60 * 24)));

            if (ageDays <= 30) {
              aging.bucket0_30 += chunk;
            } else if (ageDays <= 60) {
              aging.bucket31_60 += chunk;
            } else if (ageDays <= 90) {
              aging.bucket61_90 += chunk;
            } else {
              aging.bucket90Plus += chunk;
            }
          }
        }

        // If supplier has opening balance or balance not covered by recent purchase credits
        if (remainingBalanceToAge > 0) {
          aging.bucket0_30 += remainingBalanceToAge;
          allocatedDebtTotal += remainingBalanceToAge;
        }
      }

      // If supplier balance records exceed ledger calculations
      const unallocatedDelta = totalGrossDebt - allocatedDebtTotal;
      if (unallocatedDelta > 0) {
        aging.bucket0_30 += unallocatedDelta;
      }
    } catch (err) {
      console.warn("[PayablesAnalyticsService] Error calculating payables aging:", err.message);
      // Fallback: assign to fresh 0-30 bucket
      aging.bucket0_30 = totalGrossDebt;
    }

    aging.bucket0_30 = Math.round(aging.bucket0_30 * 100) / 100;
    aging.bucket31_60 = Math.round(aging.bucket31_60 * 100) / 100;
    aging.bucket61_90 = Math.round(aging.bucket61_90 * 100) / 100;
    aging.bucket90Plus = Math.round(aging.bucket90Plus * 100) / 100;
    aging.totalAgedDebt = Math.round(
      (aging.bucket0_30 + aging.bucket31_60 + aging.bucket61_90 + aging.bucket90Plus) * 100
    ) / 100;

    if (aging.totalAgedDebt > 0) {
      aging.shares.share0_30 = Math.round(((aging.bucket0_30 / aging.totalAgedDebt) * 100) * 100) / 100;
      aging.shares.share31_60 = Math.round(((aging.bucket31_60 / aging.totalAgedDebt) * 100) * 100) / 100;
      aging.shares.share61_90 = Math.round(((aging.bucket61_90 / aging.totalAgedDebt) * 100) * 100) / 100;
      aging.shares.share90Plus = Math.round(((aging.bucket90Plus / aging.totalAgedDebt) * 100) * 100) / 100;
    }

    return aging;
  }

  /**
   * Fetch recent payout disbursement transactions across supplier ledgers
   */
  async getRecentDisbursements(businessId, limit = 6) {
    try {
      const ledgers = await SupplierLedger.find({ businessId })
        .select("supplierId supplierCompany supplierPhone entries")
        .lean();

      const allDisbursements = [];

      for (const l of ledgers) {
        for (const e of l.entries || []) {
          if (
            e.entryType === "PAYMENT_MADE" ||
            (e.paymentAmount > 0 && e.entryType !== "PURCHASE_CREDIT")
          ) {
            allDisbursements.push({
              id: e._id,
              supplierId: l.supplierId,
              supplierCompany: l.supplierCompany,
              supplierPhone: l.supplierPhone,
              amount: e.paymentAmount || 0,
              paymentMethod: e.paymentMethod || "CASH",
              referenceId: e.referenceId || "",
              date: e.createdAt,
              balanceAfter: e.balance !== undefined ? e.balance : e.balanceSnapshot || 0,
              recordedBy: e.createdByName || "Cashier / Admin",
              notes: e.notes || "",
            });
          }
        }
      }

      allDisbursements.sort((a, b) => new Date(b.date) - new Date(a.date));
      return allDisbursements.slice(0, limit);
    } catch (err) {
      console.warn("[PayablesAnalyticsService] Error fetching recent disbursements:", err.message);
      return [];
    }
  }

  /**
   * Fast Snapshot of Total Payables (Optimized O(1) projection query)
   */
  async getPayablesSummaryOnly(businessId) {
    if (!businessId) throw new Error("Business ID required.");
    const bId = new mongoose.Types.ObjectId(businessId);

    const suppliers = await Supplier.find({ businessId: bId })
      .select("currentBalance")
      .lean();

    let totalPayables = 0;
    let payableCount = 0;
    let advanceTotal = 0;

    for (const s of suppliers) {
      const bal = Number(s.currentBalance) || 0;
      if (bal > 0) {
        totalPayables += bal;
        payableCount += 1;
      } else if (bal < 0) {
        advanceTotal += Math.abs(bal);
      }
    }

    const totalRounded = Math.round(totalPayables * 100) / 100;
    const advanceRounded = Math.round(advanceTotal * 100) / 100;

    return {
      totalPayables: totalRounded,
      currency: "INR",
      suppliersWithOutstanding: payableCount,
      grossPayables: totalRounded,
      totalSupplierAdvances: advanceRounded,
      netPayables: Math.round((totalRounded - advanceRounded) * 100) / 100,
      totalSuppliers: suppliers.length,
      averagePayablePerSupplier: payableCount > 0 ? Math.round((totalRounded / payableCount) * 100) / 100 : 0,
    };
  }
}

module.exports = new PayablesAnalyticsService();
