export const fmt = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(n ?? 0);

export const margin = (cost, sell) => {
  if (!sell || sell <= 0) return "0.0";
  const numCost = parseFloat(cost) || 0;
  const numSell = parseFloat(sell) || 0;
  if (numSell <= 0) return "0.0";
  return (((numSell - numCost) / numSell) * 100).toFixed(1);
};

export const emptyForm = {
  name: "",
  sku: "",
  barcode: "",
  categoryName: "",
  sellingPrice: "",
  costPrice: "",
  unit: "pcs",
  openingStock: "",
  openingStockNotes: "",
};

export const inputCls =
  "w-full px-3.5 py-2.5 bg-background border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary/50 text-sm text-foreground placeholder:text-muted-foreground/50 transition-all";
