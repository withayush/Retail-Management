const saleService = require("../services/sale.service");

/**
 * Phase 4 - Task T23: Sale / Invoice Controller Layer
 */

const createSale = async (req, res, next) => {
  try {
    const sale = await saleService.createSale(req.businessId, {
      ...req.body,
      createdBy: req.user?.accountId,
      createdByName: req.account?.fullName || "Staff",
    });

    return res.status(201).json({
      success: true,
      message: `Sale transaction ${sale.invoiceNumber} created successfully.`,
      data: sale,
    });
  } catch (error) {
    next(error);
  }
};

const getSales = async (req, res, next) => {
  try {
    const { paymentStatus, paymentMode, customerId, startDate, endDate, search, page, limit } =
      req.query;

    const result = await saleService.getSales(
      req.businessId,
      { paymentStatus, paymentMode, customerId, startDate, endDate, search },
      { page, limit }
    );

    return res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

const getSalesSummary = async (req, res, next) => {
  try {
    const summary = await saleService.getSalesSummary(req.businessId);

    return res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};

const getSaleById = async (req, res, next) => {
  try {
    const sale = await saleService.getSaleById(req.businessId, req.params.id);

    return res.status(200).json({
      success: true,
      data: sale,
    });
  } catch (error) {
    next(error);
  }
};

const getNextInvoiceNumber = async (req, res, next) => {
  try {
    const nextInvoiceNumber = await saleService.getNextInvoiceNumber(req.businessId);

    return res.status(200).json({
      success: true,
      data: { nextInvoiceNumber },
    });
  } catch (error) {
    next(error);
  }
};

const getSaleItems = async (req, res, next) => {
  try {
    const items = await saleService.getSaleItems(req.businessId, req.params.id);

    return res.status(200).json({
      success: true,
      data: items,
    });
  } catch (error) {
    next(error);
  }
};

const getGrossProfitReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const report = await saleService.getGrossProfitReport(req.businessId, { startDate, endDate });

    return res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

const updatePaymentStatus = async (req, res, next) => {
  try {
    const updated = await saleService.updatePaymentStatus(
      req.businessId,
      req.params.id,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Payment status updated successfully.",
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

const invoicePdfService = require("../services/invoicePdf.service");

const generateInvoicePdf = async (req, res, next) => {
  try {
    const result = await invoicePdfService.generateAndStoreInvoicePdf(req.businessId, req.params.id);

    return res.status(200).json({
      success: true,
      message: `Invoice PDF for #${result.invoiceNumber} generated successfully.`,
      data: {
        invoiceId: result.invoiceId,
        invoiceNumber: result.invoiceNumber,
        publicUrl: result.publicUrl,
        fileName: result.fileName,
        pdfGeneratedAt: result.pdfGeneratedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

const downloadInvoicePdf = async (req, res, next) => {
  try {
    const { invoiceNumber, pdfBuffer } = await invoicePdfService.getInvoicePdfStreamData(
      req.businessId,
      req.params.id
    );

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="Invoice-${invoiceNumber}.pdf"`);
    res.setHeader("Content-Length", pdfBuffer.length);

    return res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

const previewInvoicePdf = async (req, res, next) => {
  try {
    const { invoiceNumber, pdfBuffer } = await invoicePdfService.getInvoicePdfStreamData(
      req.businessId,
      req.params.id
    );

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="Invoice-${invoiceNumber}.pdf"`);
    res.setHeader("Content-Length", pdfBuffer.length);

    return res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createSale,
  getSales,
  getSalesSummary,
  getSaleById,
  getSaleItems,
  getGrossProfitReport,
  getNextInvoiceNumber,
  updatePaymentStatus,
  generateInvoicePdf,
  downloadInvoicePdf,
  previewInvoicePdf,
};


