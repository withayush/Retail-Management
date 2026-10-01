import React, { useState, useEffect, useCallback } from "react";
import {
  Truck,
  Plus,
  RefreshCw,
  Search,
  Filter,
  Wallet,
  ShoppingBag,
  PackageCheck,
} from "lucide-react";
import {
  getSuppliers,
  getSupplierSummary,
  archiveSupplier,
  restoreSupplier,
} from "../../services/supplier.api";
import toast from "react-hot-toast";

// Sub-components
import SupplierStatsCards from "./components/SupplierStatsCards";
import SuppliersTable from "./components/SuppliersTable";
import AddSupplierModal from "./components/AddSupplierModal";
import EditSupplierModal from "./components/EditSupplierModal";
import SupplierLedgerModal from "./components/SupplierLedgerModal";
import SettleSupplierModal from "./components/SettleSupplierModal";
import OutstandingPayablesModal from "./components/OutstandingPayablesModal";
import Supplier360Modal from "./components/Supplier360Modal";
import CreatePurchaseOrderModal from "./components/CreatePurchaseOrderModal";
import PurchaseOrdersListModal from "./components/PurchaseOrdersListModal";
import GoodsReceivedNotesModal from "./components/GoodsReceivedNotesModal";

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL"); // "ALL" | "ACTIVE" | "INACTIVE"
  const [balanceFilter, setBalanceFilter] = useState("ALL"); // "ALL" | "BALANCE_ONLY"

  // Modals State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLedgerModalOpen, setIsLedgerModalOpen] = useState(false);
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [isPayablesModalOpen, setIsPayablesModalOpen] = useState(false);
  const [is360ModalOpen, setIs360ModalOpen] = useState(false);
  const [isCreatePOModalOpen, setIsCreatePOModalOpen] = useState(false);
  const [isPOListModalOpen, setIsPOListModalOpen] = useState(false);
  const [isGRNModalOpen, setIsGRNModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [supplierForPO, setSupplierForPO] = useState(null);



  // Load Suppliers & KPI Summary
  const loadSuppliersData = useCallback(async () => {
    setLoading(true);
    try {
      const filters = {};
      if (statusFilter !== "ALL") filters.status = statusFilter;
      if (balanceFilter === "BALANCE_ONLY") filters.hasBalance = true;

      const [suppliersRes, summaryRes] = await Promise.all([
        getSuppliers(searchTerm, filters),
        getSupplierSummary().catch(() => null),
      ]);

      const list = suppliersRes.data || suppliersRes.suppliers || [];
      setSuppliers(list);
      if (summaryRes) {
        setSummary(summaryRes.data || summaryRes);
      }
    } catch (err) {
      console.error("Failed to load suppliers:", err);
      toast.error("Failed to load suppliers list.");
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, balanceFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadSuppliersData();
    }, 250);
    return () => clearTimeout(timer);
  }, [loadSuppliersData]);

  // Handlers
  const handleEditSupplier = (supplier) => {
    setSelectedSupplier(supplier);
    setIsEditModalOpen(true);
  };

  const handleView360 = (supplier) => {
    setSelectedSupplier(supplier);
    setIs360ModalOpen(true);
  };

  const handleCreatePO = (supplier = null) => {
    setSupplierForPO(supplier);
    setIsCreatePOModalOpen(true);
  };

  const handleViewPOs = (supplier = null) => {
    setSupplierForPO(supplier);
    setIsPOListModalOpen(true);
  };

  const handleViewLedger = (supplier) => {
    setSelectedSupplier(supplier);
    setIsLedgerModalOpen(true);
  };

  const handleSettlePayment = (supplier) => {
    setSelectedSupplier(supplier);
    setIsSettleModalOpen(true);
  };

  const handleArchiveSupplier = async (supplier) => {
    if (!window.confirm(`Are you sure you want to archive supplier "${supplier.company}"?`)) {
      return;
    }
    try {
      await archiveSupplier(supplier._id);
      toast.success(`Supplier "${supplier.company}" archived.`);
      loadSuppliersData();
    } catch (err) {
      console.error("Archive supplier error:", err);
      toast.error(err.response?.data?.message || "Failed to archive supplier.");
    }
  };

  const handleRestoreSupplier = async (supplier) => {
    try {
      await restoreSupplier(supplier._id);
      toast.success(`Supplier "${supplier.company}" restored to active.`);
      loadSuppliersData();
    } catch (err) {
      console.error("Restore supplier error:", err);
      toast.error(err.response?.data?.message || "Failed to restore supplier.");
    }
  };

  return (
    <div className="w-full p-6 md:p-8 space-y-6 min-h-[calc(100vh-4rem)]">
      {/* ── Page Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              Suppliers & Vendors
            </h1>
            {/* <span className="text-xs bg-blue-500/10 text-blue-400 font-mono px-2 py-0.5 rounded-full border border-blue-500/20 font-semibold">
              T39 
            </span> */}
            {/* <span className="text-xs bg-amber-500/10 text-amber-400 font-mono px-2 py-0.5 rounded-full border border-amber-500/20 font-semibold">
              T40 Indexer
            </span> */}
            {/* <span className="text-xs bg-violet-500/10 text-violet-400 font-mono px-2 py-0.5 rounded-full border border-violet-500/20 font-semibold">
              T41 360°
            </span> */}
            {/* <span className="text-xs bg-emerald-500/10 text-emerald-400 font-mono px-2 py-0.5 rounded-full border border-emerald-500/20 font-semibold">
              T42 PO
            </span>
            <span className="text-xs bg-emerald-500/10 text-emerald-400 font-mono px-2 py-0.5 rounded-full border border-emerald-500/20 font-semibold">
              T44 GRN
            </span> */}
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Supplier Management Center — procurement orders, physical GRN receipts, vendor profiles, ledger statements, and accounts payable
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Goods Received Notes (GRN) Modal Button (T44) */}
          <button
            onClick={() => setIsGRNModalOpen(true)}
            className="px-3.5 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
            title="Open Goods Received Notes (GRN) Master Log (T44)"
          >
            <PackageCheck className="w-4 h-4" />
            Goods Receipts (GRN)
          </button>

          {/* Purchase Orders Modal Button (T42) */}
          <button
            onClick={() => handleViewPOs(null)}
            className="px-3.5 py-2.5 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/30 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
            title="Open Purchase Orders Manager (T42)"
          >
            <ShoppingBag className="w-4 h-4" />
            Purchase Orders
          </button>

          <button
            onClick={() => setIsPayablesModalOpen(true)}
            className="px-3.5 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
            title="Open Outstanding Payables Indexer (T40)"
          >
            <Wallet className="w-4 h-4" />
            Payables Indexer
            {(summary?.totalPayableOutstanding || 0) > 0 && (
              <span className="bg-amber-500 text-zinc-950 font-mono text-[10px] px-1.5 py-0.2 rounded-full font-extrabold">
                ₹{Math.round(summary.totalPayableOutstanding).toLocaleString()}
              </span>
            )}
          </button>

          <button
            onClick={loadSuppliersData}
            disabled={loading}
            className="p-2.5 rounded-xl bg-[#18181b] hover:bg-zinc-800 text-zinc-400 hover:text-white border border-[#27272a] transition-all disabled:opacity-50 cursor-pointer"
            title="Refresh directory"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-blue-400" : ""}`} />
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-md shadow-blue-600/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Supplier
          </button>
        </div>
      </div>

      {/* ── KPI Stats Cards ─────────────────────────────────────────── */}
      <SupplierStatsCards
        summary={summary}
        loading={loading}
        onOpenPayables={() => setIsPayablesModalOpen(true)}
      />

      {/* ── Search & Filter Toolbar ─────────────────────────────────── */}
      <div className="bg-[#121214] border border-[#27272a] rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-3 shadow-sm">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by company, contact, phone, GST..."
            className="w-full bg-[#18181b] border border-[#27272a] focus:border-blue-500 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-zinc-500 outline-none transition-colors"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <div className="flex items-center gap-1.5 bg-[#18181b] border border-[#27272a] rounded-xl p-1 text-xs text-zinc-400 shrink-0">
            <Filter className="w-3.5 h-3.5 ml-2 text-zinc-400" />
            <button
              onClick={() => setStatusFilter("ALL")}
              className={`px-2.5 py-1 rounded-lg transition-colors text-xs font-medium cursor-pointer ${
                statusFilter === "ALL"
                  ? "bg-zinc-800 text-white font-semibold"
                  : "hover:text-zinc-200"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter("ACTIVE")}
              className={`px-2.5 py-1 rounded-lg transition-colors text-xs font-medium cursor-pointer ${
                statusFilter === "ACTIVE"
                  ? "bg-emerald-500/20 text-emerald-300 font-semibold"
                  : "hover:text-zinc-200"
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setStatusFilter("INACTIVE")}
              className={`px-2.5 py-1 rounded-lg transition-colors text-xs font-medium cursor-pointer ${
                statusFilter === "INACTIVE"
                  ? "bg-zinc-800 text-zinc-300 font-semibold"
                  : "hover:text-zinc-200"
              }`}
            >
              Archived
            </button>
          </div>

          <button
            onClick={() =>
              setBalanceFilter((prev) => (prev === "ALL" ? "BALANCE_ONLY" : "ALL"))
            }
            className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-all shrink-0 cursor-pointer ${
              balanceFilter === "BALANCE_ONLY"
                ? "bg-amber-500/10 border-amber-500/30 text-amber-400 font-semibold"
                : "bg-[#18181b] border-[#27272a] text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Has Payable Due
          </button>
        </div>
      </div>

      {/* ── Suppliers Directory Table ───────────────────────────────── */}
      <SuppliersTable
        suppliers={suppliers}
        loading={loading}
        onEditSupplier={handleEditSupplier}
        onArchiveSupplier={handleArchiveSupplier}
        onRestoreSupplier={handleRestoreSupplier}
        onViewLedger={handleViewLedger}
        onSettlePayment={handleSettlePayment}
        onView360={handleView360}
        onCreatePO={handleCreatePO}
      />

      {/* ── Modals ──────────────────────────────────────────────────── */}
      <AddSupplierModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSupplierAdded={() => loadSuppliersData()}
      />

      <EditSupplierModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        supplier={selectedSupplier}
        onSupplierUpdated={() => loadSuppliersData()}
      />

      <Supplier360Modal
        isOpen={is360ModalOpen}
        onClose={() => setIs360ModalOpen(false)}
        supplier={selectedSupplier}
        onEditSupplier={handleEditSupplier}
        onViewLedger={handleViewLedger}
        onDisbursePayment={handleSettlePayment}
        onCreatePO={handleCreatePO}
      />

      <SupplierLedgerModal
        isOpen={isLedgerModalOpen}
        onClose={() => setIsLedgerModalOpen(false)}
        supplier={selectedSupplier}
        onSettlePayment={handleSettlePayment}
      />

      <SettleSupplierModal
        isOpen={isSettleModalOpen}
        onClose={() => setIsSettleModalOpen(false)}
        supplier={selectedSupplier}
        onSuccess={() => loadSuppliersData()}
      />

      <OutstandingPayablesModal
        isOpen={isPayablesModalOpen}
        onClose={() => setIsPayablesModalOpen(false)}
        onOpenLedger={handleViewLedger}
        onDisbursePayment={handleSettlePayment}
      />

      {/* Phase 7 - Task T42: Purchase Order Modals */}
      <CreatePurchaseOrderModal
        isOpen={isCreatePOModalOpen}
        onClose={() => setIsCreatePOModalOpen(false)}
        preselectedSupplier={supplierForPO}
        onPOCreated={() => {
          loadSuppliersData();
        }}
      />

      <PurchaseOrdersListModal
        isOpen={isPOListModalOpen}
        onClose={() => setIsPOListModalOpen(false)}
        supplier={supplierForPO}
        onCreateNewPO={handleCreatePO}
      />

      {/* Phase 7 - Task T44: Goods Received Notes Modal */}
      <GoodsReceivedNotesModal
        isOpen={isGRNModalOpen}
        onClose={() => setIsGRNModalOpen(false)}
      />
    </div>
  );
}



