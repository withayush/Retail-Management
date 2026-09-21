/**
 * Phase 3 - Inventory & Ledger Domain Helpers & Constants
 */

export const MOVEMENT_TYPES = [
  { value: "ALL", label: "All" },
  { value: "IN", label: "Stock In (+)", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  { value: "OUT", label: "Stock Out (-)", color: "text-rose-400 bg-rose-500/10 border-rose-500/20" },
  { value: "ADJUST", label: "Adjustment (~)", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  { value: "OPENING", label: "Opening (*)", color: "text-sky-400 bg-sky-500/10 border-sky-500/20" },
  { value: "RETURN", label: "Return (<)", color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
];

export const STOCK_SOURCES = [
  { value: "ALL", label: "All Sources" },
  { value: "PURCHASE", label: "Purchase (Supplier)" },
  { value: "GOODS_RECEIPT", label: "Goods Receipt" },
  { value: "SALE", label: "Direct Sale" },
  { value: "POS_CHECKOUT", label: "POS Checkout" },
  { value: "AUDIT_RECONCILIATION", label: "Audit Reconciliation" },
  { value: "DAMAGE", label: "Damaged Stock" },
  { value: "EXPIRED", label: "Expired Stock" },
  { value: "SPILLAGE", label: "Spillage / Leakage" },
  { value: "THEFT_SHRINKAGE", label: "Theft / Shrinkage" },
  { value: "FOUND_STOCK", label: "Found Unrecorded Stock" },
  { value: "CORRECTION", label: "Count Correction" },
  { value: "RETURN_TO_VENDOR", label: "Return to Vendor" },
  { value: "INITIAL_OPENING", label: "Initial Opening Balance" },
  { value: "MANUAL", label: "Manual Adjustment" },
];

export const exportLedgerToCSV = (entries, fileName = "inventory-ledger-export.csv") => {
  if (!entries || entries.length === 0) return;

  const headers = [
    "Date & Time",
    "Product Name",
    "SKU",
    "Movement Type",
    "Qty Change",
    "Balance After",
    "Source",
    "Reference #",
    "Reason",
    "Performed By",
    "Notes",
  ];

  const rows = entries.map((e) => [
    `"${new Date(e.createdAt).toLocaleString("en-IN")}"`,
    `"${e.productId?.name || ""}"`,
    `"${e.productId?.sku || ""}"`,
    `"${e.type}"`,
    e.qtyChange,
    e.balanceAfter,
    `"${e.source || ""}"`,
    `"${e.referenceNumber || ""}"`,
    `"${(e.reason || "").replace(/"/g, '""')}"`,
    `"${e.createdByName || e.createdBy?.fullName || ""}"`,
    `"${(e.notes || "").replace(/"/g, '""')}"`,
  ]);

  const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
