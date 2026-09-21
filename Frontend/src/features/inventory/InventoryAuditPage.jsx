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
import { exportLedgerToCSV } from "./utils/inventory.utils";

// Modular Sub-Components
import InventoryHeader from "./components/InventoryHeader";
import InventorySummary from "./components/InventorySummary";
import InventoryTabs from "./components/InventoryTabs";
import StoreStateTab from "./components/StoreStateTab";
import LedgerTab from "./components/LedgerTab";
import LowStockTab from "./components/LowStockTab";

// Action Modals
import StockInModal from "./components/StockInModal";
import StockOutModal from "./components/StockOutModal";
import AdjustStockModal from "./components/AdjustStockModal";
import ReorderLevelModal from "./components/ReorderLevelModal";
import LedgerInspectorModal from "./components/LedgerInspectorModal";

export default function InventoryAuditPage() {
  // Active Main Tab: "STORE_STATE" | "LEDGER_TRAIL" | "ALERTS_QUEUE"
  const [activeTab, setActiveTab] = useState("STORE_STATE");

  // Data State
  const [summary, setSummary] = useState(null);
  const [storeState, setStoreState] = useState([]);
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [ledgerSummary, setLedgerSummary] = useState({
    totalEntries: 0,
    totalInQty: 0,
    totalOutQty: 0,
    netFlowQty: 0,
  });
  const [ledgerPagination, setLedgerPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  // Alerts Queue State
  const [alerts, setAlerts] = useState([]);
  const [alertsSummary, setAlertsSummary] = useState({
    totalActive: 0,
    unreadCount: 0,
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

  // Ledger Trail Filters
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
  const [showInspectorModal, setShowInspectorModal] = useState(false);

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

  // Fetch Inventory Ledger Trail
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

      const list = res.data || res.entries || [];
      setLedgerEntries(list);
      if (res.summary) setLedgerSummary(res.summary);
      if (res.pagination) setLedgerPagination(res.pagination);
    } catch (err) {
      console.error("Failed to load inventory ledger history:", err);
      toast.error(err?.response?.data?.message || "Failed to load audit ledger trail.");
    } finally {
      setLoading(false);
    }
  }, [
    selectedProductFilter,
    ledgerTypeFilter,
    ledgerSourceFilter,
    resolveDateRange,
    ledgerSearchTerm,
    ledgerPage,
  ]);

  // Fetch Alerts Data & Summary
  const fetchAlertsData = useCallback(async () => {
    setLoading(true);
    try {
      const [alertsRes, sumRes] = await Promise.all([
        getInventoryAlerts({
          status: alertStatusFilter !== "ALL" ? alertStatusFilter : undefined,
          search: alertSearchTerm.trim() || undefined,
          page: alertPage,
          limit: 20,
        }),
        getInventoryAlertsSummary(),
      ]);

      const list = alertsRes.data?.data || alertsRes.data || [];
      setAlerts(list);
      if (alertsRes.data?.pagination) setAlertPagination(alertsRes.data.pagination);
      setAlertsSummary(sumRes.data || sumRes || {});
    } catch (err) {
      console.error("Failed to load low-stock alerts:", err);
    } finally {
      setLoading(false);
    }
  }, [alertStatusFilter, alertSearchTerm, alertPage]);

  // Sync background alerts engine
  const handleSyncAlerts = async () => {
    setSyncingAlerts(true);
    try {
      const res = await syncInventoryAlerts();
      toast.success(res.message || "Scanned store limits successfully!");
      fetchAlertsData();
      fetchStoreData();
    } catch (err) {
      toast.error("Failed to sync alerts.");
    } finally {
      setSyncingAlerts(false);
    }
  };

  // Main effect based on active tab
  useEffect(() => {
    if (activeTab === "STORE_STATE") {
      fetchStoreData();
    } else if (activeTab === "LEDGER_TRAIL") {
      fetchLedgerData();
    } else if (activeTab === "ALERTS_QUEUE") {
      fetchAlertsData();
    }
  }, [activeTab, fetchStoreData, fetchLedgerData, fetchAlertsData]);

  // Modals Open Handlers
  const handleOpenStockIn = (item = null) => {
    setActiveItem(item);
    setSelectedProductId(item?.productId || "");
    setActionQuantity("");
    setActionSource("PURCHASE");
    setActionSupplier("");
    setActionUnitCost(item?.costPrice ? item.costPrice.toString() : "");
    setActionReferenceNumber("");
    setActionNotes("");
    setShowStockInModal(true);
  };

  const handleOpenStockOut = (item = null) => {
    setActiveItem(item);
    setSelectedProductId(item?.productId || "");
    setActionQuantity("");
    setActionSource("SALE");
    setActionReferenceNumber("");
    setActionReason("");
    setActionNotes("");
    setShowStockOutModal(true);
  };

  const handleOpenAdjust = (item) => {
    setActiveItem(item);
    setNewStockValue(item.availableStock.toString());
    setActionSource("AUDIT_RECONCILIATION");
    setActionReferenceNumber("");
    setActionReason("");
    setActionNotes("");
    setShowAdjustModal(true);
  };

  const handleOpenReorder = (item) => {
    setActiveItem(item);
    setNewReorderValue(item.reorderLevel.toString());
    setShowReorderModal(true);
  };

  const handleOpenInspectLedger = (item) => {
    setActiveItem(item);
    setShowInspectorModal(true);
  };

  // Form Submissions
  const handleSubmitStockIn = async (e) => {
    e.preventDefault();
    const prodId = activeItem?.productId || selectedProductId;
    if (!prodId) return toast.error("Please select a product.");

    const qty = parseFloat(actionQuantity);
    if (isNaN(qty) || qty <= 0) return toast.error("Please enter a valid stock-in quantity.");

    setSubmitting(true);
    try {
      await stockIn({
        productId: prodId,
        quantity: qty,
        source: actionSource || "PURCHASE",
        supplier: actionSupplier.trim() || undefined,
        unitCost: actionUnitCost ? parseFloat(actionUnitCost) : undefined,
        referenceNumber: actionReferenceNumber.trim() || undefined,
        notes: actionNotes.trim() || undefined,
      });

      toast.success(`Recorded Stock In: +${qty} units in ledger.`);
      setShowStockInModal(false);
      fetchStoreData();
      if (activeTab === "LEDGER_TRAIL") fetchLedgerData();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to record stock in.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitStockOut = async (e) => {
    e.preventDefault();
    const prodId = activeItem?.productId || selectedProductId;
    if (!prodId) return toast.error("Please select a product.");

    const qty = parseFloat(actionQuantity);
    if (isNaN(qty) || qty <= 0) return toast.error("Please enter a valid stock-out quantity.");

    setSubmitting(true);
    try {
      await stockOut({
        productId: prodId,
        quantity: qty,
        source: actionSource || "SALE",
        referenceNumber: actionReferenceNumber.trim() || undefined,
        reason: actionReason.trim() || undefined,
        notes: actionNotes.trim() || undefined,
      });

      toast.success(`Recorded Stock Out: -${qty} units in ledger.`);
      setShowStockOutModal(false);
      fetchStoreData();
      if (activeTab === "LEDGER_TRAIL") fetchLedgerData();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to record stock out.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitAdjust = async (e) => {
    e.preventDefault();
    const stockNum = parseFloat(newStockValue);
    if (isNaN(stockNum) || stockNum < 0) {
      return toast.error("Please enter a valid non-negative physical stock count.");
    }

    setSubmitting(true);
    try {
      await adjustStock({
        productId: activeItem.productId,
        physicalCount: stockNum,
        source: actionSource || "AUDIT_RECONCILIATION",
        referenceNumber: actionReferenceNumber.trim() || undefined,
        reason: actionReason.trim() || undefined,
        notes: actionNotes.trim() || undefined,
      });

      toast.success(`Reconciled stock for ${activeItem.name}.`);
      setShowAdjustModal(false);
      fetchStoreData();
      if (activeTab === "LEDGER_TRAIL") fetchLedgerData();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to adjust stock.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReorder = async (e) => {
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
      fetchStoreData();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update reorder level.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcknowledgeAlert = async (alertId) => {
    try {
      await acknowledgeAlert(alertId);
      toast.success("Alert acknowledged.");
      fetchAlertsData();
    } catch {
      toast.error("Failed to acknowledge alert.");
    }
  };

  const handleResolveAlert = async (alertId) => {
    try {
      await resolveAlert(alertId);
      toast.success("Alert marked as resolved.");
      fetchAlertsData();
    } catch {
      toast.error("Failed to resolve alert.");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* 1. Header */}
      <InventoryHeader
        syncingAlerts={syncingAlerts}
        onSyncAlerts={handleSyncAlerts}
        onRefresh={() => {
          if (activeTab === "STORE_STATE") fetchStoreData();
          else if (activeTab === "LEDGER_TRAIL") fetchLedgerData();
          else fetchAlertsData();
        }}
        loading={loading}
      />

      {/* 2. KPI Summary Cards */}
      <InventorySummary summary={summary} />

      {/* 3. Navigation Tabs */}
      <InventoryTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        alertsTotalActive={alertsSummary.totalActive}
      />

      {/* 4. Tab 1: Current Stock State (T15) */}
      {activeTab === "STORE_STATE" && (
        <StoreStateTab
          storeState={storeState}
          loading={loading}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          stockStatusFilter={stockStatusFilter}
          setStockStatusFilter={setStockStatusFilter}
          onOpenStockIn={handleOpenStockIn}
          onOpenStockOut={handleOpenStockOut}
          onOpenAdjust={handleOpenAdjust}
          onOpenReorder={handleOpenReorder}
          onOpenInspectLedger={handleOpenInspectLedger}
        />
      )}

      {/* 5. Tab 2: Movement Ledger Audit Trail (T16) */}
      {activeTab === "LEDGER_TRAIL" && (
        <LedgerTab
          ledgerEntries={ledgerEntries}
          ledgerSummary={ledgerSummary}
          ledgerPagination={ledgerPagination}
          storeState={storeState}
          loading={loading}
          ledgerSearchTerm={ledgerSearchTerm}
          setLedgerSearchTerm={setLedgerSearchTerm}
          selectedProductFilter={selectedProductFilter}
          setSelectedProductFilter={setSelectedProductFilter}
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
          ledgerPage={ledgerPage}
          setLedgerPage={setLedgerPage}
          onExportCSV={() => exportLedgerToCSV(ledgerEntries)}
        />
      )}

      {/* 6. Tab 3: Low-Stock Alerts Queue (T22) */}
      {activeTab === "ALERTS_QUEUE" && (
        <LowStockTab
          alerts={alerts}
          alertsSummary={alertsSummary}
          alertPagination={alertPagination}
          loading={loading}
          alertSearchTerm={alertSearchTerm}
          setAlertSearchTerm={setAlertSearchTerm}
          alertStatusFilter={alertStatusFilter}
          setAlertStatusFilter={setAlertStatusFilter}
          alertPage={alertPage}
          setAlertPage={setAlertPage}
          syncingAlerts={syncingAlerts}
          onSyncAlerts={handleSyncAlerts}
          onAcknowledgeAlert={handleAcknowledgeAlert}
          onResolveAlert={handleResolveAlert}
          onOpenStockIn={handleOpenStockIn}
          onOpenAdjust={handleOpenAdjust}
        />
      )}

      {/* ── Modals ── */}
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
        onSubmit={handleSubmitStockIn}
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
        actionReferenceNumber={actionReferenceNumber}
        setActionReferenceNumber={setActionReferenceNumber}
        actionReason={actionReason}
        setActionReason={setActionReason}
        actionNotes={actionNotes}
        setActionNotes={setActionNotes}
        submitting={submitting}
        onSubmit={handleSubmitStockOut}
      />

      <AdjustStockModal
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
        onSubmit={handleSubmitAdjust}
      />

      <ReorderLevelModal
        isOpen={showReorderModal}
        onClose={() => setShowReorderModal(false)}
        activeItem={activeItem}
        newReorderValue={newReorderValue}
        setNewReorderValue={setNewReorderValue}
        submitting={submitting}
        onSubmit={handleSubmitReorder}
      />

      <LedgerInspectorModal
        isOpen={showInspectorModal}
        onClose={() => setShowInspectorModal(false)}
        product={activeItem}
      />
    </div>
  );
}
