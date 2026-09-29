import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  Wallet,
  Clock,
  TrendingDown,
  Building2,
  Phone,
  ArrowUpRight,
  Plus,
  BookOpen,
  Search,
  Filter,
  ShieldAlert,
  Calendar,
  IndianRupee,
} from "lucide-react";
import {
  getBusinessPayablesSummary,
  getBusinessPayablesTotals,
} from "../../../services/supplier.api";
import toast from "react-hot-toast";

export default function OutstandingPayablesModal({
  isOpen,
  onClose,
  onOpenLedger,
  onDisbursePayment,
}) {
  const [creditors, setCreditors] = useState([]);
  const [totals, setTotals] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [minBalanceFilter, setMinBalanceFilter] = useState("ALL"); // "ALL" | "5000" | "20000" | "50000"

  const fetchPayablesData = async () => {
    setLoading(true);
    try {
      const [summaryRes, totalsRes] = await Promise.all([
        getBusinessPayablesSummary(100),
        getBusinessPayablesTotals(),
      ]);

      const list = summaryRes.data || summaryRes || [];
      const stats = totalsRes.data || totalsRes || null;

      setCreditors(list);
      setTotals(stats);
    } catch (err) {
      console.error("Failed to load payables indexer data:", err);
      toast.error("Failed to load outstanding payables summary.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchPayablesData();
      setSearchQuery("");
      setMinBalanceFilter("ALL");
    }
  }, [isOpen]);

  // Filtered creditors based on search and minimum debt
  const filteredCreditors = useMemo(() => {
    return creditors.filter((c) => {
      const balance = Number(c.currentBalance || 0);

      // Search matching
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesCompany = (c.company || "").toLowerCase().includes(q);
        const matchesContact = (c.contactName || "").toLowerCase().includes(q);
        const matchesPhone = (c.phone || "").toLowerCase().includes(q);
        const matchesGstin = (c.gstin || "").toLowerCase().includes(q);

        if (!matchesCompany && !matchesContact && !matchesPhone && !matchesGstin) {
          return false;
        }
      }

      // Min balance filter
      if (minBalanceFilter === "5000" && balance < 5000) return false;
      if (minBalanceFilter === "20000" && balance < 20000) return false;
      if (minBalanceFilter === "50000" && balance < 50000) return false;

      return true;
    });
  }, [creditors, searchQuery, minBalanceFilter]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fadeIn">
      <div className="bg-[#111113] border border-[#27272a] rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-scaleUp">
        {/* ── Modal Header ────────────────────────────────────────────── */}
        <div className="p-4 border-b border-[#1f1f23] bg-[#141417] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm md:text-base font-bold text-white tracking-tight">
                  Outstanding Payables Indexer
                </h2>
                <span className="text-[11px] bg-amber-500/10 text-amber-400 font-mono px-2 py-0.5 rounded-full border border-amber-500/20 font-semibold">
                  T40 Indexer
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Precomputed accounts payable index & cash allocation tracker for stock settlements
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Financial Allocation KPI Metrics Bar ─────────────────────────── */}
        <div className="p-4 bg-[#0c0c0e] border-b border-[#1f1f23] grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-800/30 space-y-1">
            <span className="text-[11px] text-amber-300 font-medium flex items-center gap-1">
              <Wallet className="w-3.5 h-3.5" /> Total Cash Allocation
            </span>
            <p className="text-lg font-bold font-mono text-amber-400">
              ₹{Number(totals?.totalPayableOutstanding || 0).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
            <p className="text-[10px] text-zinc-400">Total liability owed across vendors</p>
          </div>

          <div className="p-3 rounded-xl bg-[#141417] border border-[#27272a] space-y-1">
            <span className="text-[11px] text-zinc-400 font-medium flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-blue-400" /> Pending Creditors
            </span>
            <p className="text-lg font-bold font-mono text-white">
              {totals?.suppliersWithPayablesCount || 0}
              <span className="text-xs text-zinc-400 font-normal ml-1">
                / {totals?.totalSuppliersCount || 0} vendors
              </span>
            </p>
            <p className="text-[10px] text-zinc-400">Suppliers with non-zero dues</p>
          </div>

          <div className="p-3 rounded-xl bg-[#141417] border border-[#27272a] space-y-1">
            <span className="text-[11px] text-zinc-400 font-medium flex items-center gap-1">
              <TrendingDown className="w-3.5 h-3.5 text-emerald-400" /> Avg Debt / Creditor
            </span>
            <p className="text-lg font-bold font-mono text-emerald-400">
              ₹{Number(totals?.averagePayablePerSupplier || 0).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
            <p className="text-[10px] text-zinc-400">Mean liability per payable vendor</p>
          </div>

          <div className="p-3 rounded-xl bg-[#141417] border border-[#27272a] space-y-1">
            <span className="text-[11px] text-zinc-400 font-medium flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" /> Highest Single Debt
            </span>
            <p className="text-lg font-bold font-mono text-rose-400 truncate">
              {totals?.highestPayableSupplier ? (
                `₹${Number(totals.highestPayableSupplier.currentBalance).toLocaleString()}`
              ) : (
                "₹0.00"
              )}
            </p>
            <p className="text-[10px] text-zinc-400 truncate">
              {totals?.highestPayableSupplier?.company || "No active debt"}
            </p>
          </div>
        </div>

        {/* ── Search & Filter Controls ──────────────────────────────────── */}
        <div className="p-3 bg-[#121214] border-b border-[#1f1f23] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search creditors by company, phone..."
              className="w-full bg-[#18181b] border border-[#27272a] focus:border-amber-500 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 outline-none transition-colors"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
            <span className="text-[11px] text-zinc-400 shrink-0 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Min Due:
            </span>
            {["ALL", "5000", "20000", "50000"].map((threshold) => (
              <button
                key={threshold}
                onClick={() => setMinBalanceFilter(threshold)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all shrink-0 cursor-pointer ${
                  minBalanceFilter === threshold
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold"
                    : "bg-[#18181b] text-zinc-400 hover:text-zinc-200 border border-[#27272a]"
                }`}
              >
                {threshold === "ALL" ? "All Dues" : `≥ ₹${Number(threshold).toLocaleString()}`}
              </button>
            ))}
          </div>
        </div>

        {/* ── Ranked Creditor Index Table ───────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="py-20 text-center text-xs text-zinc-500 flex flex-col items-center justify-center gap-2">
              <div className="w-7 h-7 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
              <span>Indexing outstanding payables...</span>
            </div>
          ) : filteredCreditors.length === 0 ? (
            <div className="py-16 text-center text-xs text-zinc-500 space-y-2">
              <Building2 className="w-8 h-8 mx-auto text-zinc-600" />
              <p className="font-semibold text-zinc-300 text-sm">
                {creditors.length === 0
                  ? "Zero Outstanding Payables!"
                  : "No Creditors Matching Current Filter"}
              </p>
              <p className="text-zinc-500 text-xs max-w-sm mx-auto">
                {creditors.length === 0
                  ? "All supplier bills and stock deliveries have been fully settled with 0 debt."
                  : "Try lowering the minimum debt threshold or clearing the search query."}
              </p>
            </div>
          ) : (
            <div className="border border-[#1f1f23] rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs text-zinc-300">
                <thead className="bg-[#141417] text-zinc-400 uppercase text-[10px] font-semibold border-b border-[#1f1f23] tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3 w-10 text-center">Rank</th>
                    <th className="py-2.5 px-3">Supplier / Vendor</th>
                    <th className="py-2.5 px-3">Contact</th>
                    <th className="py-2.5 px-3">Last Activity</th>
                    <th className="py-2.5 px-3 text-right">Lifetime Spend</th>
                    <th className="py-2.5 px-3 text-right">Payable Balance</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1f1f23]">
                  {filteredCreditors.map((supplier, idx) => {
                    const balance = Number(supplier.currentBalance || 0);
                    const purchases = Number(supplier.totalPurchases || 0);

                    const lastPurchase = supplier.lastPurchaseDate
                      ? new Date(supplier.lastPurchaseDate).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                        })
                      : "—";

                    const lastPayment = supplier.lastPaymentDate
                      ? new Date(supplier.lastPaymentDate).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                        })
                      : "—";

                    return (
                      <tr
                        key={supplier._id || idx}
                        className="hover:bg-[#151518] transition-colors group"
                      >
                        {/* Rank Badge */}
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold font-mono ${
                              idx === 0
                                ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                                : idx === 1
                                ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                : idx === 2
                                ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                            }`}
                          >
                            {idx + 1}
                          </span>
                        </td>

                        {/* Company & GST */}
                        <td className="py-2.5 px-3 min-w-[180px]">
                          <div className="space-y-0.5">
                            <span className="font-bold text-white text-xs block truncate group-hover:text-amber-400 transition-colors">
                              {supplier.company}
                            </span>
                            {supplier.gstin && (
                              <span className="text-[10px] text-zinc-400 font-mono">
                                GST: {supplier.gstin}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Contact Person & Phone */}
                        <td className="py-2.5 px-3">
                          <div className="space-y-0.5">
                            <span className="text-zinc-200 text-xs block">
                              {supplier.contactName || "—"}
                            </span>
                            {supplier.phone && (
                              <span className="text-[11px] text-zinc-400 font-mono flex items-center gap-1">
                                <Phone className="w-3 h-3 text-emerald-400" />
                                {supplier.phone}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Last Activity Dates */}
                        <td className="py-2.5 px-3 text-[11px] text-zinc-400 whitespace-nowrap">
                          <div>Bought: <span className="text-zinc-300 font-mono">{lastPurchase}</span></div>
                          <div>Paid: <span className="text-zinc-300 font-mono">{lastPayment}</span></div>
                        </td>

                        {/* Lifetime Purchases Spend */}
                        <td className="py-2.5 px-3 text-right font-mono text-zinc-300 text-xs">
                          ₹{purchases.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>

                        {/* Current Outstanding Debt */}
                        <td className="py-2.5 px-3 text-right">
                          <span className="font-mono font-bold text-amber-400 text-sm block">
                            ₹{balance.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {onDisbursePayment && (
                              <button
                                onClick={() => {
                                  onClose();
                                  onDisbursePayment(supplier);
                                }}
                                className="px-2 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                                title="Disburse Payment"
                              >
                                <Plus className="w-3 h-3" /> Disburse
                              </button>
                            )}

                            {onOpenLedger && (
                              <button
                                onClick={() => {
                                  onClose();
                                  onOpenLedger(supplier);
                                }}
                                className="p-1 rounded-lg text-blue-400 hover:text-white hover:bg-blue-500/20 border border-blue-500/30 transition-colors cursor-pointer"
                                title="Open Full Ledger Statement (T39)"
                              >
                                <BookOpen className="w-3.5 h-3.5" />
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
          )}
        </div>

        {/* ── Modal Footer ────────────────────────────────────────────── */}
        <div className="p-3 bg-[#141417] border-t border-[#1f1f23] flex items-center justify-between text-xs text-zinc-400">
          <span>
            Indexed {filteredCreditors.length} creditor{filteredCreditors.length !== 1 ? "s" : ""}
          </span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg bg-[#18181b] hover:bg-zinc-800 text-zinc-200 text-xs border border-[#27272a] transition-colors cursor-pointer"
          >
            Close Indexer
          </button>
        </div>
      </div>
    </div>
  );
}
