import React from "react";

export default function CustomersTable({ loading, customers }) {
  return (
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
              <tr key={c.id || c._id}>
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
  );
}
