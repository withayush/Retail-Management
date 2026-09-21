import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Receipt, RefreshCw } from "lucide-react";

export default function POSHeader({ loading = false, onRefresh }) {
  const navigate = useNavigate();

  return (
    <div className="p-4 border-b border-border bg-card flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/dashboard")}
          className="p-2 rounded-xl border border-border hover:bg-secondary text-muted-foreground hover:text-foreground transition-all cursor-pointer"
          title="Return to Dashboard"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-lg font-bold flex items-center gap-2 text-foreground">
            <Receipt className="w-5 h-5 text-primary" /> POS Billing Terminal
          </h1>
          <p className="text-xs text-muted-foreground">
            Rapid Checkout & Barcode Scanner
          </p>
        </div>
      </div>

      <button
        onClick={onRefresh}
        className="p-2 rounded-xl border border-border hover:bg-secondary text-muted-foreground hover:text-foreground transition-all cursor-pointer flex items-center gap-1.5 text-xs font-medium"
        title="Refresh Catalog"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
        <span className="hidden sm:inline">Refresh</span>
      </button>
    </div>
  );
}
