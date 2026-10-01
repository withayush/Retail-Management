const samplePurchaseOrders = [
  {
    supplierMatch: "Amul Dairy Distributorship",
    paymentTerms: "Net 15 Days",
    shippingAddress: "VendorOS Central Store, Jaipur, Rajasthan",
    notes: "Weekly fresh dairy consignment order",
    items: [
      {
        skuMatch: "MILK-AMUL-TAZA-500",
        quantity: 100,
        unitCost: 24.5,
      },
      {
        skuMatch: "BUTTER-AMUL-100",
        quantity: 50,
        unitCost: 51,
      },
      {
        skuMatch: "PANEER-AMUL-200",
        quantity: 40,
        unitCost: 78,
      },
    ],
    // GRN Receipt Info
    receiveStock: {
      deliveryChallanNumber: "DC-AMUL-8891",
      invoiceNumber: "BILL-AMUL-4521",
      notes: "Crates received, chiller temperature verified OK",
    },
  },
  {
    supplierMatch: "Hindustan Unilever Wholesale",
    paymentTerms: "Net 30 Days",
    shippingAddress: "VendorOS Central Store, Jaipur, Rajasthan",
    notes: "Personal care & laundry replenishment order",
    items: [
      {
        skuMatch: "DETERGENT-SURF-1KG",
        quantity: 60,
        unitCost: 120,
      },
      {
        skuMatch: "SOAP-DOVE-100",
        quantity: 80,
        unitCost: 55,
      },
      {
        skuMatch: "SHAMPOO-SUNSILK-180",
        quantity: 45,
        unitCost: 115,
      },
    ],
    receiveStock: {
      deliveryChallanNumber: "DC-HUL-1029",
      invoiceNumber: "BILL-HUL-9844",
      notes: "Full carton consignment received and stacked in section B",
    },
  },
  {
    supplierMatch: "Adani Wilmar Fortune",
    paymentTerms: "Net 21 Days",
    shippingAddress: "VendorOS Central Store, Jaipur, Rajasthan",
    notes: "Bulk staples and edible oils order",
    items: [
      {
        skuMatch: "OIL-FORTUNE-SUN-1L",
        quantity: 75,
        unitCost: 128,
      },
      {
        skuMatch: "RICE-FORTUNE-5KG",
        quantity: 30,
        unitCost: 455,
      },
      {
        skuMatch: "FLOUR-FORTUNE-BESAN-1KG",
        quantity: 50,
        unitCost: 80,
      },
    ],
    receiveStock: {
      deliveryChallanNumber: "DC-FORTUNE-5620",
      invoiceNumber: "BILL-AW-7821",
      notes: "Oil containers and rice bags inspected, seals intact",
    },
  },
  {
    supplierMatch: "Coca-Cola Bottling Bottlers",
    paymentTerms: "Immediate Cash on Delivery",
    shippingAddress: "VendorOS Central Store, Jaipur, Rajasthan",
    notes: "Chilled beverage stock order for summer rush",
    items: [
      {
        skuMatch: "BEV-COKE-750",
        quantity: 120,
        unitCost: 38,
      },
      {
        skuMatch: "BEV-SPRITE-750",
        quantity: 90,
        unitCost: 38,
      },
      {
        skuMatch: "WATER-KINLEY-1L",
        quantity: 150,
        unitCost: 14,
      },
    ],
    receiveStock: {
      deliveryChallanNumber: "DC-COKE-3411",
      invoiceNumber: "BILL-HCCB-6701",
      notes: "All glass and PET crates counted and verified",
    },
  },
];

module.exports = samplePurchaseOrders;
