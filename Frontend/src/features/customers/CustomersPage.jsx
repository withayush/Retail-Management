import { useState, useEffect } from "react";
import { getCustomers } from "../../services/customer.api";
import { Users, Plus } from "lucide-react";

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCustomers()
      .then((res) => setCustomers(res.data?.customers || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Customers & Khata</h1>
          <p className="text-sm text-muted-foreground">Manage customer accounts, outstanding balances, and credit ledger</p>
        </div>
        <button className="btn btn-primary">
          <Plus className="w-4 h-4" />
          Add Customer
        </button>
      </div>

      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Outstanding Balance</th>
              <th>Credit Limit</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="text-center py-8 text-muted-foreground">
                  Loading customers...
                </td>
              </tr>
            ) : customers.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-8 text-muted-foreground">
                  No customers registered yet.
                </td>
              </tr>
            ) : (
              customers.map((c) => (
                <tr key={c.id}>
                  <td className="font-medium">{c.name}</td>
                  <td>{c.phone}</td>
                  <td className="text-destructive font-semibold">₹{c.outstandingBalance || 0}</td>
                  <td>₹{c.creditLimit || 0}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
