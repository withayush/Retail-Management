import React, { useState, useEffect } from "react";
import {
  X,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CreditCard,
  TrendingUp,
  ShoppingBag,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Receipt,
  History,
  BookOpen,
  Plus,
  Pencil,
  Tag,
  ChevronRight,
  IndianRupee,
  Activity,
  Layers,
} from "lucide-react";
import { getCustomerCRMSummary } from "../../../services/customer.api";

export default function CustomerCRMModal({
  isOpen,
  onClose,
  customer,
  onEditCustomer,
  onViewLedger,
  onViewPaymentHistory,
  onSettlePayment,
}) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState("purchases"); // "purchases" | "payments" | "details"

  const customerId = customer?._id || customer?.id;

  useEffect(() => {
    if (!isOpen || !customerId) return;

    let isMounted = true;
    setLoading(true);

    getCustomerCRMSummary(customerId)
      .then((res) => {
        if (isMounted) {
          setData(res.data || res);
        }
      })
      .catch((err) => {
        console.error("Failed to load customer CRM summary:", err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, customerId]);

  if (!isOpen) return null;

  const profile = data?.profile || customer || {};
  const metrics = data?.salesMetrics || {};
  const outstanding = data?.outstanding || {};
  const aging = data?.debtAging || {
    bucket0_30: 0,
    bucket31_60: 0,
    bucket61_90: 0,
    bucket90Plus: 0,
    totalAgedDebt: 0,
  };
  const recentSales = data?.recentSales || [];
  const recentPayments = data?.recentPayments || [];

  const currentDebt = Number(outstanding.currentBalance ?? profile.currentBalance ?? 0);
  const creditLimit = Number(outstanding.creditLimit ?? profile.creditLimit ?? 0);
  const isLimitExceeded = creditLimit > 0 && currentDebt > creditLimit;
  const limitUsagePercent =
    creditLimit > 0 ? Math.min(100, Math.round((currentDebt / creditLimit) * 100)) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-2xl bg-[#0e0e11] border border-[#27272a] shadow-2xl shadow-black/80 overflow-hidden text-zinc-100">
        {/* ── Top Modal Header ─────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1f1f23] bg-[#141417]/90 backdrop-blur-sm sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500/20 to-amber-400/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-base shadow-inner">
              {profile.name ? profile.name.charAt(0).toUpperCase() : <User className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  {profile.name || "Customer Profile"}
                </h2>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                    profile.status === "ACTIVE"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
                  }`}
                >
                  {profile.status || "ACTIVE"}
                </span>
                {profile.tags && profile.tags.length > 0 && (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Tag className="w-2.5 h-2.5" />
                    {profile.tags[0]}
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 flex items-center gap-3 mt-0.5">
                <span className="flex items-center gap-1 text-zinc-300">
                  <Phone className="w-3 h-3 text-zinc-500" />
                  {profile.phone || "No phone"}
                </span>
                {profile.email && (
                  <span className="hidden md:flex items-center gap-1 text-zinc-400">
                    <Mail className="w-3 h-3 text-zinc-500" />
                    {profile.email}
                  </span>
                )}
                {profile.customerSince && (
                  <span className="hidden sm:flex items-center gap-1 text-zinc-500 text-[11px]">
                    <Calendar className="w-3 h-3 text-zinc-600" />
                    Since{" "}
                    {new Date(profile.customerSince).toLocaleDateString("en-IN", {
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onEditCustomer && (
              <button
                onClick={() => {
                  onClose();
                  onEditCustomer(profile);
                }}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white bg-[#1a1a1e] hover:bg-zinc-800 border border-[#27272a] rounded-lg transition-colors cursor-pointer"
                title="Edit Customer"
              >
                <Pencil className="w-3.5 h-3.5 text-zinc-400" />
                <span>Edit</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-[#1f1f23] rounded-lg transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── Modal Body Content ───────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-zinc-400">
              <div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
              <span className="text-xs font-medium">Aggregating 360° Customer Profile & Aging...</span>
            </div>
          ) : (
            <>
              {/* ── Row 1: Quick Action Toolbar ────────────────────────────── */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-[#131316] border border-[#1f1f23]">
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <Activity className="w-4 h-4 text-amber-400" />
                  <span className="font-semibold text-zinc-200">Customer 360° CRM Center</span>
                  <span className="text-zinc-600 hidden sm:inline">•</span>
                  <span className="text-[11px] text-zinc-500 hidden sm:inline">
                    Live analytics, debt aging, & billing history
                  </span>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  {onViewLedger && (
                    <button
                      onClick={() => {
                        onClose();
                        onViewLedger(profile);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-[#1a1a1e] hover:bg-zinc-800 text-zinc-200 border border-[#27272a] text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                      <span>Full Ledger</span>
                    </button>
                  )}

                  {onViewPaymentHistory && (
                    <button
                      onClick={() => {
                        onClose();
                        onViewPaymentHistory(profile);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-[#1a1a1e] hover:bg-zinc-800 text-zinc-200 border border-[#27272a] text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
                    >
                      <History className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Repayments</span>
                    </button>
                  )}

                  {currentDebt > 0 && onSettlePayment && (
                    <button
                      onClick={() => {
                        onClose();
                        onSettlePayment(profile);
                      }}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Settle Debt</span>
                    </button>
                  )}
                </div>
              </div>

              {/* ── Row 2: 4x KPI Summary Cards ────────────────────────────── */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
                {/* Total Lifetime Sales */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-[#16161a] to-[#121215] border border-[#222226] relative overflow-hidden group">
                  <div className="flex items-center justify-between text-zinc-400 mb-2">
                    <span className="text-xs font-medium">Total Lifetime Spend</span>
                    <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <ShoppingBag className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="text-xl sm:text-2xl font-bold font-mono text-zinc-100">
                    ₹{(metrics.totalSalesAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-emerald-400" />
                    Across {metrics.totalVisits || 0} completed orders
                  </p>
                </div>

                {/* Visit Frequency */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-[#16161a] to-[#121215] border border-[#222226] relative overflow-hidden group">
                  <div className="flex items-center justify-between text-zinc-400 mb-2">
                    <span className="text-xs font-medium">Purchase Frequency</span>
                    <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      <Layers className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="text-xl sm:text-2xl font-bold font-mono text-zinc-100">
                    {metrics.totalVisits || 0} <span className="text-xs font-normal text-zinc-500">visits</span>
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1 truncate">
                    {metrics.lastPurchaseDate
                      ? `Last: ${new Date(metrics.lastPurchaseDate).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                        })}`
                      : "No visits yet"}
                  </p>
                </div>

                {/* Average Basket Size / Spend */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-[#16161a] to-[#121215] border border-[#222226] relative overflow-hidden group">
                  <div className="flex items-center justify-between text-zinc-400 mb-2">
                    <span className="text-xs font-medium">Avg. Spend / Order</span>
                    <div className="p-1.5 rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/20">
                      <CreditCard className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="text-xl sm:text-2xl font-bold font-mono text-zinc-100">
                    ₹{(metrics.averageSpend || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1">Average basket value</p>
                </div>

                {/* Current Outstanding Debt */}
                <div
                  className={`p-4 rounded-xl border relative overflow-hidden group ${
                    currentDebt > 0
                      ? "bg-gradient-to-br from-amber-500/10 to-[#121215] border-amber-500/30"
                      : "bg-gradient-to-br from-[#16161a] to-[#121215] border-[#222226]"
                  }`}
                >
                  <div className="flex items-center justify-between text-zinc-400 mb-2">
                    <span className="text-xs font-medium">Current Outstanding</span>
                    <div
                      className={`p-1.5 rounded-lg border ${
                        currentDebt > 0
                          ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                          : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      }`}
                    >
                      <IndianRupee className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div
                    className={`text-xl sm:text-2xl font-bold font-mono ${
                      currentDebt > 0 ? "text-amber-400" : "text-emerald-400"
                    }`}
                  >
                    ₹{currentDebt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-zinc-400">
                    <span>Limit: {creditLimit > 0 ? `₹${creditLimit}` : "None"}</span>
                    {isLimitExceeded && (
                      <span className="text-rose-400 font-semibold flex items-center gap-0.5">
                        <AlertTriangle className="w-2.5 h-2.5" /> Exceeded
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Row 3: Debt Aging Analysis Section ──────────────────────── */}
              <div className="p-4 sm:p-5 rounded-xl bg-[#121215] border border-[#1f1f23] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>Debt Aging Analysis (Historical Dues)</span>
                    </h3>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      Categorizes outstanding receivables by age to assess credit risk & recoverability
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-zinc-400">Total Aged Dues: </span>
                    <span className="font-mono font-bold text-xs text-amber-400">
                      ₹{aging.totalAgedDebt?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Aging Visual Distribution Bar */}
                {aging.totalAgedDebt > 0 ? (
                  <div className="space-y-2">
                    <div className="h-3 w-full rounded-full bg-[#1c1c20] overflow-hidden flex shadow-inner">
                      {aging.bucket0_30 > 0 && (
                        <div
                          style={{
                            width: `${(aging.bucket0_30 / aging.totalAgedDebt) * 100}%`,
                          }}
                          className="bg-emerald-500 hover:opacity-90 transition-all"
                          title={`0–30 Days: ₹${aging.bucket0_30}`}
                        />
                      )}
                      {aging.bucket31_60 > 0 && (
                        <div
                          style={{
                            width: `${(aging.bucket31_60 / aging.totalAgedDebt) * 100}%`,
                          }}
                          className="bg-amber-500 hover:opacity-90 transition-all"
                          title={`31–60 Days: ₹${aging.bucket31_60}`}
                        />
                      )}
                      {aging.bucket61_90 > 0 && (
                        <div
                          style={{
                            width: `${(aging.bucket61_90 / aging.totalAgedDebt) * 100}%`,
                          }}
                          className="bg-orange-500 hover:opacity-90 transition-all"
                          title={`61–90 Days: ₹${aging.bucket61_90}`}
                        />
                      )}
                      {aging.bucket90Plus > 0 && (
                        <div
                          style={{
                            width: `${(aging.bucket90Plus / aging.totalAgedDebt) * 100}%`,
                          }}
                          className="bg-rose-500 hover:opacity-90 transition-all"
                          title={`90+ Days: ₹${aging.bucket90Plus}`}
                        />
                      )}
                    </div>
                  </div>
                ) : null}

                {/* 4 Aging Tier Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {/* 0-30 Days */}
                  <div className="p-3 rounded-lg bg-[#161619] border border-[#232328] space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-medium text-emerald-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        0–30 Days
                      </span>
                      <span className="text-[10px] text-zinc-500">Recent</span>
                    </div>
                    <div className="text-sm sm:text-base font-bold font-mono text-zinc-100">
                      ₹{aging.bucket0_30.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </div>
                    <p className="text-[10px] text-zinc-500">Current cycle balance</p>
                  </div>

                  {/* 31-60 Days */}
                  <div className="p-3 rounded-lg bg-[#161619] border border-[#232328] space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-medium text-amber-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        31–60 Days
                      </span>
                      <span className="text-[10px] text-zinc-500">1–2 Mos</span>
                    </div>
                    <div className="text-sm sm:text-base font-bold font-mono text-zinc-100">
                      ₹{aging.bucket31_60.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </div>
                    <p className="text-[10px] text-zinc-500">Moderate aging</p>
                  </div>

                  {/* 61-90 Days */}
                  <div className="p-3 rounded-lg bg-[#161619] border border-[#232328] space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-medium text-orange-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                        61–90 Days
                      </span>
                      <span className="text-[10px] text-zinc-500">2–3 Mos</span>
                    </div>
                    <div className="text-sm sm:text-base font-bold font-mono text-zinc-100">
                      ₹{aging.bucket61_90.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </div>
                    <p className="text-[10px] text-zinc-500">Follow-up needed</p>
                  </div>

                  {/* 90+ Days */}
                  <div className="p-3 rounded-lg bg-[#161619] border border-[#232328] space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-medium text-rose-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                        90+ Days
                      </span>
                      <span className="text-[10px] text-rose-400/80 font-semibold">Critical</span>
                    </div>
                    <div className="text-sm sm:text-base font-bold font-mono text-zinc-100">
                      ₹{aging.bucket90Plus.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </div>
                    <p className="text-[10px] text-zinc-500">Overdue debt</p>
                  </div>
                </div>
              </div>

              {/* ── Row 4: Activity Tabs (Purchases, Repayments, Demographic Details) ─ */}
              <div className="rounded-xl bg-[#121215] border border-[#1f1f23] overflow-hidden">
                {/* Tab Navigation */}
                <div className="flex items-center border-b border-[#1f1f23] bg-[#151519] px-4">
                  <button
                    onClick={() => setActiveTab("purchases")}
                    className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
                      activeTab === "purchases"
                        ? "border-amber-500 text-amber-400"
                        : "border-transparent text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>Recent Sales ({recentSales.length})</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("payments")}
                    className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
                      activeTab === "payments"
                        ? "border-emerald-500 text-emerald-400"
                        : "border-transparent text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>Recent Repayments ({recentPayments.length})</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("details")}
                    className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
                      activeTab === "details"
                        ? "border-blue-500 text-blue-400"
                        : "border-transparent text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Contact & Demographics</span>
                  </button>
                </div>

                {/* Tab Content */}
                <div className="p-4">
                  {/* TAB 1: Recent Purchases */}
                  {activeTab === "purchases" && (
                    <div className="space-y-3">
                      {recentSales.length === 0 ? (
                        <div className="py-8 text-center text-zinc-500 text-xs">
                          No recent billing invoices recorded for this customer.
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs text-zinc-300">
                            <thead className="bg-[#17171b] text-zinc-500 uppercase text-[10px] font-semibold border-b border-[#222227]">
                              <tr>
                                <th className="py-2.5 px-3">Invoice #</th>
                                <th className="py-2.5 px-3">Date</th>
                                <th className="py-2.5 px-3">Payment Mode</th>
                                <th className="py-2.5 px-3 text-right">Items</th>
                                <th className="py-2.5 px-3 text-right">Total</th>
                                <th className="py-2.5 px-3 text-right">Paid</th>
                                <th className="py-2.5 px-3 text-right">Due</th>
                                <th className="py-2.5 px-3 text-center">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#1e1e24]">
                              {recentSales.map((sale) => (
                                <tr key={sale._id} className="hover:bg-[#18181d] transition-colors">
                                  <td className="py-2.5 px-3 font-mono font-semibold text-zinc-200">
                                    {sale.invoiceNumber}
                                  </td>
                                  <td className="py-2.5 px-3 text-zinc-400 font-mono text-[11px]">
                                    {new Date(sale.createdAt).toLocaleDateString("en-IN", {
                                      day: "2-digit",
                                      month: "short",
                                      year: "numeric",
                                    })}
                                  </td>
                                  <td className="py-2.5 px-3">
                                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#1e1e24] text-zinc-300 border border-[#2a2a32]">
                                      {sale.paymentMode || "CASH"}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-mono text-zinc-400">
                                    {sale.itemsCount || 1}
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-mono font-semibold text-zinc-100">
                                    ₹{sale.total?.toFixed(2)}
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-mono text-emerald-400">
                                    ₹{sale.paidAmount?.toFixed(2)}
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-mono">
                                    {sale.dueAmount > 0 ? (
                                      <span className="text-amber-400 font-semibold">
                                        ₹{sale.dueAmount?.toFixed(2)}
                                      </span>
                                    ) : (
                                      <span className="text-zinc-600">₹0.00</span>
                                    )}
                                  </td>
                                  <td className="py-2.5 px-3 text-center">
                                    <span
                                      className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                        sale.paymentStatus === "PAID"
                                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                          : sale.paymentStatus === "PARTIAL"
                                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                          : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                      }`}
                                    >
                                      {sale.paymentStatus}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 2: Recent Repayments */}
                  {activeTab === "payments" && (
                    <div className="space-y-3">
                      {recentPayments.length === 0 ? (
                        <div className="py-8 text-center text-zinc-500 text-xs">
                          No repayment settlements recorded yet.
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs text-zinc-300">
                            <thead className="bg-[#17171b] text-zinc-500 uppercase text-[10px] font-semibold border-b border-[#222227]">
                              <tr>
                                <th className="py-2.5 px-3">Date & Time</th>
                                <th className="py-2.5 px-3">Method</th>
                                <th className="py-2.5 px-3">Reference / Notes</th>
                                <th className="py-2.5 px-3 text-right">Repayment (Jama)</th>
                                <th className="py-2.5 px-3 text-right">Balance After</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#1e1e24]">
                              {recentPayments.map((pay) => (
                                <tr key={pay._id} className="hover:bg-[#18181d] transition-colors">
                                  <td className="py-2.5 px-3 text-zinc-300 font-mono text-[11px]">
                                    {new Date(pay.date).toLocaleString("en-IN", {
                                      day: "2-digit",
                                      month: "short",
                                      year: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </td>
                                  <td className="py-2.5 px-3">
                                    <span
                                      className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                                        pay.paymentMethod === "UPI"
                                          ? "bg-violet-500/10 text-violet-400 border-violet-500/20"
                                          : pay.paymentMethod === "CARD"
                                          ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                          : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                      }`}
                                    >
                                      {pay.paymentMethod || "CASH"}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3 text-zinc-400 text-[11px]">
                                    {pay.notes || pay.reference || "Repayment settlement"}
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">
                                    -₹{Number(pay.amount || 0).toFixed(2)}
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-mono text-zinc-300">
                                    ₹{Number(pay.balanceAfter || 0).toFixed(2)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 3: Contact & Demographics */}
                  {activeTab === "details" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-3 p-4 rounded-lg bg-[#161619] border border-[#222227]">
                        <h4 className="text-zinc-200 font-semibold uppercase text-[10px] tracking-wider">
                          Address & Location
                        </h4>
                        <div className="space-y-1.5 text-zinc-400">
                          <p className="flex items-start gap-2">
                            <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0 mt-0.5" />
                            <span>{profile.address || "No street address provided"}</span>
                          </p>
                          <p className="text-zinc-500 pl-5">
                            City: <span className="text-zinc-300">{profile.city || "—"}</span> | State:{" "}
                            <span className="text-zinc-300">{profile.state || "—"}</span> | PIN:{" "}
                            <span className="text-zinc-300">{profile.pincode || "—"}</span>
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3 p-4 rounded-lg bg-[#161619] border border-[#222227]">
                        <h4 className="text-zinc-200 font-semibold uppercase text-[10px] tracking-wider">
                          Account Notes & Tags
                        </h4>
                        <div className="space-y-2 text-zinc-400">
                          <div>
                            <span className="text-[11px] text-zinc-500">Merchant Notes:</span>
                            <p className="text-zinc-300 italic mt-0.5">
                              {profile.notes ? `"${profile.notes}"` : "No internal notes."}
                            </p>
                          </div>
                          {profile.tags && profile.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {profile.tags.map((tag, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[10px] border border-zinc-700"
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── Modal Footer ─────────────────────────────────────────────────── */}
        <div className="px-6 py-3.5 border-t border-[#1f1f23] bg-[#141417] flex items-center justify-between text-xs text-zinc-500">
          <div className="flex items-center gap-1 font-mono text-[11px]">
            <span>Customer ID:</span>
            <span className="text-zinc-400">{profile.id || profile._id}</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#1e1e23] hover:bg-zinc-700 text-zinc-200 font-medium transition-colors cursor-pointer"
          >
            Close Profile
          </button>
        </div>
      </div>
    </div>
  );
}
