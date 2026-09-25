import React, { useState, useEffect, useCallback } from "react";
import { getCustomers, getBusinessOutstandingTotals } from "../../services/customer.api";

// Sub-components
import CustomersHeader from "./components/CustomersHeader";
import CustomersStatsCards from "./components/CustomersStatsCards";
import CustomersFilters from "./components/CustomersFilters";
import CustomersTable from "./components/CustomersTable";
import AddCustomerModal from "./components/AddCustomerModal";
import EditCustomerModal from "./components/EditCustomerModal";
import CustomerLedgerModal from "./components/CustomerLedgerModal";
import CustomerPaymentHistoryModal from "./components/CustomerPaymentHistoryModal";
import CustomerCRMModal from "./components/CustomerCRMModal";
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
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCRMModalOpen, setIsCRMModalOpen] = useState(false);
  const [isLedgerModalOpen, setIsLedgerModalOpen] = useState(false);
  const [isPaymentHistoryModalOpen, setIsPaymentHistoryModalOpen] = useState(false);
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
  const handleViewProfile = (customer) => {
    setSelectedCustomer(customer);
    setIsCRMModalOpen(true);
  };

  const handleEditCustomer = (customer) => {
    setSelectedCustomer(customer);
    setIsEditModalOpen(true);
  };

  const handleViewLedger = (customer) => {
    setSelectedCustomer(customer);
    setIsLedgerModalOpen(true);
  };

  const handleViewPaymentHistory = (customer) => {
    setSelectedCustomer(customer);
    setIsPaymentHistoryModalOpen(true);
  };

  const handleSettlePayment = (customer) => {
    setSelectedCustomer(customer);
    setIsSettleModalOpen(true);
  };

  return (
    <div className="w-full p-6 md:p-8 space-y-6 min-h-[calc(100vh-4rem)]">
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
        onViewProfile={handleViewProfile}
        onEditCustomer={handleEditCustomer}
        onViewLedger={handleViewLedger}
        onViewPaymentHistory={handleViewPaymentHistory}
        onSettlePayment={handleSettlePayment}
      />

      {/* ── Add Customer Modal ──────────────────────────────────────── */}
      <AddCustomerModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => loadCustomers()}
      />

      {/* ── Edit Customer Modal (T32) ────────────────────────────────── */}
      <EditCustomerModal
        isOpen={isEditModalOpen}
        customer={selectedCustomer}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedCustomer(null);
        }}
        onSuccess={() => loadCustomers()}
      />

      {/* ── Customer 360° CRM & Profiling Modal (Task T36) ───────────── */}
      <CustomerCRMModal
        isOpen={isCRMModalOpen}
        onClose={() => {
          setIsCRMModalOpen(false);
          setSelectedCustomer(null);
        }}
        customer={selectedCustomer}
        onEditCustomer={(cust) => {
          setIsCRMModalOpen(false);
          handleEditCustomer(cust);
        }}
        onViewLedger={(cust) => {
          setIsCRMModalOpen(false);
          handleViewLedger(cust);
        }}
        onViewPaymentHistory={(cust) => {
          setIsCRMModalOpen(false);
          handleViewPaymentHistory(cust);
        }}
        onSettlePayment={(cust) => {
          setIsCRMModalOpen(false);
          handleSettlePayment(cust);
        }}
      />

      {/* ── Customer Khata Ledger Statement Modal (Task T33) ───────── */}
      <CustomerLedgerModal
        isOpen={isLedgerModalOpen}
        onClose={() => {
          setIsLedgerModalOpen(false);
          setSelectedCustomer(null);
        }}
        customer={selectedCustomer}
        onViewProfile={(cust) => {
          setIsLedgerModalOpen(false);
          handleViewProfile(cust);
        }}
        onViewPaymentHistory={(cust) => {
          setIsLedgerModalOpen(false);
          handleViewPaymentHistory(cust);
        }}
        onSettlePayment={(cust) => {
          setIsLedgerModalOpen(false);
          handleSettlePayment(cust);
        }}
      />

      {/* ── Customer Credit Payment History Modal (Task T35) ──────── */}
      <CustomerPaymentHistoryModal
        isOpen={isPaymentHistoryModalOpen}
        onClose={() => {
          setIsPaymentHistoryModalOpen(false);
          setSelectedCustomer(null);
        }}
        customer={selectedCustomer}
        onViewProfile={(cust) => {
          setIsPaymentHistoryModalOpen(false);
          handleViewProfile(cust);
        }}
        onSettlePayment={(cust) => {
          setIsPaymentHistoryModalOpen(false);
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
