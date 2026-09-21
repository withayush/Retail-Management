import React, { useState, useEffect } from "react";
import { History, X, RefreshCw, Boxes } from "lucide-react";
import { getInventoryLedger } from "../../../services/inventory.api";

export default function LedgerInspectorModal({
  isOpen,
  onClose,
  product,
}) {
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    if (!isOpen || !product) return;

    const loadProductLedger = async () => {
      setLoading(true);
      try {
        const prodId = product.productId || product.id || product._id;
        const res = await getInventoryLedger({ productId: prodId, limit: 50 });
        const list = res.data || res.entries || [];
        setEntries(list);
      } catch (err) {
        console.error("Failed to load product ledger:", err);
      } finally {
        setLoading(false);
      }
    };

    loadProductLedger();
  }, [isOpen, product]);

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl animate-in fade-in-50 zoom-in-95 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-secondary/30">
          <div className="flex items-center gap-2 text-primary">
            <History className="w-4 h-4" />
            <div>
              <h3 className="font-bold text-sm text-foreground">
                Movement Audit Trail: {product.name || product.productName}
              </h3>
              <p className="text-[11px] text-muted-foreground font-mono">
                SKU: {product.sku || "N/A"} • Available Stock: {product.availableStock} {product.unit || "pcs"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Table */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="py-16 text-center text-xs text-muted-foreground">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
              Loading product movement trail...
            </div>
          ) : entries.length === 0 ? (
            <div className="py-16 text-center text-xs text-muted-foreground space-y-2">
              <Boxes className="w-8 h-8 opacity-40 mx-auto" />
              <p className="font-semibold text-foreground">No Movement Logs Found</p>
              <p>No transactions logged yet for this specific product.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border text-[11px] font-bold text-muted-foreground uppercase">
                  <th className="py-2.5 px-3">Date & Time</th>
                  <th className="py-2.5 px-3 text-center">Type</th>
                  <th className="py-2.5 px-3 text-center">Qty Change</th>
                  <th className="py-2.5 px-3 text-center">Balance After</th>
                  <th className="py-2.5 px-3">Reason / Ref</th>
                  <th className="py-2.5 px-3">Actor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {entries.map((entry) => {
                  const isPositive = entry.qtyChange > 0;
                  return (
                    <tr key={entry._id || entry.id} className="hover:bg-secondary/30">
                      <td className="py-2.5 px-3 font-mono text-[11px] text-muted-foreground">
                        {new Date(entry.createdAt).toLocaleString("en-IN")}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            entry.type === "IN"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : entry.type === "OUT"
                              ? "bg-destructive/10 text-destructive border-destructive/20"
                              : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          }`}
                        >
                          {entry.type}
                        </span>
                      </td>
                      <td
                        className={`py-2.5 px-3 text-center font-mono font-bold ${
                          isPositive
                            ? "text-emerald-400"
                            : entry.qtyChange === 0
                            ? "text-muted-foreground"
                            : "text-destructive"
                        }`}
                      >
                        {isPositive ? `+${entry.qtyChange}` : entry.qtyChange}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-semibold text-foreground">
                        {entry.balanceAfter}
                      </td>
                      <td className="py-2.5 px-3 text-foreground truncate max-w-[180px]">
                        {entry.reason || entry.source}
                        {entry.referenceNumber && ` (#${entry.referenceNumber})`}
                      </td>
                      <td className="py-2.5 px-3 text-muted-foreground truncate max-w-[120px]">
                        {entry.createdByName || entry.createdBy?.fullName || "System"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-border bg-secondary/20 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-border text-xs font-semibold hover:bg-secondary cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
