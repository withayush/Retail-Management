import { useState, useEffect } from "react";
import { getInventorySummary } from "../../services/inventory.api";
import { Boxes, ArrowDownRight, ArrowUpRight, RefreshCw } from "lucide-react";

export default function InventoryAuditPage() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getInventorySummary()
      .then((res) => setSummary(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Inventory & Ledger Audit</h1>
          <p className="text-sm text-muted-foreground">Track real-time stock levels, stock movement, and reconciliation logs</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-secondary">
            <ArrowDownRight className="w-4 h-4" />
            Stock In
          </button>
          <button className="btn btn-secondary">
            <ArrowUpRight className="w-4 h-4" />
            Stock Out
          </button>
          <button className="btn btn-primary">
            <RefreshCw className="w-4 h-4" />
            Adjust Stock
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <p className="text-xs uppercase text-muted-foreground font-semibold">Total SKUs</p>
          <p className="text-2xl font-bold mt-1">{summary?.totalProducts || 0}</p>
        </div>
        <div className="card">
          <p className="text-xs uppercase text-muted-foreground font-semibold">Low Stock Items</p>
          <p className="text-2xl font-bold mt-1 text-yellow-500">{summary?.lowStockCount || 0}</p>
        </div>
        <div className="card">
          <p className="text-xs uppercase text-muted-foreground font-semibold">Total Valuation</p>
          <p className="text-2xl font-bold mt-1">₹{summary?.totalValuation || 0}</p>
        </div>
      </div>
    </div>
  );
}
