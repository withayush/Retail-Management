import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Users, Plus, RefreshCw } from "lucide-react";

export default function CustomerHeader({
  onOpenAddModal,
  onRefresh,
  loading = false,
}) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
            <Users className="w-5 h-5 text-primary" /> Customers & Khata Ledger
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage customer accounts, outstanding balances, and credit limits
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onRefresh}
          disabled={loading}
          className="p-2 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-neutral-800 transition-all cursor-pointer disabled:opacity-50"
          title="Refresh Data"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-primary" : ""}`} />
        </button>

        <button
          onClick={onOpenAddModal}
          className="btn btn-primary text-xs flex items-center gap-1.5 py-2 px-3.5 cursor-pointer shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add Customer</span>
        </button>
      </div>
    </div>
  );
}
