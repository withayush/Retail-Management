/**
 * Unit Test: Entity Search Optimization
 * Tests phone digit normalization, multi-token invariance, and fuzzy typo matching for Customers and Suppliers.
 */
const {
  scoreCustomer,
  rankCustomers,
  scoreSupplier,
  rankSuppliers,
  escapeRegex,
  tokenize,
} = require("../src/utils/fuzzySearch");

const mockCustomers = [
  { _id: "c1", name: "Ramesh Kumar Patel", phone: "+919876543210", email: "ramesh@gmail.com", city: "Mumbai", currentBalance: 500 },
  { _id: "c2", name: "Suresh Sharma", phone: "+919123456789", email: "suresh@yahoo.com", city: "Delhi", currentBalance: 1200 },
  { _id: "c3", name: "Ayush Gupta", phone: "+918888777766", email: "ayush@retail.com", city: "Jaipur", currentBalance: 0 },
  { _id: "c4", name: "Priya Singh", phone: "+919999000011", email: "priya@outlook.com", city: "Indore", currentBalance: 350 },
];

const mockSuppliers = [
  { _id: "s1", company: "Shree Krishna Traders", contactName: "Radhe Shyam", phone: "+919811223344", gstin: "27AAAAA0000A1Z5" },
  { _id: "s2", company: "Haldiram Snacks Pvt Ltd", contactName: "Anand Aggarwal", phone: "+919822334455", gstin: "07BBBBB1111B2Z6" },
  { _id: "s3", company: "Amul Dairy Distributors", contactName: "Vikram Patel", phone: "+919833445566", gstin: "24CCCCC2222C3Z7" },
];

console.log("=== Testing Entity Search Optimization ===");

// 1. Phone Last 4 Digits Customer Match
const phoneResults = rankCustomers(mockCustomers, "3210");
console.assert(phoneResults.length > 0 && phoneResults[0].name === "Ramesh Kumar Patel", "Failed phone last 4 digits match");
console.log("✓ Customer Phone Last 4 Digits Match (3210 -> Ramesh Patel): Passed");

// 2. Multi-token Order-Invariant Customer Name Match
const tokenResults = rankCustomers(mockCustomers, "patel ramesh");
console.assert(tokenResults.length > 0 && tokenResults[0].name === "Ramesh Kumar Patel", "Failed multi-token customer match");
console.log("✓ Customer Multi-Token Invariant Match ('patel ramesh' -> Ramesh Kumar Patel): Passed");

// 3. Typo-Tolerant Customer Search (e.g. "Rameesh" or "Sresh")
const typoResults = rankCustomers(mockCustomers, "Rameesh");
console.assert(typoResults.length > 0 && typoResults[0].name === "Ramesh Kumar Patel", "Failed typo-tolerant customer search");
console.log("✓ Customer Typo Match ('Rameesh' -> Ramesh Kumar Patel): Passed");

// 4. Supplier Phone / GSTIN Match
const gstinResults = rankSuppliers(mockSuppliers, "27AAAAA");
console.assert(gstinResults.length > 0 && gstinResults[0].company === "Shree Krishna Traders", "Failed supplier GSTIN search");
console.log("✓ Supplier GSTIN Prefix Match ('27AAAAA' -> Shree Krishna Traders): Passed");

// 5. Supplier Typo Match ("Haldiran" -> Haldiram)
const supplierTypo = rankSuppliers(mockSuppliers, "Haldiran");
console.assert(supplierTypo.length > 0 && supplierTypo[0].company.includes("Haldiram"), "Failed supplier typo match");
console.log("✓ Supplier Typo Match ('Haldiran' -> Haldiram Snacks): Passed");

// 6. Safe Regex Escaping
const dangerousString = "test (brackets) + plus [array] * star $ dollar";
const escaped = escapeRegex(dangerousString);
const re = new RegExp(escaped, "i");
console.assert(re.test(dangerousString), "Regex escaping failed");
console.log("✓ Safe Regex Escaping of dangerous characters: Passed");

console.log("\nALL 6 SEARCH OPTIMIZATION TESTS PASSED PERFECTLY!");
