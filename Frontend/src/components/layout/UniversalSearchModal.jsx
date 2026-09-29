import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  LayoutDashboard,
  ShoppingCart,
  Package,
  Boxes,
  Users,
  Receipt,
  X,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { searchProducts } from "../../services/product.api";
import { getCustomers } from "../../services/customer.api";

const PAGES = [
  { title: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { title: "POS Terminal", path: "/pos", icon: ShoppingCart },
  { title: "Products", path: "/products", icon: Package },
  { title: "Inventory", path: "/inventory", icon: Boxes },
  { title: "Customers", path: "/customers", icon: Users },
  { title: "Sales & Invoices", path: "/sales", icon: Receipt },
];

export default function UniversalSearchModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setProducts([]);
      setCustomers([]);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setProducts([]);
      setCustomers([]);
      return;
    }

    let isMounted = true;
    setLoading(true);

    const timer = setTimeout(async () => {
      try {
        const [prodRes, custRes] = await Promise.allSettled([
          searchProducts(query),
          getCustomers(query),
        ]);

        if (!isMounted) return;

        if (prodRes.status === "fulfilled" && prodRes.value?.data) {
          const prods = Array.isArray(prodRes.value.data) ? prodRes.value.data : [];
          setProducts(prods.slice(0, 4));
        }

        if (custRes.status === "fulfilled" && custRes.value?.data) {
          const custs = Array.isArray(custRes.value.data)
            ? custRes.value.data
            : custRes.value.data?.customers || [];
          setCustomers(custs.slice(0, 4));
        }
      } catch (err) {
        // silent
      } finally {
        if (isMounted) setLoading(false);
      }
    }, 200);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [query]);

  if (!isOpen) return null;

  const filteredPages = query.trim()
    ? PAGES.filter((p) => p.title.toLowerCase().includes(query.toLowerCase()))
    : PAGES;

  const handleNavigate = (path) => {
    onClose();
    navigate(path);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      {/* Apple Frosted Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-md transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Apple Spotlight Modal */}
      <div className="relative w-full max-w-lg bg-[#1D1D1F]/95 backdrop-blur-3xl border border-[#D2D2D7]/20 rounded-[18px] shadow-[0_24px_64px_rgba(0,0,0,0.6)] z-10 overflow-hidden animate-modal-pop">
        {/* Search input header */}
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-[#D2D2D7]/10">
          <Search className="w-4 h-4 text-[#0066CC] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && onClose()}
            placeholder="Search pages, products, customers..."
            className="w-full bg-transparent text-sm text-white placeholder-[#6E6E73] outline-none font-normal"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="p-1 rounded-full text-[#6E6E73] hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="text-[10px] text-[#6E6E73] bg-white/5 px-2 py-0.5 rounded-full border border-white/10 font-mono">
            ESC
          </kbd>
        </div>

        {/* Results Container */}
        <div className="max-h-80 overflow-y-auto p-3 space-y-3">
          {loading && (
            <div className="flex items-center justify-center py-6 gap-2 text-xs text-[#6E6E73]">
              <div className="w-3 h-3 rounded-full border-2 border-[#0066CC] border-t-transparent animate-spin" />
              <span>Searching catalog & records...</span>
            </div>
          )}

          {/* Navigation Pages */}
          {filteredPages.length > 0 && (
            <div>
              <p className="px-3 py-1 text-[10px] font-semibold text-[#6E6E73] tracking-wider uppercase">
                Quick Navigation
              </p>
              <div className="space-y-1">
                {filteredPages.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.path}
                      onClick={() => handleNavigate(item.path)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-[#D2D2D7] hover:bg-white/10 hover:text-white transition-all text-left group cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4 text-[#0066CC] group-hover:scale-110 transition-transform" />
                        <span className="font-medium">{item.title}</span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-[#6E6E73] group-hover:text-white opacity-0 group-hover:opacity-100 transition-all" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Products */}
          {products.length > 0 && (
            <div>
              <p className="px-3 py-1 text-[10px] font-semibold text-[#6E6E73] tracking-wider uppercase">
                Products
              </p>
              <div className="space-y-1">
                {products.map((p) => (
                  <button
                    key={p._id || p.id}
                    onClick={() => handleNavigate("/products")}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-[#D2D2D7] hover:bg-white/10 hover:text-white transition-all text-left cursor-pointer group"
                  >
                    <div className="truncate pr-2">
                      <span className="font-medium text-white block truncate">{p.name}</span>
                      <span className="text-[10px] text-[#6E6E73]">{p.sku || p.barcode || "SKU N/A"}</span>
                    </div>
                    <span className="font-semibold text-[#FF791B] shrink-0">₹{p.sellingPrice}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Customers */}
          {customers.length > 0 && (
            <div>
              <p className="px-3 py-1 text-[10px] font-semibold text-[#6E6E73] tracking-wider uppercase">
                Customers & Khata
              </p>
              <div className="space-y-1">
                {customers.map((c) => (
                  <button
                    key={c._id || c.id}
                    onClick={() => handleNavigate("/customers")}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-[#D2D2D7] hover:bg-white/10 hover:text-white transition-all text-left cursor-pointer"
                  >
                    <span className="font-medium text-white truncate">{c.name}</span>
                    <span className="text-[11px] text-[#6E6E73] font-mono">{c.phone || "No phone"}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {filteredPages.length === 0 && products.length === 0 && customers.length === 0 && !loading && (
            <p className="text-xs text-[#6E6E73] text-center py-8">No matching records found</p>
          )}
        </div>
      </div>
    </div>
  );
}
