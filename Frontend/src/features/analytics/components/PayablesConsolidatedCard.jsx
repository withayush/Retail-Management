import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Truck,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  CreditCard,
  Layers,
  Banknote,
  Receipt,
  RotateCcw,
} from "lucide-react";

/**
 * PayablesConsolidatedCard - Phase 9 (Task T58: Payables Consolidated Index)
 * Formula: SUM(All outstanding Supplier Ledger active balances)
 * Consolidated business-level accounts payable liability, supplier advances, aging buckets, and top creditors.
 */
export default function PayablesConsolidatedCard({
  data,
  loading = false,
  error = null,
  onRetry = null,
}) {
  const [activeTab, setActiveTab] = useState("OVERVIEW"); // OVERVIEW | CREDITORS | REPAYMENTS

  const formatINR = (val, decimals = 2) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(Number(val) || 0);
  };

  if (loading) {
    return (
      <div className="p-6 bg-[#161617]/90 backdrop-blur-2xl border border-[#D2D2D7]/12 rounded-[18px] shadow-[0_4px_24px_rgba(0,0,0,0.3)] space-y-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-5 w-48 bg-white/10 rounded" />
            <div className="h-3 w-72 bg-white/5 rounded" />
          </div>
          <div className="h-6 w-32 bg-white/10 rounded-full" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-white/5 rounded-xl" />
          ))}
        </div>
        <div className="h-24 bg-white/5 rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-[#161617]/90 backdrop-blur-2xl border border-rose-500/30 rounded-[18px] shadow-[0_4px_24px_rgba(0,0,0,0.3)] space-y-4 text-center">
        <div className="w-10 h-10 rounded-full bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <h3 className="text-base font-semibold text-white">Failed to load Total Supplier Payables</h3>
        <p className="text-xs text-[#A1A1AA] max-w-md mx-auto">
          {error.message || "An unexpected error occurred while calculating consolidated payables."}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="apple-btn-secondary text-xs inline-flex items-center gap-1.5 py-1.5 px-4 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retry Calculation</span>
          </button>
        )}
      </div>
    );
  }

  const totalPayables = data?.totalPayables ?? 0;
  const grossPayables = data?.grossPayables ?? totalPayables;
  const netPayables = data?.netPayables ?? totalPayables;
  const totalAdvances = data?.totalSupplierAdvances ?? 0;
  const suppliersWithOutstanding = data?.suppliersWithOutstanding ?? data?.payableSuppliersCount ?? 0;
  const totalSuppliers = data?.totalSuppliers ?? 0;
  const payableRatio = data?.payableSupplierRatio ?? 0;
  const avgPayable = data?.averagePayablePerSupplier ?? 0;
  const totalProcurementSpend = data?.totalProcurementSpend ?? 0;

  const aging = data?.aging || {
    bucket0_30: 0,
    bucket31_60: 0,
    bucket61_90: 0,
    bucket90Plus: 0,
    totalAgedDebt: 0,
    shares: { share0_30: 0, share31_60: 0, share61_90: 0, share90Plus: 0 },
  };

  const riskProfile = data?.riskProfile || {
    rating: "NORMAL",
    label: "Standard Payables Risk",
    color: "blue",
    description: "Supplier accounts payable are performing within normal retail parameters.",
  };

  const topPayables = data?.topPayables || [];
  const recentDisbursements = data?.recentDisbursements || [];

  return (
    <div className="p-6 bg-[#161617]/90 backdrop-blur-2xl border border-[#D2D2D7]/12 rounded-[18px] shadow-[0_4px_24px_rgba(0,0,0,0.3)] space-y-6">
      {/* ── HEADER SECTION ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-white tracking-tight">
              Payables Consolidated Index
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-[#FF791B]/15 text-[#FFA466] border border-[#FF791B]/30">
              Phase 9 — Task T58
            </span>
          </div>
          <p className="text-xs text-[#6E6E73] mt-0.5">
            Formula: SUM(All outstanding Supplier Ledger active balances) — Store procurement liability
          </p>
        </div>

        {/* Risk Profile Pill */}
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
              riskProfile.color === "emerald"
                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                : riskProfile.color === "rose"
                ? "bg-rose-500/15 text-rose-400 border-rose-500/30 animate-pulse"
                : riskProfile.color === "amber"
                ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                : "bg-blue-500/15 text-blue-400 border-blue-500/30"
            }`}
          >
            {riskProfile.color === "rose" ? (
              <AlertTriangle className="w-3.5 h-3.5" />
            ) : (
              <ShieldCheck className="w-3.5 h-3.5" />
            )}
            <span>{riskProfile.label}</span>
          </span>
        </div>
      </div>

      {/* ── METRIC CARDS STRIP ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Total Supplier Payables (Primary Mandated Metric Card) */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-white/[0.04] to-transparent border border-[#FF791B]/25 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#FF791B]/10 rounded-full blur-xl pointer-events-none" />
          <div>
            <div className="flex items-center justify-between text-[#6E6E73] text-xs">
              <span className="font-semibold text-[#D2D2D7]">Total Supplier Payables</span>
              <Banknote className="w-4 h-4 text-[#FFA466]" />
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold font-mono text-white tracking-tight block">
                {formatINR(totalPayables, 2)}
              </span>
              <p className="text-[11px] text-[#FFA466] mt-0.5 font-medium">
                {suppliersWithOutstanding > 0
                  ? `${suppliersWithOutstanding} suppliers with outstanding balances`
                  : "0 suppliers with outstanding balances"}
              </p>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-[#D2D2D7]/8 text-[11px] text-[#6E6E73] flex justify-between font-mono">
            <span>Net Payable (after advances):</span>
            <span className="text-white font-medium">{formatINR(netPayables, 2)}</span>
          </div>
        </div>

        {/* Card 2: Creditors vs Total Suppliers */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-white/[0.04] to-transparent border border-[#D2D2D7]/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[#6E6E73] text-xs">
              <span className="font-medium">Active Creditor Accounts</span>
              <Truck className="w-4 h-4 text-sky-400" />
            </div>
            <div className="mt-2">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold font-mono text-white tracking-tight">
                  {suppliersWithOutstanding}
                </span>
                <span className="text-xs text-[#6E6E73] font-mono">
                  / {totalSuppliers} suppliers
                </span>
              </div>
              <p className="text-[11px] text-[#A1A1AA] mt-0.5">
                {payableRatio}% of suppliers have pending credit
              </p>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-[#D2D2D7]/8 text-[11px] text-[#6E6E73] flex justify-between font-mono">
            <span>Avg Payable / Creditor:</span>
            <span className="text-sky-400 font-medium">{formatINR(avgPayable, 0)}</span>
          </div>
        </div>

        {/* Card 3: Supplier Advances (Negative Balances) */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-white/[0.04] to-transparent border border-[#D2D2D7]/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[#6E6E73] text-xs">
              <span className="font-medium">Supplier Advances</span>
              <CreditCard className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold font-mono text-emerald-400 tracking-tight">
                {formatINR(totalAdvances, 2)}
              </span>
              <p className="text-[11px] text-[#A1A1AA] mt-0.5">
                Prepayments & credit held in advance
              </p>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-[#D2D2D7]/8 text-[11px] text-[#6E6E73] flex justify-between font-mono">
            <span>Advance Accounts:</span>
            <span className="text-white font-medium">{data?.advanceSuppliersCount || 0}</span>
          </div>
        </div>

        {/* Card 4: Historical Procurement Spend */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-white/[0.04] to-transparent border border-[#D2D2D7]/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[#6E6E73] text-xs">
              <span className="font-medium">Historical Procurement</span>
              <Layers className="w-4 h-4 text-violet-400" />
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold font-mono text-white tracking-tight">
                {formatINR(totalProcurementSpend, 0)}
              </span>
              <p className="text-[11px] text-[#A1A1AA] mt-0.5">
                Total delivered stock purchases
              </p>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-[#D2D2D7]/8 text-[11px] text-[#6E6E73] flex justify-between font-mono">
            <span>Settlement Rate:</span>
            <span className="text-white font-medium">
              {totalProcurementSpend > 0
                ? `${Math.round(((totalProcurementSpend - grossPayables) / totalProcurementSpend) * 100)}%`
                : "100%"}
            </span>
          </div>
        </div>
      </div>

      {/* ── 4-TIER CONSOLIDATED PAYABLES AGING BAR ── */}
      <div className="space-y-3 p-4 rounded-xl bg-white/[0.02] border border-[#D2D2D7]/10">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-white tracking-tight block">
              Consolidated Payables Aging Schedule
            </span>
            <span className="text-[11px] text-[#6E6E73]">
              Chronological age of unpaid supplier procurement invoices across store
            </span>
          </div>
          <span className="text-xs font-mono text-[#D2D2D7]">
            Total Aged: <strong className="text-white">{formatINR(aging.totalAgedDebt || grossPayables, 2)}</strong>
          </span>
        </div>

        {/* Visual Bar */}
        <div className="h-5 w-full bg-[#1F1F23] rounded-full overflow-hidden flex border border-[#D2D2D7]/10 p-0.5">
          {aging.shares.share0_30 > 0 && (
            <div
              style={{ width: `${aging.shares.share0_30}%` }}
              className="h-full bg-emerald-500 rounded-l-full relative group transition-all"
              title={`0-30 Days: ${formatINR(aging.bucket0_30, 0)} (${aging.shares.share0_30}%)`}
            />
          )}
          {aging.shares.share31_60 > 0 && (
            <div
              style={{ width: `${aging.shares.share31_60}%` }}
              className="h-full bg-amber-500 relative group transition-all"
              title={`31-60 Days: ${formatINR(aging.bucket31_60, 0)} (${aging.shares.share31_60}%)`}
            />
          )}
          {aging.shares.share61_90 > 0 && (
            <div
              style={{ width: `${aging.shares.share61_90}%` }}
              className="h-full bg-orange-500 relative group transition-all"
              title={`61-90 Days: ${formatINR(aging.bucket61_90, 0)} (${aging.shares.share61_90}%)`}
            />
          )}
          {aging.shares.share90Plus > 0 && (
            <div
              style={{ width: `${aging.shares.share90Plus}%` }}
              className="h-full bg-rose-500 rounded-r-full relative group transition-all"
              title={`90+ Days: ${formatINR(aging.bucket90Plus, 0)} (${aging.shares.share90Plus}%)`}
            />
          )}
          {grossPayables === 0 && (
            <div className="h-full w-full flex items-center justify-center text-[10px] text-[#6E6E73]">
              Zero outstanding supplier payables recorded
            </div>
          )}
        </div>

        {/* 4 Slices Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          {/* 0-30 Days */}
          <div className="p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
            <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>0–30 Days (Current)</span>
            </div>
            <div className="mt-1 font-mono">
              <span className="text-xs font-bold text-white block">
                {formatINR(aging.bucket0_30, 0)}
              </span>
              <span className="text-[10px] text-[#6E6E73]">{aging.shares.share0_30}% share</span>
            </div>
          </div>

          {/* 31-60 Days */}
          <div className="p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/20">
            <div className="flex items-center gap-1.5 text-amber-400 text-[11px] font-semibold">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>31–60 Days (Maturing)</span>
            </div>
            <div className="mt-1 font-mono">
              <span className="text-xs font-bold text-white block">
                {formatINR(aging.bucket31_60, 0)}
              </span>
              <span className="text-[10px] text-[#6E6E73]">{aging.shares.share31_60}% share</span>
            </div>
          </div>

          {/* 61-90 Days */}
          <div className="p-2.5 rounded-lg bg-orange-500/5 border border-orange-500/20">
            <div className="flex items-center gap-1.5 text-orange-400 text-[11px] font-semibold">
              <span className="w-2 h-2 rounded-full bg-orange-400" />
              <span>61–90 Days (Attention)</span>
            </div>
            <div className="mt-1 font-mono">
              <span className="text-xs font-bold text-white block">
                {formatINR(aging.bucket61_90, 0)}
              </span>
              <span className="text-[10px] text-[#6E6E73]">{aging.shares.share61_90}% share</span>
            </div>
          </div>

          {/* 90+ Days */}
          <div className="p-2.5 rounded-lg bg-rose-500/5 border border-rose-500/20">
            <div className="flex items-center gap-1.5 text-rose-400 text-[11px] font-semibold">
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              <span>90+ Days (Critical Overdue)</span>
            </div>
            <div className="mt-1 font-mono">
              <span className="text-xs font-bold text-white block">
                {formatINR(aging.bucket90Plus, 0)}
              </span>
              <span className="text-[10px] text-[#6E6E73]">{aging.shares.share90Plus}% share</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── SUB-TABS: TOP CREDITORS vs RECENT DISBURSEMENTS ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-[#D2D2D7]/10 pb-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("OVERVIEW")}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                activeTab === "OVERVIEW"
                  ? "bg-white/10 text-white font-semibold"
                  : "text-[#6E6E73] hover:text-white"
              }`}
            >
              Top Creditors Ranking ({topPayables.length})
            </button>
            <button
              onClick={() => setActiveTab("REPAYMENTS")}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                activeTab === "REPAYMENTS"
                  ? "bg-white/10 text-white font-semibold"
                  : "text-[#6E6E73] hover:text-white"
              }`}
            >
              Recent Disbursements ({recentDisbursements.length})
            </button>
          </div>

          <Link
            to="/suppliers"
            className="text-xs text-[#0066CC] hover:text-[#54A7FF] font-medium flex items-center gap-1 group"
          >
            <span>Open Supplier Management Center</span>
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>

        {activeTab === "OVERVIEW" ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-[#D2D2D7]/10 text-[#6E6E73]">
                  <th className="pb-3 font-semibold font-sans">#</th>
                  <th className="pb-3 font-semibold font-sans">Supplier Firm</th>
                  <th className="pb-3 font-semibold font-sans text-right">Outstanding (Payable)</th>
                  <th className="pb-3 font-semibold font-sans text-right">Total Purchases</th>
                  <th className="pb-3 font-semibold font-sans text-right">Orders</th>
                  <th className="pb-3 font-semibold font-sans text-right">Last Payout</th>
                  <th className="pb-3 font-semibold font-sans text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D2D2D7]/6">
                {topPayables.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-6 text-center text-[#6E6E73] font-sans">
                      No suppliers currently have outstanding payables.
                    </td>
                  </tr>
                ) : (
                  topPayables.map((s, idx) => (
                    <tr key={s.supplierId || idx} className="hover:bg-white/[0.03] transition-colors group">
                      <td className="py-2.5 text-[#6E6E73] font-sans">{idx + 1}</td>
                      <td className="py-2.5 font-sans">
                        <div>
                          <span className="font-semibold text-white block group-hover:text-[#FFA466] transition-colors">
                            {s.company}
                          </span>
                          <span className="text-[10px] text-[#6E6E73] font-mono block">
                            {s.phone || s.contactName || "No contact info recorded"}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 text-right font-bold text-white text-sm">
                        {formatINR(s.currentBalance, 2)}
                      </td>
                      <td className="py-2.5 text-right text-[#D2D2D7]">
                        {formatINR(s.totalPurchases, 0)}
                      </td>
                      <td className="py-2.5 text-right text-[#D2D2D7]">
                        {s.totalOrders || 0}
                      </td>
                      <td className="py-2.5 text-right text-[#A1A1AA]">
                        {s.lastPaymentDate
                          ? `${s.daysSincePayment ?? 0}d ago`
                          : "No payments yet"}
                      </td>
                      <td className="py-2.5 text-right">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold font-sans uppercase ${
                            s.status === "ACTIVE"
                              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                              : "bg-zinc-500/15 text-zinc-400 border border-zinc-500/30"
                          }`}
                        >
                          {s.status || "ACTIVE"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-[#D2D2D7]/10 text-[#6E6E73]">
                  <th className="pb-3 font-semibold font-sans">Date</th>
                  <th className="pb-3 font-semibold font-sans">Supplier</th>
                  <th className="pb-3 font-semibold font-sans text-right">Disbursement Amount</th>
                  <th className="pb-3 font-semibold font-sans">Payment Method</th>
                  <th className="pb-3 font-semibold font-sans text-right">Payable Balance After</th>
                  <th className="pb-3 font-semibold font-sans">Disbursed By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D2D2D7]/6">
                {recentDisbursements.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-6 text-center text-[#6E6E73] font-sans">
                      No recent supplier payout disbursement transactions recorded.
                    </td>
                  </tr>
                ) : (
                  recentDisbursements.map((r, idx) => (
                    <tr key={r.id || idx} className="hover:bg-white/[0.03] transition-colors">
                      <td className="py-2.5 text-[#D2D2D7] font-sans">
                        {r.date ? new Date(r.date).toLocaleDateString("en-IN") : "N/A"}
                      </td>
                      <td className="py-2.5 font-sans font-medium text-white">
                        {r.supplierCompany}
                      </td>
                      <td className="py-2.5 text-right font-bold text-emerald-400">
                        {formatINR(r.amount, 2)}
                      </td>
                      <td className="py-2.5">
                        <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-white/10 text-white font-medium">
                          {r.paymentMethod}
                        </span>
                      </td>
                      <td className="py-2.5 text-right text-[#D2D2D7]">
                        {formatINR(r.balanceAfter, 2)}
                      </td>
                      <td className="py-2.5 text-[#6E6E73] font-sans">
                        {r.recordedBy}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
