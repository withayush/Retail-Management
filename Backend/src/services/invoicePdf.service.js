const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const Invoice = require("../models/invoice.model");
const Business = require("../models/business.model");

/**
 * Phase 4 - Task T27: Invoice PDF Generation Engine
 * Serverless-ready, lightweight, high-performance vector PDF invoice compiler.
 * Generates customer-facing transaction bills with snapshot pricing & stores them in storage bucket / local uploads.
 */

const UPLOADS_DIR = path.join(__dirname, "../../uploads/invoices");

// Ensure upload directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

/**
 * Format date for invoice header
 */
const formatDate = (date) => {
  const d = date ? new Date(date) : new Date();
  const day = String(d.getDate()).padStart(2, "0");
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = monthNames[d.getMonth()];
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, "0");
  const mins = String(d.getMinutes()).padStart(2, "0");
  return `${day} ${month} ${year}, ${hours}:${mins}`;
};

/**
 * Generate PDF buffer using PDFKit
 */
const generateInvoicePdfBuffer = (invoice, business = {}) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margin: 40,
        info: {
          Title: `Tax Invoice - ${invoice.invoiceNumber}`,
          Author: business.name || "VendorOS Store",
          Subject: `Retail Invoice #${invoice.invoiceNumber}`,
          Keywords: "invoice, bill, pos, retail",
        },
      });

      const buffers = [];
      doc.on("data", (chunk) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", (err) => reject(err));

      const storeName = business.name || "Retail Store";
      const storeAddress = business.address || business.city ? `${business.address || ""} ${business.city || ""}`.trim() : "Store Address";
      const storePhone = business.phone || "";
      const storeEmail = business.email || "";
      const storeGst = business.gstin || business.taxNumber || "";

      // ── Header Bar ──────────────────────────────────────────────────────────
      doc.rect(40, 40, 515, 65).fill("#0F172A"); // Slate dark primary banner

      // Store Title & Tagline
      doc.fillColor("#FFFFFF").fontSize(18).font("Helvetica-Bold").text(storeName.toUpperCase(), 55, 52, { width: 300 });
      doc.fillColor("#94A3B8").fontSize(8.5).font("Helvetica").text("RETAIL TAX INVOICE & CASH RECEIPT", 55, 74);
      if (storeGst) {
        doc.fillColor("#CBD5E1").fontSize(8).font("Helvetica").text(`GSTIN: ${storeGst}`, 55, 86);
      }

      // Invoice Badge (Right aligned in banner)
      doc.fillColor("#38BDF8").fontSize(12).font("Helvetica-Bold").text(`INVOICE: #${invoice.invoiceNumber}`, 320, 52, { align: "right", width: 220 });
      doc.fillColor("#CBD5E1").fontSize(8.5).font("Helvetica").text(`Date: ${formatDate(invoice.createdAt)}`, 320, 70, { align: "right", width: 220 });

      // Status Pill
      const statusColor = invoice.paymentStatus === "PAID" ? "#22C55E" : invoice.paymentStatus === "PARTIAL" ? "#F59E0B" : "#EF4444";
      doc.fillColor(statusColor).fontSize(9).font("Helvetica-Bold").text(`STATUS: ${invoice.paymentStatus}`, 320, 84, { align: "right", width: 220 });

      // ── Store Info & Billed To Section ───────────────────────────────────────
      let currentY = 120;
      doc.rect(40, currentY, 250, 75).strokeColor("#E2E8F0").lineWidth(1).stroke();
      doc.rect(295, currentY, 260, 75).strokeColor("#E2E8F0").lineWidth(1).stroke();

      // Left Box: Store Details
      doc.fillColor("#64748B").fontSize(8).font("Helvetica-Bold").text("STORE DETAILS", 50, currentY + 10);
      doc.fillColor("#1E293B").fontSize(9).font("Helvetica-Bold").text(storeName, 50, currentY + 22);
      doc.fillColor("#475569").fontSize(8).font("Helvetica").text(storeAddress, 50, currentY + 34, { width: 230 });
      if (storePhone || storeEmail) {
        doc.text(`Phone: ${storePhone || "N/A"} | Email: ${storeEmail || "N/A"}`, 50, currentY + 54, { width: 230 });
      }

      // Right Box: Billed To / Customer
      doc.fillColor("#64748B").fontSize(8).font("Helvetica-Bold").text("BILLED TO", 305, currentY + 10);
      doc.fillColor("#1E293B").fontSize(9).font("Helvetica-Bold").text(invoice.customerName || "Walk-in Retail Customer", 305, currentY + 22);
      if (invoice.customerPhone) {
        doc.fillColor("#475569").fontSize(8).font("Helvetica").text(`Mobile: ${invoice.customerPhone}`, 305, currentY + 34);
      }
      doc.fillColor("#475569").fontSize(8).font("Helvetica").text(`Payment Mode: ${invoice.paymentMode || "CASH"}`, 305, currentY + 46);
      if (invoice.createdByName) {
        doc.text(`Cashier / Billed By: ${invoice.createdByName}`, 305, currentY + 58);
      }

      // ── Items Table Header ───────────────────────────────────────────────────
      currentY = 210;
      doc.rect(40, currentY, 515, 22).fill("#F1F5F9");
      doc.fillColor("#334155").fontSize(8.5).font("Helvetica-Bold");
      doc.text("#", 48, currentY + 6, { width: 20 });
      doc.text("ITEM DESCRIPTION", 75, currentY + 6, { width: 200 });
      doc.text("SKU", 280, currentY + 6, { width: 65 });
      doc.text("QTY", 350, currentY + 6, { width: 45, align: "center" });
      doc.text("RATE (Rs.)", 400, currentY + 6, { width: 65, align: "right" });
      doc.text("TOTAL (Rs.)", 475, currentY + 6, { width: 70, align: "right" });

      currentY += 22;

      // ── Items Table Rows ─────────────────────────────────────────────────────
      const items = invoice.items || [];
      items.forEach((item, index) => {
        // Page break guard
        if (currentY > 700) {
          doc.addPage({ size: "A4", margin: 40 });
          currentY = 50;
        }

        const isEven = index % 2 === 0;
        if (isEven) {
          doc.rect(40, currentY, 515, 20).fill("#F8FAFC");
        }

        doc.fillColor("#1E293B").fontSize(8.5).font("Helvetica");
        doc.text(String(index + 1), 48, currentY + 5, { width: 20 });

        const itemDesc = item.name || "Item";
        doc.font("Helvetica-Bold").text(itemDesc, 75, currentY + 5, { width: 200, lineBreak: false });

        doc.font("Helvetica").fillColor("#64748B");
        doc.text(item.sku || "-", 280, currentY + 5, { width: 65 });

        doc.fillColor("#1E293B").font("Helvetica-Bold");
        doc.text(`${item.quantity} ${item.unit || "pcs"}`, 350, currentY + 5, { width: 45, align: "center" });

        doc.font("Helvetica");
        doc.text(Number(item.soldPrice || 0).toFixed(2), 400, currentY + 5, { width: 65, align: "right" });

        doc.font("Helvetica-Bold");
        doc.text(Number(item.totalPrice || item.soldPrice * item.quantity || 0).toFixed(2), 475, currentY + 5, { width: 70, align: "right" });

        doc.rect(40, currentY + 20, 515, 0.5).fill("#E2E8F0");
        currentY += 21;
      });

      // ── Financial Summary Box ────────────────────────────────────────────────
      currentY += 15;
      if (currentY > 660) {
        doc.addPage({ size: "A4", margin: 40 });
        currentY = 50;
      }

      // Left Notes / Terms Box
      doc.rect(40, currentY, 270, 95).strokeColor("#E2E8F0").lineWidth(1).stroke();
      doc.fillColor("#64748B").fontSize(8).font("Helvetica-Bold").text("NOTES & INVOICE TERMS", 50, currentY + 10);
      doc.fillColor("#475569").fontSize(8).font("Helvetica").text(
        invoice.notes || "Goods once sold are subject to store return policies. Thank you for your business!",
        50,
        currentY + 24,
        { width: 250 }
      );
      doc.fillColor("#94A3B8").fontSize(7.5).text(`System Ref: ${invoice._id.toString()}`, 50, currentY + 75);

      // Right Financial Breakdown Box
      doc.rect(320, currentY, 235, 95).fill("#F8FAFC");
      doc.rect(320, currentY, 235, 95).strokeColor("#CBD5E1").lineWidth(1).stroke();

      const subtotal = Number(invoice.subtotal || 0).toFixed(2);
      const discount = Number(invoice.discount || 0).toFixed(2);
      const tax = Number(invoice.tax || 0).toFixed(2);
      const grandTotal = Number(invoice.total || 0).toFixed(2);
      const paid = Number(invoice.paidAmount || 0).toFixed(2);
      const due = Number(invoice.dueAmount || 0).toFixed(2);

      let sumY = currentY + 8;
      doc.fillColor("#475569").fontSize(8).font("Helvetica").text("Subtotal:", 330, sumY);
      doc.text(`Rs. ${subtotal}`, 430, sumY, { align: "right", width: 115 });

      if (Number(discount) > 0) {
        sumY += 12;
        doc.fillColor("#16A34A").text("Discount Applied:", 330, sumY);
        doc.text(`- Rs. ${discount}`, 430, sumY, { align: "right", width: 115 });
      }

      if (Number(tax) > 0) {
        sumY += 12;
        doc.fillColor("#475569").text("Taxes & GST:", 330, sumY);
        doc.text(`+ Rs. ${tax}`, 430, sumY, { align: "right", width: 115 });
      }

      sumY += 14;
      doc.rect(325, sumY - 2, 225, 18).fill("#0F172A");
      doc.fillColor("#FFFFFF").fontSize(9.5).font("Helvetica-Bold").text("GRAND TOTAL:", 335, sumY + 2);
      doc.text(`Rs. ${grandTotal}`, 430, sumY + 2, { align: "right", width: 110 });

      sumY += 22;
      doc.fillColor("#22C55E").fontSize(8).font("Helvetica-Bold").text(`Paid (${invoice.paymentMode || "CASH"}):`, 330, sumY);
      doc.text(`Rs. ${paid}`, 430, sumY, { align: "right", width: 115 });

      if (Number(due) > 0) {
        sumY += 12;
        doc.fillColor("#DC2626").text("Balance Due (Udhar):", 330, sumY);
        doc.text(`Rs. ${due}`, 430, sumY, { align: "right", width: 115 });
      }

      // ── Footer ───────────────────────────────────────────────────────────────
      const footerY = 760;
      doc.rect(40, footerY, 515, 0.5).fill("#CBD5E1");
      doc.fillColor("#64748B").fontSize(8).font("Helvetica").text(
        "Thank you for shopping with us! • Computer-Generated Tax Invoice • Powered by VendorOS",
        40,
        footerY + 10,
        { align: "center", width: 515 }
      );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Generate and persist PDF invoice to local/storage bucket
 */
const generateAndStoreInvoicePdf = async (businessId, invoiceId) => {
  if (!mongoose.Types.ObjectId.isValid(businessId) || !mongoose.Types.ObjectId.isValid(invoiceId)) {
    const error = new Error("Invalid ID format.");
    error.statusCode = 400;
    error.code = "INVALID_ID";
    throw error;
  }

  // 1. Fetch Invoice
  const invoice = await Invoice.findOne({ _id: invoiceId, businessId });
  if (!invoice) {
    const error = new Error("Invoice not found in this business.");
    error.statusCode = 404;
    error.code = "INVOICE_NOT_FOUND";
    throw error;
  }

  // 2. Fetch Business details for header
  const business = await Business.findById(businessId).lean();

  // 3. Compile PDF buffer using frozen snapshot line items (T24)
  const pdfBuffer = await generateInvoicePdfBuffer(invoice, business || {});

  // 4. Save to storage directory
  const fileName = `invoice-${invoice.invoiceNumber}.pdf`;
  const filePath = path.join(UPLOADS_DIR, fileName);
  await fs.promises.writeFile(filePath, pdfBuffer);

  const publicUrl = `/uploads/invoices/${fileName}`;

  // 5. Update Invoice metadata
  invoice.invoicePdfUrl = publicUrl;
  invoice.pdfFileKey = fileName;
  invoice.pdfGeneratedAt = new Date();
  await invoice.save();

  return {
    invoiceId: invoice._id,
    invoiceNumber: invoice.invoiceNumber,
    publicUrl,
    fileName,
    filePath,
    pdfBuffer,
    pdfGeneratedAt: invoice.pdfGeneratedAt,
  };
};

/**
 * Get PDF buffer directly for streaming download / inline view
 */
const getInvoicePdfStreamData = async (businessId, invoiceId) => {
  if (!mongoose.Types.ObjectId.isValid(businessId) || !mongoose.Types.ObjectId.isValid(invoiceId)) {
    const error = new Error("Invalid ID format.");
    error.statusCode = 400;
    error.code = "INVALID_ID";
    throw error;
  }

  const invoice = await Invoice.findOne({ _id: invoiceId, businessId });
  if (!invoice) {
    const error = new Error("Invoice not found in this business.");
    error.statusCode = 404;
    error.code = "INVOICE_NOT_FOUND";
    throw error;
  }

  const business = await Business.findById(businessId).lean();
  const pdfBuffer = await generateInvoicePdfBuffer(invoice, business || {});

  return {
    invoiceNumber: invoice.invoiceNumber,
    pdfBuffer,
  };
};

module.exports = {
  generateInvoicePdfBuffer,
  generateAndStoreInvoicePdf,
  getInvoicePdfStreamData,
};
