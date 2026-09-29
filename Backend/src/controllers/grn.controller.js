const grnService = require("../services/grn.service");
const { receiveStockSchema, listGrnQuerySchema } = require("../validations/grn.validation");

/**
 * Phase 7 - Task T44: Goods Received Note (GRN) Controller
 */
class GRNController {
  /**
   * POST /api/purchases/receive
   * Receive physical stock items against a Purchase Order
   */
  async receiveStock(req, res, next) {
    try {
      const businessId = req.businessId;
      const accountId = req.user ? req.user._id : null;
      const accountName = req.user ? req.user.fullName || req.user.phone || req.user.email : "";

      const validatedData = receiveStockSchema.parse(req.body);
      const result = await grnService.receiveStock(businessId, validatedData, accountId, accountName);

      return res.status(201).json({
        success: true,
        message: `Goods Received Note (${result.grn.grnNumber}) processed successfully. Stock updated.`,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/purchases/grn/:id
   * Get single GRN by ID
   */
  async getGrnById(req, res, next) {
    try {
      const businessId = req.businessId;
      const { id } = req.params;

      const grn = await grnService.getGrnById(businessId, id);

      return res.status(200).json({
        success: true,
        data: grn,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/purchases/grn
   * List Goods Received Notes with pagination and filters
   */
  async getGrns(req, res, next) {
    try {
      const businessId = req.businessId;
      const query = listGrnQuerySchema.parse(req.query);

      const result = await grnService.getGrns(businessId, query);

      return res.status(200).json({
        success: true,
        data: result.grns,
        pagination: result.pagination,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/purchases/grn/po/:purchaseOrderId
   * Get all GRNs for a specific Purchase Order
   */
  async getGrnsByPoId(req, res, next) {
    try {
      const businessId = req.businessId;
      const { purchaseOrderId } = req.params;

      const grns = await grnService.getGrnsByPoId(businessId, purchaseOrderId);

      return res.status(200).json({
        success: true,
        data: grns,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/purchases/grn/summary
   * Summary KPIs for Goods Received Notes
   */
  async getSummary(req, res, next) {
    try {
      const businessId = req.businessId;
      const summary = await grnService.getSummary(businessId);

      return res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new GRNController();
