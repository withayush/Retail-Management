import React, { useState } from "react";
import { X, CheckCircle, Wallet, Building2, CreditCard } from "lucide-react";
import toast from "react-hot-toast";
import { recordSupplierPayment } from "../../../services/supplier.api";
import { generateIdempotencyKey } from "../../../services/api";

export default function SettleSupplierModal({
  isOpen,
  onClose,
  supplier,
  onSuccess,
}) {
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("BANK_TRANSFER");
  const [referenceId, setReferenceId] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !supplier) return null;

  const currentDebt = Number(supplier.currentBalance || supplier.payableBalance || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      return toast.error("Please enter a valid payment amount greater than 0.");
    }

    setSubmitting(true);
    try {
      const suppId = supplier.id || supplier._id;
      const idempotencyKey = generateIdempotencyKey();
      const res = await recordSupplierPayment(
        suppId,
        {
          amount: numAmount,
          paymentMethod,
          referenceId: referenceId.trim() || undefined,
          notes: notes.trim() || undefined,
        },
        idempotencyKey
      );

      toast.success(`Disbursed payment of ₹${numAmount.toFixed(2)} to ${supplier.company || "supplier"}`);
      if (onSuccess) onSuccess(res.data || res);
      onClose();
    } catch (err) {
      console.error("Failed to record supplier payment:", err);
      toast.error(err.response?.data?.message || "Failed to record payment disbursement.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fadeIn">
      <div className="bg-[#111113] border border-[#27272a] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-scaleUp">
        {/* Header */}
        <div className="p-4 border-b border-[#1f1f23] bg-[#141417] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Record Supplier Payment Payout</h2>
              <p className="text-[11px] text-zinc-400">
                {supplier.company} {supplier.phone ? `(${supplier.phone})` : ""}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Outstanding Balance Banner */}
          <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-800/30 flex items-center justify-between">
            <span className="text-xs text-amber-300 font-medium">
              Current Payable Debt Owed:
            </span>
            <span className="text-base font-bold font-mono text-amber-400">
              ₹{currentDebt.toFixed(2)}
            </span>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-medium text-zinc-300">
                Disbursement Amount (₹) *
              </label>
              {currentDebt > 0 && (
                <button
                  type="button"
                  onClick={() => setAmount(currentDebt.toString())}
                  className="text-[10px] text-emerald-400 hover:underline cursor-pointer"
                >
                  Pay Full Debt (₹{currentDebt.toFixed(2)})
                </button>
              )}
            </div>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full bg-[#18181b] border border-[#27272a] rounded-xl px-3 py-2 text-sm font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Payment Method *
            </label>
            <div className="grid grid-cols-3 gap-1.5 bg-[#18181b] p-1 rounded-xl border border-[#27272a] text-xs font-semibold text-center">
              {["BANK_TRANSFER", "UPI", "CASH", "CHEQUE", "CARD"].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPaymentMethod(m)}
                  className={`py-1.5 rounded-lg transition-all cursor-pointer text-[11px] ${
                    paymentMethod === m
                      ? "bg-white text-zinc-950 shadow-xs font-bold"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {m.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          {(paymentMethod === "UPI" || paymentMethod === "BANK_TRANSFER" || paymentMethod === "CHEQUE") && (
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                {paymentMethod === "CHEQUE"
                  ? "Cheque Number (Optional)"
                  : paymentMethod === "UPI"
                  ? "UPI Reference ID / UTR (Optional)"
                  : "NEFT / RTGS / Transaction ID (Optional)"}
              </label>
              <input
                value={referenceId}
                onChange={(e) => setReferenceId(e.target.value)}
                placeholder="e.g. UTR12345678 or CHQ-00981"
                className="w-full bg-[#18181b] border border-[#27272a] rounded-xl px-3 py-2 text-xs font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Notes / Remarks
            </label>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Cleared invoice #INV-441 bill"
              className="w-full bg-[#18181b] border border-[#27272a] rounded-xl px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#1f1f23]">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs transition-colors disabled:opacity-50 cursor-pointer shadow-xs flex items-center gap-1.5"
            >
              <CheckCircle className="w-4 h-4" />
              {submitting ? "Processing..." : "Disburse Payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
