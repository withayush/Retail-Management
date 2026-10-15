const mongoose = require("mongoose");
const { Customer, CustomerLedger } = require("../models/customer.model");
const Invoice = require("../models/invoice.model");

/**
 * Phase 9 - Task T57: Receivables Consolidated Index Service
 * Formula: SUM(All outstanding Customer Ledger active balances)
 * Consolidates customer-level outstanding credit balances for the authenticated business.
 * Delivers gross recoverable receivables, net balances, customer advances,
 * multi-tier debt aging (0-30d, 31-60d, 61-90d, 90+d), credit risk ratings, and top debtor ranking.
 */
class ReceivablesAnalyticsService {
  /**
   * Evaluate credit collection risk profile
   */
  evaluateRiskProfile(aging, totalReceivables) {
    if (!totalReceivables || totalReceivables <= 0) {
      return {
        rating: "NO_DEBT",
        label: "Zero Debt Exposure",
        color: "zinc",
        description: "No customer debt currently outstanding across the business.",
      };
    }

    const ratio90Plus = (aging.bucket90Plus / totalReceivables) * 100;
    const ratio61_90 = (aging.bucket61_90 / totalReceivables) * 100;
    const ratio0_30 = (aging.bucket0_30 / totalReceivables) * 100;

    if (ratio90Plus > 20 || (ratio90Plus + ratio61_90) > 35) {
      return {
        rating: "CRITICAL_OVERDUE",
        label: "Critical Collection Alert",
        color: "rose",
        description: "Significant overdue balances (> 60 days) require immediate follow-up to prevent bad debts.",
      };
    }

    if (ratio61_90 > 20 || (aging.bucket31_60 / totalReceivables) * 100 > 40) {
      return {
        rating: "ATTENTION_REQUIRED",
        label: "Moderate Aging Drag",
        color: "amber",
        description: "Substantial debt maturing past 30 days. Consider credit locks on aging accounts.",
      };
    }

    if (ratio0_30 >= 70) {
      return {
        rating: "HEALTHY_FLOW",
        label: "Healthy Credit Velocity",
        color: "emerald",
        description: "The majority of receivables are fresh (0-30 days) and operating within normal retail credit cycles.",
      };
    }

    return {
      rating: "NORMAL",
      label: "Standard Credit Risk",
      color: "blue",
      description: "Credit portfolio is performing within acceptable store parameters.",
    };
  }

  /**
   * Primary Consolidated Receivables Index Aggregator (T57)
   */
  async getConsolidatedReceivablesIndex(businessId, options = {}) {
    if (!businessId) {
      throw new Error("Business ID is required for multi-tenant isolation.");
    }

    const bId = new mongoose.Types.ObjectId(businessId);
    const topDebtorsLimit = Math.min(100, Math.max(1, Number(options.limit) || 10));

    // 1. Fetch all customer balance records for the business
    // Include all customers regardless of active/inactive, so outstanding debt is never obscured
    const customers = await Customer.find({ businessId: bId })
      .select("name phone currentBalance creditLimit status lastPaymentDate lastPurchaseDate createdAt updatedAt")
      .lean();

    let grossReceivables = 0; // Sum of positive balances (Customers owing money)
    let totalCustomerAdvances = 0; // Sum of negative balances (Advances / credit overpayments)
    let totalCreditLimit = 0;

    let debtorCustomersCount = 0;
    let advanceCustomersCount = 0;
    let zeroBalanceCustomersCount = 0;

    const debtorsList = [];

    const now = new Date();

    for (const c of customers) {
      const bal = Number(c.currentBalance) || 0;
      const limit = Number(c.creditLimit) || 0;
      totalCreditLimit += limit;

      if (bal > 0) {
        grossReceivables += bal;
        debtorCustomersCount += 1;

        const daysSincePayment = c.lastPaymentDate
          ? Math.max(0, Math.floor((now - new Date(c.lastPaymentDate)) / (1000 * 60 * 60 * 24)))
          : null;

        const daysSincePurchase = c.lastPurchaseDate
          ? Math.max(0, Math.floor((now - new Date(c.lastPurchaseDate)) / (1000 * 60 * 60 * 24)))
          : null;

        const availableCredit = limit > 0 ? Math.max(0, Math.round((limit - bal) * 100) / 100) : null;
        const utilization = limit > 0 ? Math.min(100, Math.round(((bal / limit) * 100) * 100) / 100) : null;

        debtorsList.push({
          customerId: c._id,
          name: c.name,
          phone: c.phone || "",
          status: c.status || "ACTIVE",
          currentBalance: Math.round(bal * 100) / 100,
          creditLimit: limit,
          availableCredit,
          utilizationPercentage: utilization,
          isLimitExceeded: limit > 0 && bal > limit,
          lastPaymentDate: c.lastPaymentDate || null,
          lastPurchaseDate: c.lastPurchaseDate || null,
          daysSincePayment,
          daysSincePurchase,
          customerSince: c.createdAt,
        });
      } else if (bal < 0) {
        totalCustomerAdvances += Math.abs(bal);
        advanceCustomersCount += 1;
      } else {
        zeroBalanceCustomersCount += 1;
      }
    }

    // Sort debtors descending by balance
    debtorsList.sort((a, b) => b.currentBalance - a.currentBalance);

    grossReceivables = Math.round(grossReceivables * 100) / 100;
    totalCustomerAdvances = Math.round(totalCustomerAdvances * 100) / 100;
    const netReceivables = Math.round((grossReceivables - totalCustomerAdvances) * 100) / 100;
    totalCreditLimit = Math.round(totalCreditLimit * 100) / 100;

    const totalCustomers = customers.length;
    const debtorRatio =
      totalCustomers > 0 ? Math.round(((debtorCustomersCount / totalCustomers) * 100) * 100) / 100 : 0;

    const averageReceivablePerDebtor =
      debtorCustomersCount > 0 ? Math.round((grossReceivables / debtorCustomersCount) * 100) / 100 : 0;

    const overallCreditUtilization =
      totalCreditLimit > 0 ? Math.round(((grossReceivables / totalCreditLimit) * 100) * 100) / 100 : 0;

    // 2. Multi-tier Consolidated Debt Aging (0-30d, 31-60d, 61-90d, 90+d)
    const aging = await this.calculateConsolidatedDebtAging(bId, grossReceivables);

    // 3. Risk Profile
    const riskProfile = this.evaluateRiskProfile(aging, grossReceivables);

    // 4. Fetch recent debt settlement repayments
    const recentRepayments = await this.getRecentRepayments(bId, 6);

    return {
      indexName: "Receivables Consolidated Index (Phase 9 - T57)",
      formula: "SUM(All outstanding Customer Ledger active balances)",
      currency: "INR",
      asOfDate: new Date().toISOString(),

      // Core Totals
      totalReceivables: grossReceivables, // Canonical gross recoverable debt
      grossReceivables,
      netReceivables,
      totalCustomerAdvances,

      // Customer Counts & Demographic Ratios
      totalCustomers,
      debtorCustomersCount,
      advanceCustomersCount,
      zeroBalanceCustomersCount,
      debtorRatio,
      averageReceivablePerDebtor,

      // Credit Facility Limits
      totalCreditLimit,
      overallCreditUtilization,

      // Aging Breakdown
      aging,

      // Risk Health Indicator
      riskProfile,

      // Debtor Rankings & Activity
      topDebtors: debtorsList.slice(0, topDebtorsLimit),
      recentRepayments,

      note: "Receivables represent money legally and commercially owed to the store by customers under accrual accounting. Cash has not yet been received.",
    };
  }

  /**
   * Consolidated Debt Aging Calculation across all customers and unpaid invoices
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

    // Query all unpaid invoices for this business (dueAmount > 0 and not CANCELLED)
    const unpaidInvoices = await Invoice.find({
      businessId,
      dueAmount: { $gt: 0 },
      status: { $ne: "CANCELLED" },
    })
      .select("dueAmount createdAt customerId")
      .lean();

    let invoiceDebtTotal = 0;

    for (const inv of unpaidInvoices) {
      const due = Number(inv.dueAmount) || 0;
      if (due <= 0) continue;

      invoiceDebtTotal += due;
      const ageDays = Math.max(0, Math.floor((now - new Date(inv.createdAt)) / (1000 * 60 * 60 * 24)));

      if (ageDays <= 30) {
        aging.bucket0_30 += due;
      } else if (ageDays <= 60) {
        aging.bucket31_60 += due;
      } else if (ageDays <= 90) {
        aging.bucket61_90 += due;
      } else {
        aging.bucket90Plus += due;
      }
    }

    // If customer balances exceed invoice due totals (e.g. legacy/opening credit balances or manual adjustments)
    const unallocatedDelta = totalGrossDebt - invoiceDebtTotal;
    if (unallocatedDelta > 0) {
      // Allocate delta to fresh bucket (0-30 days) or pro-rate
      aging.bucket0_30 += unallocatedDelta;
    }

    aging.bucket0_30 = Math.round(aging.bucket0_30 * 100) / 100;
    aging.bucket31_60 = Math.round(aging.bucket31_60 * 100) / 100;
    aging.bucket61_90 = Math.round(aging.bucket61_90 * 100) / 100;
    aging.bucket90Plus = Math.round(aging.bucket90Plus * 100) / 100;
    aging.totalAgedDebt = Math.round((aging.bucket0_30 + aging.bucket31_60 + aging.bucket61_90 + aging.bucket90Plus) * 100) / 100;

    if (aging.totalAgedDebt > 0) {
      aging.shares.share0_30 = Math.round(((aging.bucket0_30 / aging.totalAgedDebt) * 100) * 100) / 100;
      aging.shares.share31_60 = Math.round(((aging.bucket31_60 / aging.totalAgedDebt) * 100) * 100) / 100;
      aging.shares.share61_90 = Math.round(((aging.bucket61_90 / aging.totalAgedDebt) * 100) * 100) / 100;
      aging.shares.share90Plus = Math.round(((aging.bucket90Plus / aging.totalAgedDebt) * 100) * 100) / 100;
    }

    return aging;
  }

  /**
   * Fetch recent repayment transactions across customer sub-ledgers
   */
  async getRecentRepayments(businessId, limit = 6) {
    try {
      const ledgers = await CustomerLedger.find({ businessId })
        .select("customerId customerName customerPhone entries")
        .lean();

      const allRepayments = [];

      for (const l of ledgers) {
        for (const e of l.entries || []) {
          if (
            e.entryType === "PAYMENT_SETTLEMENT" ||
            e.entryType === "PAYMENT_RECEIVED" ||
            (e.debitAmount > 0 && e.entryType !== "SALE_CREDIT")
          ) {
            allRepayments.push({
              id: e._id,
              customerId: l.customerId,
              customerName: l.customerName,
              customerPhone: l.customerPhone,
              amount: e.debitAmount || e.creditAmount || 0,
              paymentMethod: e.paymentMethod || "CASH",
              date: e.createdAt,
              balanceAfter: e.balance !== undefined ? e.balance : e.balanceSnapshot || 0,
              recordedBy: e.createdByName || "Cashier",
              notes: e.notes || "",
            });
          }
        }
      }

      allRepayments.sort((a, b) => new Date(b.date) - new Date(a.date));
      return allRepayments.slice(0, limit);
    } catch (err) {
      console.warn("[ReceivablesAnalyticsService] Error fetching recent repayments:", err.message);
      return [];
    }
  }

  /**
   * Fast Snapshot of Total Receivables (Optimized O(1) projection query)
   */
  async getReceivablesSummaryOnly(businessId) {
    if (!businessId) throw new Error("Business ID required.");
    const bId = new mongoose.Types.ObjectId(businessId);

    const customers = await Customer.find({ businessId: bId }).select("currentBalance").lean();

    let totalReceivables = 0;
    let debtorCount = 0;
    let advanceTotal = 0;

    for (const c of customers) {
      const bal = Number(c.currentBalance) || 0;
      if (bal > 0) {
        totalReceivables += bal;
        debtorCount += 1;
      } else if (bal < 0) {
        advanceTotal += Math.abs(bal);
      }
    }

    return {
      totalReceivables: Math.round(totalReceivables * 100) / 100,
      totalCustomerAdvances: Math.round(advanceTotal * 100) / 100,
      netReceivables: Math.round((totalReceivables - advanceTotal) * 100) / 100,
      debtorCustomersCount: debtorCount,
      totalCustomers: customers.length,
      currency: "INR",
    };
  }
}

module.exports = new ReceivablesAnalyticsService();
