const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const businessRoutes = require("./routes/business.routes");
const categoryRoutes = require("./routes/category.routes");
const productRoutes = require("./routes/product.routes");
const inventoryRoutes = require("./routes/inventory.routes");
const saleRoutes = require("./routes/sale.routes");
const paymentRoutes = require("./routes/payment.routes");
const customerRoutes = require("./routes/customer.routes");
const supplierRoutes = require("./routes/supplier.routes");
const errorHandler = require("./middlewares/error.middleware");

const app = express();


// Trust reverse proxy for Render / Cloudflare
app.set("trust proxy", 1);

// Robust CORS for production and cross-domain credentials
app.use(
  cors({
    origin: (origin, callback) => {
      return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "x-business-id",
      "x-tenant-id",
      "x-requested-with",
    ],
    optionsSuccessStatus: 200,
  })
);

const path = require("path");

app.use(express.json());
app.use(cookieParser());
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "VendorOS API is running.",
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/business", businessRoutes);
app.use("/api/businesses", businessRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/sales", saleRoutes);
app.use("/api/invoices", saleRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/suppliers", supplierRoutes);

app.use(errorHandler);


module.exports = app;