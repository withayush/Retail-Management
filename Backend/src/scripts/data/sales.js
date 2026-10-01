const sampleSalesTemplates = [
  // 1. Morning Dairy Walk-in (CASH)
  {
    customerName: "Walk-in Customer",
    customerPhone: "",
    paymentMode: "CASH",
    paymentStatus: "PAID",
    discount: 0,
    notes: "Counter cash sale - morning milk & curd",
    items: [
      { sku: "MILK-AMUL-TAZA-500", quantity: 2 },
      { sku: "CURD-AMUL-MASTI-400", quantity: 1 },
    ],
  },

  // 2. Rajesh Sharma - Regular Family Basket (UPI)
  {
    customerMatch: "Rajesh Sharma",
    paymentMode: "UPI",
    paymentStatus: "PAID",
    discount: 15,
    notes: "Paid via PhonePe QR",
    items: [
      { sku: "MILK-AMUL-GOLD-500", quantity: 2 },
      { sku: "BUTTER-AMUL-100", quantity: 1 },
      { sku: "BISC-GOODDAY-CASHEW-200", quantity: 2 },
      { sku: "TEA-TATA-GOLD-250", quantity: 1 },
    ],
  },

  // 3. Vikram Singh Rathore - Premium Monthly Grocery (CARD)
  {
    customerMatch: "Vikram Singh Rathore",
    paymentMode: "CARD",
    paymentStatus: "PAID",
    discount: 50,
    notes: "HDFC POS Credit Card Swipe",
    items: [
      { sku: "RICE-BASM-001", quantity: 2 },
      { sku: "ATTA-AASHIRVAAD-5KG", quantity: 1 },
      { sku: "OIL-FORTUNE-SUN-1L", quantity: 2 },
      { sku: "DAL-TOOR-TATA-1KG", quantity: 1 },
      { sku: "GHEE-GEMINI-500", quantity: 1 },
    ],
  },

  // 4. Karan Johar Fast Foods - B2B Cafe Supplies (CREDIT_UDHAR)
  {
    customerMatch: "Karan Johar Fast Foods",
    paymentMode: "CREDIT_UDHAR",
    paymentStatus: "PENDING",
    discount: 0,
    notes: "Added to monthly B2B Khata bill",
    items: [
      { sku: "PANEER-AMUL-200", quantity: 5 },
      { sku: "CHEESE-GO-SLICES-200", quantity: 3 },
      { sku: "BUTTER-AMUL-100", quantity: 4 },
      { sku: "BEV-COKE-750", quantity: 6 },
    ],
  },

  // 5. Sunita Verma - Home Grocery & Cleaning (PARTIAL / SPLIT)
  {
    customerMatch: "Sunita Verma",
    paymentMode: "SPLIT",
    paymentStatus: "PARTIAL",
    discount: 20,
    partialPaid: 250,
    settleRest: 150, // Test subsequent payment recording
    notes: "₹250 paid in cash at counter, remainder added to pending",
    items: [
      { sku: "DETERGENT-SURF-1KG", quantity: 1 },
      { sku: "CLEAN-VIM-BAR-200", quantity: 2 },
      { sku: "SOAP-DOVE-100", quantity: 2 },
      { sku: "BISC-PARLE-G-800", quantity: 1 },
    ],
  },

  // 6. Amit Patel - Wholesale Refreshments & Snacks (UPI)
  {
    customerMatch: "Amit Patel",
    paymentMode: "UPI",
    paymentStatus: "PAID",
    discount: 30,
    notes: "Google Pay UPI payment",
    items: [
      { sku: "BEV-COKE-750", quantity: 4 },
      { sku: "BEV-SPRITE-750", quantity: 4 },
      { sku: "SNACK-LAYS-MAGIC-50", quantity: 5 },
      { sku: "SNACK-KURKURE-MASALA-90", quantity: 5 },
    ],
  },

  // 7. Pooja Malhotra - Personal Care & Beverages (CARD)
  {
    customerMatch: "Pooja Malhotra",
    paymentMode: "CARD",
    paymentStatus: "PAID",
    discount: 10,
    notes: "SBI Debit card tap & pay",
    items: [
      { sku: "CREAM-NIVEA-SOFT-100", quantity: 1 },
      { sku: "FACEWASH-HIMALAYA-100", quantity: 1 },
      { sku: "COFFEE-NESCAFE-100", quantity: 1 },
    ],
  },

  // 8. Deepak Choudhary - Farmhouse Kitchen Essentials (CREDIT_UDHAR)
  {
    customerMatch: "Deepak Choudhary",
    paymentMode: "CREDIT_UDHAR",
    paymentStatus: "PENDING",
    discount: 0,
    notes: "Khata credit for bulk kitchen flour and oil",
    items: [
      { sku: "ATTA-AASHIRVAAD-5KG", quantity: 2 },
      { sku: "OIL-FORTUNE-MUSTARD-1L", quantity: 2 },
      { sku: "SALT-TATA-LITE-1KG", quantity: 2 },
    ],
  },

  // 9. Quick Evening Snacks Walk-in (CASH)
  {
    customerName: "Walk-in Customer",
    customerPhone: "",
    paymentMode: "CASH",
    paymentStatus: "PAID",
    discount: 0,
    notes: "Quick evening walk-in purchase",
    items: [
      { sku: "BISC-DARKFANTASY-300", quantity: 1 },
      { sku: "SNACK-HALDIRAM-ALOO-400", quantity: 1 },
      { sku: "CHOCO-DAIRYMILK-100", quantity: 2 },
    ],
  },

  // 10. Fresh Mandi Vegetables & Staples Walk-in (UPI)
  {
    customerName: "Smt. Sharda Devi",
    customerPhone: "9828001122",
    paymentMode: "UPI",
    paymentStatus: "PAID",
    discount: 5,
    notes: "Vegetables and lentils purchase via Paytm",
    items: [
      { sku: "VEG-POTATO-1KG", quantity: 3 },
      { sku: "VEG-ONION-1KG", quantity: 2 },
      { sku: "VEG-TOMATO-1KG", quantity: 2 },
      { sku: "DAL-MOONG-TATA-1KG", quantity: 1 },
    ],
  },
];

module.exports = sampleSalesTemplates;
