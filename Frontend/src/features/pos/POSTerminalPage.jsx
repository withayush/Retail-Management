import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShoppingCart,
  Search,
  CreditCard,
  Barcode,
  Package,
  Plus,
  Minus,
  Trash2,
  ArrowLeft,
  RefreshCw,
  Layers,
  Sparkles,
  CheckCircle2,
  X,
  Receipt,
  UserCheck,
} from "lucide-react";
import toast from "react-hot-toast";
import { searchProducts, getProducts, getProductByBarcode } from "../../services/product.api";
import { getCategories } from "../../services/category.api";

export default function POSTerminalPage() {
  const navigate = useNavigate();
  const searchInputRef = useRef(null);

  // Products & Categories
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  // Cart & Order State
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMode, setPaymentMode] = useState("CASH"); // CASH | UPI | CARD | UDHAR
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [lastInvoice, setLastInvoice] = useState(null);

  // Auto-focus search input on mount
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  // Fetch Categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await getCategories();
        const list = res.data?.categories || res.data || [];
        setCategories(list);
      } catch (err) {
        console.error("Failed to load categories in POS:", err);
      }
    };
    loadCategories();
  }, []);

  // Fetch / Search Products
  const fetchPOSProducts = useCallback(async () => {
    setLoading(true);
    try {
      if (searchTerm.trim() || selectedCategory) {
        const res = await searchProducts({
          q: searchTerm.trim() || undefined,
          categoryId: selectedCategory || undefined,
          limit: 30,
        });
        setProducts(res.data || []);
      } else {
        const res = await getProducts({ limit: 30, status: "active" });
        const list = res.data?.products || res.data || [];
        setProducts(list);
      }
    } catch (err) {
      console.error("Failed to fetch POS products:", err);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedCategory]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchPOSProducts();
    }, 200);
    return () => clearTimeout(delayDebounce);
  }, [fetchPOSProducts]);

  // Add Product to Cart
  const addToCart = (product) => {
    const prodId = product.id || product._id;
    setCart((prevCart) => {
      const existing = prevCart.find((item) => (item.id || item._id) === prodId);
      if (existing) {
        return prevCart.map((item) =>
          (item.id || item._id) === prodId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prevCart,
        {
          id: prodId,
          name: product.name,
          sku: product.sku,
          barcode: product.barcode,
          sellingPrice: Number(product.sellingPrice ?? product.selling_price ?? 0),
          unit: product.unit || "pcs",
          categoryName: product.category?.name || "General",
          quantity: 1,
        },
      ];
    });
    toast.success(`Added: ${product.name}`, { duration: 1200, id: `pos-add-${prodId}` });
  };

  // Barcode / Fast Enter Key Scan Handler
  const handleKeyDown = async (e) => {
    if (e.key === "Enter" && searchTerm.trim()) {
      e.preventDefault();
      const code = searchTerm.trim();
      try {
        // 1. Try finding by exact barcode
        const barcodeRes = await getProductByBarcode(code);
        const item = barcodeRes.data || barcodeRes;
        if (item) {
          addToCart(item);
          setSearchTerm("");
          return;
        }
      } catch {
        // Fallback: Check if search returned products
        if (products.length > 0) {
          addToCart(products[0]);
          setSearchTerm("");
        } else {
          toast.error(`No product found for "${code}"`);
        }
      }
    }
  };

  // Cart Actions
  const updateQuantity = (id, delta) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if ((item.id || item._id) === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const removeFromCart = (id) => {
    setCart((prevCart) => prevCart.filter((item) => (item.id || item._id) !== id));
  };

  const clearCart = () => {
    setCart([]);
  };

  // Calculations
  const subtotal = cart.reduce(
    (sum, item) => sum + item.sellingPrice * item.quantity,
    0
  );
  const gstRate = 0.05; // 5% GST
  const gstAmount = subtotal * gstRate;
  const grandTotal = subtotal + gstAmount;

  // Checkout Handler
  const handleCheckout = () => {
    if (cart.length === 0) {
      return toast.error("Cart is empty!");
    }

    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
    const invoice = {
      invoiceNumber,
      customerName: customerName.trim() || "Walk-in Customer",
      customerPhone: customerPhone.trim() || "N/A",
      items: [...cart],
      subtotal,
      gstAmount,
      grandTotal,
      paymentMode,
      date: new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setLastInvoice(invoice);
    setCheckoutSuccess(true);
    setCart([]);
    setCustomerName("");
    setCustomerPhone("");
    toast.success(`Invoice ${invoiceNumber} billed successfully! 🎉`);
  };

  return (
    <div className="h-screen flex flex-col md:flex-row bg-background text-foreground overflow-hidden font-sans">
      {/* ── Left Side: POS Product Catalog & Search ───────────────────────── */}
      <div className="flex-1 flex flex-col border-r border-border h-full overflow-hidden">
        {/* Top App Bar */}
        <div className="p-4 border-b border-border bg-card flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/dashboard")}
              className="p-2 rounded-xl border border-border hover:bg-secondary text-muted-foreground hover:text-foreground transition-all cursor-pointer"
              title="Return to Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-lg font-bold flex items-center gap-2 text-foreground">
                <Receipt className="w-5 h-5 text-primary" /> POS Billing Terminal
              </h1>
              <p className="text-xs text-muted-foreground">
                Rapid Checkout & Barcode Scanner
              </p>
            </div>
          </div>

          <button
            onClick={fetchPOSProducts}
            className="p-2 rounded-xl border border-border hover:bg-secondary text-muted-foreground hover:text-foreground transition-all cursor-pointer flex items-center gap-1.5 text-xs font-medium"
            title="Refresh Catalog"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        {/* Search & Barcode Bar */}
        <div className="p-4 bg-secondary/30 border-b border-border space-y-3">
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              ref={searchInputRef}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search by Name, SKU, Category or Scan Barcode (Press Enter)..."
              className="w-full bg-background border border-border rounded-xl pl-10 pr-24 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-12 text-muted-foreground hover:text-foreground p-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <div className="absolute right-3 flex items-center gap-1 text-[11px] font-mono text-muted-foreground bg-secondary/80 px-2 py-0.5 rounded border border-border">
              <Barcode className="w-3.5 h-3.5 text-primary" />
              <span>SCAN</span>
            </div>
          </div>

          {/* Category Filter Pills Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedCategory("")}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border ${
                selectedCategory === ""
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-background text-muted-foreground hover:text-foreground border-border hover:bg-secondary"
              }`}
            >
              All Items
            </button>
            {categories.map((cat) => {
              const catId = cat.id || cat._id;
              const isSelected = selectedCategory === catId;
              return (
                <button
                  key={catId}
                  onClick={() => setSelectedCategory(isSelected ? "" : catId)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border ${
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-background text-muted-foreground hover:text-foreground border-border hover:bg-secondary"
                  }`}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Product Catalog Grid */}
        <div className="flex-1 p-4 overflow-y-auto bg-background/50">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center gap-3 text-muted-foreground">
              <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <span className="text-sm font-medium">Searching product catalog...</span>
            </div>
          ) : products.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-3 text-muted-foreground text-center p-6">
              <div className="w-14 h-14 rounded-2xl bg-secondary/60 border border-border flex items-center justify-center">
                <Package className="w-7 h-7 text-muted-foreground" />
              </div>
              <p className="font-semibold text-foreground text-base">No Products Found</p>
              <p className="text-xs max-w-sm">
                No active products match "{searchTerm}". Try scanning another barcode or clearing filters.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {products.map((p) => {
                const prodId = p.id || p._id;
                const price = Number(p.sellingPrice ?? p.selling_price ?? 0);
                const categoryName = p.category?.name || "General";

                return (
                  <div
                    key={prodId}
                    onClick={() => addToCart(p)}
                    className="bg-card border border-border hover:border-primary/50 hover:shadow-md transition-all rounded-2xl p-3.5 flex flex-col justify-between cursor-pointer group active:scale-[0.98]"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-1 mb-1.5">
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-secondary px-2 py-0.5 rounded text-muted-foreground border border-border">
                          <Layers className="w-2.5 h-2.5 text-primary" />
                          {categoryName}
                        </span>
                        {p.sku && (
                          <span className="text-[10px] font-mono text-muted-foreground font-semibold">
                            {p.sku}
                          </span>
                        )}
                      </div>

                      <h3 className="font-bold text-xs text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                        {p.name}
                      </h3>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-border/60 flex items-center justify-between">
                      <div>
                        <span className="font-mono font-bold text-sm text-foreground">
                          ₹{price.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-muted-foreground ml-1">
                          /{p.unit || "pcs"}
                        </span>
                      </div>

                      <button
                        type="button"
                        className="w-7 h-7 rounded-xl bg-primary/10 group-hover:bg-primary text-primary group-hover:text-primary-foreground flex items-center justify-center transition-all"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Right Side: Live Cart & Billing Summary ─────────────────────── */}
      <div className="w-full md:w-[420px] flex flex-col bg-card border-l border-border h-full justify-between shadow-lg">
        {/* Cart Header */}
        <div className="p-4 border-b border-border bg-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                <ShoppingCart className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-foreground">Current Order</h2>
                <span className="text-[11px] text-muted-foreground">
                  {cart.length} distinct item{cart.length === 1 ? "" : "s"}
                </span>
              </div>
            </div>

            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs text-destructive hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear
              </button>
            )}
          </div>

          {/* Quick Customer Attach */}
          <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-border/60">
            <input
              placeholder="Customer Name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground"
            />
            <input
              placeholder="Mobile Phone"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground font-mono"
            />
          </div>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 p-4 overflow-y-auto space-y-2.5 divide-y divide-border/40">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
              <ShoppingCart className="w-10 h-10 mb-2 opacity-30" />
              <p className="font-semibold text-sm text-foreground">Cart is Empty</p>
              <p className="text-xs mt-1">
                Scan barcodes or click products on the left catalog to start billing.
              </p>
            </div>
          ) : (
            cart.map((item) => {
              const id = item.id || item._id;
              const lineTotal = item.sellingPrice * item.quantity;

              return (
                <div key={id} className="pt-2.5 first:pt-0 flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-xs text-foreground truncate">
                      {item.name}
                    </h4>
                    <span className="text-[11px] font-mono text-muted-foreground">
                      ₹{item.sellingPrice.toFixed(2)} × {item.quantity}
                    </span>
                  </div>

                  {/* Quantity Controller */}
                  <div className="flex items-center gap-1 bg-secondary/80 border border-border rounded-lg p-0.5">
                    <button
                      onClick={() => updateQuantity(id, -1)}
                      className="w-6 h-6 rounded flex items-center justify-center hover:bg-background text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center font-mono font-bold text-xs">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(id, 1)}
                      className="w-6 h-6 rounded flex items-center justify-center hover:bg-background text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="text-right min-w-[70px]">
                    <span className="font-mono font-bold text-xs text-foreground block">
                      ₹{lineTotal.toFixed(2)}
                    </span>
                    <button
                      onClick={() => removeFromCart(id)}
                      className="text-[10px] text-destructive hover:underline cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Cart Billing Summary & Checkout */}
        <div className="p-4 bg-secondary/30 border-t border-border space-y-3">
          {/* Payment Mode Selector */}
          <div className="grid grid-cols-4 gap-1 bg-background p-1 rounded-xl border border-border text-xs font-semibold text-center">
            {["CASH", "UPI", "CARD", "UDHAR"].map((mode) => (
              <button
                key={mode}
                onClick={() => setPaymentMode(mode)}
                className={`py-1 rounded-lg transition-all cursor-pointer ${
                  paymentMode === mode
                    ? "bg-primary text-primary-foreground shadow-sm font-bold"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal:</span>
              <span className="font-mono">₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>GST (5%):</span>
              <span className="font-mono">₹{gstAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-foreground pt-1.5 border-t border-border">
              <span>Grand Total:</span>
              <span className="font-mono text-base text-primary">
                ₹{grandTotal.toFixed(2)}
              </span>
            </div>
          </div>

          <button
            disabled={cart.length === 0}
            onClick={handleCheckout}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-md hover:bg-primary/90 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <CreditCard className="w-4 h-4" />
            Charge ₹{grandTotal.toFixed(2)} ({paymentMode})
          </button>
        </div>
      </div>

      {/* ── Invoice Receipt Modal ────────────────────────────────────────── */}
      {checkoutSuccess && lastInvoice && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-2 border border-emerald-500/20">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-foreground">Payment Received</h3>
              <p className="text-xs text-muted-foreground font-mono">
                {lastInvoice.invoiceNumber} • {lastInvoice.date}
              </p>
            </div>

            <div className="bg-secondary/40 border border-border rounded-2xl p-4 text-xs space-y-2">
              <div className="flex justify-between font-semibold">
                <span>Customer:</span>
                <span>{lastInvoice.customerName}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Payment Mode:</span>
                <span className="font-mono font-bold text-foreground">{lastInvoice.paymentMode}</span>
              </div>
              <div className="border-t border-border pt-2 space-y-1">
                {lastInvoice.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-muted-foreground">
                    <span className="truncate pr-2">{item.name} × {item.quantity}</span>
                    <span className="font-mono font-medium text-foreground">
                      ₹{(item.sellingPrice * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="border-t border-border pt-2 flex justify-between font-bold text-sm text-foreground">
                <span>Total Paid:</span>
                <span className="font-mono text-primary">₹{lastInvoice.grandTotal.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setCheckoutSuccess(false);
                  if (searchInputRef.current) searchInputRef.current.focus();
                }}
                className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition-all cursor-pointer"
              >
                New Order
              </button>
              <button
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-2.5 rounded-xl border border-border bg-secondary hover:bg-secondary/80 text-foreground font-semibold text-xs transition-all cursor-pointer"
              >
                Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
