import React from "react";
import { Receipt, X } from "lucide-react";

export default function SettlePaymentModal({
  isOpen,
  selectedSale,
  newStatus,
  setNewStatus,
  newPaidAmount,
  setNewPaidAmount,
  newPaymentMode,
  setNewPaymentMode,
  settlementNotes,
  setSettlementNotes,
  submitting,
  onClose,
  onSubmit,
}) {
  if (!isOpen || !selectedSale) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#111113] border border-[#27272a] rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-[#1f1f23] pb-3">
          <h3 className="font-semibold text-sm text-white flex items-center gap-2">
            <Receipt className="w-4 h-4 text-zinc-300" /> Update Invoice {selectedSale.invoiceNumber}
          </h3>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-3.5 text-xs">
          {/* Invoice Summary Pill */}
          <div className="bg-[#141417] border border-[#27272a] rounded-xl p-3 space-y-1">
            <div className="flex justify-between">
              <span className="text-zinc-400">Customer:</span>
              <span className="font-medium text-white">{selectedSale.customerName || "Walk-in Customer"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Grand Total:</span>
              <span className="font-bold font-mono text-white">₹{selectedSale.total?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Current Due:</span>
              <span className="font-bold font-mono text-red-400">₹{selectedSale.dueAmount?.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Status */}
          <div>
            <label className="block font-medium text-zinc-300 mb-1">Payment Status</label>
            <select
              value={newStatus}
              onChange={(e) => {
                const st = e.target.value;
                setNewStatus(st);
                if (st === "PAID") {
                  setNewPaidAmount(selectedSale.total.toString());
                }
              }}
              className="w-full bg-[#141417] border border-[#27272a] rounded-lg px-3 py-1.5 text-zinc-100 focus:outline-none focus:border-zinc-500 cursor-pointer"
            >
              <option value="PAID">PAID (Fully Settled)</option>
              <option value="PARTIAL">PARTIAL (Partial Amount Paid)</option>
              <option value="PENDING">PENDING (Unpaid / Udhar)</option>
              <option value="CANCELLED">CANCELLED (Void Invoice)</option>
            </select>
          </div>

          {/* Paid Amount */}
          <div>
            <label className="block font-medium text-zinc-300 mb-1">
              Paid Amount (₹) <span className="text-zinc-500 font-normal">(Max: ₹{selectedSale.total})</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max={selectedSale.total}
              value={newPaidAmount}
              onChange={(e) => setNewPaidAmount(e.target.value)}
              className="w-full bg-[#141417] border border-[#27272a] rounded-lg px-3 py-1.5 text-zinc-100 font-mono focus:outline-none focus:border-zinc-500"
            />
          </div>

          {/* Payment Mode */}
          <div>
            <label className="block font-medium text-zinc-300 mb-1">Payment Mode</label>
            <select
              value={newPaymentMode}
              onChange={(e) => setNewPaymentMode(e.target.value)}
              className="w-full bg-[#141417] border border-[#27272a] rounded-lg px-3 py-1.5 text-zinc-100 focus:outline-none focus:border-zinc-500 cursor-pointer"
            >
              <option value="CASH">Cash</option>
              <option value="UPI">UPI / QR</option>
              <option value="CARD">Card / POS</option>
              <option value="CREDIT_UDHAR">Credit / Customer Khata</option>
              <option value="SPLIT">Split Payment</option>
            </select>
          </div>

          {/* Settlement Notes */}
          <div>
            <label className="block font-medium text-zinc-300 mb-1">Remarks / Notes</label>
            <input
              type="text"
              placeholder="e.g. Settle balance via GPay"
              value={settlementNotes}
              onChange={(e) => setSettlementNotes(e.target.value)}
              className="w-full bg-[#141417] border border-[#27272a] rounded-lg px-3 py-1.5 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1f1f23]">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg border border-[#27272a] bg-[#141417] hover:bg-zinc-800 text-zinc-300 font-medium text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-1.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-900 font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {submitting ? "Saving..." : "Update Payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
