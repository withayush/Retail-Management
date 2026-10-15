import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  CreditCard,
  ChevronRight,
  Layers,
  Banknote,
} from "lucide-react";

/**
 * ReceivablesConsolidatedCard - Phase 9 (Task T57: Receivables Consolidated Index)
 * Formula: SUM(All outstanding Customer Ledger active balances)
 * Consolidated business-level customer debt, advances, aging buckets, and top debtors.
 */
export default function ReceivablesConsolidatedCard({ data, loading = false }) {
  const [activeTab, setActiveTab] = useState("OVERVIEW"); // OVERVIEW | DEBTORS | AGING | REPAYMENTS

  const formatINR = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(val) || 0);
  };

  const totalReceivables = data?.totalReceivables ?? 0;
  const grossReceivables = data?.grossReceivables ?? totalReceivables;
  const netReceivables = data?.netReceivables ?? totalReceivables;
  const totalAdvances = data?.totalCustomerAdvances ?? 0;
  const debtorCount = data?.debtorCustomersCount ?? 0;
  const totalCustomers = data?.totalCustomers ?? 0;
  const debtorRatio = data?.debtorRatio ?? 0;
  const avgDebt = data?.averageReceivablePerDebtor ?? 0;
  const totalCreditLimit = data?.totalCreditLimit ?? 0;
  const creditUtilization = data?.overallCreditUtilization ?? 0;

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
    label: "Standard Credit Risk",
    color: "blue",
    description: "Credit portfolio is performing within acceptable store parameters.",
  };

  const topDebtors = data?.topDebtors || [];
  const recentRepayments = data?.recentRepayments || [];

  return (
    <div className="p-6 bg-[#161617]/90 backdrop-blur-2xl border border-[#D2D2D7]/12 rounded-[18px] shadow-[0_4px_24px_rgba(0,0,0,0.3)] space-y-6">
      {/* ── HEADER SECTION ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-white tracking-tight">
              Receivables Consolidated Index
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-[#0066CC]/15 text-[#54A7FF] border border-[#0066CC]/30">
              Phase 9 — Task T57
            </span>
          </div>
          <p className="text-xs text-[#6E6E73] mt-0.5">
            Formula: SUM(All outstanding Customer Ledger active balances) — Store credit recoverable
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
        {/* Total Gross Receivables */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-white/[0.04] to-transparent border border-[#D2D2D7]/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[#6E6E73] text-xs">
              <span className="font-medium">Total Recoverable (Gross)</span>
              <Banknote className="w-4 h-4 text-[#D2D2D7]" />
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold font-mono text-white tracking-tight">
                {formatINR(grossReceivables)}
              </span>
              <p className="text-[11px] text-[#A1A1AA] mt-0.5">
                Active customer Udhaar / credit debt
              </p>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-[#D2D2D7]/8 text-[11px] text-[#6E6E73] flex justify-between font-mono">
            <span>Net Balance:</span>
            <span className="text-white font-medium">{formatINR(netReceivables)}</span>
          </div>
        </div>

        {/* Debtors vs Customers Ratio */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-white/[0.04] to-transparent border border-[#D2D2D7]/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[#6E6E73] text-xs">
              <span className="font-medium">Active Debtors</span>
              <Users className="w-4 h-4 text-sky-400" />
            </div>
            <div className="mt-2">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold font-mono text-white tracking-tight">
                  {debtorCount}
                </span>
                <span className="text-xs text-[#6E6E73] font-mono">
                  / {totalCustomers} customers
                </span>
              </div>
              <p className="text-[11px] text-[#A1A1AA] mt-0.5">
                {debtorRatio}% of customer base has credit
              </p>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-[#D2D2D7]/8 text-[11px] text-[#6E6E73] flex justify-between font-mono">
            <span>Avg Debt / Debtor:</span>
            <span className="text-sky-400 font-medium">{formatINR(avgDebt)}</span>
          </div>
        </div>

        {/* Customer Advances (Negative Balances) */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-white/[0.04] to-transparent border border-[#D2D2D7]/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[#6E6E73] text-xs">
              <span className="font-medium">Customer Advances</span>
              <CreditCard className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold font-mono text-emerald-400 tracking-tight">
                {formatINR(totalAdvances)}
              </span>
              <p className="text-[11px] text-[#A1A1AA] mt-0.5">
                Overpayments / credit held in advance
              </p>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-[#D2D2D7]/8 text-[11px] text-[#6E6E73] flex justify-between font-mono">
            <span>Advance Accounts:</span>
            <span className="text-white font-medium">{data?.advanceCustomersCount || 0}</span>
          </div>
        </div>

        {/* Credit Limit & Facility Utilization */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-white/[0.04] to-transparent border border-[#D2D2D7]/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[#6E6E73] text-xs">
              <span className="font-medium">Credit Facility Utilization</span>
              <Layers className="w-4 h-4 text-amber-400" />
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold font-mono text-amber-400 tracking-tight">
                {creditUtilization}%
              </span>
              <p className="text-[11px] text-[#A1A1AA] mt-0.5">
                {formatINR(grossReceivables)} of {formatINR(totalCreditLimit)} limit
              </p>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-[#D2D2D7]/8 text-[11px] text-[#6E6E73] flex justify-between font-mono">
            <span>Limit Assigned:</span>
            <span className="text-white font-medium">{formatINR(totalCreditLimit)}</span>
          </div>
        </div>
      </div>

      {/* ── 4-TIER CONSOLIDATED DEBT AGING BAR ── */}
      <div className="space-y-3 p-4 rounded-xl bg-white/[0.02] border border-[#D2D2D7]/10">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-white tracking-tight block">
              Consolidated Debt Aging Schedule
            </span>
            <span className="text-[11px] text-[#6E6E73]">
              Chronological age of unpaid customer credit invoices across store
            </span>
          </div>
          <span className="text-xs font-mono text-[#D2D2D7]">
            Total Aged: <strong className="text-white">{formatINR(aging.totalAgedDebt || grossReceivables)}</strong>
          </span>
        </div>

        {/* Visual Bar */}
        <div className="h-5 w-full bg-[#1F1F23] rounded-full overflow-hidden flex border border-[#D2D2D7]/10 p-0.5">
          {aging.shares.share0_30 > 0 && (
            <div
              style={{ width: `${aging.shares.share0_30}%` }}
              className="h-full bg-emerald-500 rounded-l-full relative group transition-all"
              title={`0-30 Days: ${formatINR(aging.bucket0_30)} (${aging.shares.share0_30}%)`}
            />
          )}
          {aging.shares.share31_60 > 0 && (
            <div
              style={{ width: `${aging.shares.share31_60}%` }}
              className="h-full bg-amber-500 relative group transition-all"
              title={`31-60 Days: ${formatINR(aging.bucket31_60)} (${aging.shares.share31_60}%)`}
            />
          )}
          {aging.shares.share61_90 > 0 && (
            <div
              style={{ width: `${aging.shares.share61_90}%` }}
              className="h-full bg-orange-500 relative group transition-all"
              title={`61-90 Days: ${formatINR(aging.bucket61_90)} (${aging.shares.share61_90}%)`}
            />
          )}
          {aging.shares.share90Plus > 0 && (
            <div
              style={{ width: `${aging.shares.share90Plus}%` }}
              className="h-full bg-rose-500 rounded-r-full relative group transition-all"
              title={`90+ Days: ${formatINR(aging.bucket90Plus)} (${aging.shares.share90Plus}%)`}
            />
          )}
          {grossReceivables === 0 && (
            <div className="h-full w-full flex items-center justify-center text-[10px] text-[#6E6E73]">
              Zero outstanding debt recorded
            </div>
          )}
        </div>

        {/* 4 Slices Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          {/* 0-30 Days */}
          <div className="p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
            <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>0–30 Days (Fresh)</span>
            </div>
            <div className="mt-1 font-mono">
              <span className="text-xs font-bold text-white block">
                {formatINR(aging.bucket0_30)}
              </span>
              <span className="text-[10px] text-[#6E6E73]">{aging.shares.share0_30}% share</span>
            </div>
          </div>

          {/* 31-60 Days */}
          <div className="p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/20">
            <div className="flex items-center gap-1.5 text-amber-400 text-[11px] font-semibold">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>31–60 Days (Attention)</span>
            </div>
            <div className="mt-1 font-mono">
              <span className="text-xs font-bold text-white block">
                {formatINR(aging.bucket31_60)}
              </span>
              <span className="text-[10px] text-[#6E6E73]">{aging.shares.share31_60}% share</span>
            </div>
          </div>

          {/* 61-90 Days */}
          <div className="p-2.5 rounded-lg bg-orange-500/5 border border-orange-500/20">
            <div className="flex items-center gap-1.5 text-orange-400 text-[11px] font-semibold">
              <span className="w-2 h-2 rounded-full bg-orange-400" />
              <span>61–90 Days (Aging)</span>
            </div>
            <div className="mt-1 font-mono">
              <span className="text-xs font-bold text-white block">
                {formatINR(aging.bucket61_90)}
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
                {formatINR(aging.bucket90Plus)}
              </span>
              <span className="text-[10px] text-[#6E6E73]">{aging.shares.share90Plus}% share</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── SUB-TABS: TOP DEBTORS vs RECENT REPAYMENTS ── */}
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
              Top Debtors Ranking ({topDebtors.length})
            </button>
            <button
              onClick={() => setActiveTab("REPAYMENTS")}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                activeTab === "REPAYMENTS"
                  ? "bg-white/10 text-white font-semibold"
                  : "text-[#6E6E73] hover:text-white"
              }`}
            >
              Recent Repayments ({recentRepayments.length})
            </button>
          </div>

          <Link
            to="/customers"
            className="text-xs text-[#0066CC] hover:text-[#54A7FF] font-medium flex items-center gap-1 group"
          >
            <span>Open Customer Khata Center</span>
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>

        {activeTab === "OVERVIEW" ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-[#D2D2D7]/10 text-[#6E6E73]">
                  <th className="pb-3 font-semibold font-sans">#</th>
                  <th className="pb-3 font-semibold font-sans">Customer</th>
                  <th className="pb-3 font-semibold font-sans text-right">Outstanding (Debt)</th>
                  <th className="pb-3 font-semibold font-sans text-right">Credit Limit</th>
                  <th className="pb-3 font-semibold font-sans text-right">Limit Utilization</th>
                  <th className="pb-3 font-semibold font-sans text-right">Last Repayment</th>
                  <th className="pb-3 font-semibold font-sans text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D2D2D7]/6">
                {topDebtors.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-6 text-center text-[#6E6E73] font-sans">
                      Zero customers currently have outstanding debt.
                    </td>
                  </tr>
                ) : (
                  topDebtors.map((d, idx) => (
                    <tr key={d.customerId || idx} className="hover:bg-white/[0.03] transition-colors group">
                      <td className="py-2.5 text-[#6E6E73] font-sans">{idx + 1}</td>
                      <td className="py-2.5 font-sans">
                        <div>
                          <span className="font-semibold text-white block group-hover:text-[#54A7FF] transition-colors">
                            {d.name}
                          </span>
                          <span className="text-[10px] text-[#6E6E73] font-mono block">
                            {d.phone || "No phone recorded"}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 text-right font-bold text-white text-sm">
                        {formatINR(d.currentBalance)}
                      </td>
                      <td className="py-2.5 text-right text-[#D2D2D7]">
                        {d.creditLimit > 0 ? formatINR(d.creditLimit) : "Unlimited"}
                      </td>
                      <td className="py-2.5 text-right">
                        {d.creditLimit > 0 ? (
                          <span
                            className={`font-semibold ${
                              d.isLimitExceeded
                                ? "text-rose-400"
                                : d.utilizationPercentage > 80
                                ? "text-amber-400"
                                : "text-emerald-400"
                            }`}
                          >
                            {d.utilizationPercentage}%
                          </span>
                        ) : (
                          <span className="text-[#6E6E73]">—</span>
                        )}
                      </td>
                      <td className="py-2.5 text-right text-[#A1A1AA]">
                        {d.lastPaymentDate
                          ? `${d.daysSincePayment ?? 0}d ago`
                          : "No payments yet"}
                      </td>
                      <td className="py-2.5 text-right">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold font-sans uppercase ${
                            d.isLimitExceeded
                              ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                              : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                          }`}
                        >
                          {d.isLimitExceeded ? "LIMIT EXCEEDED" : d.status || "ACTIVE"}
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
                  <th className="pb-3 font-semibold font-sans">Customer</th>
                  <th className="pb-3 font-semibold font-sans text-right">Settlement Amount</th>
                  <th className="pb-3 font-semibold font-sans">Payment Method</th>
                  <th className="pb-3 font-semibold font-sans text-right">Balance After</th>
                  <th className="pb-3 font-semibold font-sans">Staff / Cashier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D2D2D7]/6">
                {recentRepayments.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-6 text-center text-[#6E6E73] font-sans">
                      No recent debt repayment transactions recorded.
                    </td>
                  </tr>
                ) : (
                  recentRepayments.map((r, idx) => (
                    <tr key={r.id || idx} className="hover:bg-white/[0.03] transition-colors">
                      <td className="py-2.5 text-[#D2D2D7] font-sans">
                        {r.date ? new Date(r.date).toLocaleDateString("en-IN") : "N/A"}
                      </td>
                      <td className="py-2.5 font-sans font-medium text-white">
                        {r.customerName}
                      </td>
                      <td className="py-2.5 text-right font-bold text-emerald-400">
                        {formatINR(r.amount)}
                      </td>
                      <td className="py-2.5">
                        <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-white/10 text-white font-medium">
                          {r.paymentMethod}
                        </span>
                      </td>
                      <td className="py-2.5 text-right text-[#D2D2D7]">
                        {formatINR(r.balanceAfter)}
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
