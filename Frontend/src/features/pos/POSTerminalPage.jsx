import React, { useState, useEffect, useCallback, useRef } from "react";
import toast from "react-hot-toast";
import { searchProducts, getProducts, getProductByBarcode } from "../../services/product.api";
import { getCategories } from "../../services/category.api";

// Modular Sub-Components
import POSHeader from "./components/POSHeader";
import POSSearchBar from "./components/POSSearchBar";
import POSCategoryFilter from "./components/POSCategoryFilter";
import POSProductGrid from "./components/POSProductGrid";
import POSCart from "./components/POSCart";
import POSPaymentPanel from "./components/POSPaymentPanel";
import POSReceiptModal from "./components/POSReceiptModal";

export default function POSTerminalPage() {
  const searchInputRef = useRef(null);

  // Products & Categories Data
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

  // Barcode Enter Key Scan Handler
  const handleKeyDown = async (e) => {
    if (e.key === "Enter" && searchTerm.trim()) {
      e.preventDefault();
      const code = searchTerm.trim();
      try {
        const barcodeRes = await getProductByBarcode(code);
        const item = barcodeRes.data || barcodeRes;
        if (item) {
          addToCart(item);
          setSearchTerm("");
          return;
        }
      } catch {
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
        {/* 1. Header */}
        <POSHeader loading={loading} onRefresh={fetchPOSProducts} />

        {/* 2. Search & Category Filters */}
        <div className="p-4 bg-secondary/30 border-b border-border space-y-3">
          <POSSearchBar
            searchInputRef={searchInputRef}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            onKeyDown={handleKeyDown}
          />

          <POSCategoryFilter
            categories={categories}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
          />
        </div>

        {/* 3. Product Catalog Grid */}
        <POSProductGrid
          products={products}
          loading={loading}
          searchTerm={searchTerm}
          onAddToCart={addToCart}
        />
      </div>

      {/* ── Right Side: Live Cart & Billing Summary ─────────────────────── */}
      <div className="w-full md:w-[420px] flex flex-col bg-card border-l border-border h-full justify-between shadow-lg">
        {/* 4. Cart List */}
        <POSCart
          cart={cart}
          customerName={customerName}
          setCustomerName={setCustomerName}
          customerPhone={customerPhone}
          setCustomerPhone={setCustomerPhone}
          onUpdateQuantity={updateQuantity}
          onRemoveFromCart={removeFromCart}
          onClearCart={clearCart}
        />

        {/* 5. Payment & Calculations Panel */}
        <POSPaymentPanel
          subtotal={subtotal}
          gstAmount={gstAmount}
          grandTotal={grandTotal}
          paymentMode={paymentMode}
          setPaymentMode={setPaymentMode}
          cartCount={cart.length}
          onCheckout={handleCheckout}
        />
      </div>

      {/* 6. Invoice Receipt Modal */}
      <POSReceiptModal
        isOpen={checkoutSuccess}
        onClose={() => setCheckoutSuccess(false)}
        invoice={lastInvoice}
      />
    </div>
  );
}
