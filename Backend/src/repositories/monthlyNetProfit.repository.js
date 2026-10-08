const MonthlyNetProfitSummary = require("../models/monthlyNetProfitSummary.model");

/**
 * Monthly Net Profit Repository Layer (Phase 9 - Task T56)
 * Manages materialized calendar-month Net Profit summaries.
 * All operations are strictly multi-tenant scoped by businessId.
 */
class MonthlyNetProfitRepository {
  /**
   * Upsert monthly Net Profit summary
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

    return await MonthlyNetProfitSummary.findOneAndUpdate(
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
    return await MonthlyNetProfitSummary.findOne({
      businessId,
      year: Number(year),
      month: Number(month),
    }).lean();
  }

  /**
   * Find summary by businessId and monthKey (e.g. "2026-10")
   */
  async findByMonthKey(businessId, monthKey) {
    return await MonthlyNetProfitSummary.findOne({
      businessId,
      monthKey: monthKey.trim(),
    }).lean();
  }

  /**
   * Find previous month's summary relative to given year & month
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
   * Find all monthly summaries for a business in a given calendar year
   */
  async findByBusinessAndYear(businessId, year) {
    return await MonthlyNetProfitSummary.find({
      businessId,
      year: Number(year),
    })
      .sort({ month: 1 })
      .lean();
  }

  /**
   * Delete all summaries for a business (used in tests / cleanup)
   */
  async deleteByBusinessId(businessId) {
    return await MonthlyNetProfitSummary.deleteMany({ businessId });
  }
}

module.exports = new MonthlyNetProfitRepository();
