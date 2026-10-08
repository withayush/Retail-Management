const Business = require("../models/business.model");
const monthlyOpExService = require("../services/monthlyOpEx.service");

/**
 * Monthly OpEx Background Reconciliation Worker (Phase 8 - T51)
 * Periodically sweeps registered store tenants to consolidate calendar month OpEx totals,
 * detect reconciliation drift, and finalize closed past month statements.
 */
class MonthlyOpExWorker {
  constructor() {
    this.intervalId = null;
    this.isRunning = false;
  }

  /**
   * Run full sweep for all businesses for the target calendar year and month
   */
  async sweepAndConsolidateAllBusinesses(targetYear = null, targetMonth = null) {
    if (this.isRunning) {
      console.log("[MonthlyOpExWorker] Consolidation sweep already running. Skipping concurrent tick.");
      return;
    }

    this.isRunning = true;
    try {
      const now = new Date();
      const year = targetYear || now.getUTCFullYear();
      const month = targetMonth || now.getUTCMonth() + 1;

      const businesses = await Business.find({ isArchived: { $ne: true } }).select("_id name").lean();
      console.log(`[MonthlyOpExWorker] Starting OpEx consolidation sweep for ${businesses.length} businesses (${month}/${year})...`);

      let processedCount = 0;
      for (const b of businesses) {
        try {
          await monthlyOpExService.aggregateAndCacheMonth(b._id, year, month, "CRON_SYNC");
          processedCount++;
        } catch (err) {
          console.error(`[MonthlyOpExWorker] Error consolidating business ${b._id}:`, err.message);
        }
      }

      console.log(`[MonthlyOpExWorker] Completed OpEx consolidation sweep for ${processedCount}/${businesses.length} businesses.`);
    } catch (error) {
      console.error("[MonthlyOpExWorker] Fatal error during OpEx sweep:", error.message);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Start recurring background cron timer (e.g. daily interval)
   */
  startScheduler(intervalMs = 24 * 60 * 60 * 1000) {
    if (this.intervalId) return;

    // Run initial sweep shortly after startup (10 seconds delay)
    setTimeout(() => {
      this.sweepAndConsolidateAllBusinesses().catch(() => {});
    }, 10000);

    // Schedule regular sweep
    this.intervalId = setInterval(() => {
      this.sweepAndConsolidateAllBusinesses().catch(() => {});
    }, intervalMs);

    console.log("[MonthlyOpExWorker] Recurring OpEx Aggregator cron scheduler initialized.");
  }

  /**
   * Stop recurring background timer (used during tests or server shutdown)
   */
  stopScheduler() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log("[MonthlyOpExWorker] Recurring OpEx Aggregator cron scheduler stopped.");
    }
  }
}

const workerInstance = new MonthlyOpExWorker();
module.exports = workerInstance;
