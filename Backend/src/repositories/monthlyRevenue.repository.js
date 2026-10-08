const MonthlyRevenueSummary = require("../models/monthlyRevenueSummary.model");

/**
 * Monthly Revenue Repository Layer (Phase 9 - Task T52)
 * Manages materialized calendar-month sales revenue summaries.
 * All queries are strictly multi-tenant scoped to businessId.
 */
class MonthlyRevenueRepository {
  /**
   * Upsert monthly revenue summary document
   */
  async upsertMonthlySummary(businessId, year, month, data) {
    const monthKey = `${year}-${String(month).padStart(2, "0")}`;

    const updatePayload = {
      ...data,
      businessId,
      year: Number(year),
      month: Number(month),
      monthKey,
      lastAggregatedAt: new Date(),
    };

    return await MonthlyRevenueSummary.findOneAndUpdate(
      {
        businessId,
        year: Number(year),
        month: Number(month),
      },
      {
        $set: updatePayload,
      },
      {
        upsert: true,
        returnDocument: "after",
        runValidators: true,
      }
    );
  }

  /**
   * Find summary by businessId, year and month
   */
  async findByBusinessAndMonth(businessId, year, month) {
    return await MonthlyRevenueSummary.findOne({
      businessId,
      year: Number(year),
      month: Number(month),
    }).lean();
  }

  /**
   * Find summary by businessId and monthKey (e.g. "2026-10")
   */
  async findByMonthKey(businessId, monthKey) {
    return await MonthlyRevenueSummary.findOne({
      businessId,
      monthKey: monthKey.trim(),
    }).lean();
  }

  /**
   * Find previous calendar month's summary
   */
  async findPreviousMonthSummary(businessId, year, month) {
    const numericYear = Number(year);
    const numericMonth = Number(month);

    let prevYear = numericYear;
    let prevMonth = numericMonth - 1;

    if (prevMonth === 0) {
      prevMonth = 12;
      prevYear = numericYear - 1;
    }

    return await this.findByBusinessAndMonth(businessId, prevYear, prevMonth);
  }

  /**
   * Find all monthly summaries for a given calendar year
   */
  async findByBusinessAndYear(businessId, year) {
    return await MonthlyRevenueSummary.find({
      businessId,
      year: Number(year),
    })
      .sort({ month: 1 })
      .lean();
  }

  /**
   * Find recent monthly revenue summaries
   */
  async findRecentMonths(businessId, limit = 12) {
    return await MonthlyRevenueSummary.find({
      businessId,
    })
      .sort({ year: -1, month: -1 })
      .limit(Math.min(36, Math.max(1, Number(limit) || 12)))
      .lean();
  }

  /**
   * Delete summaries for a business (used in tests / cleanup)
   */
  async deleteByBusinessId(businessId) {
    return await MonthlyRevenueSummary.deleteMany({ businessId });
  }
}

module.exports = new MonthlyRevenueRepository();
