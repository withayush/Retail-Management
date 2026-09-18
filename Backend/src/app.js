const express = require("express");
const cookieParser = require("cookie-parser");

const authRoutes = require("./routes/auth.routes");
const businessRoutes = require("./routes/business.routes");
const categoryRoutes = require("./routes/category.routes");
const productRoutes = require("./routes/product.routes");
const errorHandler = require("./middlewares/error.middleware");

const app = express();

app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "VendorOS API is running.",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/business", businessRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);

app.use(errorHandler);

module.exports = app;
