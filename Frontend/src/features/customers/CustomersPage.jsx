import React, { useState, useEffect } from "react";
import { getCustomers } from "../../services/customer.api";
import CustomersHeader from "./components/CustomersHeader";
import CustomersTable from "./components/CustomersTable";

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCustomers()
      .then((res) => setCustomers(res.data?.customers || res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 md:p-8 space-y-6 w-full">
      <CustomersHeader onAddCustomer={() => {}} />
      <CustomersTable loading={loading} customers={customers} />
    </div>
  );
}
