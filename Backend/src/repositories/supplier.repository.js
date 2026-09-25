const mongoose = require("mongoose");
const Supplier = require("../models/supplier.model");

/**
 * Phase 6 - Task T37: Supplier Repository (Multi-Tenant Data Access Layer)
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
   * List Suppliers with search, filter, and pagination
   */
  async listSuppliers(businessId, options = {}) {
    const {
      search = "",
      status = "ACTIVE",
      page = 1,
      limit = 50,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = options;

    const query = { businessId };

    if (status && status !== "ALL") {
      query.status = status;
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
      ];
    }

    const skip = (Math.max(1, page) - 1) * Math.max(1, limit);
    const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

    const [suppliers, totalRecords] = await Promise.all([
      Supplier.find(query).sort(sort).skip(skip).limit(Math.max(1, limit)).lean(),
      Supplier.countDocuments(query),
    ]);

    return {
      suppliers,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        totalRecords,
        totalPages: Math.ceil(totalRecords / Math.max(1, limit)) || 1,
      },
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

    // Phone uniqueness check if phone is changing
    if (updateData.phone !== undefined) {
      const normalizedPhone = this.normalizePhone(updateData.phone);
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
      updateData.phone = normalizedPhone;
    }

    if (updateData.email !== undefined) {
      updateData.email = updateData.email.trim().toLowerCase();
    }
    if (updateData.gstin !== undefined) {
      updateData.gstin = updateData.gstin.trim().toUpperCase();
    }

    const updated = await Supplier.findOneAndUpdate(
      { _id: supplierId, businessId },
      { $set: updateData },
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
   * Count suppliers for business
   */
  async getSupplierCount(businessId, filter = {}) {
    return await Supplier.countDocuments({ businessId, ...filter });
  }
}

module.exports = new SupplierRepository();
