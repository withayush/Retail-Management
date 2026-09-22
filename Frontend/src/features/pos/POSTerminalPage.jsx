import React, { useState, useEffect, useCallback, useRef } from "react";
import toast from "react-hot-toast";
import { searchProducts, getProducts, getProductByBarcode } from "../../services/product.api";
import { getCategories } from "../../services/category.api";
import { createSale } from "../../services/sale.api";

// Sub-components
import POSTerminalHeader from "./components/POSTerminalHeader";
import POSProductSearch from "./components/POSProductSearch";
import POSProductGrid from "./components/POSProductGrid";
import POSCart from "./components/POSCart";
import POSReceiptModal from "./components/POSReceiptModal";

export default function POSTerminalPage() {
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
  const [paymentMode, setPaymentMode] = useState("CASH");
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [lastInvoice, setLastInvoice] = useState(null);
  const [checkingOut, setCheckingOut] = useState(false);

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

  // Add Product to Cart (Task T26 Floor Overselling Guard)
  const addToCart = (product) => {
    const prodId = product.id || product._id;
    const stock = product.availableStock !== undefined ? Number(product.availableStock) : null;

    if (stock !== null && stock <= 0) {
      return toast.error(`Cannot add "${product.name}" - Item is Out of Stock!`, { id: `pos-oos-${prodId}` });
    }

    setCart((prevCart) => {
      const existing = prevCart.find((item) => (item.id || item._id) === prodId);
      if (existing) {
        if (stock !== null && existing.quantity >= stock) {
          toast.error(`Only ${stock} units in stock for "${product.name}"`, { id: `pos-max-${prodId}` });
          return prevCart;
        }
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
          costPrice: Number(product.costPrice ?? product.cost_price ?? 0),
          unit: product.unit || "pcs",
          categoryName: product.category?.name || "General",
          availableStock: stock,
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

  // Cart Actions with Floor Stock Guard
  const updateQuantity = (id, delta) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if ((item.id || item._id) === id) {
            const newQty = item.quantity + delta;
            if (delta > 0 && item.availableStock !== null && item.availableStock !== undefined && newQty > item.availableStock) {
              toast.error(`Only ${item.availableStock} units available in stock!`, { id: `pos-limit-${id}` });
              return item;
            }
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
  const gstRate = 0.05;
  const gstAmount = subtotal * gstRate;
  const grandTotal = subtotal + gstAmount;

  // Checkout Handler (Task T24 Integration)
  const handleCheckout = async () => {
    if (cart.length === 0) {
      return toast.error("Cart is empty!");
    }

    setCheckingOut(true);
    try {
      const payload = {
        customerName: customerName.trim() || "Walk-in Customer",
        customerPhone: customerPhone.trim() || "",
        subtotal: Math.round(subtotal * 100) / 100,
        tax: Math.round(gstAmount * 100) / 100,
        discount: 0,
        total: Math.round(grandTotal * 100) / 100,
        paidAmount: Math.round(grandTotal * 100) / 100,
        paymentStatus: "PAID",
        paymentMode,
        items: cart.map((it) => ({
          productId: it.id || it._id,
          name: it.name,
          sku: it.sku || "",
          unit: it.unit || "pcs",
          soldPrice: it.sellingPrice,
          costPrice: it.costPrice || 0,
          quantity: it.quantity,
          totalPrice: Math.round(it.sellingPrice * it.quantity * 100) / 100,
        })),
        notes: "Billed at POS Terminal",
      };

      const res = await createSale(payload);
      const createdSale = res.data || res;

      setLastInvoice(createdSale);
      setCheckoutSuccess(true);
      setCart([]);
      setCustomerName("");
      setCustomerPhone("");
      toast.success(`Invoice ${createdSale.invoiceNumber} billed successfully! 🎉`);
      fetchPOSProducts();
    } catch (err) {
      console.error("POS Checkout error:", err);
      const isStockError = err.response?.data?.code === "INSUFFICIENT_STOCK";
      const errorMsg = err.response?.data?.message || err.message || "Failed to complete checkout.";
      if (isStockError) {
        toast.error(`⚠️ ${errorMsg}`, { duration: 4000 });
      } else {
        toast.error(errorMsg);
      }
    } finally {
      setCheckingOut(false);
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col md:flex-row bg-[#09090b] text-zinc-100 overflow-hidden font-sans">
      {/* ── Left Side: POS Product Catalog & Search ───────────────────────── */}
      <div className="flex-1 flex flex-col border-r border-[#1f1f23] h-full overflow-hidden">
        <POSProductSearch
          searchInputRef={searchInputRef}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          onKeyDown={handleKeyDown}
          categories={categories}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          onRefresh={fetchPOSProducts}
          loading={loading}
        />
        <POSProductGrid
          loading={loading}
          products={products}
          searchTerm={searchTerm}
          onAddToCart={addToCart}
        />
      </div>

      {/* ── Right Side: Live Cart & Billing Summary ─────────────────────── */}
      <POSCart
        cart={cart}
        customerName={customerName}
        setCustomerName={setCustomerName}
        customerPhone={customerPhone}
        setCustomerPhone={setCustomerPhone}
        paymentMode={paymentMode}
        setPaymentMode={setPaymentMode}
        subtotal={subtotal}
        gstAmount={gstAmount}
        grandTotal={grandTotal}
        checkingOut={checkingOut}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeFromCart}
        onClearCart={clearCart}
        onCheckout={handleCheckout}
      />

      {/* ── Invoice Receipt Modal ────────────────────────────────────────── */}
      <POSReceiptModal
        isOpen={checkoutSuccess}
        invoice={lastInvoice}
        onClose={() => {
          setCheckoutSuccess(false);
          if (searchInputRef.current) searchInputRef.current.focus();
        }}
      />
    </div>
  );
}
