import toast from "react-hot-toast";

/**
 * Export sales ledger records to CSV
 */
export function exportSalesToCSV(sales) {
  if (!sales || sales.length === 0) {
    toast.error("No sale records to export.");
    return false;
  }

  const headers = [
    "Invoice #",
    "Timestamp",
    "Customer Name",
    "Customer Phone",
    "Subtotal (₹)",
    "Discount (₹)",
    "Tax (₹)",
    "Total (₹)",
    "Paid Amount (₹)",
    "Due Amount (₹)",
    "Payment Status",
    "Payment Mode",
    "Billed By",
    "Notes",
  ];

  const rows = sales.map((s) => [
    `"${s.invoiceNumber || ""}"`,
    `"${new Date(s.createdAt).toLocaleString("en-IN")}"`,
    `"${s.customerName || "Walk-in"}"`,
    `"${s.customerPhone || ""}"`,
    s.subtotal || 0,
    s.discount || 0,
    s.tax || 0,
    s.total || 0,
    s.paidAmount || 0,
    s.dueAmount || 0,
    `"${s.paymentStatus || ""}"`,
    `"${s.paymentMode || ""}"`,
    `"${s.createdByName || "Staff"}"`,
    `"${s.notes || ""}"`,
  ]);

  const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `vendoros-sales-ledger-${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  toast.success("Exported Sales Ledger CSV statement!");
  return true;
}
