import React, { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
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
import { exportSalesToCSV } from "./utils/pos.utils";

export default function SalesHistoryPage() {
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
