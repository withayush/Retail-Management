import React, { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { Receipt, BarChart3, Package, TrendingUp, Flame } from "lucide-react";
import {
  getSales,
  getSalesSummary,
  updatePaymentStatus,
  getNextInvoiceNumber,
} from "../../services/sale.api";

// Sub-components
import SalesHistoryHeader from "./components/SalesHistoryHeader";
import SalesHistoryStats from "./components/SalesHistoryStats";
import SalesHistoryFilters from "./components/SalesHistoryFilters";
import SalesHistoryTable from "./components/SalesHistoryTable";
import SettlePaymentModal from "./components/SettlePaymentModal";
import SaleDetailModal from "./components/SaleDetailModal";
import MonthlyRevenueAggregator from "./components/MonthlyRevenueAggregator";
import MonthlyCogsCalculator from "./components/MonthlyCogsCalculator";
import MonthlyGrossProfitCalculator from "./components/MonthlyGrossProfitCalculator";
import MonthlyOpExAggregations from "./components/MonthlyOpExAggregations";
import { exportSalesToCSV } from "./utils/pos.utils";

export default function SalesHistoryPage() {
  // Active View Tab: "TRANSACTIONS" | "REVENUE_ANALYTICS" (T52) | "COGS_CALCULATOR" (T53) | "GROSS_PROFIT" (T54) | "OPEX_AGGREGATIONS" (T55)
  const [activeTab, setActiveTab] = useState("TRANSACTIONS");

  // Data state
  const [sales, setSales] = useState([]);
  const [summary, setSummary] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [nextInvNum, setNextInvNum] = useState("INV-1001");
  const [loading, setLoading] = useState(true);

  // Filters state
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("ALL");
  const [paymentModeFilter, setPaymentModeFilter] = useState("ALL");
  const [page, setPage] = useState(1);

  // Detail Modal state (Task T24)
  const [detailSale, setDetailSale] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Settlement Modal state
  const [selectedSale, setSelectedSale] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState("PAID");
  const [newPaidAmount, setNewPaidAmount] = useState("");
  const [newPaymentMode, setNewPaymentMode] = useState("CASH");
  const [settlementNotes, setSettlementNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Fetch summary and next invoice number
  const fetchSummaryAndMeta = useCallback(async () => {
    try {
      const [sumRes, nextRes] = await Promise.all([
        getSalesSummary(),
        getNextInvoiceNumber(),
      ]);
      setSummary(sumRes.data || sumRes);
      setNextInvNum(nextRes?.data?.nextInvoiceNumber || "INV-1001");
    } catch (err) {
      console.error("Failed to load sales summary meta:", err);
    }
  }, []);

  // Fetch sales transactions list
  const fetchSalesData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getSales({
        search: searchTerm.trim() || undefined,
        paymentStatus: paymentStatusFilter !== "ALL" ? paymentStatusFilter : undefined,
        paymentMode: paymentModeFilter !== "ALL" ? paymentModeFilter : undefined,
        page,
        limit: 20,
      });

      setSales(res.data || []);
      setPagination(res.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (err) {
      console.error("Failed to load sales history:", err);
      toast.error(err?.response?.data?.message || "Failed to load sales records.");
    } finally {
      setLoading(false);
    }
  }, [searchTerm, paymentStatusFilter, paymentModeFilter, page]);

  useEffect(() => {
    fetchSummaryAndMeta();
  }, [fetchSummaryAndMeta]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSalesData();
    }, 200);
    return () => clearTimeout(timer);
  }, [fetchSalesData]);

  // Open Detail Modal (Task T24 Item Snapshot view)
  const handleOpenDetailModal = (sale) => {
    setDetailSale(sale);
    setShowDetailModal(true);
  };

  // Open Status update modal
  const handleOpenStatusModal = (sale) => {
    setSelectedSale(sale);
    setNewStatus(sale.paymentStatus);
    setNewPaidAmount(sale.paidAmount?.toString() || "");
    setNewPaymentMode(sale.paymentMode || "CASH");
    setSettlementNotes(sale.notes || "");
    setShowStatusModal(true);
  };

  // Submit payment status update
  const handleSubmitPaymentUpdate = async (e) => {
    e.preventDefault();
    if (!selectedSale) return;

    setSubmitting(true);
    try {
      await updatePaymentStatus(selectedSale._id, {
        paymentStatus: newStatus,
        paidAmount: newPaidAmount !== "" ? Number(newPaidAmount) : undefined,
        paymentMode: newPaymentMode,
        notes: settlementNotes.trim(),
      });

      toast.success(`Payment updated for invoice ${selectedSale.invoiceNumber}`);
      setShowStatusModal(false);
      fetchSalesData();
      fetchSummaryAndMeta();
    } catch (err) {
      console.error("Failed to update payment status:", err);
      toast.error(err?.response?.data?.message || "Failed to update payment.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full p-6 md:p-8 space-y-6 min-h-[calc(100vh-4rem)]">
      {/* Top Header */}
      <SalesHistoryHeader
        nextInvNum={nextInvNum}
        loading={loading}
        onRefresh={() => {
          fetchSalesData();
          fetchSummaryAndMeta();
        }}
      />

      {/* View Switcher Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2">
        <button
          onClick={() => setActiveTab("TRANSACTIONS")}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "TRANSACTIONS"
              ? "bg-white/[0.08] text-white border border-white/20 shadow-md"
              : "text-[#8E8E93] hover:text-white hover:bg-white/[0.03]"
          }`}
        >
          <Receipt className="w-4 h-4 text-[#2997FF]" />
          <span>Transactions Ledger</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/40 text-[#8E8E93] border border-white/5">
            {pagination.total || sales.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("REVENUE_ANALYTICS")}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "REVENUE_ANALYTICS"
              ? "bg-gradient-to-r from-[#0066CC]/20 to-[#2997FF]/20 text-white border border-[#2997FF]/40 shadow-lg shadow-[#0066CC]/10"
              : "text-[#8E8E93] hover:text-white hover:bg-white/[0.03]"
          }`}
        >
          <BarChart3 className="w-4 h-4 text-[#2997FF]" />
          <span>Monthly Revenue Engine</span>
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#2997FF]/20 text-[#2997FF] border border-[#2997FF]/30">
            T52 Accrual
          </span>
        </button>

        <button
          onClick={() => setActiveTab("COGS_CALCULATOR")}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "COGS_CALCULATOR"
              ? "bg-gradient-to-r from-[#D27D00]/20 to-[#FF9F0A]/20 text-white border border-[#FF9F0A]/40 shadow-lg shadow-[#D27D00]/10"
              : "text-[#8E8E93] hover:text-white hover:bg-white/[0.03]"
          }`}
        >
          <Package className="w-4 h-4 text-[#FF9F0A]" />
          <span>COGS & Profit Engine</span>
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#FF9F0A]/20 text-[#FF9F0A] border border-[#FF9F0A]/30">
            T53 Formula
          </span>
        </button>

        <button
          onClick={() => setActiveTab("GROSS_PROFIT")}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "GROSS_PROFIT"
              ? "bg-gradient-to-r from-[#248A3D]/20 to-[#30D158]/20 text-white border border-[#30D158]/40 shadow-lg shadow-[#248A3D]/10"
              : "text-[#8E8E93] hover:text-white hover:bg-white/[0.03]"
          }`}
        >
          <TrendingUp className="w-4 h-4 text-[#30D158]" />
          <span>Gross Profit & Margins</span>
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#30D158]/20 text-[#30D158] border border-[#30D158]/30">
            T54 P&L
          </span>
        </button>

        <button
          onClick={() => setActiveTab("OPEX_AGGREGATIONS")}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "OPEX_AGGREGATIONS"
              ? "bg-gradient-to-r from-[#D70015]/20 to-[#FF453A]/20 text-white border border-[#FF453A]/40 shadow-lg shadow-[#D70015]/10"
              : "text-[#8E8E93] hover:text-white hover:bg-white/[0.03]"
          }`}
        >
          <Flame className="w-4 h-4 text-[#FF453A]" />
          <span>OpEx & Cash Burn</span>
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#FF453A]/20 text-[#FF453A] border border-[#FF453A]/30">
            T55 OpEx
          </span>
        </button>
      </div>

      {/* Tab 1: Historical Sales & Invoices Transactions */}
      {activeTab === "TRANSACTIONS" && (
        <div className="space-y-6 animate-fade-in">
          {/* KPI Summary Cards */}
          <SalesHistoryStats summary={summary} />

          {/* Control & Filter Deck */}
          <SalesHistoryFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            paymentModeFilter={paymentModeFilter}
            setPaymentModeFilter={setPaymentModeFilter}
            paymentStatusFilter={paymentStatusFilter}
            setPaymentStatusFilter={setPaymentStatusFilter}
            setPage={setPage}
            onExportCSV={() => exportSalesToCSV(sales)}
          />

          {/* Sales Ledger Table */}
          <SalesHistoryTable
            loading={loading}
            sales={sales}
            pagination={pagination}
            page={page}
            setPage={setPage}
            onOpenStatusModal={handleOpenStatusModal}
            onViewDetailModal={handleOpenDetailModal}
          />
        </div>
      )}

      {/* Tab 2: Monthly Revenue Aggregations (T52 Accrual Analytics Engine) */}
      {activeTab === "REVENUE_ANALYTICS" && (
        <MonthlyRevenueAggregator />
      )}

      {/* Tab 3: Cost of Goods Sold & Gross Profit (T53 COGS Calculator) */}
      {activeTab === "COGS_CALCULATOR" && (
        <MonthlyCogsCalculator />
      )}

      {/* Tab 4: Gross Profit & GP Margin % Analytics (T54 Gross Profit Calculations) */}
      {activeTab === "GROSS_PROFIT" && (
        <MonthlyGrossProfitCalculator />
      )}

      {/* Tab 5: Operating Expense Aggregations & Cash Burn (T55 OpEx Analytics) */}
      {activeTab === "OPEX_AGGREGATIONS" && (
        <MonthlyOpExAggregations />
      )}

      {/* Modal: View Snapshot Line Items & Gross Profit (Task T24) */}
      <SaleDetailModal
        isOpen={showDetailModal}
        sale={detailSale}
        onClose={() => setShowDetailModal(false)}
      />

      {/* Modal: Update Payment Status & Settle Balance */}
      <SettlePaymentModal
        isOpen={showStatusModal}
        selectedSale={selectedSale}
        newStatus={newStatus}
        setNewStatus={setNewStatus}
        newPaidAmount={newPaidAmount}
        setNewPaidAmount={setNewPaidAmount}
        newPaymentMode={newPaymentMode}
        setNewPaymentMode={setNewPaymentMode}
        settlementNotes={settlementNotes}
        setSettlementNotes={setSettlementNotes}
        submitting={submitting}
        onClose={() => setShowStatusModal(false)}
        onSubmit={handleSubmitPaymentUpdate}
      />
    </div>
  );
}
