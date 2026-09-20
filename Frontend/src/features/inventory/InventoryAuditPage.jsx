import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Boxes,
  ArrowLeft,
  RefreshCw,
  Search,
  SlidersHorizontal,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Layers,
  Edit2,
  PackageCheck,
  X,
  Plus,
  Minus,
  History,
  FileText,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRightLeft,
  ShieldCheck,
  Calendar,
  User,
  Download,
  Filter,
  Bell,
  BellRing,
  AlertOctagon,
  CheckCheck,
  Clock,
  Zap,
} from "lucide-react";
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

export default function InventoryAuditPage() {
  const navigate = useNavigate();

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
  const [alertStatusFilter, setAlertStatusFilter] = useState("ALL_ACTIVE"); // ALL_ACTIVE | UNREAD | CRITICAL | WARNING | RESOLVED | ALL
  const [alertSearchTerm, setAlertSearchTerm] = useState("");
  const [alertPage, setAlertPage] = useState(1);
  const [alertPagination, setAlertPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [syncingAlerts, setSyncingAlerts] = useState(false);

  const [loading, setLoading] = useState(true);

  // Store State Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [stockStatusFilter, setStockStatusFilter] = useState("ALL"); // ALL | IN_STOCK | LOW_STOCK | OUT_OF_STOCK

  // Ledger Trail Filters (Phase 3 - Task T21)
  const [selectedProductFilter, setSelectedProductFilter] = useState("ALL");
  const [ledgerTypeFilter, setLedgerTypeFilter] = useState("ALL"); // ALL | IN | OUT | ADJUST | OPENING | RETURN
  const [ledgerSourceFilter, setLedgerSourceFilter] = useState("ALL");
  const [ledgerDatePreset, setLedgerDatePreset] = useState("ALL"); // ALL | TODAY | LAST_7_DAYS | LAST_30_DAYS | CUSTOM
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

  // Export Filtered Statement as CSV
  const handleExportCSV = () => {
    if (ledgerEntries.length === 0) {
      return toast.error("No ledger entries to export.");
    }

    const headers = [
      "Timestamp",
      "Product Name",
      "SKU",
      "Movement Type",
      "Source",
      "Qty Change",
      "Balance After",
      "Reference #",
      "Reason",
      "Supplier / Customer",
      "Unit Cost (₹)",
      "Performed By",
      "Notes",
    ];

    const rows = ledgerEntries.map((log) => [
      `"${new Date(log.createdAt).toLocaleString("en-IN")}"`,
      `"${log.productId?.name || "Unknown"}"`,
      `"${log.productId?.sku || ""}"`,
      `"${log.type || ""}"`,
      `"${log.source || ""}"`,
      log.qtyChange,
      log.balanceAfter,
      `"${log.referenceNumber || ""}"`,
      `"${log.reason || ""}"`,
      `"${log.supplierName || ""}"`,
      log.unitCost !== null && log.unitCost !== undefined ? log.unitCost : "",
      `"${log.createdByName || log.createdBy?.fullName || "System"}"`,
      `"${log.notes || ""}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `vendoros-inventory-ledger-audit-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Exported inventory audit ledger CSV statement!");
  };

  // ── Fetch Alerts Data & Summary (Phase 3 - Task T22) ────────────────────────
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
      productName: alert.productId?.name,
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
      await stockIn({
        productId: targetProdId,
        quantity: qty,
        source: actionSource || "PURCHASE",
        supplierName: actionSupplier.trim() || undefined,
        unitCost: !isNaN(unitCostNum) && unitCostNum >= 0 ? unitCostNum : undefined,
        referenceNumber: actionReferenceNumber.trim() || undefined,
        notes: actionNotes.trim() || undefined,
      });

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
      await stockOut({
        productId: targetProdId,
        quantity: qty,
        source: actionSource || "SALE",
        reason: actionReason.trim() || undefined,
        referenceNumber: actionReferenceNumber.trim() || undefined,
        notes: actionNotes.trim() || undefined,
      });

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
      await adjustStock({
        productId: activeItem.productId,
        physicalCount: stockNum,
        source: actionSource || "AUDIT_RECONCILIATION",
        referenceNumber: actionReferenceNumber.trim() || undefined,
        reason: actionReason.trim() || undefined,
        notes: actionNotes.trim() || undefined,
      });

      toast.success(
        `Reconciled ${activeItem.name}: ${stockNum} ${activeItem.unit} (${discrepancy >= 0 ? "+" : ""}${discrepancy} delta).`
      );
      setShowAdjustModal(false);
      setActiveItem(null);
      fetchStoreData();
      if (activeTab === "LEDGER_TRAIL") fetchLedgerData();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to adjust stock.");
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
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* ── Top Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/dashboard")}
            className="p-2 rounded-xl border border-border hover:bg-secondary text-muted-foreground hover:text-foreground transition-all cursor-pointer"
            title="Return to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2 text-foreground">
              <Boxes className="w-5 h-5 text-primary" /> Inventory Store & Ledger System
            </h1>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Phase 3 T15/T16: Current physical stock & immutable movement audit ledger</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenStockIn()}
            className="px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            Stock In
          </button>
          <button
            onClick={() => handleOpenStockOut()}
            className="px-3.5 py-2 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive hover:bg-destructive/20 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold shadow-xs"
          >
            <Minus className="w-3.5 h-3.5" />
            Stock Out
          </button>
          <button
            onClick={activeTab === "STORE_STATE" ? fetchStoreData : fetchLedgerData}
            className="px-3 py-2 rounded-xl border border-border hover:bg-secondary text-muted-foreground hover:text-foreground transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── KPI Summary Cards ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {/* Card 1: Total SKUs */}
        <div className="bg-card border border-border rounded-2xl p-4 space-y-1">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
            Catalog SKUs
          </span>
          <div className="text-2xl font-bold text-foreground">
            {loading && !summary ? "…" : summary?.totalProducts || 0}
          </div>
          <span className="text-[10px] text-muted-foreground">Active products tracked</span>
        </div>

        {/* Card 2: In-Stock */}
        <div className="bg-card border border-border rounded-2xl p-4 space-y-1">
          <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> In Stock
          </span>
          <div className="text-2xl font-bold text-emerald-400">
            {loading && !summary ? "…" : summary?.inStockCount || 0}
          </div>
          <span className="text-[10px] text-muted-foreground">Healthy inventory</span>
        </div>

        {/* Card 3: Low Stock Alerts */}
        <div className="bg-card border border-amber-500/30 bg-amber-500/5 rounded-2xl p-4 space-y-1">
          <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Low Stock
          </span>
          <div className="text-2xl font-bold text-amber-400">
            {loading && !summary ? "…" : summary?.lowStockCount || 0}
          </div>
          <span className="text-[10px] text-muted-foreground">Below reorder level</span>
        </div>

        {/* Card 4: Out of Stock */}
        <div className="bg-card border border-destructive/30 bg-destructive/5 rounded-2xl p-4 space-y-1">
          <span className="text-[11px] font-bold text-destructive uppercase tracking-wider flex items-center gap-1">
            <XCircle className="w-3 h-3" /> Out of Stock
          </span>
          <div className="text-2xl font-bold text-destructive">
            {loading && !summary ? "…" : summary?.outOfStockCount || 0}
          </div>
          <span className="text-[10px] text-muted-foreground">Zero available units</span>
        </div>

        {/* Card 5: Inventory Valuation */}
        <div className="bg-card border border-border rounded-2xl p-4 space-y-1 col-span-2 md:col-span-1">
          <span className="text-[11px] font-bold text-primary uppercase tracking-wider flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Total Asset Val.
          </span>
          <div className="text-2xl font-bold font-mono text-primary">
            ₹{loading && !summary ? "…" : (summary?.totalValuation || 0).toLocaleString("en-IN")}
          </div>
          <span className="text-[10px] text-muted-foreground">Based on cost prices</span>
        </div>
      </div>

      {/* ── Main Tab Switcher ────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-border pb-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab("STORE_STATE")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all cursor-pointer border-b-2 -mb-1 whitespace-nowrap ${
            activeTab === "STORE_STATE"
              ? "border-primary text-primary bg-primary/5"
              : "border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/40"
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>Current Stock State (T15)</span>
        </button>

        <button
          onClick={() => setActiveTab("LEDGER_TRAIL")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all cursor-pointer border-b-2 -mb-1 whitespace-nowrap ${
            activeTab === "LEDGER_TRAIL"
              ? "border-primary text-primary bg-primary/5"
              : "border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/40"
          }`}
        >
          <History className="w-4 h-4" />
          <span>Movement Ledger Audit Trail (T16)</span>
        </button>

        <button
          onClick={() => setActiveTab("ALERTS_QUEUE")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all cursor-pointer border-b-2 -mb-1 whitespace-nowrap ${
            activeTab === "ALERTS_QUEUE"
              ? "border-primary text-primary bg-primary/5"
              : "border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/40"
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Low-Stock Alerts Queue (T22)</span>
          {alertsSummary.totalActive > 0 && (
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                alertsSummary.criticalCount > 0
                  ? "bg-destructive text-destructive-foreground animate-pulse"
                  : "bg-amber-500 text-amber-950 font-extrabold"
              }`}
            >
              {alertsSummary.totalActive}
            </span>
          )}
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 1: CURRENT STORE STATE (T15)                                       */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "STORE_STATE" && (
        <div className="space-y-4">
          {/* Search & Stock Status Filters */}
          <div className="bg-card border border-border rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
            {/* Search */}
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, SKU or category..."
                className="w-full bg-background border border-border rounded-xl pl-10 pr-8 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              {[
                { label: "All Items", value: "ALL" },
                { label: "In Stock", value: "IN_STOCK" },
                { label: "Low Stock", value: "LOW_STOCK" },
                { label: "Out of Stock", value: "OUT_OF_STOCK" },
              ].map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setStockStatusFilter(tab.value)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer border ${
                    stockStatusFilter === tab.value
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-background text-muted-foreground hover:text-foreground border-border hover:bg-secondary"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Store State Table */}
          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border bg-secondary/40 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    <th className="py-3 px-4">Product & Category</th>
                    <th className="py-3 px-4">SKU / Code</th>
                    <th className="py-3 px-4 text-right">Selling / Cost</th>
                    <th className="py-3 px-4 text-center">Current Stock</th>
                    <th className="py-3 px-4 text-center">Reorder Threshold</th>
                    <th className="py-3 px-4 text-right">Valuation (Cost)</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="py-16 text-center text-muted-foreground">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                          <span className="font-medium">Loading inventory store state...</span>
                        </div>
                      </td>
                    </tr>
                  ) : storeState.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-16 text-center text-muted-foreground">
                        <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                          <Boxes className="w-10 h-10 opacity-40" />
                          <p className="font-semibold text-foreground text-sm">No Inventory Records Found</p>
                          <p className="text-xs">No products match current filter conditions.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    storeState.map((item) => {
                      const isOutOfStock = item.stockStatus === "OUT_OF_STOCK";
                      const isLowStock = item.stockStatus === "LOW_STOCK";

                      return (
                        <tr key={item.productId} className="hover:bg-secondary/30 transition-colors">
                          {/* Product Name & Category */}
                          <td className="py-3 px-4 align-middle">
                            <div className="flex flex-col gap-0.5">
                              <span className="font-semibold text-foreground text-xs">{item.name}</span>
                              <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                                <Layers className="w-2.5 h-2.5 text-primary" />
                                {item.category?.name || "Uncategorized"}
                              </span>
                            </div>
                          </td>

                          {/* SKU */}
                          <td className="py-3 px-4 align-middle font-mono text-[11px] text-muted-foreground">
                            <span className="bg-secondary px-2 py-0.5 rounded border border-border text-foreground font-semibold">
                              {item.sku}
                            </span>
                          </td>

                          {/* Pricing */}
                          <td className="py-3 px-4 text-right align-middle font-mono">
                            <span className="font-bold text-foreground block">₹{item.sellingPrice.toFixed(2)}</span>
                            <span className="text-[10px] text-muted-foreground">Cost: ₹{item.costPrice.toFixed(2)}</span>
                          </td>

                          {/* Available Stock */}
                          <td className="py-3 px-4 text-center align-middle font-mono">
                            <span
                              className={`font-bold text-sm px-2 py-0.5 rounded-lg border ${
                                isOutOfStock
                                  ? "bg-destructive/10 text-destructive border-destructive/20"
                                  : isLowStock
                                  ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                  : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              }`}
                            >
                              {item.availableStock} {item.unit}
                            </span>
                          </td>

                          {/* Reorder Level */}
                          <td className="py-3 px-4 text-center align-middle font-mono">
                            <button
                              onClick={() => handleOpenReorder(item)}
                              className="inline-flex items-center gap-1 text-xs hover:text-primary transition-colors cursor-pointer"
                              title="Click to change reorder threshold"
                            >
                              <span>{item.reorderLevel} {item.unit}</span>
                              <Edit2 className="w-3 h-3 opacity-60 hover:opacity-100" />
                            </button>
                          </td>

                          {/* Valuation */}
                          <td className="py-3 px-4 text-right align-middle font-mono font-bold text-foreground">
                            ₹{item.valuation.toFixed(2)}
                          </td>

                          {/* Status */}
                          <td className="py-3 px-4 text-center align-middle">
                            {isOutOfStock ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-destructive/10 text-destructive px-2 py-0.5 rounded-full border border-destructive/20">
                                <XCircle className="w-3 h-3" /> Out of Stock
                              </span>
                            ) : isLowStock ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/20 animate-pulse">
                                <AlertTriangle className="w-3 h-3" /> Low Stock
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                <CheckCircle2 className="w-3 h-3" /> In Stock
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right align-middle">
                            <div className="inline-flex items-center gap-1">
                              <button
                                onClick={() => handleOpenStockIn(item)}
                                className="p-1.5 rounded-lg border border-border bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all cursor-pointer"
                                title="Add Stock (IN)"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleOpenStockOut(item)}
                                className="p-1.5 rounded-lg border border-border bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all cursor-pointer"
                                title="Deduct Stock (OUT)"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleOpenAdjust(item)}
                                className="px-2 py-1 rounded-lg border border-border bg-background hover:bg-secondary text-foreground text-xs font-semibold inline-flex items-center gap-1 cursor-pointer transition-all shadow-xs"
                                title="Reconcile Physical Count"
                              >
                                <PackageCheck className="w-3.5 h-3.5 text-primary" /> Adjust
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 2: MOVEMENT LEDGER AUDIT TRAIL (T16 / T21)                         */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "LEDGER_TRAIL" && (
        <div className="space-y-4">
          {/* ── Filter Control Deck & Search ──────────────────────────────────── */}
          <div className="bg-card border border-border rounded-2xl p-4 shadow-sm space-y-3">
            {/* Top Row: Search & Actions */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Reference / Actor / Note Search */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by Reference #, Reason, Supplier, User, or Notes..."
                  value={ledgerSearchTerm}
                  onChange={(e) => {
                    setLedgerSearchTerm(e.target.value);
                    setLedgerPage(1);
                  }}
                  className="w-full bg-secondary/50 border border-border rounded-xl pl-9 pr-4 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                {ledgerSearchTerm && (
                  <button
                    onClick={() => {
                      setLedgerSearchTerm("");
                      setLedgerPage(1);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Product Selector */}
              <div className="flex items-center gap-2">
                <Boxes className="w-4 h-4 text-muted-foreground shrink-0" />
                <select
                  value={selectedProductFilter}
                  onChange={(e) => {
                    setSelectedProductFilter(e.target.value);
                    setLedgerPage(1);
                  }}
                  className="bg-secondary/50 border border-border rounded-xl px-3 py-2 text-xs text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer max-w-[200px] truncate"
                >
                  <option value="ALL">📦 All Products</option>
                  {storeState.map((item) => (
                    <option key={item.productId} value={item.productId}>
                      {item.productName} ({item.sku || "No SKU"})
                    </option>
                  ))}
                </select>
              </div>

              {/* Source Category Selector */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
                <select
                  value={ledgerSourceFilter}
                  onChange={(e) => {
                    setLedgerSourceFilter(e.target.value);
                    setLedgerPage(1);
                  }}
                  className="bg-secondary/50 border border-border rounded-xl px-3 py-2 text-xs text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer"
                >
                  <option value="ALL">⚡ All Sources</option>
                  <option value="PURCHASE">Purchase (Stock In)</option>
                  <option value="SALE">Sale / POS (Stock Out)</option>
                  <option value="INITIAL">Initial / Opening</option>
                  <option value="DAMAGE">Damage / Spoilage</option>
                  <option value="CYCLE_COUNT">Cycle Count</option>
                  <option value="RETURN_IN">Customer Return</option>
                  <option value="RETURN_OUT">Supplier Return</option>
                  <option value="AUDIT_CORRECTION">Audit Correction</option>
                </select>
              </div>

              {/* CSV Statement Export */}
              <button
                onClick={handleExportCSV}
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-border bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold shadow-xs transition-colors cursor-pointer shrink-0"
                title="Export Statement as CSV"
              >
                <Download className="w-3.5 h-3.5 text-primary" />
                <span>Export CSV</span>
              </button>
            </div>

            {/* Middle Row: Movement Type Pills & Date Preset Tabs */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 pt-2 border-t border-border/50">
              {/* Movement Type Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto w-full lg:w-auto pb-1 lg:pb-0">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mr-1">
                  Type:
                </span>
                {[
                  { label: "All", value: "ALL" },
                  { label: "Stock In (+)", value: "IN" },
                  { label: "Stock Out (-)", value: "OUT" },
                  { label: "Adjustment (~)", value: "ADJUST" },
                  { label: "Opening (*)", value: "OPENING" },
                  { label: "Return (<)", value: "RETURN" },
                ].map((tab) => (
                  <button
                    key={tab.value}
                    onClick={() => {
                      setLedgerTypeFilter(tab.value);
                      setLedgerPage(1);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer border ${
                      ledgerTypeFilter === tab.value
                        ? "bg-primary text-primary-foreground border-primary shadow-xs"
                        : "bg-secondary/40 text-muted-foreground hover:text-foreground border-border hover:bg-secondary"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Date Presets */}
              <div className="flex items-center gap-1.5 overflow-x-auto w-full lg:w-auto pb-1 lg:pb-0">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground mr-1 shrink-0" />
                {[
                  { label: "All Time", value: "ALL" },
                  { label: "Today", value: "TODAY" },
                  { label: "7 Days", value: "LAST_7_DAYS" },
                  { label: "30 Days", value: "LAST_30_DAYS" },
                  { label: "Custom", value: "CUSTOM" },
                ].map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => {
                      setLedgerDatePreset(preset.value);
                      setLedgerPage(1);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer border ${
                      ledgerDatePreset === preset.value
                        ? "bg-foreground text-background border-foreground font-semibold"
                        : "bg-secondary/40 text-muted-foreground hover:text-foreground border-border"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Date Range Selector (If Selected) */}
            {ledgerDatePreset === "CUSTOM" && (
              <div className="flex items-center gap-3 pt-2 border-t border-border/40 text-xs animate-in fade-in-50">
                <div className="flex items-center gap-1.5">
                  <span className="text-muted-foreground font-medium">From:</span>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => {
                      setCustomStartDate(e.target.value);
                      setLedgerPage(1);
                    }}
                    className="bg-secondary/60 border border-border rounded-lg px-2.5 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-muted-foreground font-medium">To:</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => {
                      setCustomEndDate(e.target.value);
                      setLedgerPage(1);
                    }}
                    className="bg-secondary/60 border border-border rounded-lg px-2.5 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
            )}
          </div>

          {/* ── Statement Summary KPI Bar ─────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-card border border-border rounded-xl p-3 shadow-xs">
              <div className="flex items-center justify-between text-muted-foreground text-[11px] font-medium">
                <span>Total Inflow</span>
                <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <p className="text-lg font-bold font-mono text-emerald-400 mt-1">
                +{ledgerSummary.totalInQty || 0}
              </p>
              <span className="text-[10px] text-muted-foreground">Units Added</span>
            </div>

            <div className="bg-card border border-border rounded-xl p-3 shadow-xs">
              <div className="flex items-center justify-between text-muted-foreground text-[11px] font-medium">
                <span>Total Outflow</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-destructive" />
              </div>
              <p className="text-lg font-bold font-mono text-destructive mt-1">
                -{ledgerSummary.totalOutQty || 0}
              </p>
              <span className="text-[10px] text-muted-foreground">Units Sold / Dispatched</span>
            </div>

            <div className="bg-card border border-border rounded-xl p-3 shadow-xs">
              <div className="flex items-center justify-between text-muted-foreground text-[11px] font-medium">
                <span>Net Stock Flow</span>
                <TrendingUp className="w-3.5 h-3.5 text-primary" />
              </div>
              <p
                className={`text-lg font-bold font-mono mt-1 ${
                  (ledgerSummary.netFlowQty || 0) > 0
                    ? "text-emerald-400"
                    : (ledgerSummary.netFlowQty || 0) < 0
                    ? "text-destructive"
                    : "text-foreground"
                }`}
              >
                {(ledgerSummary.netFlowQty || 0) > 0
                  ? `+${ledgerSummary.netFlowQty}`
                  : ledgerSummary.netFlowQty || 0}
              </p>
              <span className="text-[10px] text-muted-foreground">Delta Net Variance</span>
            </div>

            <div className="bg-card border border-border rounded-xl p-3 shadow-xs">
              <div className="flex items-center justify-between text-muted-foreground text-[11px] font-medium">
                <span>Audited Movements</span>
                <ShieldCheck className="w-3.5 h-3.5 text-primary" />
              </div>
              <p className="text-lg font-bold font-mono text-foreground mt-1">
                {ledgerPagination.total || ledgerSummary.totalEntries || 0}
              </p>
              <span className="text-[10px] text-muted-foreground">Logged Transactions</span>
            </div>
          </div>

          {/* ── Ledger Trail Table (Who, When, Why, What) ─────────────────────── */}
          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border bg-secondary/40 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    <th className="py-3 px-4">When (Date & Time)</th>
                    <th className="py-3 px-4">What (Product)</th>
                    <th className="py-3 px-4 text-center">Movement Type</th>
                    <th className="py-3 px-4 text-center">Qty Change</th>
                    <th className="py-3 px-4 text-center">Balance After</th>
                    <th className="py-3 px-4">Why (Reason & Ref)</th>
                    <th className="py-3 px-4">Who (Actor)</th>
                    <th className="py-3 px-4">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="py-16 text-center text-muted-foreground">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                          <span className="font-medium">Loading ledger audit trail...</span>
                        </div>
                      </td>
                    </tr>
                  ) : ledgerEntries.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-16 text-center text-muted-foreground">
                        <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                          <History className="w-10 h-10 opacity-40" />
                          <p className="font-semibold text-foreground text-sm">No Ledger Entries Found</p>
                          <p className="text-xs">
                            No stock movement matches your active filter criteria.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    ledgerEntries.map((log) => {
                      const isPositive = log.qtyChange > 0;
                      const formattedDate = new Date(log.createdAt).toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      });

                      let badgeClass = "bg-secondary text-foreground border-border";
                      let TypeIcon = ArrowRightLeft;

                      if (log.type === "IN") {
                        badgeClass = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
                        TypeIcon = ArrowDownLeft;
                      } else if (log.type === "OUT") {
                        badgeClass = "bg-destructive/10 text-destructive border-destructive/20";
                        TypeIcon = ArrowUpRight;
                      } else if (log.type === "ADJUST") {
                        badgeClass = "bg-amber-500/10 text-amber-400 border-amber-500/20";
                        TypeIcon = SlidersHorizontal;
                      } else if (log.type === "OPENING") {
                        badgeClass = "bg-blue-500/10 text-blue-400 border-blue-500/20";
                        TypeIcon = CheckCircle2;
                      }

                      const actorName =
                        log.createdByName || log.createdBy?.fullName || "System Admin";

                      return (
                        <tr key={log._id} className="hover:bg-secondary/30 transition-colors">
                          {/* When (Timestamp) */}
                          <td className="py-3 px-4 align-middle whitespace-nowrap font-mono text-[11px] text-muted-foreground">
                            <span className="flex items-center gap-1.5">
                              <Calendar className="w-3 h-3 text-muted-foreground shrink-0" />
                              {formattedDate}
                            </span>
                          </td>

                          {/* What (Product) */}
                          <td className="py-3 px-4 align-middle">
                            <div className="flex flex-col">
                              <span className="font-semibold text-foreground">
                                {log.productId?.name || "Unknown Product"}
                              </span>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[10px] text-muted-foreground font-mono">
                                  SKU: {log.productId?.sku || "N/A"}
                                </span>
                                {log.productId?.category && (
                                  <span className="text-[9px] bg-secondary px-1 rounded text-muted-foreground">
                                    {log.productId.category}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Movement Type & Source */}
                          <td className="py-3 px-4 text-center align-middle">
                            <div className="inline-flex flex-col items-center gap-1">
                              <span
                                className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeClass}`}
                              >
                                <TypeIcon className="w-3 h-3" />
                                {log.type}
                              </span>
                              {log.source && (
                                <span className="text-[9px] font-mono text-muted-foreground uppercase bg-secondary/80 px-1.5 py-0.2 rounded border border-border">
                                  {log.source}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Qty Change */}
                          <td className="py-3 px-4 text-center align-middle font-mono font-bold text-sm">
                            <span
                              className={
                                isPositive
                                  ? "text-emerald-400"
                                  : log.qtyChange < 0
                                  ? "text-destructive"
                                  : "text-muted-foreground"
                              }
                            >
                              {isPositive ? `+${log.qtyChange}` : log.qtyChange} {log.productId?.unit || "pcs"}
                            </span>
                          </td>

                          {/* Balance After */}
                          <td className="py-3 px-4 text-center align-middle font-mono font-bold text-foreground">
                            {log.balanceAfter} {log.productId?.unit || "pcs"}
                          </td>

                          {/* Why (Reason & Reference) */}
                          <td className="py-3 px-4 align-middle text-xs">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-foreground font-medium">{log.reason || "—"}</span>
                              {log.supplierName && (
                                <span className="text-[10px] text-muted-foreground">
                                  Supplier: <strong className="text-foreground">{log.supplierName}</strong>
                                </span>
                              )}
                              {log.referenceNumber && (
                                <span className="text-[10px] text-primary font-mono">
                                  Ref: #{log.referenceNumber}
                                </span>
                              )}
                              {log.unitCost !== null && log.unitCost !== undefined && (
                                <span className="text-[10px] text-emerald-400 font-mono">
                                  Cost: ₹{log.unitCost.toFixed(2)}/unit
                                </span>
                              )}
                              {log.invoiceId && (
                                <span className="text-[10px] text-primary font-mono">
                                  Invoice: {log.invoiceId.invoiceNumber || log.invoiceId._id}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Who (Actor / CreatedBy) */}
                          <td className="py-3 px-4 align-middle">
                            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-secondary/60 border border-border text-[11px] font-medium text-foreground">
                              <User className="w-3 h-3 text-primary shrink-0" />
                              <span className="truncate max-w-[110px]">{actorName}</span>
                            </div>
                          </td>

                          {/* Notes */}
                          <td className="py-3 px-4 align-middle text-xs text-muted-foreground max-w-[150px] truncate">
                            {log.notes || "—"}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {ledgerPagination.totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-border bg-secondary/20">
                <span className="text-xs text-muted-foreground">
                  Page {ledgerPagination.page} of {ledgerPagination.totalPages} ({ledgerPagination.total} total movement logs)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={ledgerPage <= 1}
                    onClick={() => setLedgerPage((p) => Math.max(p - 1, 1))}
                    className="px-3 py-1.5 rounded-xl border border-border text-xs font-semibold hover:bg-secondary disabled:opacity-40 cursor-pointer"
                  >
                    Previous
                  </button>
                  <button
                    disabled={ledgerPage >= ledgerPagination.totalPages}
                    onClick={() => setLedgerPage((p) => p + 1)}
                    className="px-3 py-1.5 rounded-xl border border-border text-xs font-semibold hover:bg-secondary disabled:opacity-40 cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 3: LOW-STOCK ALERTS QUEUE (PHASE 3 - TASK T22)                     */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "ALERTS_QUEUE" && (
        <div className="space-y-4">
          {/* ── Control & Filter Deck ─────────────────────────────────────────── */}
          <div className="bg-card border border-border rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search alert by Product Name, SKU or Message..."
                  value={alertSearchTerm}
                  onChange={(e) => {
                    setAlertSearchTerm(e.target.value);
                    setAlertPage(1);
                  }}
                  className="w-full bg-secondary/50 border border-border rounded-xl pl-9 pr-4 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                {alertSearchTerm && (
                  <button
                    onClick={() => {
                      setAlertSearchTerm("");
                      setAlertPage(1);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Sweep & Sync Button */}
              <button
                onClick={handleSyncAlerts}
                disabled={syncingAlerts}
                className="flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl border border-border bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold shadow-xs transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                title="Run Deterministic Reorder Sweep across all products"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-primary ${syncingAlerts ? "animate-spin" : ""}`} />
                <span>{syncingAlerts ? "Evaluating Store..." : "Run Reorder Sweep"}</span>
              </button>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-border/50 pb-1">
              {[
                { label: "Active Queue", value: "ALL_ACTIVE", count: alertsSummary.totalActive },
                { label: "Unread", value: "UNREAD", count: alertsSummary.unreadCount },
                { label: "Critical (OOS)", value: "CRITICAL", count: alertsSummary.criticalCount },
                { label: "Low Stock", value: "WARNING", count: alertsSummary.warningCount },
                { label: "Resolved", value: "RESOLVED", count: alertsSummary.resolvedCount },
                { label: "All History", value: "ALL", count: null },
              ].map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => {
                    setAlertStatusFilter(tab.value);
                    setAlertPage(1);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer border ${
                    alertStatusFilter === tab.value
                      ? "bg-primary text-primary-foreground border-primary shadow-xs"
                      : "bg-secondary/40 text-muted-foreground hover:text-foreground border-border hover:bg-secondary"
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.count !== null && tab.count > 0 && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                        alertStatusFilter === tab.value
                          ? "bg-primary-foreground text-primary"
                          : tab.value === "CRITICAL"
                          ? "bg-destructive text-destructive-foreground"
                          : "bg-amber-500/20 text-amber-400"
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* ── Summary KPI Strip ─────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-card border border-border rounded-xl p-3 shadow-xs">
              <div className="flex items-center justify-between text-muted-foreground text-[11px] font-medium">
                <span>Active Triggers</span>
                <BellRing className="w-3.5 h-3.5 text-primary" />
              </div>
              <p className="text-lg font-bold font-mono text-foreground mt-1">
                {alertsSummary.totalActive || 0}
              </p>
              <span className="text-[10px] text-muted-foreground">Require attention</span>
            </div>

            <div className="bg-card border border-destructive/20 bg-destructive/5 rounded-xl p-3 shadow-xs">
              <div className="flex items-center justify-between text-destructive text-[11px] font-medium">
                <span>Critical Out of Stock</span>
                <XCircle className="w-3.5 h-3.5 text-destructive" />
              </div>
              <p className="text-lg font-bold font-mono text-destructive mt-1">
                {alertsSummary.criticalCount || 0}
              </p>
              <span className="text-[10px] text-muted-foreground">0 units available</span>
            </div>

            <div className="bg-card border border-amber-500/20 bg-amber-500/5 rounded-xl p-3 shadow-xs">
              <div className="flex items-center justify-between text-amber-400 text-[11px] font-medium">
                <span>Low Stock Warnings</span>
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <p className="text-lg font-bold font-mono text-amber-400 mt-1">
                {alertsSummary.warningCount || 0}
              </p>
              <span className="text-[10px] text-muted-foreground">Below reorder level</span>
            </div>

            <div className="bg-card border border-emerald-500/20 bg-emerald-500/5 rounded-xl p-3 shadow-xs">
              <div className="flex items-center justify-between text-emerald-400 text-[11px] font-medium">
                <span>Auto-Resolved</span>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <p className="text-lg font-bold font-mono text-emerald-400 mt-1">
                {alertsSummary.resolvedCount || 0}
              </p>
              <span className="text-[10px] text-muted-foreground">Restocked & cleared</span>
            </div>
          </div>

          {/* ── Alerts Cards Deck ─────────────────────────────────────────────── */}
          {loading ? (
            <div className="bg-card border border-border rounded-2xl p-12 text-center text-muted-foreground">
              <div className="flex flex-col items-center justify-center gap-2">
                <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                <span className="font-medium text-xs">Loading alerts queue...</span>
              </div>
            </div>
          ) : alerts.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-foreground">
                  {alertStatusFilter === "ALL_ACTIVE" || alertStatusFilter === "UNREAD"
                    ? "All Stock Levels Healthy! 🎉"
                    : "No Alerts Found"}
                </h4>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  {alertStatusFilter === "ALL_ACTIVE" || alertStatusFilter === "UNREAD"
                    ? "Every product in your catalog is currently above its configured reorder threshold."
                    : "No alerts match the active filter criteria."}
                </p>
              </div>
              <button
                onClick={handleSyncAlerts}
                className="px-3.5 py-1.5 rounded-xl border border-border bg-secondary hover:bg-secondary/80 text-xs font-semibold cursor-pointer"
              >
                Re-scan Inventory
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => {
                const isCritical = alert.severity === "CRITICAL" || alert.currentStock <= 0;
                const isResolved = alert.status === "RESOLVED";
                const isUnread = alert.status === "UNREAD";

                const formattedDate = new Date(alert.lastTriggeredAt || alert.createdAt).toLocaleString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                });

                const stockPercentage = alert.reorderLevel > 0
                  ? Math.min(100, Math.round((alert.currentStock / alert.reorderLevel) * 100))
                  : 0;

                return (
                  <div
                    key={alert._id}
                    className={`bg-card border rounded-2xl p-4 shadow-xs transition-all hover:border-border/80 ${
                      isResolved
                        ? "border-border/40 opacity-75"
                        : isCritical
                        ? "border-destructive/40 bg-destructive/[0.02]"
                        : isUnread
                        ? "border-amber-500/40 bg-amber-500/[0.02]"
                        : "border-border"
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                      {/* Left: Product & Severity Badges */}
                      <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Severity Pill */}
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              isCritical
                                ? "bg-destructive/10 text-destructive border-destructive/30"
                                : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                            }`}
                          >
                            {isCritical ? <AlertOctagon className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                            {isCritical ? "CRITICAL: OUT OF STOCK" : "WARNING: LOW STOCK"}
                          </span>

                          {/* Status Pill */}
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              isResolved
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                : isUnread
                                ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                                : "bg-secondary text-muted-foreground border-border"
                            }`}
                          >
                            {alert.status}
                          </span>

                          {/* Trigger Timestamp */}
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-mono">
                            <Clock className="w-3 h-3" />
                            {formattedDate}
                          </span>
                        </div>

                        {/* Product Details */}
                        <div>
                          <h4 className="font-bold text-foreground text-sm flex items-center gap-2">
                            <span>{alert.productId?.name || "Unknown Product"}</span>
                            {alert.productId?.sku && (
                              <span className="text-[10px] font-mono bg-secondary px-1.5 py-0.2 rounded text-muted-foreground font-normal">
                                SKU: {alert.productId.sku}
                              </span>
                            )}
                            {alert.productId?.categoryId?.name && (
                              <span className="text-[10px] bg-secondary/80 px-1.5 py-0.2 rounded text-muted-foreground font-normal">
                                {alert.productId.categoryId.name}
                              </span>
                            )}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-0.5">{alert.message}</p>
                        </div>
                      </div>

                      {/* Middle: Stock vs Threshold Gauge */}
                      <div className="w-full lg:w-64 bg-secondary/40 border border-border rounded-xl p-2.5 space-y-1.5 shrink-0">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground font-medium">Stock Gauge:</span>
                          <span className="font-mono font-bold text-foreground">
                            {alert.currentStock} / {alert.reorderLevel} {alert.productId?.unit || "pcs"}
                          </span>
                        </div>

                        {/* Visual Progress Bar */}
                        <div className="w-full bg-secondary rounded-full h-2 overflow-hidden border border-border/50">
                          <div
                            className={`h-full transition-all duration-300 rounded-full ${
                              isCritical ? "bg-destructive" : "bg-amber-400"
                            }`}
                            style={{ width: `${Math.max(4, stockPercentage)}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                          <span>0 Units</span>
                          <span className="text-amber-400 font-semibold font-mono">
                            Deficit: -{alert.deficitQty} {alert.productId?.unit || "pcs"}
                          </span>
                          <span>{alert.reorderLevel} (Threshold)</span>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-2 w-full lg:w-auto justify-end shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-border/40">
                        {/* 1-Click Quick Restock */}
                        <button
                          onClick={() => handleQuickRestockFromAlert(alert)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-xs hover:bg-primary/90 transition-all cursor-pointer"
                          title="Restock this item now"
                        >
                          <Zap className="w-3.5 h-3.5 fill-current" />
                          <span>Restock Now</span>
                        </button>

                        {/* Acknowledge Action */}
                        {!isResolved && alert.status === "UNREAD" && (
                          <button
                            onClick={() => handleAcknowledgeAlert(alert._id)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-border bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold cursor-pointer"
                            title="Acknowledge alert"
                          >
                            <CheckCheck className="w-3.5 h-3.5 text-blue-400" />
                            <span>Ack</span>
                          </button>
                        )}

                        {/* Resolve Action */}
                        {!isResolved && (
                          <button
                            onClick={() => handleResolveAlert(alert._id)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-border bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold cursor-pointer"
                            title="Mark resolved"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Resolve</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Alerts Pagination */}
              {alertPagination.totalPages > 1 && (
                <div className="flex items-center justify-between p-4 bg-card border border-border rounded-2xl">
                  <span className="text-xs text-muted-foreground">
                    Page {alertPagination.page} of {alertPagination.totalPages} ({alertPagination.total} total alerts)
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      disabled={alertPage <= 1}
                      onClick={() => setAlertPage((p) => Math.max(p - 1, 1))}
                      className="px-3 py-1.5 rounded-xl border border-border text-xs font-semibold hover:bg-secondary disabled:opacity-40 cursor-pointer"
                    >
                      Previous
                    </button>
                    <button
                      disabled={alertPage >= alertPagination.totalPages}
                      onClick={() => setAlertPage((p) => p + 1)}
                      className="px-3 py-1.5 rounded-xl border border-border text-xs font-semibold hover:bg-secondary disabled:opacity-40 cursor-pointer"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Modal: Stock In (+) ─────────────────────────────────────────────── */}
      {showStockInModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-400" /> Stock In (Purchase / Restock)
              </h3>
              <button
                onClick={() => setShowStockInModal(false)}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStockIn} className="space-y-4">
              {/* Product Select if not preset */}
              {!activeItem ? (
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1.5">
                    Select Product:
                  </label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    required
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {storeState.map((p) => (
                      <option key={p.productId} value={p.productId}>
                        {p.name} ({p.sku}) — Available: {p.availableStock} {p.unit}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="bg-secondary/40 p-3 rounded-xl space-y-1 text-xs">
                  <p className="font-bold text-foreground">{activeItem.name}</p>
                  <p className="text-muted-foreground font-mono">SKU: {activeItem.sku}</p>
                  <p className="text-muted-foreground">
                    Current Stock: <strong className="text-foreground">{activeItem.availableStock} {activeItem.unit}</strong>
                  </p>
                </div>
              )}

              {/* Source Type */}
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1.5">
                  Stock-In Source:
                </label>
                <select
                  value={actionSource}
                  onChange={(e) => setActionSource(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="PURCHASE">Supplier Purchase / Invoice</option>
                  <option value="GOODS_RECEIPT">Goods Receipt Note (GRN)</option>
                  <option value="MANUAL">Manual Stock Addition</option>
                  <option value="RETURN">Customer Return Restock</option>
                  <option value="TRANSFER">Stock Transfer</option>
                  <option value="OTHER">Other / Miscellaneous</option>
                </select>
              </div>

              {/* Quantity */}
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1.5">
                  Stock In Quantity (+):
                </label>
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  required
                  value={actionQuantity}
                  onChange={(e) => setActionQuantity(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  placeholder="e.g. 50"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Supplier */}
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1.5">
                    Supplier Name (Optional):
                  </label>
                  <input
                    type="text"
                    value={actionSupplier}
                    onChange={(e) => setActionSupplier(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="e.g. Metro Wholesalers"
                  />
                </div>

                {/* Unit Cost */}
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1.5">
                    Purchase Price / Unit (₹):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={actionUnitCost}
                    onChange={(e) => setActionUnitCost(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="e.g. 10.50"
                  />
                </div>
              </div>

              {/* Reference # */}
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1.5">
                  PO / Bill / Challan Ref # (Optional):
                </label>
                <input
                  type="text"
                  value={actionReferenceNumber}
                  onChange={(e) => setActionReferenceNumber(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g. PO-8819 or INV-1002"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1.5">
                  Additional Notes (Optional):
                </label>
                <input
                  type="text"
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g. Goods received in good condition"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowStockInModal(false)}
                  className="px-4 py-2 rounded-xl border border-border bg-secondary hover:bg-secondary/80 text-foreground font-semibold text-xs transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-emerald-500 text-black font-bold text-xs hover:bg-emerald-400 transition-all cursor-pointer disabled:opacity-50"
                >
                  {submitting ? "Recording..." : "Record Stock In"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Stock Out (-) ────────────────────────────────────────────── */}
      {showStockOutModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                <Minus className="w-5 h-5 text-destructive" /> Stock Out (Deduction / Dispatch)
              </h3>
              <button
                onClick={() => setShowStockOutModal(false)}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStockOut} className="space-y-4">
              {/* Product Select if not preset */}
              {!activeItem ? (
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1.5">
                    Select Product:
                  </label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    required
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {storeState.map((p) => (
                      <option key={p.productId} value={p.productId}>
                        {p.name} ({p.sku}) — Available: {p.availableStock} {p.unit}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="bg-secondary/40 p-3 rounded-xl space-y-1 text-xs">
                  <p className="font-bold text-foreground">{activeItem.name}</p>
                  <p className="text-muted-foreground font-mono">SKU: {activeItem.sku}</p>
                  <p className="text-muted-foreground">
                    Available Stock: <strong className="text-foreground">{activeItem.availableStock} {activeItem.unit}</strong>
                  </p>
                </div>
              )}

              {/* Quantity */}
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1.5">
                  Stock Out Quantity (-):
                </label>
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  required
                  value={actionQuantity}
                  onChange={(e) => setActionQuantity(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-destructive"
                  placeholder="e.g. 5"
                  autoFocus
                />
              </div>

              {/* Source Type */}
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1.5">
                  Stock-Out Source / Category:
                </label>
                <select
                  value={actionSource}
                  onChange={(e) => setActionSource(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="SALE">Customer Sale / POS Bill</option>
                  <option value="DAMAGE">Damaged / Broken Packaging</option>
                  <option value="EXPIRED">Expired Goods Write-Off</option>
                  <option value="RETURN_TO_VENDOR">Return to Vendor / Supplier</option>
                  <option value="SAMPLE">Store Demonstration / Internal Sample</option>
                  <option value="MANUAL">Manual Stock Deduction</option>
                  <option value="OTHER">Other / Discrepancy</option>
                </select>
              </div>

              {/* Reference # */}
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1.5">
                  Invoice / Bill / Reference # (Optional):
                </label>
                <input
                  type="text"
                  value={actionReferenceNumber}
                  onChange={(e) => setActionReferenceNumber(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g. INV-2026-1001 or DMG-01"
                />
              </div>

              {/* Reason */}
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1.5">
                  Reason Description:
                </label>
                <input
                  type="text"
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g. Counter sale or broken during unloading"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1.5">
                  Additional Notes (Optional):
                </label>
                <input
                  type="text"
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g. Discarded in garbage / batch #B10"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowStockOutModal(false)}
                  className="px-4 py-2 rounded-xl border border-border bg-secondary hover:bg-secondary/80 text-foreground font-semibold text-xs transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-destructive text-destructive-foreground font-bold text-xs hover:bg-destructive/90 transition-all cursor-pointer disabled:opacity-50"
                >
                  {submitting ? "Deducting..." : "Record Stock Out"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Adjust Physical Stock Count (Phase 3 - Task T20) ──────────── */}
      {showAdjustModal && activeItem && (() => {
        const currentStock = activeItem.availableStock || 0;
        const targetCount = parseFloat(newStockValue);
        const discrepancy = !isNaN(targetCount) ? targetCount - currentStock : 0;

        return (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                  <PackageCheck className="w-5 h-5 text-primary" /> Physical Stock Reconciliation
                </h3>
                <button
                  onClick={() => setShowAdjustModal(false)}
                  className="text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Product Header & Live Comparison */}
              <div className="bg-secondary/40 border border-border/80 p-3.5 rounded-2xl space-y-2 text-xs">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-foreground text-sm">{activeItem.name}</p>
                    <p className="text-muted-foreground font-mono text-[11px]">SKU: {activeItem.sku}</p>
                  </div>
                  <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 font-bold px-2 py-0.5 rounded-full">
                    {activeItem.category?.name || "General"}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/60 text-center font-mono">
                  <div className="bg-background/80 p-2 rounded-xl border border-border">
                    <span className="text-[10px] text-muted-foreground block">System Stock</span>
                    <strong className="text-foreground text-xs">{currentStock} {activeItem.unit}</strong>
                  </div>
                  <div className="bg-background/80 p-2 rounded-xl border border-border">
                    <span className="text-[10px] text-muted-foreground block">Physical Count</span>
                    <strong className="text-primary text-xs">{!isNaN(targetCount) ? targetCount : "—"} {activeItem.unit}</strong>
                  </div>
                  <div className={`p-2 rounded-xl border font-bold text-xs ${
                    discrepancy > 0
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : discrepancy < 0
                      ? "bg-destructive/10 text-destructive border-destructive/20"
                      : "bg-secondary text-muted-foreground border-border"
                  }`}>
                    <span className="text-[10px] opacity-80 block font-normal">Discrepancy</span>
                    {discrepancy > 0 ? `+${discrepancy}` : discrepancy} {activeItem.unit}
                  </div>
                </div>
              </div>

              <form onSubmit={handleSaveAdjust} className="space-y-3.5">
                {/* Physical Count Input */}
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">
                    New Physical Count ({activeItem.unit}):
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    required
                    value={newStockValue}
                    onChange={(e) => setNewStockValue(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-base font-mono font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Enter physical count"
                    autoFocus
                  />
                </div>

                {/* Reason Category / Source */}
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">
                    Adjustment Reason / Category:
                  </label>
                  <select
                    value={actionSource}
                    onChange={(e) => setActionSource(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="AUDIT_RECONCILIATION">Physical Store Audit (Periodic Count)</option>
                    <option value="DAMAGE">Damaged / Broken Goods Write-Off</option>
                    <option value="EXPIRED">Expired Stock Discard</option>
                    <option value="SPILLAGE">Spillage / Leakage Loss</option>
                    <option value="THEFT_SHRINKAGE">Theft / Shrinkage Discrepancy</option>
                    <option value="FOUND_STOCK">Found Unrecorded Stock (Surplus)</option>
                    <option value="CORRECTION">Recount / Data Entry Correction</option>
                    <option value="MANUAL">Manual Stock Adjustment</option>
                    <option value="OTHER">Other Reason</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Audit Reference # */}
                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1">
                      Audit Ref / Batch # (Optional):
                    </label>
                    <input
                      type="text"
                      value={actionReferenceNumber}
                      onChange={(e) => setActionReferenceNumber(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="e.g. AUDIT-2026-Q1"
                    />
                  </div>

                  {/* Custom Reason */}
                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1">
                      Reason Description (Optional):
                    </label>
                    <input
                      type="text"
                      value={actionReason}
                      onChange={(e) => setActionReason(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="e.g. Broken packaging in aisle 2"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">
                    Auditor Notes (Optional):
                  </label>
                  <textarea
                    rows={2}
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    placeholder="e.g. Verified and approved by Store Manager"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAdjustModal(false)}
                    className="px-4 py-2 rounded-xl border border-border bg-secondary hover:bg-secondary/80 text-foreground font-semibold text-xs transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? "Reconciling..." : "Save Reconciliation"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* ── Modal: Update Reorder Level Threshold ───────────────────────────── */}
      {showReorderModal && activeItem && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-primary" /> Low Stock Reorder Threshold
              </h3>
              <button
                onClick={() => setShowReorderModal(false)}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-secondary/40 p-3 rounded-xl space-y-1 text-xs">
              <p className="font-bold text-foreground">{activeItem.name}</p>
              <p className="text-muted-foreground font-mono">SKU: {activeItem.sku}</p>
              <p className="text-muted-foreground">
                Current Level: <strong className="text-foreground">{activeItem.reorderLevel} {activeItem.unit}</strong>
              </p>
            </div>

            <form onSubmit={handleSaveReorder} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1.5">
                  Set Reorder Alert Threshold ({activeItem.unit}):
                </label>
                <p className="text-[11px] text-muted-foreground mb-2">
                  When available physical stock drops to or below this quantity, a low stock warning will be triggered.
                </p>
                <input
                  type="number"
                  step="any"
                  min="0"
                  required
                  value={newReorderValue}
                  onChange={(e) => setNewReorderValue(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g. 10"
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReorderModal(false)}
                  className="px-4 py-2 rounded-xl border border-border bg-secondary hover:bg-secondary/80 text-foreground font-semibold text-xs transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition-all cursor-pointer disabled:opacity-50"
                >
                  {submitting ? "Updating..." : "Update Threshold"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
