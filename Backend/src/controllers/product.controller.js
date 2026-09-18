const productService = require("../services/product.service");

/**
 * Product Controller Layer
 * Receives requests after authentication and T6 business context mapping.
 * Uses req.businessId established by businessMiddleware.
 */

const createProduct = async (req, res, next) => {
  try {
    const product = await productService.createProduct(
      req.businessId,
      req.body
    );

    return res.status(201).json({
      success: true,
      message: "Product created successfully.",
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

const getProducts = async (req, res, next) => {
  try {
    const result = await productService.getProducts(
      req.businessId,
      req.query
    );

    return res.status(200).json({
      success: true,
      count: result.products.length,
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
      data: result.products,
    });
  } catch (error) {
    next(error);
  }
};

const getProductById = async (req, res, next) => {
  try {
    const product = await productService.getProductById(
      req.businessId,
      req.params.id
    );

    return res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

const getProductByBarcode = async (req, res, next) => {
  try {
    const product = await productService.getProductByBarcode(
      req.businessId,
      req.params.barcode
    );

    return res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const updatedProduct = await productService.updateProduct(
      req.businessId,
      req.params.id,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Product updated successfully.",
      data: updatedProduct,
    });
  } catch (error) {
    next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const result = await productService.deleteProduct(
      req.businessId,
      req.params.id
    );

    return res.status(200).json({
      success: true,
      message: result.message,
      data: { id: result.deletedId },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  getProductByBarcode,
  updateProduct,
  deleteProduct,
};
