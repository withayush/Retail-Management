const express = require("express");
const router = express.Router();
const supplierController = require("../controllers/supplier.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const { businessMiddleware } = require("../middlewares/business.middleware");

// Protect all supplier routes with Auth and Business Tenant validation
router.use(authMiddleware);
router.use(businessMiddleware);


// Standard REST CRUD endpoints for Supplier Master Entity
router.post("/", supplierController.createSupplier);
router.get("/", supplierController.getSuppliers);
router.get("/:id", supplierController.getSupplierById);
router.put("/:id", supplierController.updateSupplier);
router.delete("/:id", supplierController.deleteSupplier);

module.exports = router;
