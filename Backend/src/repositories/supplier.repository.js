const mongoose = require("mongoose");
const { Supplier } = require("../models/supplier.model");

/**
 * Phase 6 - Task T37 & T38: Supplier Repository (Multi-Tenant Data Access Layer)
 */
class SupplierRepository {
  /**
   * Normalize Phone Number to standard E.164-compatible canonical string (+91XXXXXXXXXX)
   */
  normalizePhone(phone) {
    if (!phone || typeof phone !== "string") return "";
    const clean = phone.trim().replace(/[\s\-\(\)]/g, "");
    if (!clean) return "";
    if (clean.startsWith("+")) return clean;
    if (clean.length === 10) return `+91${clean}`;
    if (clean.startsWith("91") && clean.length === 12) return `+${clean}`;
    return clean;
  }

  /**
   * Create new Supplier under active business tenant
   */
  async createSupplier(businessId, supplierData) {
    const normalizedPhone = this.normalizePhone(supplierData.phone);

    // Duplicate check within same business tenant
    if (normalizedPhone) {
      const existing = await Supplier.findOne({
        businessId,
        phone: normalizedPhone,
      });

      if (existing) {
        const error = new Error(`Supplier with phone ${normalizedPhone} already exists in this business.`);
        error.statusCode = 409;
        error.code = "SUPPLIER_ALREADY_EXISTS";
        throw error;
      }
    }

    const supplier = new Supplier({
      businessId,
      company: supplierData.company?.trim(),
      contactName: supplierData.contactName?.trim() || "",
      phone: normalizedPhone,
      email: supplierData.email?.trim().toLowerCase() || "",
      address: supplierData.address?.trim() || "",
      city: supplierData.city?.trim() || "",
      state: supplierData.state?.trim() || "",
      pincode: supplierData.pincode?.trim() || "",
      gstin: supplierData.gstin?.trim().toUpperCase() || "",
      notes: supplierData.notes?.trim() || "",
      tags: Array.isArray(supplierData.tags) ? supplierData.tags.map((t) => t.trim()) : [],
      status: supplierData.status || "ACTIVE",
    });

    return await supplier.save();
  }

  /**
   * Find Supplier by ID strictly scoped to businessId
   */
  async findSupplierById(businessId, supplierId) {
    if (!mongoose.Types.ObjectId.isValid(supplierId)) return null;
    return await Supplier.findOne({
      _id: supplierId,
      businessId,
    });
  }

  /**
   * Find Supplier by phone strictly scoped to businessId
   */
  async findSupplierByPhone(businessId, phone) {
    const normalizedPhone = this.normalizePhone(phone);
    if (!normalizedPhone) return null;
    return await Supplier.findOne({
      businessId,
      phone: normalizedPhone,
    });
  }

  /**
   * Fast autocomplete search by company, contactName, phone, or email
   */
  async searchSuppliers(businessId, queryStr = "", limit = 10) {
    const lim = Math.max(1, Math.min(50, parseInt(limit, 10) || 10));
    if (!queryStr || !queryStr.trim()) {
      return await Supplier.find({ businessId, status: "ACTIVE" })
        .sort({ company: 1 })
        .limit(lim)
        .lean();
    }

    const term = queryStr.trim();
    const regex = new RegExp(term, "i");
    return await Supplier.find({
      businessId,
      status: "ACTIVE",
      $or: [
        { company: regex },
        { contactName: regex },
        { phone: regex },
        { email: regex },
        { city: regex },
      ],
    })
      .sort({ company: 1 })
      .limit(lim)
      .lean();
  }

  /**
   * List Suppliers with search, filter, and pagination
   */
  async listSuppliers(businessId, options = {}) {
    const {
      search = "",
      phone = "",
      status = "ACTIVE",
      hasBalance = false,
      city = "",
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = options;

    const query = { businessId };

    if (status && status !== "ALL") {
      query.status = status;
    } else if (!status) {
      query.status = { $ne: "INACTIVE" };
    }

    if (phone && phone.trim()) {
      const normalized = this.normalizePhone(phone);
      query.phone = { $regex: normalized || phone.trim(), $options: "i" };
    }

    if (city && city.trim()) {
      query.city = { $regex: city.trim(), $options: "i" };
    }

    if (hasBalance === "true" || hasBalance === true) {
      query.currentBalance = { $gt: 0 };
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), "i");
      query.$or = [
        { company: regex },
        { contactName: regex },
        { phone: regex },
        { email: regex },
        { city: regex },
        { gstin: regex },
        { address: regex },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;
    const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

    const [suppliers, totalRecords] = await Promise.all([
      Supplier.find(query).sort(sort).skip(skip).limit(limitNum).lean(),
      Supplier.countDocuments(query),
    ]);

    return {
      suppliers,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalRecords,
        totalPages: Math.ceil(totalRecords / limitNum) || 1,
      },
    };
  }

  /**
   * Summary KPI totals for supplier dashboard widgets
   */
  async getSupplierSummary(businessId) {
    const [totalSuppliers, activeSuppliers, inactiveSuppliers, balanceAggregate] = await Promise.all([
      Supplier.countDocuments({ businessId }),
      Supplier.countDocuments({ businessId, status: "ACTIVE" }),
      Supplier.countDocuments({ businessId, status: "INACTIVE" }),
      Supplier.aggregate([
        { $match: { businessId: new mongoose.Types.ObjectId(businessId) } },
        {
          $group: {
            _id: null,
            totalPayableOutstanding: { $sum: "$currentBalance" },
            totalPurchasesVolume: { $sum: "$totalPurchases" },
            suppliersWithPayablesCount: {
              $sum: { $cond: [{ $gt: ["$currentBalance", 0] }, 1, 0] },
            },
          },
        },
      ]),
    ]);

    const aggregate = balanceAggregate[0] || {
      totalPayableOutstanding: 0,
      totalPurchasesVolume: 0,
      suppliersWithPayablesCount: 0,
    };

    return {
      totalSuppliers,
      activeSuppliers,
      inactiveSuppliers,
      totalPayableOutstanding: aggregate.totalPayableOutstanding || 0,
      totalPurchasesVolume: aggregate.totalPurchasesVolume || 0,
      suppliersWithPayablesCount: aggregate.suppliersWithPayablesCount || 0,
    };
  }

  /**
   * Update Supplier details strictly scoped to businessId
   */
  async updateSupplier(businessId, supplierId, updateData) {
    if (!mongoose.Types.ObjectId.isValid(supplierId)) {
      const error = new Error("Invalid supplier ID.");
      error.statusCode = 400;
      throw error;
    }

    const existing = await this.findSupplierById(businessId, supplierId);
    if (!existing) {
      const error = new Error("Supplier not found in this business.");
      error.statusCode = 404;
      error.code = "SUPPLIER_NOT_FOUND";
      throw error;
    }

    const payload = { ...updateData };

    // Phone uniqueness check if phone is changing
    if (payload.phone !== undefined) {
      const normalizedPhone = this.normalizePhone(payload.phone);
      if (normalizedPhone && normalizedPhone !== existing.phone) {
        const phoneConflict = await Supplier.findOne({
          businessId,
          phone: normalizedPhone,
          _id: { $ne: supplierId },
        });

        if (phoneConflict) {
          const error = new Error(`Supplier with phone ${normalizedPhone} already exists in this business.`);
          error.statusCode = 409;
          error.code = "SUPPLIER_ALREADY_EXISTS";
          throw error;
        }
      }
      payload.phone = normalizedPhone;
    }

    if (payload.company !== undefined) {
      payload.company = payload.company.trim();
    }
    if (payload.contactName !== undefined) {
      payload.contactName = payload.contactName.trim();
    }
    if (payload.email !== undefined) {
      payload.email = payload.email.trim().toLowerCase();
    }
    if (payload.gstin !== undefined) {
      payload.gstin = payload.gstin.trim().toUpperCase();
    }
    if (payload.address !== undefined) {
      payload.address = payload.address.trim();
    }
    if (payload.city !== undefined) {
      payload.city = payload.city.trim();
    }
    if (payload.state !== undefined) {
      payload.state = payload.state.trim();
    }
    if (payload.pincode !== undefined) {
      payload.pincode = payload.pincode.trim();
    }
    if (payload.notes !== undefined) {
      payload.notes = payload.notes.trim();
    }

    const updated = await Supplier.findOneAndUpdate(
      { _id: supplierId, businessId },
      { $set: payload },
      { new: true, runValidators: true }
    );

    return updated;
  }

  /**
   * Soft delete / Deactivate Supplier strictly scoped to businessId
   */
  async deleteSupplier(businessId, supplierId) {
    return await this.updateSupplier(businessId, supplierId, { status: "INACTIVE" });
  }

  /**
   * Restore deactivated Supplier back to ACTIVE
   */
  async restoreSupplier(businessId, supplierId) {
    return await this.updateSupplier(businessId, supplierId, { status: "ACTIVE" });
  }

  /**
   * Count suppliers for business
   */
  async getSupplierCount(businessId, filter = {}) {
    return await Supplier.countDocuments({ businessId, ...filter });
  }

  /**
   * Phase 6 - Task T41: Supplier 360° Management Center Aggregator
   * Unifies supplier master profile, lifetime procurement spend, real-time payable debt,
   * recent purchase deliveries, recent payment disbursements, and activity stats into a single fast payload.
   */
  async getSupplier360Summary(businessId, supplierId) {
    if (!mongoose.Types.ObjectId.isValid(supplierId)) {
      const error = new Error("Invalid supplier ID.");
      error.statusCode = 400;
      throw error;
    }

    const { SupplierLedger } = require("../models/supplier.model");

    const [supplier, ledgerDoc] = await Promise.all([
      Supplier.findOne({ _id: supplierId, businessId }).lean(),
      SupplierLedger.findOne({ businessId, supplierId }).lean(),
    ]);

    if (!supplier) {
      const error = new Error("Supplier not found in this business.");
      error.statusCode = 404;
      error.code = "SUPPLIER_NOT_FOUND";
      throw error;
    }

    const allEntries = ledgerDoc ? ledgerDoc.entries || [] : [];

    // Filter recent purchases (up to 5 latest)
    const purchaseEntries = allEntries
      .filter((e) => e.entryType === "PURCHASE_CREDIT" || Number(e.invoiceValue || 0) > 0)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)
      .map((e) => ({
        _id: e._id,
        purchaseId: e.purchaseId || null,
        invoiceNumber: e.purchaseInvoiceNumber || "",
        invoiceValue: Number(e.invoiceValue || 0),
        balanceAfter: Number(e.balance !== undefined ? e.balance : e.balanceSnapshot || 0),
        notes: e.notes || "",
        createdAt: e.createdAt,
      }));

    // Filter recent payment disbursements (up to 5 latest)
    const paymentEntries = allEntries
      .filter((e) => e.entryType === "PAYMENT_MADE" || Number(e.paymentAmount || 0) > 0)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)
      .map((e) => ({
        _id: e._id,
        amount: Number(e.paymentAmount || 0),
        paymentMethod: e.paymentMethod || "CASH",
        referenceId: e.referenceId || "",
        balanceAfter: Number(e.balance !== undefined ? e.balance : e.balanceSnapshot || 0),
        notes: e.notes || "",
        createdAt: e.createdAt,
        recordedBy: e.createdByName || "Cashier",
      }));

    // Aggregate lifetime payments disbursed
    let totalPaymentsDisbursed = 0;
    let totalPurchasesFromLedger = 0;
    for (const e of allEntries) {
      totalPaymentsDisbursed += Number(e.paymentAmount || 0);
      totalPurchasesFromLedger += Number(e.invoiceValue || 0);
    }

    const lifetimeSpend = Number(supplier.totalPurchases || totalPurchasesFromLedger || 0);
    const ordersCount = Number(supplier.totalOrders || purchaseEntries.length || 0);
    const avgOrderVal = ordersCount > 0 ? Math.round((lifetimeSpend / ordersCount) * 100) / 100 : 0;

    return {
      profile: {
        id: supplier._id,
        _id: supplier._id,
        company: supplier.company,
        contactName: supplier.contactName || "",
        phone: supplier.phone || "",
        email: supplier.email || "",
        address: supplier.address || "",
        city: supplier.city || "",
        state: supplier.state || "",
        pincode: supplier.pincode || "",
        gstin: supplier.gstin || "",
        status: supplier.status || "ACTIVE",
        tags: supplier.tags || [],
        notes: supplier.notes || "",
        createdAt: supplier.createdAt,
        updatedAt: supplier.updatedAt,
      },
      metrics: {
        currentPayableOutstanding: Number(supplier.currentBalance || 0),
        totalPurchasesVolume: Math.round(lifetimeSpend * 100) / 100,
        totalPaymentsDisbursed: Math.round(totalPaymentsDisbursed * 100) / 100,
        totalOrdersCount: ordersCount,
        averageOrderValue: avgOrderVal,
        lastPurchaseDate: supplier.lastPurchaseDate || (purchaseEntries[0] ? purchaseEntries[0].createdAt : null),
        lastPaymentDate: supplier.lastPaymentDate || (paymentEntries[0] ? paymentEntries[0].createdAt : null),
        totalTransactionsCount: allEntries.length,
      },
      recentPurchases: purchaseEntries,
      recentPayments: paymentEntries,
    };
  }
}

module.exports = new SupplierRepository();

