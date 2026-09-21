import React, { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { getCustomers, createCustomer, updateCustomer } from "../../services/customer.api";

// Modular Sub-Components
import CustomerHeader from "./components/CustomerHeader";
import CustomerStats from "./components/CustomerStats";
import CustomerTable from "./components/CustomerTable";
import CustomerFormModal from "./components/CustomerFormModal";

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchCustomersList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getCustomers(searchTerm.trim());
      const list = res.data?.customers || res.data || [];
      setCustomers(list);
    } catch (err) {
      console.error("Failed to load customers:", err);
      toast.error("Failed to load customers list.");
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    fetchCustomersList();
  }, [fetchCustomersList]);

  const handleOpenAdd = () => {
    setSelectedCustomer(null);
    setShowModal(true);
  };

  const handleOpenEdit = (customer) => {
    setSelectedCustomer(customer);
    setShowModal(true);
  };

  const handleFormSubmit = async (formData) => {
    setSubmitting(true);
    try {
      if (selectedCustomer) {
        const id = selectedCustomer.id || selectedCustomer._id;
        await updateCustomer(id, formData);
        toast.success("Customer profile updated successfully.");
      } else {
        await createCustomer(formData);
        toast.success("Customer registered successfully.");
      }
      setShowModal(false);
      fetchCustomersList();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save customer.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto min-h-screen bg-background text-foreground">
      {/* 1. Header */}
      <CustomerHeader
        onOpenAddModal={handleOpenAdd}
        onRefresh={fetchCustomersList}
        loading={loading}
      />

      {/* 2. KPI Summary Strip */}
      <CustomerStats customers={customers} loading={loading} />

      {/* 3. Customer Directory Table */}
      <CustomerTable
        customers={customers}
        loading={loading}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onEditCustomer={handleOpenEdit}
      />

      {/* 4. Form Modal */}
      <CustomerFormModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        customer={selectedCustomer}
        onSubmit={handleFormSubmit}
        submitting={submitting}
      />
    </div>
  );
}
