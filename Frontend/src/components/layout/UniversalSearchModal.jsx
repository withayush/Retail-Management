import React, { useState, useEffect, useRef, useCallback } from "react";
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
  Clock,
  Truck,
  Wallet,
  BarChart2,
  ChevronRight,
  Keyboard,
} from "lucide-react";
import { searchProducts } from "../../services/product.api";
import { searchCustomers } from "../../services/customer.api";
import { searchSuppliers } from "../../services/supplier.api";
import { getSales } from "../../services/sale.api";
import { getExpenses } from "../../services/expense.api";

const PAGES = [
  { title: "Dashboard", path: "/dashboard", icon: LayoutDashboard, desc: "Overview & analytics" },
  { title: "POS Terminal", path: "/pos", icon: ShoppingCart, desc: "Sell products & billing" },
  { title: "Products", path: "/products", icon: Package, desc: "Manage inventory catalog" },
  { title: "Inventory", path: "/inventory", icon: Boxes, desc: "Stock audit & levels" },
  { title: "Customers", path: "/customers", icon: Users, desc: "Khata & customer accounts" },
  { title: "Sales & Invoices", path: "/sales", icon: Receipt, desc: "Bills & payment history" },
  { title: "Suppliers", path: "/suppliers", icon: Truck, desc: "Vendor & purchase orders" },
  { title: "Expenses", path: "/expenses", icon: Wallet, desc: "Track business expenses" },
  { title: "Reconciliation", path: "/reconciliation", icon: BarChart2, desc: "Financial reconciliation" },
];

const TABS = [
  { id: "all", label: "All" },
  { id: "pages", label: "Pages" },
  { id: "products", label: "Products" },
  { id: "customers", label: "Customers" },
  { id: "suppliers", label: "Suppliers" },
  { id: "sales", label: "Sales" },
  { id: "expenses", label: "Expenses" },
];

const RECENT_KEY = "vos_recent_searches";
const MAX_RECENT = 6;

function getRecents() {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]"); }
  catch { return []; }
}

function saveRecent(item) {
  try {
    const prev = getRecents().filter((r) => r.title !== item.title);
    const clean = { title: item.title, path: item.path, subtitle: item.subtitle || "" };
    localStorage.setItem(RECENT_KEY, JSON.stringify([clean, ...prev].slice(0, MAX_RECENT)));
  } catch {}
}

function highlight(text, query) {
  if (!text) return "";
  if (!query || !query.trim()) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{ background: "rgba(0,102,204,0.3)", color: "#60AAFF", borderRadius: "2px", padding: "0 2px" }}>
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

function fmt(amount) {
  if (amount == null) return null;
  return `Rs.${Number(amount).toLocaleString("en-IN")}`;
}

function ResultItem({ item, isActive, onClick, query }) {
  const ref = useRef(null);
  useEffect(() => {
    if (isActive) ref.current?.scrollIntoView({ block: "nearest" });
  }, [isActive]);

  const IconComp = item.icon;

  return (
    <button
      ref={ref}
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150 group cursor-pointer ${
        isActive
          ? "bg-blue-600/20 border border-blue-600/40"
          : "hover:bg-white/5 border border-transparent"
      }`}
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
        isActive ? "bg-blue-600/30" : "bg-white/5 group-hover:bg-white/10"
      }`}>
        {item.avatar ? (
          <span className="text-xs font-bold text-white">{item.avatar}</span>
        ) : IconComp ? (
          <IconComp className={`w-4 h-4 transition-colors ${isActive ? "text-blue-400" : "text-gray-500 group-hover:text-blue-500"}`} />
        ) : null}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-white truncate leading-snug">
          {highlight(String(item.title || ""), query)}
        </p>
        {item.subtitle && (
          <p className="text-[10px] text-gray-500 truncate mt-0.5 leading-snug">{item.subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {item.badge && (
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${item.badgeColor || "bg-white/10 text-gray-400"}`}>
            {item.badge}
          </span>
        )}
        <ChevronRight className={`w-3.5 h-3.5 transition-all ${isActive ? "text-blue-400" : "text-gray-600 opacity-0 group-hover:opacity-100"}`} />
      </div>
    </button>
  );
}

function SectionHeader({ label, count }) {
  return (
    <div className="flex items-center justify-between px-3 py-1.5 mt-1">
      <span className="text-[9px] font-bold text-gray-600 tracking-widest uppercase">{label}</span>
      {count != null && (
        <span className="text-[9px] text-gray-600 bg-white/5 px-1.5 py-0.5 rounded-full">{count}</span>
      )}
    </div>
  );
}

export default function UniversalSearchModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const inputRef = useRef(null);

  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [recents, setRecents] = useState([]);

  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [sales, setSales] = useState([]);
  const [expenses, setExpenses] = useState([]);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setProducts([]); setCustomers([]); setSuppliers([]); setSales([]); setExpenses([]);
      setActiveIdx(0);
      setActiveTab("all");
      setRecents(getRecents());
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setProducts([]); setCustomers([]); setSuppliers([]); setSales([]); setExpenses([]);
      return;
    }
    let mounted = true;
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const should = (tab) => activeTab === "all" || activeTab === tab;
        const [pR, cR, sR, slR, eR] = await Promise.allSettled([
          should("products") ? searchProducts(query) : Promise.resolve(null),
          should("customers") ? searchCustomers(query, 6) : Promise.resolve(null),
          should("suppliers") ? searchSuppliers(query, 6) : Promise.resolve(null),
          should("sales") ? getSales({ search: query, limit: 5 }) : Promise.resolve(null),
          should("expenses") ? getExpenses({ search: query, limit: 5 }) : Promise.resolve(null),
        ]);
        if (!mounted) return;
        if (pR.status === "fulfilled" && pR.value) {
          const d = pR.value?.data ?? pR.value;
          setProducts(Array.isArray(d) ? d.slice(0, 5) : []);
        }
        if (cR.status === "fulfilled" && cR.value) {
          const d = cR.value?.data ?? cR.value;
          setCustomers((Array.isArray(d) ? d : d?.customers ?? []).slice(0, 5));
        }
        if (sR.status === "fulfilled" && sR.value) {
          const d = sR.value?.data ?? sR.value;
          setSuppliers((Array.isArray(d) ? d : d?.suppliers ?? []).slice(0, 5));
        }
        if (slR.status === "fulfilled" && slR.value) {
          const d = slR.value?.data ?? slR.value;
          setSales((Array.isArray(d) ? d : d?.sales ?? []).slice(0, 4));
        }
        if (eR.status === "fulfilled" && eR.value) {
          const d = eR.value?.data ?? eR.value;
          setExpenses((Array.isArray(d) ? d : d?.expenses ?? []).slice(0, 4));
        }
      } catch {}
      finally { if (mounted) setLoading(false); }
    }, 220);
    return () => { mounted = false; clearTimeout(timer); };
  }, [query, activeTab]);

  const filteredPages = query.trim()
    ? PAGES.filter((p) => p.title.toLowerCase().includes(query.toLowerCase()))
    : PAGES;

  function go(path, meta) {
    if (meta) saveRecent({ title: meta.title, path, subtitle: meta.subtitle || "" });
    setRecents(getRecents());
    onClose();
    navigate(path);
  }

  const buildItems = useCallback(() => {
    const items = [];
    const show = (tab) => activeTab === "all" || activeTab === tab;

    if (show("pages")) {
      filteredPages.forEach((p) => items.push({
        key: `page-${p.path}`, section: "Pages", icon: p.icon,
        title: p.title, subtitle: p.desc,
        action: () => go(p.path, { title: p.title, subtitle: p.desc }),
      }));
    }
    if (show("products")) {
      products.forEach((p) => items.push({
        key: `prod-${p._id || p.id}`, section: "Products", icon: Package,
        title: p.name, subtitle: p.sku || p.barcode || "SKU N/A",
        badge: fmt(p.sellingPrice), badgeColor: "bg-orange-500/15 text-orange-400",
        action: () => go("/products", { title: p.name, subtitle: p.sku }),
      }));
    }
    if (show("customers")) {
      customers.forEach((c) => items.push({
        key: `cust-${c._id || c.id}`, section: "Customers", icon: Users,
        title: c.name, subtitle: c.phone || "No phone",
        avatar: (c.name || "C").slice(0, 2).toUpperCase(),
        badge: c.outstandingBalance > 0 ? fmt(c.outstandingBalance) : null,
        badgeColor: "bg-red-500/15 text-red-400",
        action: () => go("/customers", { title: c.name, subtitle: c.phone }),
      }));
    }
    if (show("suppliers")) {
      suppliers.forEach((s) => items.push({
        key: `supp-${s._id || s.id}`, section: "Suppliers", icon: Truck,
        title: s.company || s.contactName || "Supplier", subtitle: s.phone || "",
        badge: s.totalPayable > 0 ? fmt(s.totalPayable) : null,
        badgeColor: "bg-orange-500/15 text-orange-400",
        action: () => go("/suppliers", { title: s.company || s.contactName, subtitle: s.phone }),
      }));
    }
    if (show("sales")) {
      sales.forEach((s) => items.push({
        key: `sale-${s._id || s.id}`, section: "Sales & Invoices", icon: Receipt,
        title: s.invoiceNumber || s.billNumber || `Sale #${(s._id || "").slice(-6)}`,
        subtitle: s.customerName || "Walk-in Customer",
        badge: fmt(s.grandTotal ?? s.totalAmount), badgeColor: "bg-green-500/15 text-green-400",
        action: () => go("/sales", { title: s.invoiceNumber, subtitle: s.customerName }),
      }));
    }
    if (show("expenses")) {
      expenses.forEach((e) => items.push({
        key: `exp-${e._id || e.id}`, section: "Expenses", icon: Wallet,
        title: e.description || e.expenseNumber || "Expense",
        subtitle: e.category || e.paymentMethod || "",
        badge: fmt(e.amount), badgeColor: "bg-red-500/15 text-red-400",
        action: () => go("/expenses", { title: e.description || "Expense" }),
      }));
    }
    return items;
  }, [filteredPages, products, customers, suppliers, sales, expenses, activeTab]);

  const allItems = buildItems();

  useEffect(() => { setActiveIdx(0); }, [query, activeTab]);

  const handleKeyDown = (e) => {
    if (e.key === "Escape") return onClose();
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, allItems.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, 0)); }
    if (e.key === "Enter" && allItems[activeIdx]) allItems[activeIdx].action();
    if (e.key === "Tab") {
      e.preventDefault();
      const ci = TABS.findIndex((t) => t.id === activeTab);
      setActiveTab(TABS[(ci + 1) % TABS.length].id);
    }
  };

  if (!isOpen) return null;

  const sections = [];
  let curSec = null;
  allItems.forEach((item) => {
    if (item.section !== curSec) { curSec = item.section; sections.push({ label: item.section, items: [] }); }
    sections[sections.length - 1].items.push(item);
  });

  let flatIdx = 0;
  const hasResults = allItems.length > 0;
  const showRecents = !query.trim() && recents.length > 0;
  const emptyState = !loading && !hasResults && query.trim().length >= 2;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4" style={{ paddingTop: "8vh" }}>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <div
        className="relative w-full max-w-xl z-10 overflow-hidden flex flex-col rounded-2xl border border-white/10"
        style={{
          maxHeight: "80vh",
          background: "rgba(18,18,20,0.98)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.7)",
          backdropFilter: "blur(40px)",
        }}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 border-b border-white/8" style={{ paddingTop: "14px", paddingBottom: "14px" }}>
          {loading
            ? <div className="w-4 h-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin shrink-0" />
            : <Search className="w-4 h-4 text-blue-500 shrink-0" />
          }
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search products, customers, suppliers, invoices..."
            className="w-full bg-transparent text-sm text-white outline-none font-normal"
            style={{ color: "white", caretColor: "#0066CC" }}
            autoComplete="off"
          />
          <div className="flex items-center gap-2 shrink-0">
            {query && (
              <button onClick={() => setQuery("")} className="p-1 rounded-full text-gray-500 hover:text-white hover:bg-white/10 transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <kbd className="hidden sm:flex items-center text-[9px] text-gray-600 bg-white/5 px-2 py-1 rounded-lg border border-white/10 font-mono">ESC</kbd>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 px-3 py-2 border-b border-white/6 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="px-3 py-1 text-[10px] font-semibold rounded-full whitespace-nowrap transition-all duration-150 cursor-pointer"
              style={activeTab === tab.id
                ? { background: "#0066CC", color: "white", boxShadow: "0 0 12px rgba(0,102,204,0.4)" }
                : { color: "#6E6E73" }
              }
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Results */}
        <div className="overflow-y-auto flex-1 p-2" style={{ scrollbarWidth: "thin" }}>

          {/* Recent searches */}
          {showRecents && (
            <div>
              <SectionHeader label="Recent" />
              {recents.map((r, i) => (
                <ResultItem
                  key={`recent-${i}`}
                  item={{ ...r, icon: Clock, subtitle: r.subtitle || r.path }}
                  isActive={false}
                  query=""
                  onClick={() => go(r.path, r)}
                />
              ))}
            </div>
          )}

          {/* No query hint */}
          {!query.trim() && !showRecents && (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
                style={{ background: "rgba(0,102,204,0.1)", border: "1px solid rgba(0,102,204,0.2)" }}>
                <Search className="w-5 h-5 text-blue-500" />
              </div>
              <p className="text-xs text-white font-medium mb-1">Global Search</p>
              <p className="text-[10px] text-gray-600">Search products, customers, suppliers & more</p>
              <div className="flex items-center justify-center gap-4 mt-4">
                {[["↑↓", "Navigate"], ["↵", "Open"], ["Tab", "Filter"]].map(([key, label]) => (
                  <div key={key} className="flex items-center gap-1.5 text-[9px] text-gray-600">
                    <kbd className="bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-[9px] font-mono">{key}</kbd>
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Grouped results */}
          {hasResults && sections.map((section) => {
            const sectionStart = flatIdx;
            flatIdx += section.items.length;
            return (
              <div key={section.label}>
                <SectionHeader label={section.label} count={section.items.length} />
                {section.items.map((item, i) => {
                  const idx = sectionStart + i;
                  return (
                    <ResultItem key={item.key} item={item} isActive={activeIdx === idx} query={query} onClick={item.action} />
                  );
                })}
              </div>
            );
          })}

          {/* Empty state */}
          {emptyState && (
            <div className="text-center py-10">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mx-auto mb-3">
                <Search className="w-4 h-4 text-gray-600" />
              </div>
              <p className="text-xs text-white font-medium mb-1">No results for "{query}"</p>
              <p className="text-[10px] text-gray-600">Try a different keyword or check spelling</p>
            </div>
          )}

          {/* Loading shimmer */}
          {loading && query.trim().length >= 2 && (
            <div className="space-y-1 p-1">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl">
                  <div className="w-8 h-8 rounded-lg bg-white/5 animate-pulse" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-2.5 w-32 bg-white/5 rounded animate-pulse" />
                    <div className="h-2 w-20 bg-white/5 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-white/6" style={{ background: "rgba(255,255,255,0.02)" }}>
          <div className="flex items-center gap-1 text-[9px] text-gray-600">
            <Keyboard className="w-3 h-3" />
            <span>{allItems.length > 0 ? `${allItems.length} result${allItems.length !== 1 ? "s" : ""}` : "Type to search"}</span>
          </div>
          <div className="flex items-center gap-1 text-[9px] text-gray-600">
            <kbd className="bg-white/5 border border-white/10 px-1.5 py-0.5 rounded font-mono">Ctrl+K</kbd>
            <span>to open</span>
          </div>
        </div>
      </div>
    </div>
  );
}
