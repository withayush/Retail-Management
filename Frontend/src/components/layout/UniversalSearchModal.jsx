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
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Modal content */}
      <div className="relative w-full max-w-lg bg-[#111113] border border-[#27272a] rounded-2xl shadow-2xl z-10 overflow-hidden animate-modal-pop">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#1f1f23]">
          <Search className="w-4 h-4 text-zinc-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && onClose()}
            placeholder="Search pages, products, customers..."
            className="w-full bg-transparent text-sm text-foreground placeholder-zinc-500 outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="p-1 rounded text-zinc-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="text-[10px] text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-700">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-3">
          {loading && (
            <p className="text-xs text-zinc-500 text-center py-4">Searching...</p>
          )}

          {/* Pages */}
          {filteredPages.length > 0 && (
            <div>
              <p className="px-2 py-1 text-[11px] font-medium text-zinc-500 uppercase">
                Pages
              </p>
              <div className="space-y-0.5">
                {filteredPages.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.path}
                      onClick={() => handleNavigate(item.path)}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors text-left"
                    >
                      <Icon className="w-4 h-4 text-zinc-400" />
                      <span>{item.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Products */}
          {products.length > 0 && (
            <div>
              <p className="px-2 py-1 text-[11px] font-medium text-zinc-500 uppercase">
                Products
              </p>
              <div className="space-y-0.5">
                {products.map((p) => (
                  <button
                    key={p._id || p.id}
                    onClick={() => handleNavigate("/products")}
                    className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors text-left"
                  >
                    <span className="truncate">{p.name}</span>
                    <span className="text-xs text-zinc-400">₹{p.sellingPrice}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Customers */}
          {customers.length > 0 && (
            <div>
              <p className="px-2 py-1 text-[11px] font-medium text-zinc-500 uppercase">
                Customers
              </p>
              <div className="space-y-0.5">
                {customers.map((c) => (
                  <button
                    key={c._id || c.id}
                    onClick={() => handleNavigate("/customers")}
                    className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors text-left"
                  >
                    <span className="truncate">{c.name}</span>
                    <span className="text-xs text-zinc-400">{c.phone || "No phone"}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {filteredPages.length === 0 && products.length === 0 && customers.length === 0 && !loading && (
            <p className="text-xs text-zinc-500 text-center py-6">No matches found</p>
          )}
        </div>
      </div>
    </div>
  );
}
