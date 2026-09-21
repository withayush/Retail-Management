import React from "react";
import { Search, X, Users, Edit3 } from "lucide-react";

export default function CustomerTable({
  customers = [],
  loading = false,
  searchTerm = "",
  setSearchTerm,
  onEditCustomer,
}) {
  const filtered = customers.filter(
    (c) =>
      c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone?.includes(searchTerm)
  );

  return (
    <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col space-y-3">
      {/* Search Header */}
      <div className="p-4 border-b border-border flex items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by customer name or phone..."
            className="w-full bg-background border border-border rounded-xl pl-10 pr-8 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <span className="text-xs text-muted-foreground font-mono">
          {filtered.length} of {customers.length} customer{customers.length === 1 ? "" : "s"}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-border bg-secondary/40 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              <th className="py-3 px-4">Customer Name</th>
              <th className="py-3 px-4">Contact Phone</th>
              <th className="py-3 px-4 text-right">Outstanding Khata</th>
              <th className="py-3 px-4 text-right">Credit Limit</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-16 text-center text-muted-foreground">
                  Loading customers directory...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-16 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                    <Users className="w-10 h-10 opacity-40" />
                    <p className="font-semibold text-foreground text-sm">No Customers Found</p>
                    <p className="text-xs">No registered customer matches your search.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((c) => {
                const balance = Number(c.outstandingBalance || 0);
                const hasDebt = balance > 0;

                return (
                  <tr key={c.id || c._id} className="hover:bg-secondary/30 transition-colors">
                    {/* Name */}
                    <td className="py-3 px-4 align-middle font-bold text-foreground">
                      {c.name}
                    </td>

                    {/* Phone */}
                    <td className="py-3 px-4 align-middle font-mono text-muted-foreground">
                      {c.phone || "—"}
                    </td>

                    {/* Outstanding */}
                    <td className="py-3 px-4 text-right align-middle font-mono font-bold">
                      <span className={hasDebt ? "text-destructive" : "text-muted-foreground"}>
                        ₹{balance.toFixed(2)}
                      </span>
                    </td>

                    {/* Credit Limit */}
                    <td className="py-3 px-4 text-right align-middle font-mono text-muted-foreground">
                      ₹{Number(c.creditLimit || 0).toFixed(2)}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 text-center align-middle">
                      {hasDebt ? (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-destructive/10 text-destructive border border-destructive/20">
                          Due
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Clear
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right align-middle">
                      <button
                        onClick={() => onEditCustomer(c)}
                        className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-all cursor-pointer"
                        title="Edit Customer Details"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
