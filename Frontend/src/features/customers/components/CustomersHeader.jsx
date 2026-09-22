import React from "react";
import { Plus } from "lucide-react";

export default function CustomersHeader({ onAddCustomer }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold">Customers & Khata</h1>
        <p className="text-sm text-muted-foreground">
          Manage customer accounts, outstanding balances, and credit ledger
        </p>
      </div>
      <button onClick={onAddCustomer} className="btn btn-primary cursor-pointer flex items-center gap-1.5">
        <Plus className="w-4 h-4" />
        <span>Add Customer</span>
      </button>
    </div>
  );
}
