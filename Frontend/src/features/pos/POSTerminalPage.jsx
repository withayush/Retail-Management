import React, { useState, useEffect, useCallback, useRef } from "react";
import toast from "react-hot-toast";
import { searchProducts, getProducts, getProductByBarcode } from "../../services/product.api";
import { getCategories } from "../../services/category.api";
import { createSale } from "../../services/sale.api";
import { generateIdempotencyKey } from "../../services/api";
import usePOSKeyboard from "./hooks/usePOSKeyboard";
import useBarcodeScanner, { playPOSBeep } from "./hooks/useBarcodeScanner";

// Sub-components
import POSTerminalHeader from "./components/POSTerminalHeader";
import POSProductSearch from "./components/POSProductSearch";
import POSProductGrid from "./components/POSProductGrid";
import POSCart from "./components/POSCart";
import POSReceiptModal from "./components/POSReceiptModal";
import POSCustomerModal from "./components/POSCustomerModal";
import POSKeyboardShortcutsModal from "./components/POSKeyboardShortcutsModal";

export default function POSTerminalPage() {
  const searchInputRef = useRef(null);
  const discountInputRef = useRef(null);

  // Products & Categories State
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  // Cart & Order State
  const [cart, setCart] = useState([]);
  const [attachedCustomer, setAttachedCustomer] = useState(null);
  const [discountType, setDiscountType] = useState("flat"); // "flat" | "percent"
  const [discountValue, setDiscountValue] = useState("");
  const [paymentMode, setPaymentMode] = useState("CASH"); // "CASH" | "UPI" | "CARD" | "UDHAR"
  const [upiRefId, setUpiRefId] = useState("");

  // Modals State
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [lastInvoice, setLastInvoice] = useState(null);
  const [checkingOut, setCheckingOut] = useState(false);
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false);

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
          limit: 40,
        });
        setProducts(res.data || []);
      } else {
        const res = await getProducts({ limit: 40, status: "active" });
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
    const stock = product.availableStock !== undefined ? Number(product.availableStock) : null;

    if (stock !== null && stock <= 0) {
      return toast.error(`Cannot add "${product.name}" - Item is Out of Stock!`, { id: `pos-oos-${prodId}` });
    }

    setCart((prevCart) => {
      const existing = prevCart.find((item) => (item.id || item._id) === prodId);
      if (existing) {
        if (stock !== null && existing.quantity >= stock) {
          toast.error(`Only ${stock} units available in stock for "${product.name}"`, { id: `pos-max-${prodId}` });
          return prevCart;
        }
        return prevCart.map((item) =>
          (item.id || item._id) === prodId ? { ...item, quantity: item.quantity + 1 } : item
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
    playPOSBeep(1200, 50);
    toast.success(`+1 ${product.name}`, { duration: 1000, id: `pos-add-${prodId}` });
  };

  // Hardware Barcode Scanner Listener Hook (Task T30)
  useBarcodeScanner({
    onAddToCart: addToCart,
    isModalOpen: customerModalOpen || shortcutsModalOpen || checkoutSuccess,
  });

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

  // Cart Actions
  const updateQuantity = (id, delta) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if ((item.id || item._id) === id) {
            const newQty = item.quantity + delta;
            if (
              delta > 0 &&
              item.availableStock !== null &&
              item.availableStock !== undefined &&
              newQty > item.availableStock
            ) {
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

  const setQuantity = (id, qty) => {
    setCart((prevCart) =>
      prevCart.map((item) => {
        if ((item.id || item._id) === id) {
          let target = Math.max(1, qty);
          if (item.availableStock !== null && item.availableStock !== undefined && target > item.availableStock) {
            toast.error(`Only ${item.availableStock} units available in stock!`, { id: `pos-limit-${id}` });
            target = item.availableStock;
          }
          return { ...item, quantity: target };
        }
        return item;
      })
    );
  };

  const removeFromCart = (id) => {
    setCart((prevCart) => prevCart.filter((item) => (item.id || item._id) !== id));
  };

  const clearCart = () => {
    if (cart.length > 0) {
      setCart([]);
      setDiscountValue("");
      setUpiRefId("");
      toast("Cart cleared", { icon: "🗑️" });
    }
  };

  // Billing Math Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.sellingPrice * item.quantity, 0);

  let discountAmount = 0;
  const rawDiscount = Number(discountValue) || 0;
  if (rawDiscount > 0) {
    if (discountType === "percent") {
      discountAmount = (subtotal * Math.min(100, rawDiscount)) / 100;
    } else {
      discountAmount = Math.min(subtotal, rawDiscount);
    }
  }
  discountAmount = Math.round(discountAmount * 100) / 100;

  const afterDiscount = Math.max(0, subtotal - discountAmount);
  const gstRate = 0.05;
  const gstAmount = Math.round(afterDiscount * gstRate * 100) / 100;
  const grandTotal = Math.round((afterDiscount + gstAmount) * 100) / 100;

  // Checkout Handler (Tasks T25, T28, T29, T30)
  const handleCheckout = async () => {
    if (cart.length === 0) {
      return toast.error("Cart is empty! Add products to proceed with billing.");
    }

    const isCreditSale = paymentMode === "UDHAR" || paymentMode === "CREDIT" || paymentMode === "CREDIT_UDHAR";

    if (isCreditSale && !attachedCustomer) {
      setCustomerModalOpen(true);
      return toast.error("Please select / attach a Customer (F4) for Udhaar (Credit) sales!", {
        id: "pos-udhar-customer-required",
        duration: 4000,
      });
    }

    setCheckingOut(true);
    try {
      const calcPaid = isCreditSale ? 0 : grandTotal;
      const calcStatus = isCreditSale ? "PENDING" : "PAID";
      const resolvedMode = isCreditSale ? "CREDIT_UDHAR" : paymentMode;

      const payload = {
        customerId: attachedCustomer ? attachedCustomer.id || attachedCustomer._id : null,
        customerName: attachedCustomer ? attachedCustomer.name : "Walk-in Customer",
        customerPhone: attachedCustomer ? attachedCustomer.phone : "",
        subtotal: Math.round(subtotal * 100) / 100,
        tax: gstAmount,
        discount: discountAmount,
        total: grandTotal,
        paidAmount: calcPaid,
        paymentStatus: calcStatus,
        paymentMode: resolvedMode,
        referenceId: paymentMode === "UPI" && upiRefId.trim() ? upiRefId.trim() : undefined,
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
        notes: isCreditSale
          ? `Udhaar sale for ${attachedCustomer?.name}`
          : `Billed at POS (${paymentMode})`,
      };

      const idempotencyKey = generateIdempotencyKey();
      const res = await createSale(payload, idempotencyKey);
      const createdSale = res.data || res;

      setLastInvoice(createdSale);
      setCheckoutSuccess(true);
      setCart([]);
      setDiscountValue("");
      setUpiRefId("");

      if (isCreditSale) {
        toast.success(
          `Invoice ${createdSale.invoiceNumber} booked on Credit! ₹${grandTotal} added to ${attachedCustomer?.name}'s Khata. 📒`,
          { duration: 4500 }
        );
      } else {
        toast.success(`Invoice ${createdSale.invoiceNumber} billed successfully! 🎉`);
      }

      fetchPOSProducts();
    } catch (err) {
      console.error("POS Checkout error:", err);
      const code = err.response?.data?.code;
      const errorMsg = err.response?.data?.message || err.message || "Failed to complete checkout.";

      if (code === "INSUFFICIENT_STOCK") {
        toast.error(`⚠️ ${errorMsg}`, { duration: 4500 });
      } else if (code === "CREDIT_LIMIT_EXCEEDED") {
        toast.error(`🛑 Credit Limit Exceeded: ${errorMsg}`, { duration: 5000 });
      } else if (code === "CUSTOMER_REQUIRED_FOR_CREDIT") {
        setCustomerModalOpen(true);
        toast.error(`⚠️ ${errorMsg}`, { duration: 4000 });
      } else {
        toast.error(errorMsg);
      }
    } finally {
      setCheckingOut(false);
    }
  };

  // Keyboard Shortcuts Hook (Task T30)
  usePOSKeyboard({
    onFocusSearch: () => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
        searchInputRef.current.select();
      }
    },
    onOpenCustomerModal: () => setCustomerModalOpen(true),
    onFocusDiscount: () => {
      if (discountInputRef.current) {
        discountInputRef.current.focus();
        discountInputRef.current.select();
      }
    },
    onCheckout: handleCheckout,
    onClearCart: clearCart,
    onSelectPaymentMode: (mode) => setPaymentMode(mode),
    onToggleShortcutsModal: () => setShortcutsModalOpen((prev) => !prev),
    onCloseModal: () => {
      if (customerModalOpen) setCustomerModalOpen(false);
      else if (shortcutsModalOpen) setShortcutsModalOpen(false);
      else if (checkoutSuccess) setCheckoutSuccess(false);
    },
    isModalOpen: customerModalOpen || shortcutsModalOpen || checkoutSuccess,
    checkingOut,
  });

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-[#09090b] text-zinc-100 overflow-hidden font-sans">
      {/* ── Top Terminal Header ────────────────────────────────────────── */}
      <POSTerminalHeader
        loading={loading}
        onRefresh={fetchPOSProducts}
        onOpenShortcuts={() => setShortcutsModalOpen(true)}
      />

      {/* ── Main Split Terminal Workspace ──────────────────────────────── */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Side: Product Catalog Search & Grid */}
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

        {/* Right Side: Quick Cart & Checkout Summary */}
        <POSCart
          cart={cart}
          customer={attachedCustomer}
          onOpenCustomerModal={() => setCustomerModalOpen(true)}
          discountType={discountType}
          setDiscountType={setDiscountType}
          discountValue={discountValue}
          setDiscountValue={setDiscountValue}
          discountInputRef={discountInputRef}
          paymentMode={paymentMode}
          setPaymentMode={setPaymentMode}
          upiRefId={upiRefId}
          setUpiRefId={setUpiRefId}
          subtotal={subtotal}
          discountAmount={discountAmount}
          gstAmount={gstAmount}
          grandTotal={grandTotal}
          checkingOut={checkingOut}
          onUpdateQuantity={updateQuantity}
          onSetQuantity={setQuantity}
          onRemoveItem={removeFromCart}
          onClearCart={clearCart}
          onCheckout={handleCheckout}
        />
      </div>

      {/* ── Customer Selection Modal (F4) ──────────────────────────────── */}
      <POSCustomerModal
        isOpen={customerModalOpen}
        onClose={() => {
          setCustomerModalOpen(false);
          if (searchInputRef.current) searchInputRef.current.focus();
        }}
        onSelectCustomer={(cust) => {
          setAttachedCustomer(cust);
          if (cust) {
            toast.success(`Attached Customer: ${cust.name}`);
          }
        }}
        currentCustomer={attachedCustomer}
      />

      {/* ── Keyboard Shortcuts Cheat Sheet Modal (F1 / ?) ──────────────── */}
      <POSKeyboardShortcutsModal
        isOpen={shortcutsModalOpen}
        onClose={() => {
          setShortcutsModalOpen(false);
          if (searchInputRef.current) searchInputRef.current.focus();
        }}
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
