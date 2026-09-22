import toast from "react-hot-toast";

/**
 * Export filtered ledger entries as CSV file
 */
export function exportLedgerToCSV(ledgerEntries) {
  if (!ledgerEntries || ledgerEntries.length === 0) {
    toast.error("No ledger entries to export.");
    return false;
  }

  const headers = [
    "Timestamp",
    "Product Name",
    "SKU",
    "Movement Type",
    "Source",
    "Qty Change",
    "Balance After",
    "Reference #",
    "Reason",
    "Supplier / Customer",
    "Unit Cost (₹)",
    "Performed By",
    "Notes",
  ];

  const rows = ledgerEntries.map((log) => [
    `"${new Date(log.createdAt).toLocaleString("en-IN")}"`,
    `"${log.productId?.name || "Unknown"}"`,
    `"${log.productId?.sku || ""}"`,
    `"${log.type || ""}"`,
    `"${log.source || ""}"`,
    log.qtyChange,
    log.balanceAfter,
    `"${log.referenceNumber || ""}"`,
    `"${log.reason || ""}"`,
    `"${log.supplierName || ""}"`,
    log.unitCost !== null && log.unitCost !== undefined ? log.unitCost : "",
    `"${log.createdByName || log.createdBy?.fullName || "System"}"`,
    `"${log.notes || ""}"`,
  ]);

  const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `vendoros-inventory-ledger-audit-${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  toast.success("Exported inventory audit ledger CSV statement!");
  return true;
}
