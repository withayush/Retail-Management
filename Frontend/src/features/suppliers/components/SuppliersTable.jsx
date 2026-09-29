import React from "react";
import {
  Truck,
  Phone,
  Mail,
  MapPin,
  Edit2,
  Archive,
  RotateCcw,
  CheckCircle2,
  Clock,
  Building2,
  FileText,
  BookOpen,
  Wallet,
  ShoppingBag,
} from "lucide-react";

export default function SuppliersTable({
  suppliers,
  loading,
  onEditSupplier,
  onArchiveSupplier,
  onRestoreSupplier,
  onViewLedger,
  onSettlePayment,
  onView360,
  onCreatePO,
}) {


  if (loading) {
    return (
      <div className="bg-[#121214] border border-[#27272a] rounded-2xl p-12 text-center">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-3" />
        <p className="text-sm text-zinc-400">Loading supplier master directory...</p>
      </div>
    );
  }

  if (!suppliers || suppliers.length === 0) {
    return (
      <div className="bg-[#121214] border border-[#27272a] rounded-2xl p-12 text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center mx-auto text-zinc-400">
          <Truck className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-white">No Suppliers Found</h3>
        <p className="text-xs text-zinc-400 max-w-sm mx-auto">
          No registered suppliers matched your current search filters or none have been added yet.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[#121214] border border-[#27272a] rounded-2xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#27272a] bg-[#18181b]/60 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              <th className="px-5 py-3.5">Supplier / Company</th>
              <th className="px-5 py-3.5">Contact Person</th>
              <th className="px-5 py-3.5">Contact Info</th>
              <th className="px-5 py-3.5">Location & GST</th>
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5 text-right">Payable Balance</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#27272a]/60 text-xs text-zinc-300">
            {suppliers.map((supplier) => {
              const isActive = supplier.status === "ACTIVE";
              const hasBalance = (supplier.currentBalance || 0) > 0;

              return (
                <tr
                  key={supplier._id}
                  className="hover:bg-zinc-800/30 transition-colors group"
                >
                  {/* Company & Tags */}
                  <td className="px-5 py-4 min-w-[200px]">
                    <div className="flex items-start gap-3">
                      <div
                        onClick={() => (onView360 ? onView360(supplier) : null)}
                        className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0 mt-0.5 cursor-pointer hover:bg-blue-500/20 transition-colors"
                        title="Open Supplier 360° Profile (T41)"
                      >
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <button
                          type="button"
                          onClick={() => (onView360 ? onView360(supplier) : null)}
                          className="font-bold text-white text-sm block truncate group-hover:text-blue-400 transition-colors text-left cursor-pointer hover:underline"
                          title="Open Supplier 360° Profile (T41)"
                        >
                          {supplier.company}
                        </button>
                        {supplier.tags && supplier.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {supplier.tags.slice(0, 2).map((t, idx) => (
                              <span
                                key={idx}
                                className="text-[10px] bg-zinc-800/80 text-zinc-400 px-1.5 py-0.5 rounded border border-zinc-700/50"
                              >
                                {t}
                              </span>
                            ))}
                            {supplier.tags.length > 2 && (
                              <span className="text-[10px] text-zinc-400">
                                +{supplier.tags.length - 2}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>


                  {/* Contact Person */}
                  <td className="px-5 py-4">
                    <span className="text-zinc-200 font-medium">
                      {supplier.contactName || "—"}
                    </span>
                  </td>

                  {/* Contact Info (Phone & Email) */}
                  <td className="px-5 py-4">
                    <div className="space-y-1">
                      {supplier.phone ? (
                        <div className="flex items-center gap-1.5 text-zinc-300 font-mono text-xs">
                          <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>{supplier.phone}</span>
                        </div>
                      ) : (
                        <span className="text-zinc-400 text-xs">No phone</span>
                      )}
                      {supplier.email && (
                        <div className="flex items-center gap-1.5 text-zinc-400 text-[11px] truncate max-w-[160px]">
                          <Mail className="w-3 h-3 text-zinc-400 shrink-0" />
                          <span className="truncate">{supplier.email}</span>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Location & GSTIN */}
                  <td className="px-5 py-4">
                    <div className="space-y-1">
                      {(supplier.city || supplier.state) ? (
                        <div className="flex items-center gap-1.5 text-zinc-300 text-xs">
                          <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                          <span>
                            {[supplier.city, supplier.state].filter(Boolean).join(", ")}
                          </span>
                        </div>
                      ) : (
                        <span className="text-zinc-400 text-xs">—</span>
                      )}
                      {supplier.gstin && (
                        <div className="flex items-center gap-1.5 text-[11px] text-amber-400/90 font-mono">
                          <FileText className="w-3 h-3 shrink-0" />
                          <span>{supplier.gstin}</span>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Status Badge */}
                  <td className="px-5 py-4">
                    {isActive ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" />
                        ACTIVE
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-zinc-800 text-zinc-400 border border-zinc-700">
                        <Clock className="w-3 h-3" />
                        {supplier.status || "INACTIVE"}
                      </span>
                    )}
                  </td>

                  {/* Payable Balance */}
                  <td className="px-5 py-4 text-right">
                    <div className="space-y-0.5">
                      <div
                        className={`text-sm font-bold font-mono ${
                          hasBalance ? "text-amber-400" : "text-zinc-400"
                        }`}
                      >
                        ₹{(supplier.currentBalance || 0).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </div>
                      {hasBalance && (
                        <span className="text-[10px] text-amber-500/80 font-medium block">
                          Payable Due
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* T41 Supplier 360 Management Center Button */}
                      {onView360 && (
                        <button
                          onClick={() => onView360(supplier)}
                          className="px-2 py-1.5 rounded-lg text-blue-400 hover:text-white hover:bg-blue-500/20 transition-colors border border-blue-500/30 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                          title="Open Supplier 360° Management Center (T41)"
                        >
                          <Building2 className="w-3.5 h-3.5" />
                          <span className="hidden xl:inline">360° Profile</span>
                        </button>
                      )}

                      {/* T39 Supplier Ledger Audit Button */}
                      {onViewLedger && (
                        <button
                          onClick={() => onViewLedger(supplier)}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors border border-zinc-700/60 cursor-pointer"
                          title="View Accounts Payable Ledger (T39)"
                        >
                          <BookOpen className="w-4 h-4" />
                        </button>
                      )}

                      {/* T42 Create Purchase Order Button */}
                      {onCreatePO && (
                        <button
                          onClick={() => onCreatePO(supplier)}
                          className="p-1.5 rounded-lg text-blue-400 hover:text-white hover:bg-blue-600/20 transition-colors border border-blue-500/30 cursor-pointer"
                          title="Create Purchase Order (T42)"
                        >
                          <ShoppingBag className="w-4 h-4" />
                        </button>
                      )}

                      {/* Quick Settle / Disburse Payment Button */}
                      {hasBalance && onSettlePayment && (
                        <button
                          onClick={() => onSettlePayment(supplier)}
                          className="p-1.5 rounded-lg text-emerald-400 hover:text-zinc-950 hover:bg-emerald-400 transition-colors border border-emerald-500/30 font-bold cursor-pointer"
                          title="Disburse Payment Payout"
                        >
                          <Wallet className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        onClick={() => onEditSupplier(supplier)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                        title="Edit Supplier (T38)"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      {isActive ? (
                        <button
                          onClick={() => onArchiveSupplier(supplier)}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Archive Supplier (Soft-delete)"
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => onRestoreSupplier(supplier)}
                          className="p-1.5 rounded-lg text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 transition-colors cursor-pointer"
                          title="Restore to Active"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>


                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
