const supplierService = require("../services/supplier.service");

/**
 * Phase 6 - Task T37: Supplier Controller
 */

// POST /api/suppliers
const createSupplier = async (req, res, next) => {
  try {
    const businessId = req.businessId;
    const { company, contactName, phone, email, address, city, state, pincode, gstin, notes, tags } = req.body;

    if (!company || !company.trim()) {
      return res.status(400).json({
        success: false,
        message: "Supplier company name is required.",
      });
    }

    const supplier = await supplierService.createSupplier(businessId, {
      company,
      contactName,
      phone,
      email,
      address,
      city,
      state,
      pincode,
      gstin,
      notes,
      tags,
    });

    return res.status(201).json({
      success: true,
      message: "Supplier created successfully.",
      data: supplier,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/suppliers
const getSuppliers = async (req, res, next) => {
  try {
    const businessId = req.businessId;
    const { search, status, page, limit, sortBy, sortOrder } = req.query;

    const result = await supplierService.getSuppliers(businessId, {
      search,
      status,
      page,
      limit,
      sortBy,
      sortOrder,
    });

    return res.status(200).json({
      success: true,
      data: result.suppliers,
      pagination: result.pagination,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/suppliers/:id
const getSupplierById = async (req, res, next) => {
  try {
    const businessId = req.businessId;
    const supplier = await supplierService.getSupplierById(businessId, req.params.id);

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: "Supplier not found in this business.",
      });
    }

    return res.status(200).json({
      success: true,
      data: supplier,
    });
  } catch (err) {
    next(err);
  }
};

// PUT /api/suppliers/:id
const updateSupplier = async (req, res, next) => {
  try {
    const businessId = req.businessId;
    const updated = await supplierService.updateSupplier(businessId, req.params.id, req.body);

    return res.status(200).json({
      success: true,
      message: "Supplier updated successfully.",
      data: updated,
    });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/suppliers/:id
const deleteSupplier = async (req, res, next) => {
  try {
    const businessId = req.businessId;
    const deleted = await supplierService.deleteSupplier(businessId, req.params.id);

    return res.status(200).json({
      success: true,
      message: "Supplier deactivated successfully.",
      data: deleted,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createSupplier,
  getSuppliers,
  getSupplierById,
  updateSupplier,
  deleteSupplier,
};
