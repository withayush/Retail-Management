import React, { useState, useEffect } from "react";
import {
  X,
  Building2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Wallet,
  TrendingDown,
  ShoppingBag,
  Clock,
  CheckCircle2,
  Receipt,
  History,
  BookOpen,
  Plus,
  Pencil,
  Tag,
  IndianRupee,
  Activity,
  FileText,
  CreditCard,
  PackageCheck,
} from "lucide-react";
import { getSupplier360Summary } from "../../../services/supplier.api";
import { getSupplierPurchaseOrders } from "../../../services/purchaseOrder.api";
import ReceiveGoodsModal from "./ReceiveGoodsModal";
import toast from "react-hot-toast";

export default function Supplier360Modal({
  isOpen,
  onClose,
  supplier,
  onEditSupplier,
  onViewLedger,
  onDisbursePayment,
  onCreatePO,
}) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [activeTab, setActiveTab] = useState("purchases"); // "purchases" | "payments" | "pos" | "details"
  const [poToReceive, setPoToReceive] = useState(null);
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);

  const supplierId = supplier?._id || supplier?.id;

  useEffect(() => {
    if (!isOpen || !supplierId) return;

    let isMounted = true;
    setLoading(true);

    Promise.all([
      getSupplier360Summary(supplierId),
      getSupplierPurchaseOrders(supplierId).catch(() => ({ data: [] })),
    ])
      .then(([summaryRes, poRes]) => {
        if (isMounted) {
          setData(summaryRes.data || summaryRes);
          setPurchaseOrders(poRes.data || poRes.orders || poRes || []);
        }
      })
      .catch((err) => {
        console.error("Failed to load supplier 360 summary:", err);
        toast.error("Failed to load supplier 360° profile.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, supplierId]);

  if (!isOpen) return null;

  const profile = data?.profile || supplier || {};
  const metrics = data?.metrics || {};
  const recentPurchases = data?.recentPurchases || [];
  const recentPayments = data?.recentPayments || [];

  const currentDebt = Number(metrics.currentPayableOutstanding ?? profile.currentBalance ?? 0);
  const totalPurchases = Number(metrics.totalPurchasesVolume ?? profile.totalPurchases ?? 0);
  const totalPaid = Number(metrics.totalPaymentsDisbursed ?? 0);
  const ordersCount = Number(metrics.totalOrdersCount ?? profile.totalOrders ?? 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-2xl bg-[#0e0e11] border border-[#27272a] shadow-2xl shadow-black/80 overflow-hidden text-zinc-100 animate-scaleUp">
        {/* ── Top Modal Header ─────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1f1f23] bg-[#141417]/90 backdrop-blur-sm sticky top-0 z-20">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600/30 to-blue-400/10 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-lg shadow-inner shrink-0">
              {profile.company ? profile.company.charAt(0).toUpperCase() : <Building2 className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  {profile.company || "Supplier 360° Profile"}
                </h2>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                    profile.status === "ACTIVE"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : "bg-zinc-800 text-zinc-400 border-zinc-700"
                  }`}
                >
                  <CheckCircle2 className="w-3 h-3" />
                  {profile.status || "ACTIVE"}
                </span>
                {profile.gstin && (
                  <span className="text-[11px] bg-amber-500/10 text-amber-400 font-mono px-2 py-0.5 rounded-md border border-amber-500/20">
                    GST: {profile.gstin}
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                {profile.contactName ? `${profile.contactName} • ` : ""}
                Supplier 360° Management & Accounts Payable Center (T41)
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2">
            {onEditSupplier && (
              <button
                onClick={() => {
                  onClose();
                  onEditSupplier(profile);
                }}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#18181b] hover:bg-zinc-800 text-zinc-300 text-xs font-semibold border border-[#27272a] transition-colors cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5 text-blue-400" />
                Edit Profile
              </button>
            )}

            {onViewLedger && (
              <button
                onClick={() => {
                  onClose();
                  onViewLedger(profile);
                }}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 text-xs font-semibold border border-blue-500/30 transition-colors cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5" />
                Audit Statement
              </button>
            )}

            {onCreatePO && (
              <button
                onClick={() => {
                  onClose();
                  onCreatePO(profile);
                }}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-xs font-semibold border border-blue-500/30 transition-colors cursor-pointer"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                Create PO
              </button>
            )}

            {currentDebt > 0 && onDisbursePayment && (
              <button
                onClick={() => {
                  onClose();
                  onDisbursePayment(profile);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold transition-colors shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Disburse Payment
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Scrollable Body Content ──────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {loading ? (
            <div className="py-24 text-center text-xs text-zinc-500 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
              <span>Gathering supplier 360° intelligence...</span>
            </div>
          ) : (
            <>
              {/* ── 4x KPI Cards Grid ──────────────────────────────────────── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {/* 1. Outstanding Payables (Gold / Amber) */}
                <div className="p-4 rounded-2xl bg-[#131316] border border-[#232328] space-y-1.5 relative overflow-hidden">
                  <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
                    <span className="flex items-center gap-1.5">
                      <Wallet className="w-3.5 h-3.5 text-amber-400" /> Current Net Payable
                    </span>
                    {currentDebt > 0 ? (
                      <span className="text-[10px] bg-amber-500/10 text-amber-400 px-1.5 py-0.2 rounded font-semibold border border-amber-500/20">
                        Debt Owed
                      </span>
                    ) : (
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.2 rounded font-semibold">
                        Settled
                      </span>
                    )}
                  </div>
                  <div className="text-xl sm:text-2xl font-bold font-mono text-amber-400 tracking-tight">
                    ₹{currentDebt.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    {currentDebt > 0 ? "Pending raw cash settlement" : "No outstanding liability"}
                  </p>
                </div>

                {/* 2. Lifetime Procurements Spend */}
                <div className="p-4 rounded-2xl bg-[#131316] border border-[#232328] space-y-1.5">
                  <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
                    <span className="flex items-center gap-1.5">
                      <ShoppingBag className="w-3.5 h-3.5 text-blue-400" /> Lifetime Purchases
                    </span>
                  </div>
                  <div className="text-xl sm:text-2xl font-bold font-mono text-white tracking-tight">
                    ₹{totalPurchases.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                  <p className="text-[11px] text-zinc-400">Total goods delivered on credit</p>
                </div>

                {/* 3. Lifetime Payments Made */}
                <div className="p-4 rounded-2xl bg-[#131316] border border-[#232328] space-y-1.5">
                  <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
                    <span className="flex items-center gap-1.5">
                      <TrendingDown className="w-3.5 h-3.5 text-emerald-400" /> Total Paid Out
                    </span>
                  </div>
                  <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-400 tracking-tight">
                    ₹{totalPaid.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                  <p className="text-[11px] text-zinc-400">All historical settlement payouts</p>
                </div>

                {/* 4. Orders & Average PO Value */}
                <div className="p-4 rounded-2xl bg-[#131316] border border-[#232328] space-y-1.5">
                  <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
                    <span className="flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-violet-400" /> Order Velocity
                    </span>
                    <span className="text-[10px] font-mono text-violet-400 font-bold">
                      {ordersCount} Orders
                    </span>
                  </div>
                  <div className="text-xl sm:text-2xl font-bold font-mono text-violet-300 tracking-tight">
                    ₹{Number(metrics.averageOrderValue || 0).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                  <p className="text-[11px] text-zinc-400">Average procurement order size</p>
                </div>
              </div>

              {/* ── Multi-Tab Navigation Bar ──────────────────────────────── */}
              <div className="flex items-center gap-2 border-b border-[#232328] pb-1">
                <button
                  onClick={() => setActiveTab("purchases")}
                  className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                    activeTab === "purchases"
                      ? "bg-blue-600/10 text-blue-400 border border-blue-500/30"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <Receipt className="w-3.5 h-3.5" /> Stock Receipts ({recentPurchases.length})
                </button>
                <button
                  onClick={() => setActiveTab("pos")}
                  className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                    activeTab === "pos"
                      ? "bg-blue-600/20 text-blue-400 border border-blue-500/40"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <ShoppingBag className="w-3.5 h-3.5" /> Purchase Orders ({purchaseOrders.length})
                </button>
                <button
                  onClick={() => setActiveTab("payments")}
                  className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                    activeTab === "payments"
                      ? "bg-emerald-600/10 text-emerald-400 border border-emerald-500/30"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <History className="w-3.5 h-3.5" /> Settlement Payouts ({recentPayments.length})
                </button>
                <button
                  onClick={() => setActiveTab("details")}
                  className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                    activeTab === "details"
                      ? "bg-zinc-800 text-zinc-200 border border-zinc-700"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" /> Vendor Terms & Details
                </button>
              </div>

              {/* ── Tab Content: Recent Purchases ──────────────────────────── */}
              {activeTab === "purchases" && (
                <div className="space-y-3 animate-fadeIn">
                  {recentPurchases.length === 0 ? (
                    <div className="py-12 text-center text-xs text-zinc-500 space-y-1.5">
                      <Receipt className="w-7 h-7 mx-auto text-zinc-600" />
                      <p className="font-semibold text-zinc-300">No Recent Stock Purchases</p>
                      <p className="text-zinc-500 text-[11px]">
                        Purchases logged against this supplier will appear here automatically.
                      </p>
                    </div>
                  ) : (
                    <div className="border border-[#1f1f23] rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs text-zinc-300">
                        <thead className="bg-[#141417] text-zinc-400 uppercase text-[10px] font-semibold border-b border-[#1f1f23]">
                          <tr>
                            <th className="py-2.5 px-3">Date</th>
                            <th className="py-2.5 px-3">Bill / Invoice #</th>
                            <th className="py-2.5 px-3">Delivery Notes</th>
                            <th className="py-2.5 px-3 text-right">Invoice Value (+)</th>
                            <th className="py-2.5 px-3 text-right">Balance After</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1f1f23]">
                          {recentPurchases.map((p, idx) => (
                            <tr key={p._id || idx} className="hover:bg-[#151518] transition-colors">
                              <td className="py-2.5 px-3 font-mono text-[11px] text-zinc-400 whitespace-nowrap">
                                {p.createdAt
                                  ? new Date(p.createdAt).toLocaleDateString("en-IN", {
                                      day: "2-digit",
                                      month: "short",
                                      year: "numeric",
                                    })
                                  : "—"}
                              </td>
                              <td className="py-2.5 px-3 font-mono text-zinc-200 font-semibold">
                                {p.invoiceNumber ? `#${p.invoiceNumber}` : "Stock Receipt"}
                              </td>
                              <td className="py-2.5 px-3 text-zinc-400 text-[11px] max-w-[240px] truncate">
                                {p.notes || "Procurement delivery"}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold text-blue-400">
                                +₹{Number(p.invoiceValue || 0).toFixed(2)}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-semibold text-white">
                                ₹{Number(p.balanceAfter || 0).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* ── Tab Content: Purchase Orders (T42) ──────────────────────── */}
              {activeTab === "pos" && (
                <div className="space-y-3 animate-fadeIn">
                  {purchaseOrders.length === 0 ? (
                    <div className="py-12 text-center text-xs text-zinc-500 space-y-2">
                      <ShoppingBag className="w-8 h-8 mx-auto text-zinc-600" />
                      <p className="font-semibold text-zinc-300">No Purchase Orders Placed Yet</p>
                      <p className="text-zinc-500 text-[11px] max-w-sm mx-auto">
                        You have not created any formal purchase order requests for this supplier yet.
                      </p>
                      {onCreatePO && (
                        <button
                          onClick={() => {
                            onClose();
                            onCreatePO(profile);
                          }}
                          className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 text-xs font-semibold border border-blue-500/30 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Create Purchase Order
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="border border-[#1f1f23] rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs text-zinc-300">
                        <thead className="bg-[#141417] text-zinc-400 uppercase text-[10px] font-semibold border-b border-[#1f1f23]">
                          <tr>
                            <th className="py-2.5 px-3">PO Number</th>
                            <th className="py-2.5 px-3">Order Date</th>
                            <th className="py-2.5 px-3">Expected Delivery</th>
                            <th className="py-2.5 px-3 text-center">Status</th>
                            <th className="py-2.5 px-3 text-right">Items / Qty</th>
                            <th className="py-2.5 px-3 text-right">Cost Total (₹)</th>
                            <th className="py-2.5 px-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1f1f23]">
                          {purchaseOrders.map((po, idx) => (
                            <tr key={po._id || idx} className="hover:bg-[#151518] transition-colors">
                              <td className="py-2.5 px-3 font-mono font-bold text-white text-xs">
                                {po.poNumber}
                              </td>
                              <td className="py-2.5 px-3 font-mono text-[11px] text-zinc-400 whitespace-nowrap">
                                {po.orderDate
                                  ? new Date(po.orderDate).toLocaleDateString("en-IN", {
                                      day: "2-digit",
                                      month: "short",
                                      year: "numeric",
                                    })
                                  : "—"}
                              </td>
                              <td className="py-2.5 px-3 font-mono text-[11px] text-zinc-400 whitespace-nowrap">
                                {po.expectedDelivery
                                  ? new Date(po.expectedDelivery).toLocaleDateString("en-IN", {
                                      day: "2-digit",
                                      month: "short",
                                      year: "numeric",
                                    })
                                  : "Not set"}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase border ${
                                    po.status === "RECEIVED"
                                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                      : po.status === "PENDING"
                                      ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                      : po.status === "PARTIAL"
                                      ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                      : po.status === "DRAFT"
                                      ? "bg-zinc-800 text-zinc-400 border-zinc-700"
                                      : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                                  }`}
                                >
                                  {po.status}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-right text-zinc-300">
                                {po.itemsCount || po.items?.length || 0} lines ({po.totalQuantity || 0} units)
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold text-blue-400">
                                ₹{Number(po.costTotal || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                {po.status !== "RECEIVED" && po.status !== "CANCELLED" ? (
                                  <button
                                    onClick={() => {
                                      setPoToReceive(po);
                                      setIsReceiveModalOpen(true);
                                    }}
                                    className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-semibold flex items-center gap-1 ml-auto cursor-pointer"
                                    title="Receive physical stock against PO (GRN)"
                                  >
                                    <PackageCheck className="w-3 h-3" />
                                    Receive
                                  </button>
                                ) : (
                                  <span className="text-[11px] text-zinc-600">—</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* ── Tab Content: Settlement Payouts ────────────────────────── */}
              {activeTab === "payments" && (
                <div className="space-y-3 animate-fadeIn">
                  {recentPayments.length === 0 ? (
                    <div className="py-12 text-center text-xs text-zinc-500 space-y-1.5">
                      <History className="w-7 h-7 mx-auto text-zinc-600" />
                      <p className="font-semibold text-zinc-300">No Payment Disbursements Yet</p>
                      <p className="text-zinc-500 text-[11px]">
                        Cash and bank payout settlements recorded to this vendor will appear here.
                      </p>
                    </div>
                  ) : (
                    <div className="border border-[#1f1f23] rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs text-zinc-300">
                        <thead className="bg-[#141417] text-zinc-400 uppercase text-[10px] font-semibold border-b border-[#1f1f23]">
                          <tr>
                            <th className="py-2.5 px-3">Date</th>
                            <th className="py-2.5 px-3">Method</th>
                            <th className="py-2.5 px-3">Reference / UTR</th>
                            <th className="py-2.5 px-3 text-right">Amount Paid (-)</th>
                            <th className="py-2.5 px-3 text-right">Balance After</th>
                            <th className="py-2.5 px-3">Disbursed By</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1f1f23]">
                          {recentPayments.map((pmt, idx) => (
                            <tr key={pmt._id || idx} className="hover:bg-[#151518] transition-colors">
                              <td className="py-2.5 px-3 font-mono text-[11px] text-zinc-400 whitespace-nowrap">
                                {pmt.createdAt
                                  ? new Date(pmt.createdAt).toLocaleDateString("en-IN", {
                                      day: "2-digit",
                                      month: "short",
                                      year: "numeric",
                                    })
                                  : "—"}
                              </td>
                              <td className="py-2.5 px-3">
                                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-semibold uppercase">
                                  {pmt.paymentMethod || "CASH"}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 font-mono text-zinc-300 text-[11px]">
                                {pmt.referenceId || "Direct payout"}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">
                                -₹{Number(pmt.amount || 0).toFixed(2)}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-semibold text-white">
                                ₹{Number(pmt.balanceAfter || 0).toFixed(2)}
                              </td>
                              <td className="py-2.5 px-3 text-zinc-400 text-[11px]">
                                {pmt.recordedBy || "Cashier"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* ── Tab Content: Vendor Terms & Demographics ───────────────── */}
              {activeTab === "details" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn">
                  {/* Contact & Physical Address */}
                  <div className="p-4 rounded-2xl bg-[#131316] border border-[#232328] space-y-3">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-blue-400" /> Contact & Warehouse Location
                    </h3>

                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="text-zinc-500 block text-[11px]">Contact Person</span>
                        <span className="text-zinc-200 font-medium">{profile.contactName || "—"}</span>
                      </div>

                      <div>
                        <span className="text-zinc-500 block text-[11px]">Phone Number</span>
                        {profile.phone ? (
                          <a
                            href={`tel:${profile.phone}`}
                            className="text-emerald-400 font-mono hover:underline inline-flex items-center gap-1"
                          >
                            <Phone className="w-3 h-3" /> {profile.phone}
                          </a>
                        ) : (
                          <span className="text-zinc-500">No phone</span>
                        )}
                      </div>

                      <div>
                        <span className="text-zinc-500 block text-[11px]">Email Address</span>
                        {profile.email ? (
                          <a
                            href={`mailto:${profile.email}`}
                            className="text-blue-400 hover:underline inline-flex items-center gap-1"
                          >
                            <Mail className="w-3 h-3" /> {profile.email}
                          </a>
                        ) : (
                          <span className="text-zinc-500">No email</span>
                        )}
                      </div>

                      <div>
                        <span className="text-zinc-500 block text-[11px]">Physical Address</span>
                        <span className="text-zinc-300">
                          {[profile.address, profile.city, profile.state, profile.pincode]
                            .filter(Boolean)
                            .join(", ") || "No address provided"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Merchant Terms, GSTIN & Tags */}
                  <div className="p-4 rounded-2xl bg-[#131316] border border-[#232328] space-y-3">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-amber-400" /> Commercial Terms & Tax
                    </h3>

                    <div className="space-y-2.5 text-xs">
                      <div>
                        <span className="text-zinc-500 block text-[11px]">GST Identification Number (GSTIN)</span>
                        <span className="text-amber-400 font-mono font-bold">
                          {profile.gstin || "Not Registered / Unregistered"}
                        </span>
                      </div>

                      <div>
                        <span className="text-zinc-500 block text-[11px]">Vendor Tags</span>
                        {profile.tags && profile.tags.length > 0 ? (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {profile.tags.map((t, idx) => (
                              <span
                                key={idx}
                                className="text-[10px] bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-md border border-zinc-700"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-zinc-500">No tags assigned</span>
                        )}
                      </div>

                      <div>
                        <span className="text-zinc-500 block text-[11px]">Merchant Notes & Terms</span>
                        <p className="text-zinc-300 bg-[#18181b] p-2.5 rounded-xl border border-[#27272a] text-[11px] leading-relaxed">
                          {profile.notes || "No additional terms or notes documented."}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Modal Footer ─────────────────────────────────────────────────── */}
        <div className="p-3.5 bg-[#141417] border-t border-[#1f1f23] flex items-center justify-between text-xs text-zinc-400">
          <span>Supplier Record ID: {profile.id || profile._id || "N/A"}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors cursor-pointer border border-zinc-700"
          >
            Close 360° Profile
          </button>
        </div>

        {/* ── Task T44: Receive Goods Modal (GRN) ─────────────────────────── */}
        <ReceiveGoodsModal
          isOpen={isReceiveModalOpen}
          onClose={() => {
            setIsReceiveModalOpen(false);
            setPoToReceive(null);
          }}
          purchaseOrder={poToReceive}
          onReceivedSuccess={() => {
            if (supplierId) {
              getSupplierPurchaseOrders(supplierId)
                .then((res) => setPurchaseOrders(res.data || res.orders || res || []))
                .catch(console.error);
            }
          }}
        />
      </div>
    </div>
  );
}
