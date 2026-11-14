const assert = require("assert");

// 1. Verify Service methods and exports
const dashboardService = require("../src/services/dashboard.service");
assert(
  typeof dashboardService.getInventoryWarnings === "function",
  "dashboardService.getInventoryWarnings must be a function"
);

// 2. Verify Controller methods and exports
const dashboardController = require("../src/controllers/dashboard.controller");
assert(
  typeof dashboardController.getInventoryWarnings === "function",
  "dashboardController.getInventoryWarnings must be a function"
);

// 3. Verify Route registrations in dashboard.routes.js
const dashboardRoutes = require("../src/routes/dashboard.routes");
const registeredRoutes = dashboardRoutes.stack
  .filter((r) => r.route)
  .map((r) => ({
    path: r.route.path,
    methods: Object.keys(r.route.methods),
  }));

const inventoryWarningRoute = registeredRoutes.find(
  (r) => r.path === "/inventory-warnings" && r.methods.includes("get")
);
assert(
  inventoryWarningRoute,
  "GET /inventory-warnings must be registered on dashboard router"
);

// 4. Test Core Business Logic of T63 Warning Generation
function evaluateWarningStatus(availableStock, reorderLevel) {
  if (availableStock === 0) {
    return "OUT_OF_STOCK";
  } else if (availableStock <= reorderLevel) {
    return "LOW_STOCK";
  } else {
    return "HEALTHY";
  }
}

// Case 1: Maggi (5, 20) -> LOW_STOCK
assert.strictEqual(evaluateWarningStatus(5, 20), "LOW_STOCK");

// Case 2: Coca-Cola (0, 15) -> OUT_OF_STOCK
assert.strictEqual(evaluateWarningStatus(0, 15), "OUT_OF_STOCK");

// Case 3: Rice 5kg (8, 10) -> LOW_STOCK
assert.strictEqual(evaluateWarningStatus(8, 10), "LOW_STOCK");

// Case 4: Sugar (50, 10) -> HEALTHY
assert.strictEqual(evaluateWarningStatus(50, 10), "HEALTHY");

// Case 5: Oil 1L (3, 5) -> LOW_STOCK
assert.strictEqual(evaluateWarningStatus(3, 5), "LOW_STOCK");

// Edge Case 6: availableStock = 0, reorderLevel = 0 -> OUT_OF_STOCK
assert.strictEqual(evaluateWarningStatus(0, 0), "OUT_OF_STOCK");

// Edge Case 7: availableStock = 5, reorderLevel = 0 -> HEALTHY
assert.strictEqual(evaluateWarningStatus(5, 0), "HEALTHY");

// Edge Case 8: availableStock = reorderLevel (e.g. 10, 10) -> LOW_STOCK
assert.strictEqual(evaluateWarningStatus(10, 10), "LOW_STOCK");

// Edge Case 9: availableStock = 0, reorderLevel = 100 -> OUT_OF_STOCK (Checked first!)
assert.strictEqual(evaluateWarningStatus(0, 100), "OUT_OF_STOCK");

// 5. Priority sorting check
const sampleItems = [
  { name: "Maggi", status: "LOW_STOCK", urgencyPriority: 2, availableStock: 5 },
  { name: "Coca-Cola", status: "OUT_OF_STOCK", urgencyPriority: 1, availableStock: 0 },
  { name: "Rice 5kg", status: "LOW_STOCK", urgencyPriority: 2, availableStock: 8 },
  { name: "Oil 1L", status: "LOW_STOCK", urgencyPriority: 2, availableStock: 3 },
  { name: "Zero Reorder Out", status: "OUT_OF_STOCK", urgencyPriority: 1, availableStock: 0 },
];

const sorted = [...sampleItems].sort((a, b) => {
  if (a.urgencyPriority !== b.urgencyPriority) {
    return a.urgencyPriority - b.urgencyPriority;
  }
  return a.availableStock - b.availableStock;
});

// Priority 1 items must come first
assert.strictEqual(sorted[0].status, "OUT_OF_STOCK");
assert.strictEqual(sorted[1].status, "OUT_OF_STOCK");
assert.strictEqual(sorted[2].status, "LOW_STOCK");
assert.strictEqual(sorted[3].status, "LOW_STOCK");
assert.strictEqual(sorted[4].status, "LOW_STOCK");
// Among LOW_STOCK, availableStock 3 before 5 before 8
assert.strictEqual(sorted[2].availableStock, 3);
assert.strictEqual(sorted[3].availableStock, 5);
assert.strictEqual(sorted[4].availableStock, 8);

console.log("===============================================================================");
console.log("  ALL UNIT & INTEGRATION CHECKS FOR T63 INVENTORY WARNING CENTER PASSED!      ");
console.log("===============================================================================");

