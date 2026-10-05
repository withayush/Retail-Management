const mongoose = require("mongoose");
const Expense = require("../models/expense.model");
const counterRepository = require("./counter.repository");

/**
 * Expense Repository Layer
 * Every query is strictly anchored to businessId to guarantee tenant isolation.
 */
class ExpenseRepository {
  /**
   * Create a new expense record with atomic sequence generation
   */
  async createExpense({
    businessId,
    categoryId,
    categoryName,
    categoryIcon = "Tag",
    categoryColor = "#8E8E93",
    amount,
    expenseDate,
    paymentMethod = "CASH",
    referenceNumber = "",
    payee = "",
    description = "",
    taxAmount = 0,
    attachment = null,
    status = "PAID",
    createdBy = null,
    createdByName = "",
    session = null,
  }) {
    // Generate sequential expense number (e.g. EXP-1001)
    const expenseNumber = await counterRepository.generateNextExpenseNumber(businessId, session);

    const docData = {
      businessId,
      expenseNumber,
      categoryId,
      categoryName: categoryName.trim(),
      categoryIcon: categoryIcon || "Tag",
      categoryColor: categoryColor || "#8E8E93",
      amount: Number(amount),
      expenseDate: expenseDate ? new Date(expenseDate) : new Date(),
      paymentMethod: paymentMethod || "CASH",
      referenceNumber: referenceNumber ? referenceNumber.trim() : "",
      payee: payee ? payee.trim() : "",
      description: description ? description.trim() : "",
      taxAmount: Math.max(0, Number(taxAmount) || 0),
      attachment: attachment || { fileName: "", url: "", fileType: "", fileSize: 0 },
      status: status || "PAID",
      createdBy: createdBy || null,
      createdByName: createdByName ? createdByName.trim() : "",
      isArchived: false,
    };

    if (session) {
      const [created] = await Expense.create([docData], { session });
      return created;
    }

    return await Expense.create(docData);
  }

  /**
   * Find expenses with flexible filtering, search, and pagination
   */
  async findExpensesByBusinessId(businessId, filters = {}) {
    const query = {
      businessId,
      isArchived: { $ne: true },
    };

    // Category filter
    if (filters.categoryId) {
      query.categoryId = filters.categoryId;
    }

    // Payment method filter
    if (filters.paymentMethod && filters.paymentMethod !== "ALL") {
      query.paymentMethod = filters.paymentMethod.toUpperCase();
    }

    // Status filter
    if (filters.status && filters.status !== "ALL") {
      query.status = filters.status.toUpperCase();
    }

    // Month filter (e.g. "2026-10" or "YYYY-MM")
    if (filters.month && !filters.startDate && !filters.endDate) {
      const parts = filters.month.split("-");
      if (parts.length === 2) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        if (!isNaN(year) && !isNaN(month)) {
          const start = new Date(year, month - 1, 1);
          const end = new Date(year, month, 0, 23, 59, 59, 999);
          query.expenseDate = { $gte: start, $lte: end };
        }
      }
    } else if (filters.startDate || filters.endDate) {
      query.expenseDate = {};
      if (filters.startDate) {
        query.expenseDate.$gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999);
        query.expenseDate.$lte = end;
      }
    }

    // Search query (matches description, payee, referenceNumber, expenseNumber, categoryName)
    if (filters.search && filters.search.trim()) {
      const searchRegex = new RegExp(filters.search.trim(), "i");
      query.$or = [
        { expenseNumber: searchRegex },
        { categoryName: searchRegex },
        { payee: searchRegex },
        { description: searchRegex },
        { referenceNumber: searchRegex },
      ];
    }

    // Amount range
    if (filters.minAmount !== undefined && filters.minAmount !== "") {
      query.amount = { ...(query.amount || {}), $gte: Number(filters.minAmount) };
    }
    if (filters.maxAmount !== undefined && filters.maxAmount !== "") {
      query.amount = { ...(query.amount || {}), $lte: Number(filters.maxAmount) };
    }

    const page = Math.max(1, parseInt(filters.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(filters.limit, 10) || 20));
    const skip = (page - 1) * limit;

    let sortObj = { expenseDate: -1, createdAt: -1 };
    if (filters.sortBy === "amount_asc") sortObj = { amount: 1 };
    else if (filters.sortBy === "amount_desc") sortObj = { amount: -1 };
    else if (filters.sortBy === "date_asc") sortObj = { expenseDate: 1 };
    else if (filters.sortBy === "date_desc") sortObj = { expenseDate: -1 };

    const [expenses, totalCount] = await Promise.all([
      Expense.find(query)
        .populate("categoryId", "categoryName icon color budgetLimit isDefault")
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean(),
      Expense.countDocuments(query),
    ]);

    return {
      expenses,
      pagination: {
        page,
        limit,
        totalRecords: totalCount,
        totalPages: Math.ceil(totalCount / limit) || 1,
        hasNextPage: page * limit < totalCount,
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * Find single expense by ID and businessId
   */
  async findExpenseById(businessId, expenseId) {
    return await Expense.findOne({
      _id: expenseId,
      businessId,
    }).populate("categoryId", "categoryName icon color budgetLimit isDefault");
  }

  /**
   * Find single expense by expenseNumber and businessId
   */
  async findExpenseByNumber(businessId, expenseNumber) {
    return await Expense.findOne({
      businessId,
      expenseNumber: expenseNumber.toUpperCase().trim(),
    }).populate("categoryId", "categoryName icon color budgetLimit isDefault");
  }

  /**
   * Update an existing expense
   */
  async updateExpenseById(businessId, expenseId, updateData) {
    const cleanUpdate = {};
    if (updateData.amount !== undefined) cleanUpdate.amount = Number(updateData.amount);
    if (updateData.expenseDate !== undefined) cleanUpdate.expenseDate = new Date(updateData.expenseDate);
    if (updateData.paymentMethod !== undefined) cleanUpdate.paymentMethod = updateData.paymentMethod;
    if (updateData.referenceNumber !== undefined) cleanUpdate.referenceNumber = updateData.referenceNumber.trim();
    if (updateData.payee !== undefined) cleanUpdate.payee = updateData.payee.trim();
    if (updateData.description !== undefined) cleanUpdate.description = updateData.description.trim();
    if (updateData.taxAmount !== undefined) cleanUpdate.taxAmount = Math.max(0, Number(updateData.taxAmount) || 0);
    if (updateData.attachment !== undefined) cleanUpdate.attachment = updateData.attachment;
    if (updateData.status !== undefined) cleanUpdate.status = updateData.status;

    // If category was changed, snapshot updated category fields
    if (updateData.categoryId) cleanUpdate.categoryId = updateData.categoryId;
    if (updateData.categoryName) cleanUpdate.categoryName = updateData.categoryName;
    if (updateData.categoryIcon) cleanUpdate.categoryIcon = updateData.categoryIcon;
    if (updateData.categoryColor) cleanUpdate.categoryColor = updateData.categoryColor;

    return await Expense.findOneAndUpdate(
      {
        _id: expenseId,
        businessId,
      },
      { $set: cleanUpdate },
      { returnDocument: "after", new: true, runValidators: true }
    ).populate("categoryId", "categoryName icon color budgetLimit isDefault");
  }

  /**
   * Archive / soft-delete expense
   */
  async archiveExpenseById(businessId, expenseId) {
    return await Expense.findOneAndUpdate(
      {
        _id: expenseId,
        businessId,
      },
      { $set: { isArchived: true } },
      { returnDocument: "after", new: true }
    );
  }

  /**
   * Count expenses matching query
   */
  async countExpensesByBusinessId(businessId, query = {}) {
    return await Expense.countDocuments({
      businessId,
      isArchived: { $ne: true },
      ...query,
    });
  }

  /**
   * High-Performance Aggregated Expense Summary
   */
  async getExpenseSummary(businessId, dateFilters = {}) {
    const matchStage = {
      businessId: new mongoose.Types.ObjectId(businessId),
      isArchived: { $ne: true },
      status: { $ne: "CANCELLED" },
    };

    // Category filter in summary
    if (dateFilters.categoryId) {
      matchStage.categoryId = new mongoose.Types.ObjectId(dateFilters.categoryId);
    }

    // Month filter in summary (e.g. "2026-10" or "YYYY-MM")
    if (dateFilters.month && !dateFilters.startDate && !dateFilters.endDate) {
      const parts = dateFilters.month.split("-");
      if (parts.length === 2) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        if (!isNaN(year) && !isNaN(month)) {
          const start = new Date(year, month - 1, 1);
          const end = new Date(year, month, 0, 23, 59, 59, 999);
          matchStage.expenseDate = { $gte: start, $lte: end };
        }
      }
    } else if (dateFilters.startDate || dateFilters.endDate) {
      matchStage.expenseDate = {};
      if (dateFilters.startDate) matchStage.expenseDate.$gte = new Date(dateFilters.startDate);
      if (dateFilters.endDate) {
        const end = new Date(dateFilters.endDate);
        end.setHours(23, 59, 59, 999);
        matchStage.expenseDate.$lte = end;
      }
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [overallStats, categoryStats, methodStats, todayStats, monthStats] = await Promise.all([
      // 1. Overall stats
      Expense.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: "$amount" },
            totalTax: { $sum: "$taxAmount" },
            count: { $sum: 1 },
            avgAmount: { $avg: "$amount" },
          },
        },
      ]),

      // 2. Category-wise stats
      Expense.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: "$categoryId",
            categoryName: { $first: "$categoryName" },
            categoryIcon: { $first: "$categoryIcon" },
            categoryColor: { $first: "$categoryColor" },
            totalAmount: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
        { $sort: { totalAmount: -1 } },
      ]),

      // 3. Payment Method breakdown
      Expense.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: "$paymentMethod",
            totalAmount: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
        { $sort: { totalAmount: -1 } },
      ]),

      // 4. Today's total
      Expense.aggregate([
        {
          $match: {
            businessId: new mongoose.Types.ObjectId(businessId),
            isArchived: { $ne: true },
            status: { $ne: "CANCELLED" },
            expenseDate: { $gte: startOfToday },
          },
        },
        { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
      ]),

      // 5. This Month's total
      Expense.aggregate([
        {
          $match: {
            businessId: new mongoose.Types.ObjectId(businessId),
            isArchived: { $ne: true },
            status: { $ne: "CANCELLED" },
            expenseDate: { $gte: startOfMonth },
          },
        },
        { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
      ]),
    ]);

    const overall = overallStats[0] || { totalAmount: 0, totalTax: 0, count: 0, avgAmount: 0 };
    const today = todayStats[0] || { total: 0, count: 0 };
    const month = monthStats[0] || { total: 0, count: 0 };

    // Enrich category stats with budget limits and leakage calculation
    const ExpenseCategory = require("../models/expenseCategory.model");
    const allCategories = await ExpenseCategory.find({ businessId, isArchived: { $ne: true } }).lean();
    const catMap = new Map(allCategories.map((c) => [c._id.toString(), c]));

    const enrichedCategoryBreakdown = categoryStats.map((item) => {
      const catDoc = item._id ? catMap.get(item._id.toString()) : null;
      const budgetLimit = catDoc?.budgetLimit || 0;
      const totalAmount = item.totalAmount || 0;
      const percentageOfTotal = overall.totalAmount > 0
        ? Math.round((totalAmount / overall.totalAmount) * 1000) / 10
        : 0;

      return {
        ...item,
        budgetLimit,
        isOverBudget: budgetLimit > 0 && totalAmount > budgetLimit,
        budgetVariance: budgetLimit > 0 ? totalAmount - budgetLimit : 0,
        percentageOfTotal,
      };
    });

    return {
      totalExpenseAmount: overall.totalAmount || 0,
      totalTaxAmount: overall.totalTax || 0,
      totalExpensesCount: overall.count || 0,
      averageExpenseAmount: Math.round(overall.avgAmount || 0),
      todayExpenseAmount: today.total || 0,
      todayExpenseCount: today.count || 0,
      monthExpenseAmount: month.total || 0,
      monthExpenseCount: month.count || 0,
      categoryBreakdown: enrichedCategoryBreakdown,
      paymentMethodBreakdown: methodStats,
    };
  }
}

module.exports = new ExpenseRepository();
