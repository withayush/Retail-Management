const mongoose = require("mongoose");
const grnRepo = require("../repositories/grn.repository");
const inventoryRepo = require("../repositories/inventory.repository");
const { PurchaseOrder } = require("../models/purchaseOrder.model");
const { PurchaseItem } = require("../models/purchaseItem.model");
const { Product } = require("../models/product.model");
const { InventoryLedger } = require("../models/inventory.model");

const { withTransaction } = require("../utils/transaction");

/**
 * Phase 7 - Task T44: Goods Received Note (GRN) Service Layer
 * Multi-tenant business logic for physical stock reception, variance checking,
 * PO lifecycle progression, and atomic inventory stock-in ledger integration.
 */
class GRNService {
  /**
   * Primary GRN Stock Receive Processor (POST /api/purchases/receive)
   */
  async receiveStock(businessId, payload, accountId = null, accountName = "") {
    return await withTransaction(async (session) => {
      const bId = typeof businessId === "string" ? new mongoose.Types.ObjectId(businessId) : businessId;
      const {
        purchaseOrderId,
        receivedDate,
        deliveryChallanNumber = "",
        invoiceNumber = "",
        notes = "",
        allowOverdelivery = false,
        items = [],
      } = payload;

      if (!mongoose.Types.ObjectId.isValid(purchaseOrderId)) {
        const err = new Error("Invalid Purchase Order ID format.");
        err.statusCode = 400;
        err.code = "INVALID_PO_ID";
        throw err;
      }

      // 1. Fetch & Verify Purchase Order belongs to this business
      const po = await PurchaseOrder.findOne({ _id: purchaseOrderId, businessId: bId }).session(session);
      if (!po) {
        const err = new Error("Purchase Order not found or does not belong to this business.");
        err.statusCode = 404;
        err.code = "PURCHASE_ORDER_NOT_FOUND";
        throw err;
      }

      // 2. Validate PO Status
      if (po.status === "CANCELLED") {
        const err = new Error(`Cannot receive goods for a CANCELLED Purchase Order (${po.poNumber}).`);
        err.statusCode = 400;
        err.code = "CANNOT_RECEIVE_CANCELLED_ORDER";
        throw err;
      }

    if (po.status === "RECEIVED") {
      // Check if any items still have pending quantity
      const hasPending = po.items.some((item) => (item.receivedQuantity || 0) < item.quantity);
      if (!hasPending && !allowOverdelivery) {
        const err = new Error(`Purchase Order ${po.poNumber} has already been fully received.`);
        err.statusCode = 400;
        err.code = "ORDER_ALREADY_FULLY_RECEIVED";
        throw err;
      }
    }

    // 3. Build lookup map from PO items
    const poItemMap = new Map();
    po.items.forEach((item) => {
      const pIdKey = item.productId ? item.productId.toString() : null;
      if (pIdKey) {
        poItemMap.set(pIdKey, item);
      }
      // Also map by item _id
      poItemMap.set(item._id.toString(), item);
    });

    // 4. Process and validate each receipt line item
    const grnItems = [];
    let totalItemsReceived = 0;
    let totalCostReceived = 0;

    for (const receiptItem of items) {
      const rQty = Number(receiptItem.receivedQty);
      if (isNaN(rQty) || rQty < 0) {
        const err = new Error("Received quantity must be a non-negative number.");
        err.statusCode = 400;
        err.code = "INVALID_RECEIVED_QTY";
        throw err;
      }

      // Skip 0 quantity lines from inventory increment, but validate them
      const pIdStr = receiptItem.productId ? receiptItem.productId.toString() : null;
      let matchedPoItem = null;

      if (pIdStr && poItemMap.has(pIdStr)) {
        matchedPoItem = poItemMap.get(pIdStr);
      } else if (receiptItem.itemId && poItemMap.has(receiptItem.itemId)) {
        matchedPoItem = poItemMap.get(receiptItem.itemId);
      } else if (receiptItem.name) {
        // Fallback name match
        matchedPoItem = po.items.find(
          (i) => i.name.toLowerCase() === receiptItem.name.trim().toLowerCase()
        );
      }

      if (!matchedPoItem) {
        const err = new Error(
          `Item '${receiptItem.name || receiptItem.productId || "Unknown"}' is not present in Purchase Order ${po.poNumber}.`
        );
        err.statusCode = 400;
        err.code = "ITEM_NOT_IN_PURCHASE_ORDER";
        throw err;
      }

      const orderedQty = matchedPoItem.quantity || 0;
      const previouslyReceivedQty = matchedPoItem.receivedQuantity || 0;
      const unitCost = Number(receiptItem.costPrice !== undefined ? receiptItem.costPrice : matchedPoItem.unitCost) || 0;
      const variance = (previouslyReceivedQty + rQty) - orderedQty;
      const remainingQty = Math.max(0, orderedQty - (previouslyReceivedQty + rQty));
      const lineCost = Number((rQty * unitCost).toFixed(2));

      // Over-delivery check (Allow up to 10% tolerance unless allowOverdelivery is explicitly true)
      if (!allowOverdelivery && rQty > 0) {
        const maxAllowed = Math.ceil(orderedQty * 1.10);
        if ((previouslyReceivedQty + rQty) > maxAllowed) {
          const err = new Error(
            `Received quantity (${previouslyReceivedQty + rQty}) for '${matchedPoItem.name}' exceeds ordered quantity (${orderedQty}) beyond 10% tolerance limit. Enable over-delivery to proceed.`
          );
          err.statusCode = 400;
          err.code = "OVERDELIVERY_EXCEEDS_TOLERANCE";
          throw err;
        }
      }

      grnItems.push({
        productId: matchedPoItem.productId || null,
        name: matchedPoItem.name,
        sku: matchedPoItem.sku || "",
        unit: matchedPoItem.unit || "pcs",
        costPrice: unitCost,
        orderedQty,
        previouslyReceivedQty,
        receivedQty: rQty,
        remainingQty,
        variance,
        totalCost: lineCost,
        notes: (receiptItem.notes || "").trim(),
      });

      totalItemsReceived += rQty;
      totalCostReceived += lineCost;
    }

    if (totalItemsReceived === 0) {
      const err = new Error("At least one item must have a received quantity greater than 0 to generate a Goods Received Note.");
      err.statusCode = 400;
      err.code = "ZERO_RECEIPT_QUANTITY";
      throw err;
    }

    // 5. Generate human-readable GRN Number (GRN-1001)
    const grnNumber = await grnRepo.generateNextGrnNumber(bId, session);

    // 6. Create and persist Goods Received Note
    const grnDoc = {
      businessId: bId,
      grnNumber,
      purchaseOrderId: po._id,
      poNumber: po.poNumber,
      supplierId: po.supplierId,
      supplierCompany: po.supplierCompany,
      receivedDate: receivedDate ? new Date(receivedDate) : new Date(),
      status: "COMPLETED",
      items: grnItems,
      totalItemsReceived,
      totalCostReceived: Number(totalCostReceived.toFixed(2)),
      deliveryChallanNumber: deliveryChallanNumber.trim(),
      invoiceNumber: invoiceNumber.trim(),
      receivedBy: accountId ? new mongoose.Types.ObjectId(accountId) : null,
      receivedByName: accountName || "",
      notes: notes.trim(),
    };

    const savedGRN = await grnRepo.createGrn(grnDoc, session);

    // 7. Update PO Item received quantities and PurchaseItem collection
    for (const line of grnItems) {
      if (line.receivedQty > 0) {
        // Update PO embedded sub-item
        const poSubItem = po.items.find(
          (i) =>
            (line.productId && i.productId && i.productId.toString() === line.productId.toString()) ||
            i.name.toLowerCase() === line.name.toLowerCase()
        );
        if (poSubItem) {
          poSubItem.receivedQuantity = (poSubItem.receivedQuantity || 0) + line.receivedQty;
        }

        // Update standalone PurchaseItem document (T43)
        if (line.productId) {
          await PurchaseItem.updateOne(
            { businessId: bId, purchaseOrderId: po._id, productId: line.productId },
            { $inc: { receivedQty: line.receivedQty } },
            session ? { session } : {}
          );
        }
      }
    }

    // 8. Progress Purchase Order Lifecycle Status (DRAFT/PENDING -> PARTIAL / RECEIVED)
    const previousStatus = po.status;
    let allReceived = true;
    let anyReceived = false;

    po.items.forEach((item) => {
      const rec = item.receivedQuantity || 0;
      if (rec > 0) anyReceived = true;
      if (rec < item.quantity) allReceived = false;
    });

    if (allReceived) {
      po.status = "RECEIVED";
    } else if (anyReceived) {
      po.status = "PARTIAL";
    }

    await po.save(session ? { session } : {});

    // 9. Execute Phase 7 - Task T45: Auto Inventory IN Deductions & Immutable Ledger
    const inventoryUpdates = await this.executeAutoInventoryIn(bId, {
      grn: savedGRN,
      purchaseOrder: po,
      items: grnItems,
      accountId,
      accountName,
      session,
    });

    return {
      grn: savedGRN,
      purchaseOrder: {
        _id: po._id,
        poNumber: po.poNumber,
        previousStatus,
        newStatus: po.status,
        costTotal: po.costTotal,
        itemsCount: po.itemsCount,
        totalQuantity: po.totalQuantity,
      },
      inventoryUpdates,
      summary: {
        grnNumber: savedGRN.grnNumber,
        totalItemsReceived,
        totalCostReceived: Number(totalCostReceived.toFixed(2)),
        poStatus: po.status,
      },
    };
    });
  }

  /**
   * Get single GRN by ID
   */
  async getGrnById(businessId, grnId) {
    if (!mongoose.Types.ObjectId.isValid(businessId) || !mongoose.Types.ObjectId.isValid(grnId)) {
      const err = new Error("Invalid ID format.");
      err.statusCode = 400;
      err.code = "INVALID_ID";
      throw err;
    }

    const grn = await grnRepo.findById(businessId, grnId);
    if (!grn) {
      const err = new Error("Goods Received Note not found.");
      err.statusCode = 404;
      err.code = "GRN_NOT_FOUND";
      throw err;
    }

    return grn;
  }

  /**
   * List GRNs with filters & pagination
   */
  async getGrns(businessId, filters = {}) {
    if (!mongoose.Types.ObjectId.isValid(businessId)) {
      const err = new Error("Invalid business ID.");
      err.statusCode = 400;
      err.code = "INVALID_BUSINESS_ID";
      throw err;
    }

    return await grnRepo.findGrns(businessId, filters);
  }

  /**
   * Get all GRNs for a specific Purchase Order
   */
  async getGrnsByPoId(businessId, poId) {
    if (!mongoose.Types.ObjectId.isValid(businessId) || !mongoose.Types.ObjectId.isValid(poId)) {
      const err = new Error("Invalid ID format.");
      err.statusCode = 400;
      err.code = "INVALID_ID";
      throw err;
    }

    return await grnRepo.findGrnsByPoId(businessId, poId);
  }

  /**
   * GRN Summary KPIs
   */
  async getSummary(businessId) {
    if (!mongoose.Types.ObjectId.isValid(businessId)) {
      const err = new Error("Invalid business ID.");
      err.statusCode = 400;
      err.code = "INVALID_BUSINESS_ID";
      throw err;
    }

    return await grnRepo.getSummary(businessId);
  }

  /**
   * Phase 7 - Task T45: Auto Inventory IN Deductions Service Capability
   * 
   * Directly converts confirmed goods from GRN into active sellable inventory (T15)
   * and creates immutable Inventory Ledger entries (T16) inside the transactional session.
   * 
   * 3 Non-Negotiable Core Rules:
   * 1. Only newly received quantity added (never entire PO qty or previously received qty).
   * 2. Idempotency guard: Same GRN receiving event must NEVER produce duplicate stock-in.
   * 3. Single-transaction consistency: GRN + Inventory + Ledger + PO update committed or rolled back together.
   */
  async executeAutoInventoryIn(businessId, { grn, purchaseOrder, items, accountId = null, accountName = "", session = null }) {
    const bId = typeof businessId === "string" ? new mongoose.Types.ObjectId(businessId) : businessId;

    // Rule 2: Idempotency Guard - Verify same GRN has not already executed stock IN
    const existingLedger = await InventoryLedger.findOne({
      businessId: bId,
      referenceType: "GRN",
      referenceId: grn._id,
      source: "GOODS_RECEIPT",
    }).session(session);

    if (existingLedger) {
      const err = new Error(
        `Auto Inventory IN has already been executed for GRN '${grn.grnNumber}'. Duplicate stock intake is prevented.`
      );
      err.statusCode = 409;
      err.code = "DUPLICATE_GRN_STOCK_IN";
      throw err;
    }

    const inventoryUpdates = [];

    // Rule 1: Only newly received quantity added for each item
    for (const line of items) {
      const rQty = Number(line.receivedQty) || 0;
      if (rQty <= 0 || !line.productId) continue;

      // Get or create current inventory state
      const currentInv = await inventoryRepo.getOrCreateInventory(bId, line.productId, 0, 5, session);
      const previousStock = currentInv.availableStock || 0;

      // Rule 3: Atomic stock increment & ledger write within session
      const movement = await inventoryRepo.recordStockMovement({
        businessId: bId,
        productId: line.productId,
        qtyChange: rQty, // Strictly the newly received quantity
        type: "IN",
        source: "GOODS_RECEIPT",
        supplierName: purchaseOrder.supplierCompany || grn.supplierCompany || "",
        unitCost: line.costPrice !== undefined ? Number(line.costPrice) : null,
        referenceType: "GRN",
        referenceNumber: grn.grnNumber,
        referenceId: grn._id,
        reason: `Goods Receipt for PO #${purchaseOrder.poNumber} (GRN #${grn.grnNumber})`,
        createdBy: accountId ? new mongoose.Types.ObjectId(accountId) : null,
        createdByName: accountName || "",
        notes: line.notes || grn.notes || "",
        session,
      });

      const newStock = movement.inventory.availableStock;

      inventoryUpdates.push({
        productId: line.productId,
        productName: line.name,
        sku: line.sku || "",
        previousStock,
        receivedQty: rQty,
        newStock,
        ledgerId: movement.ledgerEntry?._id || null,
        referenceNumber: grn.grnNumber,
      });
    }

    return inventoryUpdates;
  }
}

module.exports = new GRNService();
