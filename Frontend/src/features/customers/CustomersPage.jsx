import React, { useState, useEffect, useCallback } from "react";
import { getCustomers, getBusinessOutstandingTotals } from "../../services/customer.api";

// Sub-components
import CustomersHeader from "./components/CustomersHeader";
import CustomersStatsCards from "./components/CustomersStatsCards";
import CustomersFilters from "./components/CustomersFilters";
import CustomersTable from "./components/CustomersTable";
import AddCustomerModal from "./components/AddCustomerModal";
import CustomerLedgerModal from "./components/CustomerLedgerModal";
import SettleKhataModal from "./components/SettleKhataModal";

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [totals, setTotals] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [searchTerm, setSearchTerm] = useState("");
  const [debtFilter, setDebtFilter] = useState("ALL"); // "ALL" | "DEBT_ONLY"

  // Modals State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLedgerModalOpen, setIsLedgerModalOpen] = useState(false);
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Load Customers
  const loadCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const isDebtOnly = debtFilter === "DEBT_ONLY";
      const [custListRes, totalsRes] = await Promise.all([
        getCustomers(searchTerm),
        getBusinessOutstandingTotals().catch(() => null),
      ]);

      let list = custListRes.data?.customers || custListRes.data || [];
      if (isDebtOnly) {
        list = list.filter((c) => (c.currentBalance || c.outstandingBalance || 0) > 0);
      }

      setCustomers(list);
      if (totalsRes) {
        setTotals(totalsRes.data || totalsRes);
      }
    } catch (err) {
      console.error("Failed to load customers:", err);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, debtFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadCustomers();
    }, 250);
    return () => clearTimeout(timer);
  }, [loadCustomers]);

  // Handlers
  const handleViewLedger = (customer) => {
    setSelectedCustomer(customer);
    setIsLedgerModalOpen(true);
  };

  const handleSettlePayment = (customer) => {
    setSelectedCustomer(customer);
    setIsSettleModalOpen(true);
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full font-sans animate-fadeIn">
      {/* ── Page Header ─────────────────────────────────────────────── */}
      <CustomersHeader
        onAddCustomer={() => setIsAddModalOpen(true)}
        onRefresh={loadCustomers}
        loading={loading}
      />

      {/* ── Financial Stats Overview (Khata Overview) ──────────────── */}
      <CustomersStatsCards customers={customers} totals={totals} loading={loading} />

      {/* ── Filters & Search ────────────────────────────────────────── */}
      <CustomersFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        debtFilter={debtFilter}
        setDebtFilter={setDebtFilter}
        onRefresh={loadCustomers}
      />

      {/* ── Customer Directory & Khata Table ────────────────────────── */}
      <CustomersTable
        loading={loading}
        customers={customers}
        onViewLedger={handleViewLedger}
        onSettlePayment={handleSettlePayment}
      />

      {/* ── Add Customer Modal ──────────────────────────────────────── */}
      <AddCustomerModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => loadCustomers()}
      />

      {/* ── Customer Khata Ledger Statement Modal (Task T29) ───────── */}
      <CustomerLedgerModal
        isOpen={isLedgerModalOpen}
        onClose={() => {
          setIsLedgerModalOpen(false);
          setSelectedCustomer(null);
        }}
        customer={selectedCustomer}
        onSettlePayment={(cust) => {
          setIsLedgerModalOpen(false);
          handleSettlePayment(cust);
        }}
      />

      {/* ── Settle Khata Payment Modal ───────────────────────────────── */}
      <SettleKhataModal
        isOpen={isSettleModalOpen}
        onClose={() => {
          setIsSettleModalOpen(false);
          setSelectedCustomer(null);
        }}
        customer={selectedCustomer}
        onSuccess={() => loadCustomers()}
      />
    </div>
  );
}
