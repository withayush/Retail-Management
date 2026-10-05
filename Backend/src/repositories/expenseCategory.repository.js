const ExpenseCategory = require("../models/expenseCategory.model");

/**
 * System Default Expense Categories
 * Standard operational expense headings common across retail and wholesale stores.
 */
const DEFAULT_EXPENSE_CATEGORIES = [
  {
    categoryName: "Rent",
    icon: "Building",
    color: "#FF9F0A",
    description: "Shop, warehouse, and office property lease & rental payments",
    budgetLimit: 0,
    isDefault: true,
    sortOrder: 1,
  },
  {
    categoryName: "Salary & Wages",
    icon: "Users",
    color: "#30D158",
    description: "Staff salaries, overtime, helper wages, and employee allowances",
    budgetLimit: 0,
    isDefault: true,
    sortOrder: 2,
  },
  {
    categoryName: "Electricity & Utilities",
    icon: "Zap",
    color: "#FFD60A",
    description: "Electricity bills, commercial power, and municipal utility fees",
    budgetLimit: 0,
    isDefault: true,
    sortOrder: 3,
  },
  {
    categoryName: "Internet & Phone",
    icon: "Wifi",
    color: "#64D2FF",
    description: "Shop broadband, POS SIM data cards, and landline bills",
    budgetLimit: 0,
    isDefault: true,
    sortOrder: 4,
  },
  {
    categoryName: "Transport & Logistics",
    icon: "Truck",
    color: "#BF5AF2",
    description: "Local freight, tempo charges, fuel, and courier deliveries",
    budgetLimit: 0,
    isDefault: true,
    sortOrder: 5,
  },
  {
    categoryName: "Repairs & Maintenance",
    icon: "Wrench",
    color: "#FF453A",
    description: "Racks, lighting, electrical repairs, and shop fixture maintenance",
    budgetLimit: 0,
    isDefault: true,
    sortOrder: 6,
  },
  {
    categoryName: "Marketing & Ads",
    icon: "Megaphone",
    color: "#FF375F",
    description: "Banners, WhatsApp campaigns, print flyers, and promotions",
    budgetLimit: 0,
    isDefault: true,
    sortOrder: 7,
  },
  {
    categoryName: "Packaging & Supplies",
    icon: "Package",
    color: "#AC8E68",
    description: "Carry bags, billing thermal rolls, packaging tape, and stationery",
    budgetLimit: 0,
    isDefault: true,
    sortOrder: 8,
  },
  {
    categoryName: "General & Miscellaneous",
    icon: "Tag",
    color: "#8E8E93",
    description: "Tea/refreshments, store cleaning, and other petty day-to-day overheads",
    budgetLimit: 0,
    isDefault: true,
    sortOrder: 9,
  },
];

/**
 * ExpenseCategory Repository Layer
 * Every query is strictly scoped to businessId to guarantee tenant isolation.
 */
class ExpenseCategoryRepository {
  /**
   * Create a single expense category
   */
  async createCategory({
    businessId,
    categoryName,
    description = "",
    icon = "Tag",
    color = "#8E8E93",
    budgetLimit = 0,
    isDefault = false,
    sortOrder = 0,
    session = null,
  }) {
    const docData = {
      businessId,
      categoryName: categoryName.trim(),
      description: description ? description.trim() : "",
      icon: icon || "Tag",
      color: color || "#8E8E93",
      budgetLimit: Number(budgetLimit) || 0,
      isDefault: Boolean(isDefault),
      isActive: true,
      isArchived: false,
      sortOrder: Number(sortOrder) || 0,
    };

    if (session) {
      const [created] = await ExpenseCategory.create([docData], { session });
      return created;
    }

    return await ExpenseCategory.create(docData);
  }

  /**
   * Find categories for a business with optional search and status filtering
   */
  async findCategoriesByBusinessId(businessId, filters = {}) {
    const query = {
      businessId,
    };

    // Filter by status (ACTIVE / INACTIVE / ALL)
    if (filters.status === "ACTIVE") {
      query.isActive = true;
      query.isArchived = { $ne: true };
    } else if (filters.status === "INACTIVE") {
      query.isActive = false;
    } else if (filters.includeArchived !== true && filters.status !== "ALL") {
      query.isArchived = { $ne: true };
    }

    // Optional text search across categoryName and description
    if (filters.search) {
      const searchRegex = new RegExp(filters.search.trim(), "i");
      query.$or = [
        { categoryName: searchRegex },
        { description: searchRegex },
      ];
    }

    // Default vs Custom filter
    if (filters.isDefault !== undefined && filters.isDefault !== null && filters.isDefault !== "") {
      query.isDefault = filters.isDefault === "true" || filters.isDefault === true;
    }

    let sortObj = { sortOrder: 1, categoryName: 1 };
    if (filters.sortBy === "name_asc") {
      sortObj = { categoryName: 1 };
    } else if (filters.sortBy === "name_desc") {
      sortObj = { categoryName: -1 };
    } else if (filters.sortBy === "recent") {
      sortObj = { createdAt: -1 };
    } else if (filters.sortBy === "budget") {
      sortObj = { budgetLimit: -1 };
    }

    return await ExpenseCategory.find(query).sort(sortObj);
  }

  /**
   * Find single category by ID and businessId
   */
  async findCategoryById(businessId, categoryId) {
    return await ExpenseCategory.findOne({
      _id: categoryId,
      businessId,
    });
  }

  /**
   * Find category by exact name (case-insensitive)
   */
  async findCategoryByName(businessId, categoryName, excludeId = null) {
    const query = {
      businessId,
      categoryName: { $regex: `^${categoryName.trim()}$`, $options: "i" },
      isArchived: { $ne: true },
    };

    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    return await ExpenseCategory.findOne(query);
  }

  /**
   * Update category fields by ID
   */
  async updateCategoryById(businessId, categoryId, updateData) {
    const cleanUpdate = {};
    if (updateData.categoryName !== undefined) cleanUpdate.categoryName = updateData.categoryName.trim();
    if (updateData.description !== undefined) cleanUpdate.description = updateData.description.trim();
    if (updateData.icon !== undefined) cleanUpdate.icon = updateData.icon.trim();
    if (updateData.color !== undefined) cleanUpdate.color = updateData.color.trim();
    if (updateData.budgetLimit !== undefined) cleanUpdate.budgetLimit = Math.max(0, Number(updateData.budgetLimit) || 0);
    if (updateData.sortOrder !== undefined) cleanUpdate.sortOrder = Number(updateData.sortOrder) || 0;
    if (updateData.isActive !== undefined) cleanUpdate.isActive = Boolean(updateData.isActive);

    return await ExpenseCategory.findOneAndUpdate(
      {
        _id: categoryId,
        businessId,
      },
      { $set: cleanUpdate },
      { returnDocument: "after", new: true, runValidators: true }
    );
  }

  /**
   * Soft-delete / Archive category
   */
  async archiveCategoryById(businessId, categoryId) {
    return await ExpenseCategory.findOneAndUpdate(
      {
        _id: categoryId,
        businessId,
      },
      {
        $set: {
          isActive: false,
          isArchived: true,
        },
      },
      { returnDocument: "after", new: true }
    );
  }

  /**
   * Restore archived/inactive category
   */
  async restoreCategoryById(businessId, categoryId) {
    return await ExpenseCategory.findOneAndUpdate(
      {
        _id: categoryId,
        businessId,
      },
      {
        $set: {
          isActive: true,
          isArchived: false,
        },
      },
      { returnDocument: "after", new: true }
    );
  }

  /**
   * Toggle active status
   */
  async toggleCategoryStatus(businessId, categoryId) {
    const existing = await this.findCategoryById(businessId, categoryId);
    if (!existing) return null;

    const newActive = !existing.isActive;
    return await ExpenseCategory.findOneAndUpdate(
      {
        _id: categoryId,
        businessId,
      },
      {
        $set: {
          isActive: newActive,
        },
      },
      { returnDocument: "after", new: true }
    );
  }

  /**
   * Seed default categories for a business tenant
   */
  async seedDefaultCategories(businessId, session = null) {
    const existingCategories = await ExpenseCategory.find({
      businessId,
      isArchived: { $ne: true },
    });

    const existingNames = new Set(
      existingCategories.map((c) => c.categoryName.toLowerCase().trim())
    );

    const categoriesToInsert = [];

    for (const def of DEFAULT_EXPENSE_CATEGORIES) {
      if (!existingNames.has(def.categoryName.toLowerCase().trim())) {
        categoriesToInsert.push({
          businessId,
          categoryName: def.categoryName,
          description: def.description,
          icon: def.icon,
          color: def.color,
          budgetLimit: def.budgetLimit || 0,
          isDefault: true,
          isActive: true,
          isArchived: false,
          sortOrder: def.sortOrder,
        });
      }
    }

    if (categoriesToInsert.length > 0) {
      if (session) {
        await ExpenseCategory.insertMany(categoriesToInsert, { session });
      } else {
        await ExpenseCategory.insertMany(categoriesToInsert);
      }
    }

    return await this.findCategoriesByBusinessId(businessId, { status: "ALL" });
  }

  /**
   * Count total categories for business
   */
  async countCategoriesByBusinessId(businessId) {
    return await ExpenseCategory.countDocuments({
      businessId,
      isArchived: { $ne: true },
    });
  }

  /**
   * Executive summary counts
   */
  async getCategorySummary(businessId) {
    const [total, active, inactive, customCount, defaultCount] = await Promise.all([
      ExpenseCategory.countDocuments({ businessId, isArchived: { $ne: true } }),
      ExpenseCategory.countDocuments({ businessId, isActive: true, isArchived: { $ne: true } }),
      ExpenseCategory.countDocuments({ businessId, isActive: false, isArchived: { $ne: true } }),
      ExpenseCategory.countDocuments({ businessId, isDefault: false, isArchived: { $ne: true } }),
      ExpenseCategory.countDocuments({ businessId, isDefault: true, isArchived: { $ne: true } }),
    ]);

    return {
      totalCategories: total,
      activeCategories: active,
      inactiveCategories: inactive,
      customCategories: customCount,
      defaultCategories: defaultCount,
    };
  }
}

module.exports = new ExpenseCategoryRepository();
module.exports.DEFAULT_EXPENSE_CATEGORIES = DEFAULT_EXPENSE_CATEGORIES;
