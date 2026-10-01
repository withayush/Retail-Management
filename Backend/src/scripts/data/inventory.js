const categoryStockDefaults = {
  "dairy & milk": {
    openingStock: 45,
    reorderLevel: 15,
  },
  "biscuits & snacks": {
    openingStock: 60,
    reorderLevel: 20,
  },
  "rice & grains": {
    openingStock: 35,
    reorderLevel: 10,
  },
  "pulses & lentils": {
    openingStock: 40,
    reorderLevel: 12,
  },
  "cooking oil": {
    openingStock: 50,
    reorderLevel: 15,
  },
  "spices & masala": {
    openingStock: 55,
    reorderLevel: 15,
  },
  "beverages": {
    openingStock: 65,
    reorderLevel: 20,
  },
  "personal care": {
    openingStock: 40,
    reorderLevel: 10,
  },
  "home care": {
    openingStock: 45,
    reorderLevel: 12,
  },
  "fruits & vegetables": {
    openingStock: 30,
    reorderLevel: 8,
  },
};

// Sample inventory physical audit discrepancies to test stock adjustments & alerts
const auditAdjustments = [
  {
    skuMatch: "MILK-AMUL-TAZA-500",
    adjustmentQty: -3,
    source: "DAMAGE",
    reason: "Damaged during morning delivery crate unloading",
  },
  {
    skuMatch: "BISC-PARLE-G-800",
    adjustmentQty: -2,
    source: "THEFT_SHRINKAGE",
    reason: "Missing from shelf during physical floor count",
  },
  {
    skuMatch: "BEV-COKE-750",
    adjustmentQty: 5,
    source: "FOUND_STOCK",
    reason: "Unrecorded backroom carton discovered during stocktake",
  },
  {
    skuMatch: "OIL-FORTUNE-SUN-1L",
    adjustmentQty: -1,
    source: "SPILLAGE",
    reason: "Leaking bottle seal in warehouse aisle",
  },
];

module.exports = {
  categoryStockDefaults,
  auditAdjustments,
};
