import React, { useState, useEffect, useCallback, useMemo } from "react";
import toast from "react-hot-toast";
import {
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Wrench,
  CheckCircle2,
  Boxes,
  Users,
  Truck,
  Search,
  Check,
  ChevronRight,
  Database,
  Activity,
  ArrowUpRight,
  Clock,
  Sparkles,
} from "lucide-react";
import {
  getFullReconciliation,
  fixInventoryDiscrepancies,
  fixCustomerDiscrepancies,
  fixSupplierDiscrepancies,
  runAllReconciliation,
  getInventoryReconciliation,
  getCustomerReconciliation,
  getSupplierReconciliation,
} from "../../services/reconciliation.api";

export default function ReconciliationPage() {
  // Main Data State
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fixingModule, setFixingModule] = useState(null); // 'all' | 'inventory' | 'customers' | 'suppliers'
  const [lastScanned, setLastScanned] = useState(null);

  // Tab State: 'all' | 'inventory' | 'customers' | 'suppliers'
  const [activeTab, setActiveTab] = useState("all");

  // Search Filter
  const [searchQuery, setSearchQuery] = useState("");

  // Confirmation Modal
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    module: null, // 'all' | 'inventory' | 'customers' | 'suppliers'
    title: "",
    description: "",
  });

  // Fetch Full Reconciliation Data
  const fetchReconciliation = useCallback(async (showToast = false) => {
    setLoading(true);
    try {
      const res = await getFullReconciliation(false);
      setData(res);
      setLastScanned(new Date());
      if (showToast) {
        if (res.isHealthy) {
          toast.success("System audit completed: All records in 100% parity!");
        } else {
          toast("Discrepancies detected across active records", {
            icon: "⚠️",
          });
        }
      }
    } catch (err) {
      console.error("Failed to load reconciliation data:", err);
      toast.error(err?.response?.data?.message || "Failed to audit system integrity.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReconciliation();
  }, [fetchReconciliation]);

  // Execute Repair Handler
  const handleExecuteFix = async (moduleType) => {
    setFixingModule(moduleType);
    setConfirmModal({ isOpen: false, module: null, title: "", description: "" });

    try {
      if (moduleType === "all") {
        await runAllReconciliation(true);
        toast.success("All module discrepancies repaired successfully!");
      } else if (moduleType === "inventory") {
        await fixInventoryDiscrepancies();
        toast.success("Inventory stock synchronized to immutable ledger!");
      } else if (moduleType === "customers") {
        await fixCustomerDiscrepancies();
        toast.success("Customer khata balances reconciled to ledger trail!");
      } else if (moduleType === "suppliers") {
        await fixSupplierDiscrepancies();
        toast.success("Supplier payables reconciled to purchase ledger!");
      }
      // Re-scan immediately
      await fetchReconciliation(false);
    } catch (err) {
      console.error(`Error fixing ${moduleType}:`, err);
      toast.error(err?.response?.data?.message || `Failed to repair ${moduleType} discrepancies.`);
    } finally {
      setFixingModule(null);
    }
  };

  // Open confirmation modal
  const openConfirmModal = (moduleType) => {
    let title = "";
    let description = "";

    if (moduleType === "all") {
      title = "Repair All System Discrepancies?";
      description =
        "This will automatically synchronize physical stock, customer khatas, and supplier payables to their authoritative ledger transaction logs across all database collections.";
    } else if (moduleType === "inventory") {
      title = "Synchronize Inventory Stock?";
      description =
        "This will adjust current inventory availableStock to match the mathematical sum of all historical stock ledger movements.";
    } else if (moduleType === "customers") {
      title = "Reconcile Customer Debt Balances?";
      description =
        "This will calculate total unpaid credit sales minus recorded settlements for each discrepant customer and update their currentBalance.";
    } else if (moduleType === "suppliers") {
      title = "Reconcile Supplier Accounts Payable?";
      description =
        "This will reconcile accounts payable with verified purchase orders and payment vouchers.";
    }

    setConfirmModal({
      isOpen: true,
      module: moduleType,
      title,
      description,
    });
  };

  // Aggregated Counts
  const overallHealth = data?.overallHealthScore ?? 100;
  const isHealthy = data?.isHealthy ?? true;

  const totalChecks =
    (data?.inventory?.totalProductsChecked || 0) +
    (data?.customers?.totalCustomersChecked || 0) +
    (data?.suppliers?.totalSuppliersChecked || 0);

  const totalInSync =
    (data?.inventory?.inSyncCount || 0) +
    (data?.customers?.inSyncCount || 0) +
    (data?.suppliers?.inSyncCount || 0);

  const totalDiscrepancies =
    (data?.inventory?.discrepancyCount || 0) +
    (data?.customers?.discrepancyCount || 0) +
    (data?.suppliers?.discrepancyCount || 0);

  // Filtered Discrepancies based on search query
  const filteredInventoryDiscrepancies = useMemo(() => {
    const list = data?.inventory?.discrepancies || [];
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (item) =>
        item.productName?.toLowerCase().includes(q) ||
        item.sku?.toLowerCase().includes(q)
    );
  }, [data?.inventory?.discrepancies, searchQuery]);

  const filteredCustomerDiscrepancies = useMemo(() => {
    const list = data?.customers?.discrepancies || [];
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (item) =>
        item.customerName?.toLowerCase().includes(q) ||
        item.customerPhone?.toLowerCase().includes(q)
    );
  }, [data?.customers?.discrepancies, searchQuery]);

  const filteredSupplierDiscrepancies = useMemo(() => {
    const list = data?.suppliers?.discrepancies || [];
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (item) =>
        item.supplierCompany?.toLowerCase().includes(q) ||
        item.supplierPhone?.toLowerCase().includes(q)
    );
  }, [data?.suppliers?.discrepancies, searchQuery]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
      {/* 1. HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#1D1D1F] to-[#2C2C2E] border border-[#D2D2D7]/20 flex items-center justify-center text-[#0066CC] shadow-sm">
              <ShieldCheck className="w-5 h-5 text-[#54A7FF]" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                System Reconciliation & Audit
                <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#0066CC]/20 text-[#54A7FF] border border-[#0066CC]/30">
                  Data Parity Engine
                </span>
              </h1>
              <p className="text-xs text-[#6E6E73] mt-0.5">
                Autonomous ledger drift audit, physical vs ledger validation, and self-healing data repair
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            onClick={() => fetchReconciliation(true)}
            disabled={loading || fixingModule !== null}
            className="apple-btn-secondary text-xs py-2 px-3.5 flex items-center gap-2 cursor-pointer"
            title="Scan system integrity now"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#0066CC]" : ""}`} />
            <span>{loading ? "Auditing..." : "Scan System"}</span>
          </button>

          <button
            onClick={() => openConfirmModal("all")}
            disabled={loading || fixingModule !== null || totalDiscrepancies === 0}
            className={`text-xs py-2 px-4 rounded-full font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-sm ${
              totalDiscrepancies > 0
                ? "bg-[#B64400] hover:bg-[#FF791B] text-white shadow-[0_2px_12px_rgba(182,68,0,0.35)]"
                : "bg-white/5 text-[#6E6E73] cursor-not-allowed border border-[#D2D2D7]/10"
            }`}
          >
            <Wrench className={`w-3.5 h-3.5 ${fixingModule === "all" ? "animate-spin" : ""}`} />
            <span>
              {fixingModule === "all" ? "Repairing..." : "Auto-Repair All Discrepancies"}
            </span>
          </button>
        </div>
      </div>

      {/* 2. OVERALL HEALTH KPI BAR & CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Overall System Health Card */}
        <div className="apple-glass-card p-4 relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-[#6E6E73]">
                System Health Score
              </p>
              <div className="flex items-baseline gap-2 mt-1">
                <span
                  className={`text-3xl font-extrabold tracking-tight tabular-nums ${
                    overallHealth === 100
                      ? "text-[#30D158]"
                      : overallHealth >= 80
                      ? "text-[#FF9F0A]"
                      : "text-[#FF453A]"
                  }`}
                >
                  {overallHealth}%
                </span>
                <span className="text-[11px] text-[#6E6E73] font-medium">integrity</span>
              </div>
            </div>
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center border ${
                isHealthy
                  ? "bg-[#30D158]/15 border-[#30D158]/30 text-[#30D158]"
                  : "bg-[#FF453A]/15 border-[#FF453A]/30 text-[#FF453A]"
              }`}
            >
              {isHealthy ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <AlertTriangle className="w-5 h-5" />
              )}
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#D2D2D7]/10 flex items-center justify-between text-[11px]">
            <span className="text-[#6E6E73]">Overall Status</span>
            <span
              className={`font-semibold ${
                isHealthy ? "text-[#30D158]" : "text-[#FF453A]"
              }`}
            >
              {isHealthy ? "100% In Parity" : "Drift Detected"}
            </span>
          </div>
        </div>

        {/* Total Verified Entities Card */}
        <div className="apple-glass-card p-4 relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-[#6E6E73]">
                Entities Audited
              </p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-extrabold tracking-tight tabular-nums text-white">
                  {totalChecks}
                </span>
                <span className="text-[11px] text-[#6E6E73] font-medium">records</span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-full bg-[#0066CC]/15 border border-[#0066CC]/30 flex items-center justify-center text-[#54A7FF]">
              <Database className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#D2D2D7]/10 flex items-center justify-between text-[11px]">
            <span className="text-[#6E6E73]">In Perfect Sync</span>
            <span className="font-semibold text-white tabular-nums">
              {totalInSync} / {totalChecks}
            </span>
          </div>
        </div>

        {/* Detected Discrepancies Card */}
        <div className="apple-glass-card p-4 relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-[#6E6E73]">
                Discrepancies
              </p>
              <div className="flex items-baseline gap-2 mt-1">
                <span
                  className={`text-3xl font-extrabold tracking-tight tabular-nums ${
                    totalDiscrepancies > 0 ? "text-[#FF453A]" : "text-[#30D158]"
                  }`}
                >
                  {totalDiscrepancies}
                </span>
                <span className="text-[11px] text-[#6E6E73] font-medium">drifts</span>
              </div>
            </div>
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center border ${
                totalDiscrepancies > 0
                  ? "bg-[#FF453A]/15 border-[#FF453A]/30 text-[#FF453A]"
                  : "bg-[#30D158]/15 border-[#30D158]/30 text-[#30D158]"
              }`}
            >
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#D2D2D7]/10 flex items-center justify-between text-[11px]">
            <span className="text-[#6E6E73]">Auto-Repairable</span>
            <span
              className={`font-semibold ${
                totalDiscrepancies > 0 ? "text-[#FF791B]" : "text-[#6E6E73]"
              }`}
            >
              {totalDiscrepancies > 0 ? "Ready to Fix" : "None"}
            </span>
          </div>
        </div>

        {/* Last Audit Scan Timestamp */}
        <div className="apple-glass-card p-4 relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-[#6E6E73]">
                Audit Timestamp
              </p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-xl font-bold tracking-tight text-white">
                  {lastScanned
                    ? lastScanned.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
                    : "Scanning..."}
                </span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-full bg-white/5 border border-[#D2D2D7]/15 flex items-center justify-center text-[#D2D2D7]">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#D2D2D7]/10 flex items-center justify-between text-[11px]">
            <span className="text-[#6E6E73]">Audit Engine</span>
            <span className="font-semibold text-[#54A7FF] flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Real-time
            </span>
          </div>
        </div>
      </div>

      {/* 3. MODULE STATUS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Inventory Stock Module Card */}
        <div
          onClick={() => setActiveTab("inventory")}
          className={`apple-glass-card p-4 cursor-pointer transition-all duration-300 relative group ${
            activeTab === "inventory" ? "ring-2 ring-[#0066CC] border-transparent" : ""
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#0066CC]/20 border border-[#0066CC]/30 flex items-center justify-center text-[#54A7FF]">
                <Boxes className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-[#54A7FF] transition-colors">
                  Inventory Stock
                </h3>
                <p className="text-[10px] text-[#6E6E73]">Physical vs Ledger</p>
              </div>
            </div>
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                (data?.inventory?.discrepancyCount || 0) === 0
                  ? "bg-[#30D158]/15 text-[#30D158] border border-[#30D158]/30"
                  : "bg-[#FF453A]/15 text-[#FF453A] border border-[#FF453A]/30"
              }`}
            >
              {data?.inventory?.healthScore ?? 100}%
            </span>
          </div>

          <div className="space-y-1.5 text-xs text-[#D2D2D7]/80">
            <div className="flex justify-between">
              <span className="text-[#6E6E73]">Products Audited:</span>
              <span className="font-medium text-white tabular-nums">
                {data?.inventory?.totalProductsChecked || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6E6E73]">Discrepancies:</span>
              <span
                className={`font-semibold tabular-nums ${
                  (data?.inventory?.discrepancyCount || 0) > 0 ? "text-[#FF453A]" : "text-[#30D158]"
                }`}
              >
                {data?.inventory?.discrepancyCount || 0}
              </span>
            </div>
          </div>

          {(data?.inventory?.discrepancyCount || 0) > 0 && (
            <div className="mt-3 pt-2.5 border-t border-[#D2D2D7]/10 flex justify-end">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openConfirmModal("inventory");
                }}
                disabled={fixingModule === "inventory"}
                className="text-[11px] font-semibold text-[#FF791B] hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <Wrench className="w-3 h-3" />
                <span>{fixingModule === "inventory" ? "Fixing..." : "Repair Stock"}</span>
              </button>
            </div>
          )}
        </div>

        {/* Customer Khata Module Card */}
        <div
          onClick={() => setActiveTab("customers")}
          className={`apple-glass-card p-4 cursor-pointer transition-all duration-300 relative group ${
            activeTab === "customers" ? "ring-2 ring-[#0066CC] border-transparent" : ""
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#30D158]/20 border border-[#30D158]/30 flex items-center justify-center text-[#30D158]">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-[#30D158] transition-colors">
                  Customer Khata
                </h3>
                <p className="text-[10px] text-[#6E6E73]">Udhaar Debt Balance</p>
              </div>
            </div>
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                (data?.customers?.discrepancyCount || 0) === 0
                  ? "bg-[#30D158]/15 text-[#30D158] border border-[#30D158]/30"
                  : "bg-[#FF453A]/15 text-[#FF453A] border border-[#FF453A]/30"
              }`}
            >
              {data?.customers?.healthScore ?? 100}%
            </span>
          </div>

          <div className="space-y-1.5 text-xs text-[#D2D2D7]/80">
            <div className="flex justify-between">
              <span className="text-[#6E6E73]">Customers Audited:</span>
              <span className="font-medium text-white tabular-nums">
                {data?.customers?.totalCustomersChecked || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6E6E73]">Discrepancies:</span>
              <span
                className={`font-semibold tabular-nums ${
                  (data?.customers?.discrepancyCount || 0) > 0 ? "text-[#FF453A]" : "text-[#30D158]"
                }`}
              >
                {data?.customers?.discrepancyCount || 0}
              </span>
            </div>
          </div>

          {(data?.customers?.discrepancyCount || 0) > 0 && (
            <div className="mt-3 pt-2.5 border-t border-[#D2D2D7]/10 flex justify-end">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openConfirmModal("customers");
                }}
                disabled={fixingModule === "customers"}
                className="text-[11px] font-semibold text-[#FF791B] hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <Wrench className="w-3 h-3" />
                <span>{fixingModule === "customers" ? "Fixing..." : "Repair Khata"}</span>
              </button>
            </div>
          )}
        </div>

        {/* Supplier Payables Module Card */}
        <div
          onClick={() => setActiveTab("suppliers")}
          className={`apple-glass-card p-4 cursor-pointer transition-all duration-300 relative group ${
            activeTab === "suppliers" ? "ring-2 ring-[#0066CC] border-transparent" : ""
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#FF791B]/20 border border-[#FF791B]/30 flex items-center justify-center text-[#FF791B]">
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-[#FF791B] transition-colors">
                  Supplier Payables
                </h3>
                <p className="text-[10px] text-[#6E6E73]">Accounts Payable</p>
              </div>
            </div>
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                (data?.suppliers?.discrepancyCount || 0) === 0
                  ? "bg-[#30D158]/15 text-[#30D158] border border-[#30D158]/30"
                  : "bg-[#FF453A]/15 text-[#FF453A] border border-[#FF453A]/30"
              }`}
            >
              {data?.suppliers?.healthScore ?? 100}%
            </span>
          </div>

          <div className="space-y-1.5 text-xs text-[#D2D2D7]/80">
            <div className="flex justify-between">
              <span className="text-[#6E6E73]">Suppliers Audited:</span>
              <span className="font-medium text-white tabular-nums">
                {data?.suppliers?.totalSuppliersChecked || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6E6E73]">Discrepancies:</span>
              <span
                className={`font-semibold tabular-nums ${
                  (data?.suppliers?.discrepancyCount || 0) > 0 ? "text-[#FF453A]" : "text-[#30D158]"
                }`}
              >
                {data?.suppliers?.discrepancyCount || 0}
              </span>
            </div>
          </div>

          {(data?.suppliers?.discrepancyCount || 0) > 0 && (
            <div className="mt-3 pt-2.5 border-t border-[#D2D2D7]/10 flex justify-end">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openConfirmModal("suppliers");
                }}
                disabled={fixingModule === "suppliers"}
                className="text-[11px] font-semibold text-[#FF791B] hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <Wrench className="w-3 h-3" />
                <span>{fixingModule === "suppliers" ? "Fixing..." : "Repair Payables"}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 4. SEGMENTED TABS & SEARCH BAR */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        {/* Navigation Tabs */}
        <div className="flex items-center p-1 bg-[#161617] border border-[#D2D2D7]/12 rounded-full overflow-x-auto">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "all"
                ? "bg-[#0066CC] text-white shadow-sm"
                : "text-[#6E6E73] hover:text-white hover:bg-white/5"
            }`}
          >
            All Modules
          </button>
          <button
            onClick={() => setActiveTab("inventory")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === "inventory"
                ? "bg-[#0066CC] text-white shadow-sm"
                : "text-[#6E6E73] hover:text-white hover:bg-white/5"
            }`}
          >
            <span>Inventory Drift</span>
            {(data?.inventory?.discrepancyCount || 0) > 0 && (
              <span className="w-4 h-4 rounded-full bg-[#FF453A] text-white text-[10px] font-bold flex items-center justify-center">
                {data.inventory.discrepancyCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("customers")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === "customers"
                ? "bg-[#0066CC] text-white shadow-sm"
                : "text-[#6E6E73] hover:text-white hover:bg-white/5"
            }`}
          >
            <span>Customer Khata</span>
            {(data?.customers?.discrepancyCount || 0) > 0 && (
              <span className="w-4 h-4 rounded-full bg-[#FF453A] text-white text-[10px] font-bold flex items-center justify-center">
                {data.customers.discrepancyCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("suppliers")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === "suppliers"
                ? "bg-[#0066CC] text-white shadow-sm"
                : "text-[#6E6E73] hover:text-white hover:bg-white/5"
            }`}
          >
            <span>Supplier Payables</span>
            {(data?.suppliers?.discrepancyCount || 0) > 0 && (
              <span className="w-4 h-4 rounded-full bg-[#FF453A] text-white text-[10px] font-bold flex items-center justify-center">
                {data.suppliers.discrepancyCount}
              </span>
            )}
          </button>
        </div>

        {/* Quick Search */}
        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-[#6E6E73] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search discrepancies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-1.5 rounded-full text-xs bg-[#161617] border border-[#D2D2D7]/15 text-white placeholder-[#6E6E73] focus:border-[#0066CC] outline-none transition-all"
          />
        </div>
      </div>

      {/* 5. TABLES OR HEALTH CONFIRMATION SECTIONS */}
      {/* If entirely healthy and all discrepancies 0 */}
      {totalDiscrepancies === 0 && (
        <div className="apple-glass-card p-10 text-center flex flex-col items-center justify-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-[#30D158]/10 border border-[#30D158]/25 flex items-center justify-center text-[#30D158] shadow-[0_0_24px_rgba(48,209,88,0.2)]">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">System in Perfect Mathematical Integrity</h3>
            <p className="text-xs text-[#6E6E73] max-w-md mt-1 mx-auto leading-relaxed">
              All physical inventory stocks match sum of ledger entries. Customer khata debts and supplier
              payables match their transaction ledgers with zero balance drift.
            </p>
          </div>
          <button
            onClick={() => fetchReconciliation(true)}
            className="apple-btn-secondary text-xs py-2 px-4 mt-2"
          >
            Run Integrity Audit Again
          </button>
        </div>
      )}

      {/* INVENTORY DRIFT SECTION */}
      {(activeTab === "all" || activeTab === "inventory") &&
        (data?.inventory?.discrepancyCount || 0) > 0 && (
          <div className="apple-glass-card overflow-hidden">
            <div className="px-4 py-3 border-b border-[#D2D2D7]/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Boxes className="w-4 h-4 text-[#54A7FF]" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Inventory Stock Discrepancies ({filteredInventoryDiscrepancies.length})
                </h3>
              </div>
              <button
                onClick={() => openConfirmModal("inventory")}
                disabled={fixingModule === "inventory"}
                className="apple-btn-primary text-[11px] py-1 px-3 shadow-none flex items-center gap-1.5"
              >
                <Wrench className="w-3 h-3" />
                <span>Repair Stock</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#D2D2D7]">
                <thead className="bg-[#1D1D1F]/60 text-[#6E6E73] uppercase tracking-wider text-[10px] border-b border-[#D2D2D7]/10 font-semibold">
                  <tr>
                    <th className="py-2.5 px-4">Product Name</th>
                    <th className="py-2.5 px-3">SKU</th>
                    <th className="py-2.5 px-3 text-right">Stored Stock</th>
                    <th className="py-2.5 px-3 text-right">Ledger Expected</th>
                    <th className="py-2.5 px-3 text-right">Discrepancy Drift</th>
                    <th className="py-2.5 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D2D2D7]/5 font-mono">
                  {filteredInventoryDiscrepancies.map((item, idx) => (
                    <tr key={item.productId || idx} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4 font-sans font-medium text-white">{item.productName}</td>
                      <td className="py-3 px-3 text-[#6E6E73] text-[11px]">{item.sku || "—"}</td>
                      <td className="py-3 px-3 text-right text-white tabular-nums">{item.actualStock}</td>
                      <td className="py-3 px-3 text-right text-[#54A7FF] tabular-nums font-semibold">
                        {item.expectedStockFromLedger}
                      </td>
                      <td className="py-3 px-3 text-right tabular-nums">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            item.discrepancy > 0
                              ? "bg-[#FF791B]/15 text-[#FF791B] border border-[#FF791B]/30"
                              : "bg-[#FF453A]/15 text-[#FF453A] border border-[#FF453A]/30"
                          }`}
                        >
                          {item.discrepancy > 0 ? `+${item.discrepancy}` : item.discrepancy}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-sans">
                        <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-[#FF453A]/10 text-[#FF453A] border border-[#FF453A]/20">
                          Shortage / Surplus
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      {/* CUSTOMER KHATA DRIFT SECTION */}
      {(activeTab === "all" || activeTab === "customers") &&
        (data?.customers?.discrepancyCount || 0) > 0 && (
          <div className="apple-glass-card overflow-hidden">
            <div className="px-4 py-3 border-b border-[#D2D2D7]/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#30D158]" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Customer Khata Debt Discrepancies ({filteredCustomerDiscrepancies.length})
                </h3>
              </div>
              <button
                onClick={() => openConfirmModal("customers")}
                disabled={fixingModule === "customers"}
                className="apple-btn-primary text-[11px] py-1 px-3 shadow-none flex items-center gap-1.5"
              >
                <Wrench className="w-3 h-3" />
                <span>Reconcile Khata</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#D2D2D7]">
                <thead className="bg-[#1D1D1F]/60 text-[#6E6E73] uppercase tracking-wider text-[10px] border-b border-[#D2D2D7]/10 font-semibold">
                  <tr>
                    <th className="py-2.5 px-4">Customer Name</th>
                    <th className="py-2.5 px-3">Phone</th>
                    <th className="py-2.5 px-3 text-right">Stored Balance</th>
                    <th className="py-2.5 px-3 text-right">Authoritative Ledger</th>
                    <th className="py-2.5 px-3 text-right">Discrepancy Drift</th>
                    <th className="py-2.5 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D2D2D7]/5 font-mono">
                  {filteredCustomerDiscrepancies.map((item, idx) => (
                    <tr key={item.customerId || idx} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4 font-sans font-medium text-white">{item.customerName}</td>
                      <td className="py-3 px-3 text-[#6E6E73] text-[11px]">{item.customerPhone || "—"}</td>
                      <td className="py-3 px-3 text-right text-white tabular-nums">
                        ₹{Number(item.storedBalance || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-3 text-right text-[#30D158] tabular-nums font-semibold">
                        ₹{Number(item.authoritativeLedgerBalance || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-3 text-right tabular-nums">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            item.discrepancy > 0
                              ? "bg-[#FF791B]/15 text-[#FF791B] border border-[#FF791B]/30"
                              : "bg-[#FF453A]/15 text-[#FF453A] border border-[#FF453A]/30"
                          }`}
                        >
                          {item.discrepancy > 0 ? `+₹${item.discrepancy}` : `-₹${Math.abs(item.discrepancy)}`}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-sans">
                        <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-[#FF453A]/10 text-[#FF453A] border border-[#FF453A]/20">
                          Balance Drift
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      {/* SUPPLIER PAYABLES DRIFT SECTION */}
      {(activeTab === "all" || activeTab === "suppliers") &&
        (data?.suppliers?.discrepancyCount || 0) > 0 && (
          <div className="apple-glass-card overflow-hidden">
            <div className="px-4 py-3 border-b border-[#D2D2D7]/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#FF791B]" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Supplier Payables Discrepancies ({filteredSupplierDiscrepancies.length})
                </h3>
              </div>
              <button
                onClick={() => openConfirmModal("suppliers")}
                disabled={fixingModule === "suppliers"}
                className="apple-btn-primary text-[11px] py-1 px-3 shadow-none flex items-center gap-1.5"
              >
                <Wrench className="w-3 h-3" />
                <span>Reconcile Payables</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#D2D2D7]">
                <thead className="bg-[#1D1D1F]/60 text-[#6E6E73] uppercase tracking-wider text-[10px] border-b border-[#D2D2D7]/10 font-semibold">
                  <tr>
                    <th className="py-2.5 px-4">Supplier Company</th>
                    <th className="py-2.5 px-3">Phone</th>
                    <th className="py-2.5 px-3 text-right">Stored Payable</th>
                    <th className="py-2.5 px-3 text-right">Authoritative Ledger</th>
                    <th className="py-2.5 px-3 text-right">Discrepancy Drift</th>
                    <th className="py-2.5 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D2D2D7]/5 font-mono">
                  {filteredSupplierDiscrepancies.map((item, idx) => (
                    <tr key={item.supplierId || idx} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4 font-sans font-medium text-white">{item.supplierCompany}</td>
                      <td className="py-3 px-3 text-[#6E6E73] text-[11px]">{item.supplierPhone || "—"}</td>
                      <td className="py-3 px-3 text-right text-white tabular-nums">
                        ₹{Number(item.storedPayable || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-3 text-right text-[#FF791B] tabular-nums font-semibold">
                        ₹{Number(item.authoritativeLedgerPayable || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-3 text-right tabular-nums">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            item.discrepancy > 0
                              ? "bg-[#FF791B]/15 text-[#FF791B] border border-[#FF791B]/30"
                              : "bg-[#FF453A]/15 text-[#FF453A] border border-[#FF453A]/30"
                          }`}
                        >
                          {item.discrepancy > 0 ? `+₹${item.discrepancy}` : `-₹${Math.abs(item.discrepancy)}`}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-sans">
                        <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-[#FF453A]/10 text-[#FF453A] border border-[#FF453A]/20">
                          Payable Drift
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      {/* 6. CONFIRMATION MODAL */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="apple-glass-card max-w-md w-full p-5 border border-[#D2D2D7]/20 shadow-2xl animate-modal-pop">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-[#B64400]/20 border border-[#B64400]/40 flex items-center justify-center text-[#FF791B] shrink-0">
                <Wrench className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">{confirmModal.title}</h3>
                <p className="text-[11px] text-[#6E6E73]">Mathematical Parity Synchronization</p>
              </div>
            </div>

            <p className="text-xs text-[#D2D2D7]/85 leading-relaxed mb-5">
              {confirmModal.description}
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                onClick={() => setConfirmModal({ isOpen: false, module: null, title: "", description: "" })}
                className="apple-btn-secondary text-xs py-2 px-4 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleExecuteFix(confirmModal.module)}
                className="text-xs py-2 px-4 rounded-full font-semibold bg-[#0066CC] hover:bg-[#0077ED] text-white shadow-[0_2px_12px_rgba(0,102,204,0.35)] cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Confirm & Reconcile</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
