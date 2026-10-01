const mongoose = require("mongoose");
const Counter = require("../models/counter.model");

/**
 * Counter Repository
 * Provides thread-safe, concurrency-guaranteed sequential identifier generation
 * for multi-tenant businesses.
 */
class CounterRepository {
  /**
   * Generates the next atomic, collision-free sequential number for a given business and sequence.
   *
   * @param {string|mongoose.Types.ObjectId} businessId
   * @param {"INVOICE"|"PURCHASE_ORDER"|"GRN"} sequenceName
   * @param {Object} options
   * @param {string} [options.prefix] - Prefix (e.g. "INV", "PO", "GRN")
   * @param {number} [options.defaultStart=1000] - Baseline sequence starting point
   * @param {mongoose.ClientSession|null} [options.session=null] - Optional Mongoose transaction session
   * @returns {Promise<string>} e.g. "INV-1001", "PO-1001", "GRN-1001"
   */
  async getNextSequence(businessId, sequenceName, options = {}) {
    const bId = typeof businessId === "string" ? new mongoose.Types.ObjectId(businessId) : businessId;
    const seqName = (sequenceName || "").trim().toUpperCase();
    const defaultStart = typeof options.defaultStart === "number" ? options.defaultStart : 1000;
    const session = options.session || null;
    const sessionOpt = session ? { session } : {};

    // Determine default prefix if not specified
    let prefix = options.prefix;
    if (!prefix) {
      if (seqName === "INVOICE") prefix = "INV";
      else if (seqName === "PURCHASE_ORDER") prefix = "PO";
      else if (seqName === "GRN") prefix = "GRN";
      else prefix = seqName;
    }

    // 1. Fast Path: Atomic findOneAndUpdate with $inc
    let counter = await Counter.findOneAndUpdate(
      { businessId: bId, sequenceName: seqName },
      { $inc: { seq: 1 } },
      { returnDocument: "after", ...sessionOpt }
    );

    // 2. Cold-start initialization (First time this sequence is requested for this business)
    if (!counter) {
      const existingMax = await this.getExistingMaxSequence(bId, seqName, defaultStart, session);
      const startSeq = Math.max(existingMax, defaultStart) + 1;

      try {
        const [created] = await Counter.create(
          [
            {
              businessId: bId,
              sequenceName: seqName,
              seq: startSeq,
            },
          ],
          sessionOpt
        );
        counter = created;
      } catch (err) {
        if (err.code === 11000) {
          // Concurrent worker created the counter in the same millisecond; atomically increment it
          counter = await Counter.findOneAndUpdate(
            { businessId: bId, sequenceName: seqName },
            { $inc: { seq: 1 } },
            { returnDocument: "after", ...sessionOpt }
          );
        } else {
          throw err;
        }
      }
    }

    // 3. Collision guard against historical manual outliers
    let candidate = `${prefix}-${counter.seq}`;
    while (await this.documentNumberExists(bId, seqName, candidate, session)) {
      counter = await Counter.findOneAndUpdate(
        { businessId: bId, sequenceName: seqName },
        { $inc: { seq: 1 } },
        { returnDocument: "after", ...sessionOpt }
      );
      candidate = `${prefix}-${counter.seq}`;
    }

    return candidate;
  }

  /**
   * Scans existing documents in the collection to seed the initial counter
   * value, guaranteeing backward compatibility with existing pre-counter records.
   */
  async getExistingMaxSequence(businessId, sequenceName, defaultStart = 1000, session = null) {
    const sessionOpt = session ? { session } : {};

    try {
      if (sequenceName === "INVOICE") {
        const Invoice = require("../models/invoice.model");
        const invoices = await Invoice.find({ businessId })
          .select("invoiceNumber")
          .sort({ createdAt: -1 })
          .limit(100)
          .session(session)
          .lean();

        let max = defaultStart;
        for (const inv of invoices) {
          if (!inv.invoiceNumber) continue;
          const match = inv.invoiceNumber.match(/INV-(\d+)/i);
          if (match && match[1]) {
            const num = parseInt(match[1], 10);
            if (num > max) max = num;
          }
        }
        return max;
      }

      if (sequenceName === "PURCHASE_ORDER") {
        const { PurchaseOrder } = require("../models/purchaseOrder.model");
        const pos = await PurchaseOrder.find({ businessId })
          .select("poNumber")
          .sort({ createdAt: -1 })
          .limit(100)
          .session(session)
          .lean();

        let max = defaultStart;
        for (const po of pos) {
          if (!po.poNumber) continue;
          const match = po.poNumber.match(/PO-(\d+)/i);
          if (match && match[1]) {
            const num = parseInt(match[1], 10);
            if (num > max) max = num;
          }
        }
        return max;
      }

      if (sequenceName === "GRN") {
        const GoodsReceivedNote = require("../models/grn.model");
        const grns = await GoodsReceivedNote.find({ businessId })
          .select("grnNumber")
          .sort({ createdAt: -1 })
          .limit(100)
          .session(session)
          .lean();

        let max = defaultStart;
        for (const grn of grns) {
          if (!grn.grnNumber) continue;
          const match = grn.grnNumber.match(/GRN-(\d+)/i);
          if (match && match[1]) {
            const num = parseInt(match[1], 10);
            if (num > max) max = num;
          }
        }
        return max;
      }
    } catch (err) {
      console.warn(`[CounterRepository] Could not inspect existing max sequence for ${sequenceName}:`, err.message);
    }

    return defaultStart;
  }

  /**
   * Checks if an entity with this identifier already exists for this business.
   */
  async documentNumberExists(businessId, sequenceName, candidateNumber, session = null) {
    try {
      if (sequenceName === "INVOICE") {
        const Invoice = require("../models/invoice.model");
        return !!(await Invoice.exists({ businessId, invoiceNumber: candidateNumber }).session(session));
      }
      if (sequenceName === "PURCHASE_ORDER") {
        const { PurchaseOrder } = require("../models/purchaseOrder.model");
        return !!(await PurchaseOrder.exists({ businessId, poNumber: candidateNumber }).session(session));
      }
      if (sequenceName === "GRN") {
        const GoodsReceivedNote = require("../models/grn.model");
        return !!(await GoodsReceivedNote.exists({ businessId, grnNumber: candidateNumber }).session(session));
      }
    } catch (err) {
      console.warn(`[CounterRepository] Error checking existence for ${candidateNumber}:`, err.message);
    }
    return false;
  }
}

module.exports = new CounterRepository();
