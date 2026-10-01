import React, { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import {
  getInventorySummary,
  getStoreState,
  getInventoryLedger,
  getInventoryAlerts,
  getInventoryAlertsSummary,
  acknowledgeAlert,
  resolveAlert,
  syncInventoryAlerts,
  stockIn,
  stockOut,
  updateReorderLevel,
  adjustStock,
} from "../../services/inventory.api";
import { generateIdempotencyKey } from "../../services/api";

// Sub-components
import InventoryHeader from "./components/InventoryHeader";
import InventoryStats from "./components/InventoryStats";
import InventoryTabsNav from "./components/InventoryTabsNav";
import StockStateFilters from "./components/StockStateFilters";
import StockStateTable from "./components/StockStateTable";
import LedgerFilters from "./components/LedgerFilters";
import LedgerFlowCards from "./components/LedgerFlowCards";
import LedgerTable from "./components/LedgerTable";
import AlertsSummaryCards from "./components/AlertsSummaryCards";
import AlertsTable from "./components/AlertsTable";
import StockInModal from "./components/StockInModal";
import StockOutModal from "./components/StockOutModal";
import StockAdjustModal from "./components/StockAdjustModal";
import ReorderLevelModal from "./components/ReorderLevelModal";
import { exportLedgerToCSV } from "./utils/inventory.utils";

export default function InventoryAuditPage() {
  // Active Main Tab: "STORE_STATE" | "LEDGER_TRAIL" | "ALERTS_QUEUE"
  const [activeTab, setActiveTab] = useState("STORE_STATE");

  // Data State
  const [summary, setSummary] = useState(null);
  const [storeState, setStoreState] = useState([]);
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [ledgerSummary, setLedgerSummary] = useState({ totalEntries: 0, totalInQty: 0, totalOutQty: 0, netFlowQty: 0 });
  const [ledgerPagination, setLedgerPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  // Alert Queue State (Phase 3 - Task T22)
  const [alerts, setAlerts] = useState([]);
  const [alertsSummary, setAlertsSummary] = useState({
    totalActive: 0,
    unreadCount: 0,
    acknowledgedCount: 0,
    criticalCount: 0,
    warningCount: 0,
    resolvedCount: 0,
  });
  const [alertStatusFilter, setAlertStatusFilter] = useState("ALL_ACTIVE");
  const [alertSearchTerm, setAlertSearchTerm] = useState("");
  const [alertPage, setAlertPage] = useState(1);
  const [alertPagination, setAlertPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [syncingAlerts, setSyncingAlerts] = useState(false);

  const [loading, setLoading] = useState(true);

  // Store State Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [stockStatusFilter, setStockStatusFilter] = useState("ALL");

  // Ledger Trail Filters (Phase 3 - Task T21)
  const [selectedProductFilter, setSelectedProductFilter] = useState("ALL");
  const [ledgerTypeFilter, setLedgerTypeFilter] = useState("ALL");
  const [ledgerSourceFilter, setLedgerSourceFilter] = useState("ALL");
  const [ledgerDatePreset, setLedgerDatePreset] = useState("ALL");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [ledgerSearchTerm, setLedgerSearchTerm] = useState("");
  const [ledgerPage, setLedgerPage] = useState(1);

  // Action Modals State
  const [showStockInModal, setShowStockInModal] = useState(false);
  const [showStockOutModal, setShowStockOutModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showReorderModal, setShowReorderModal] = useState(false);

  const [activeItem, setActiveItem] = useState(null);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [actionQuantity, setActionQuantity] = useState("");
  const [actionSource, setActionSource] = useState("PURCHASE");
  const [actionSupplier, setActionSupplier] = useState("");
  const [actionUnitCost, setActionUnitCost] = useState("");
  const [actionReferenceNumber, setActionReferenceNumber] = useState("");
  const [actionReason, setActionReason] = useState("");
  const [actionNotes, setActionNotes] = useState("");
  const [newStockValue, setNewStockValue] = useState("");
  const [newReorderValue, setNewReorderValue] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Fetch Inventory Summary & Store State
  const fetchStoreData = useCallback(async () => {
    setLoading(true);
    try {
      const [summaryRes, stateRes] = await Promise.all([
        getInventorySummary(),
        getStoreState({
          search: searchTerm.trim() || undefined,
          stockStatus: stockStatusFilter !== "ALL" ? stockStatusFilter : undefined,
        }),
      ]);

      setSummary(summaryRes.data || summaryRes);
      setStoreState(stateRes.data || stateRes || []);
    } catch (err) {
      console.error("Failed to load inventory store state:", err);
      toast.error(err?.response?.data?.message || "Failed to load inventory state.");
    } finally {
      setLoading(false);
    }
  }, [searchTerm, stockStatusFilter]);

  // Compute active date boundaries
  const resolveDateRange = useCallback(() => {
    if (ledgerDatePreset === "ALL") return { startDate: undefined, endDate: undefined };

    const now = new Date();
    if (ledgerDatePreset === "TODAY") {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      return { startDate: start.toISOString(), endDate: now.toISOString() };
    }
    if (ledgerDatePreset === "LAST_7_DAYS") {
      const start = new Date(now);
      start.setDate(start.getDate() - 7);
      return { startDate: start.toISOString(), endDate: now.toISOString() };
    }
    if (ledgerDatePreset === "LAST_30_DAYS") {
      const start = new Date(now);
      start.setDate(start.getDate() - 30);
      return { startDate: start.toISOString(), endDate: now.toISOString() };
    }
    if (ledgerDatePreset === "CUSTOM") {
      return {
        startDate: customStartDate ? new Date(customStartDate).toISOString() : undefined,
        endDate: customEndDate ? new Date(customEndDate).toISOString() : undefined,
      };
    }
    return { startDate: undefined, endDate: undefined };
  }, [ledgerDatePreset, customStartDate, customEndDate]);

  // Fetch Inventory Ledger Trail (Who, When, Why, What)
  const fetchLedgerData = useCallback(async () => {
    setLoading(true);
    try {
      const dateRange = resolveDateRange();
      const res = await getInventoryLedger({
        productId: selectedProductFilter !== "ALL" ? selectedProductFilter : undefined,
        type: ledgerTypeFilter !== "ALL" ? ledgerTypeFilter : undefined,
        source: ledgerSourceFilter !== "ALL" ? ledgerSourceFilter : undefined,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        search: ledgerSearchTerm.trim() || undefined,
        page: ledgerPage,
        limit: 30,
      });

      setLedgerEntries(res.data || []);
      setLedgerSummary(res.summary || { totalEntries: 0, totalInQty: 0, totalOutQty: 0, netFlowQty: 0 });
      setLedgerPagination(res.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (err) {
      console.error("Failed to load inventory ledger history:", err);
      toast.error(err?.response?.data?.message || "Failed to load ledger history.");
    } finally {
      setLoading(false);
    }
  }, [selectedProductFilter, ledgerTypeFilter, ledgerSourceFilter, resolveDateRange, ledgerSearchTerm, ledgerPage]);

  // Fetch Alerts Data & Summary (Phase 3 - Task T22)
  const fetchAlertsSummaryData = useCallback(async () => {
    try {
      const res = await getInventoryAlertsSummary();
      setAlertsSummary(res.data || res || {
        totalActive: 0,
        unreadCount: 0,
        acknowledgedCount: 0,
        criticalCount: 0,
        warningCount: 0,
        resolvedCount: 0,
      });
    } catch (err) {
      console.error("Failed to load alerts summary:", err);
    }
  }, []);

  const fetchAlertsData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getInventoryAlerts({
        status: alertStatusFilter === "CRITICAL" || alertStatusFilter === "WARNING" ? "ALL_ACTIVE" : alertStatusFilter,
        severity: alertStatusFilter === "CRITICAL" ? "CRITICAL" : alertStatusFilter === "WARNING" ? "WARNING" : undefined,
        search: alertSearchTerm.trim() || undefined,
        page: alertPage,
        limit: 20,
      });

      setAlerts(res.data || []);
      setAlertPagination(res.pagination || { page: 1, totalPages: 1, total: 0 });
      await fetchAlertsSummaryData();
    } catch (err) {
      console.error("Failed to load inventory alerts queue:", err);
      toast.error(err?.response?.data?.message || "Failed to load alerts queue.");
    } finally {
      setLoading(false);
    }
  }, [alertStatusFilter, alertSearchTerm, alertPage, fetchAlertsSummaryData]);

  const handleAcknowledgeAlert = async (alertId) => {
    try {
      await acknowledgeAlert(alertId);
      toast.success("Alert marked as acknowledged.");
      fetchAlertsData();
      fetchAlertsSummaryData();
    } catch (err) {
      console.error("Failed to acknowledge alert:", err);
      toast.error(err?.response?.data?.message || "Failed to acknowledge alert.");
    }
  };

  const handleResolveAlert = async (alertId) => {
    try {
      await resolveAlert(alertId);
      toast.success("Alert marked as resolved.");
      fetchAlertsData();
      fetchAlertsSummaryData();
    } catch (err) {
      console.error("Failed to resolve alert:", err);
      toast.error(err?.response?.data?.message || "Failed to resolve alert.");
    }
  };

  const handleSyncAlerts = async () => {
    setSyncingAlerts(true);
    try {
      const res = await syncInventoryAlerts();
      toast.success(`Synced alert queue! Scanned ${res?.data?.scannedProducts || 0} products.`);
      fetchAlertsData();
      fetchAlertsSummaryData();
      fetchStoreData();
    } catch (err) {
      console.error("Failed to sync inventory alerts:", err);
      toast.error("Failed to sync alerts.");
    } finally {
      setSyncingAlerts(false);
    }
  };

  const handleQuickRestockFromAlert = (alert) => {
    const matchedProduct = storeState.find((item) => item.productId === alert.productId?._id);
    setSelectedProductId(alert.productId?._id || "");
    setActiveItem(matchedProduct || {
      productId: alert.productId?._id,
      name: alert.productId?.name,
      sku: alert.productId?.sku,
      unit: alert.productId?.unit,
      costPrice: alert.productId?.costPrice,
    });
    setActionQuantity(alert.deficitQty ? alert.deficitQty.toString() : "10");
    setActionSource("PURCHASE");
    setActionSupplier("");
    setActionUnitCost(alert.productId?.costPrice ? alert.productId.costPrice.toString() : "");
    setActionReferenceNumber(`RESTOCK-${alert._id?.slice(-4)?.toUpperCase() || "ORD"}`);
    setActionReason(`Low-Stock Alert Restock (${alert.alertType})`);
    setActionNotes(`Quick restock initiated from Alert Queue.`);
    setShowStockInModal(true);
  };

  // Main data sync effect
  useEffect(() => {
    fetchAlertsSummaryData();
  }, [fetchAlertsSummaryData]);

  useEffect(() => {
    if (activeTab === "STORE_STATE") {
      const timer = setTimeout(() => {
        fetchStoreData();
      }, 200);
      return () => clearTimeout(timer);
    } else if (activeTab === "LEDGER_TRAIL") {
      const timer = setTimeout(() => {
        fetchLedgerData();
      }, 200);
      return () => clearTimeout(timer);
    } else if (activeTab === "ALERTS_QUEUE") {
      const timer = setTimeout(() => {
        fetchAlertsData();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [activeTab, fetchStoreData, fetchLedgerData, fetchAlertsData]);

  // ── Stock-In Handlers (Phase 3 - Task T18) ──────────────────────────────────
  const handleOpenStockIn = (item = null) => {
    setActiveItem(item);
    setSelectedProductId(item ? item.productId : (storeState[0]?.productId || ""));
    setActionQuantity("");
    setActionSource("PURCHASE");
    setActionSupplier("");
    setActionUnitCost(item?.costPrice ? item.costPrice.toString() : "");
    setActionReferenceNumber("");
    setActionNotes("");
    setShowStockInModal(true);
  };

  const handleSaveStockIn = async (e) => {
    e.preventDefault();
    const qty = parseFloat(actionQuantity);
    if (isNaN(qty) || qty <= 0) {
      return toast.error("Please enter a valid positive quantity to add.");
    }
    const targetProdId = activeItem ? activeItem.productId : selectedProductId;
    if (!targetProdId) {
      return toast.error("Please select a product.");
    }

    const unitCostNum = actionUnitCost ? parseFloat(actionUnitCost) : undefined;

    setSubmitting(true);
    try {
      await stockIn(
        {
          productId: targetProdId,
          quantity: qty,
          source: actionSource || "PURCHASE",
          supplierName: actionSupplier.trim() || undefined,
          unitCost: !isNaN(unitCostNum) && unitCostNum >= 0 ? unitCostNum : undefined,
          referenceNumber: actionReferenceNumber.trim() || undefined,
          notes: actionNotes.trim() || undefined,
        },
        generateIdempotencyKey()
      );

      toast.success(`Recorded Stock In: +${qty} units into ledger (${actionSource}).`);
      setShowStockInModal(false);
      fetchStoreData();
      if (activeTab === "LEDGER_TRAIL") fetchLedgerData();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to record stock in.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Stock-Out Handlers (Phase 3 - Task T19) ──────────────────────────────────
  const handleOpenStockOut = (item = null) => {
    setActiveItem(item);
    setSelectedProductId(item ? item.productId : (storeState[0]?.productId || ""));
    setActionQuantity("");
    setActionSource("SALE");
    setActionReason("Customer Sale");
    setActionReferenceNumber("");
    setActionNotes("");
    setShowStockOutModal(true);
  };

  const handleSaveStockOut = async (e) => {
    e.preventDefault();
    const qty = parseFloat(actionQuantity);
    if (isNaN(qty) || qty <= 0) {
      return toast.error("Please enter a valid positive quantity to deduct.");
    }
    const targetProdId = activeItem ? activeItem.productId : selectedProductId;
    if (!targetProdId) {
      return toast.error("Please select a product.");
    }

    setSubmitting(true);
    try {
      await stockOut(
        {
          productId: targetProdId,
          quantity: qty,
          source: actionSource || "SALE",
          reason: actionReason.trim() || undefined,
          referenceNumber: actionReferenceNumber.trim() || undefined,
          notes: actionNotes.trim() || undefined,
        },
        generateIdempotencyKey()
      );

      toast.success(`Recorded Stock Out: -${qty} units in ledger (${actionSource}).`);
      setShowStockOutModal(false);
      fetchStoreData();
      if (activeTab === "LEDGER_TRAIL") fetchLedgerData();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to record stock out.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Adjust Stock Handlers (Phase 3 - Task T20) ─────────────────────────────
  const handleOpenAdjust = (item) => {
    setActiveItem(item);
    setNewStockValue(item.availableStock.toString());
    setActionSource("AUDIT_RECONCILIATION");
    setActionReferenceNumber("");
    setActionReason("");
    setActionNotes("");
    setShowAdjustModal(true);
  };

  const handleSaveAdjust = async (e) => {
    e.preventDefault();
    const stockNum = parseFloat(newStockValue);
    if (isNaN(stockNum) || stockNum < 0) {
      return toast.error("Please enter a valid non-negative physical stock count.");
    }

    const current = activeItem?.availableStock || 0;
    const discrepancy = stockNum - current;

    setSubmitting(true);
    try {
      await adjustStock(
        {
          productId: activeItem.productId,
          physicalCount: stockNum,
          source: actionSource || "AUDIT_RECONCILIATION",
          referenceNumber: actionReferenceNumber.trim() || undefined,
          reason: actionReason.trim() || undefined,
          notes: actionNotes.trim() || undefined,
        },
        generateIdempotencyKey()
      );

      toast.success(
        `Reconciled ${activeItem.name}: ${stockNum} ${activeItem.unit} (${discrepancy >= 0 ? "+" : ""}${discrepancy} delta).`
      );
      setShowAdjustModal(false);
      setActiveItem(null);
      fetchStoreData();
      if (activeTab === "LEDGER_TRAIL") fetchLedgerData();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to adjust stock.");
      fetchStoreData();
    } finally {
      setSubmitting(false);
    }
  };

  // ── Reorder Level Handlers ─────────────────────────────────────────────────
  const handleOpenReorder = (item) => {
    setActiveItem(item);
    setNewReorderValue(item.reorderLevel.toString());
    setShowReorderModal(true);
  };

  const handleSaveReorder = async (e) => {
    e.preventDefault();
    const reorderNum = parseFloat(newReorderValue);
    if (isNaN(reorderNum) || reorderNum < 0) {
      return toast.error("Please enter a valid non-negative reorder level.");
    }

    setSubmitting(true);
    try {
      await updateReorderLevel(activeItem.productId, {
        reorderLevel: reorderNum,
      });

      toast.success(`Reorder threshold set to ${reorderNum} ${activeItem.unit}`);
      setShowReorderModal(false);
      setActiveItem(null);
      fetchStoreData();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update reorder level.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full p-6 md:p-8 space-y-6 bg-[#09090b] text-zinc-100 min-h-[calc(100vh-4rem)]">
      {/* ── Top Header ──────────────────────────────────────────────────────── */}
      <InventoryHeader
        loading={loading}
        activeTab={activeTab}
        onStockIn={() => handleOpenStockIn()}
        onStockOut={() => handleOpenStockOut()}
        onRefresh={activeTab === "STORE_STATE" ? fetchStoreData : fetchLedgerData}
      />

      {/* ── KPI Summary Cards ───────────────────────────────────────────────── */}
      <InventoryStats summary={summary} loading={loading} />

      {/* ── Main Tab Switcher ────────────────────────────────────────────────── */}
      <InventoryTabsNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        alertsSummary={alertsSummary}
      />

      {/* ── TAB 1: CURRENT STORE STATE (T15) ────────────────────────────────── */}
      {activeTab === "STORE_STATE" && (
        <div className="space-y-4">
          <StockStateFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            stockStatusFilter={stockStatusFilter}
            setStockStatusFilter={setStockStatusFilter}
          />
          <StockStateTable
            loading={loading}
            storeState={storeState}
            onOpenStockIn={handleOpenStockIn}
            onOpenStockOut={handleOpenStockOut}
            onOpenAdjust={handleOpenAdjust}
            onOpenReorder={handleOpenReorder}
          />
        </div>
      )}

      {/* ── TAB 2: MOVEMENT LEDGER AUDIT TRAIL (T16 / T21) ──────────────────── */}
      {activeTab === "LEDGER_TRAIL" && (
        <div className="space-y-4">
          <LedgerFilters
            ledgerSearchTerm={ledgerSearchTerm}
            setLedgerSearchTerm={setLedgerSearchTerm}
            selectedProductFilter={selectedProductFilter}
            setSelectedProductFilter={setSelectedProductFilter}
            storeState={storeState}
            ledgerSourceFilter={ledgerSourceFilter}
            setLedgerSourceFilter={setLedgerSourceFilter}
            ledgerTypeFilter={ledgerTypeFilter}
            setLedgerTypeFilter={setLedgerTypeFilter}
            ledgerDatePreset={ledgerDatePreset}
            setLedgerDatePreset={setLedgerDatePreset}
            customStartDate={customStartDate}
            setCustomStartDate={setCustomStartDate}
            customEndDate={customEndDate}
            setCustomEndDate={setCustomEndDate}
            setLedgerPage={setLedgerPage}
            onExportCSV={() => exportLedgerToCSV(ledgerEntries)}
          />
          <LedgerFlowCards
            ledgerSummary={ledgerSummary}
            ledgerPagination={ledgerPagination}
          />
          <LedgerTable
            loading={loading}
            ledgerEntries={ledgerEntries}
            ledgerPagination={ledgerPagination}
            ledgerPage={ledgerPage}
            setLedgerPage={setLedgerPage}
          />
        </div>
      )}

      {/* ── TAB 3: LOW-STOCK ALERTS QUEUE (T22) ─────────────────────────────── */}
      {activeTab === "ALERTS_QUEUE" && (
        <div className="space-y-4">
          <AlertsSummaryCards alertsSummary={alertsSummary} />
          <AlertsTable
            loading={loading}
            alerts={alerts}
            alertsSummary={alertsSummary}
            alertStatusFilter={alertStatusFilter}
            setAlertStatusFilter={setAlertStatusFilter}
            alertSearchTerm={alertSearchTerm}
            setAlertSearchTerm={setAlertSearchTerm}
            alertPage={alertPage}
            setAlertPage={setAlertPage}
            alertPagination={alertPagination}
            syncingAlerts={syncingAlerts}
            onSyncAlerts={handleSyncAlerts}
            onQuickRestock={handleQuickRestockFromAlert}
            onAcknowledge={handleAcknowledgeAlert}
            onResolve={handleResolveAlert}
          />
        </div>
      )}

      {/* ── Modals ──────────────────────────────────────────────────────────── */}
      <StockInModal
        isOpen={showStockInModal}
        onClose={() => setShowStockInModal(false)}
        activeItem={activeItem}
        storeState={storeState}
        selectedProductId={selectedProductId}
        setSelectedProductId={setSelectedProductId}
        actionQuantity={actionQuantity}
        setActionQuantity={setActionQuantity}
        actionSource={actionSource}
        setActionSource={setActionSource}
        actionSupplier={actionSupplier}
        setActionSupplier={setActionSupplier}
        actionUnitCost={actionUnitCost}
        setActionUnitCost={setActionUnitCost}
        actionReferenceNumber={actionReferenceNumber}
        setActionReferenceNumber={setActionReferenceNumber}
        actionNotes={actionNotes}
        setActionNotes={setActionNotes}
        submitting={submitting}
        onSubmit={handleSaveStockIn}
      />

      <StockOutModal
        isOpen={showStockOutModal}
        onClose={() => setShowStockOutModal(false)}
        activeItem={activeItem}
        storeState={storeState}
        selectedProductId={selectedProductId}
        setSelectedProductId={setSelectedProductId}
        actionQuantity={actionQuantity}
        setActionQuantity={setActionQuantity}
        actionSource={actionSource}
        setActionSource={setActionSource}
        actionReason={actionReason}
        setActionReason={setActionReason}
        actionReferenceNumber={actionReferenceNumber}
        setActionReferenceNumber={setActionReferenceNumber}
        actionNotes={actionNotes}
        setActionNotes={setActionNotes}
        submitting={submitting}
        onSubmit={handleSaveStockOut}
      />

      <StockAdjustModal
        isOpen={showAdjustModal}
        onClose={() => setShowAdjustModal(false)}
        activeItem={activeItem}
        newStockValue={newStockValue}
        setNewStockValue={setNewStockValue}
        actionSource={actionSource}
        setActionSource={setActionSource}
        actionReferenceNumber={actionReferenceNumber}
        setActionReferenceNumber={setActionReferenceNumber}
        actionReason={actionReason}
        setActionReason={setActionReason}
        actionNotes={actionNotes}
        setActionNotes={setActionNotes}
        submitting={submitting}
        onSubmit={handleSaveAdjust}
      />

      <ReorderLevelModal
        isOpen={showReorderModal}
        onClose={() => setShowReorderModal(false)}
        activeItem={activeItem}
        newReorderValue={newReorderValue}
        setNewReorderValue={setNewReorderValue}
        submitting={submitting}
        onSubmit={handleSaveReorder}
      />
    </div>
  );
}
