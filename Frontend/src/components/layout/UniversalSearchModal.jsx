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
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { searchProducts } from "../../services/product.api";
import { searchCustomers } from "../../services/customer.api";
import { searchSuppliers } from "../../services/supplier.api";
import { getSales } from "../../services/sale.api";
import { getExpenses } from "../../services/expense.api";

const PAGES = [
  { title: "Dashboard", path: "/dashboard", icon: LayoutDashboard, desc: "Overview & real-time analytics" },
  { title: "POS Terminal", path: "/pos", icon: ShoppingCart, desc: "Barcode billing & quick checkout" },
  { title: "Products", path: "/products", icon: Package, desc: "Catalog, SKU, prices & categories" },
  { title: "Inventory", path: "/inventory", icon: Boxes, desc: "Stock audit trail & low-stock alerts" },
  { title: "Customers", path: "/customers", icon: Users, desc: "Khata, credit ledger & 360° CRM" },
  { title: "Sales & Invoices", path: "/sales", icon: Receipt, desc: "Bills, payment receipts & history" },
  { title: "Suppliers", path: "/suppliers", icon: Truck, desc: "Vendors & accounts payable ledger" },
  { title: "Purchase Orders", path: "/purchases", icon: Truck, desc: "Procurement pipelines & vendor orders" },
  { title: "Goods Received (GRN)", path: "/grn", icon: Boxes, desc: "Physical delivery stock-in verification" },
  { title: "Expenses", path: "/expenses", icon: Wallet, desc: "Track operational cash burn & OpEx" },
  { title: "Profit & Analytics", path: "/analytics", icon: BarChart2, desc: "P&L waterfall & product profit matrix" },
  { title: "Reconciliation", path: "/reconciliation", icon: BarChart2, desc: "Ledger drift & stock discrepancy checks" },
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
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveRecent(item) {
  try {
    const prev = getRecents().filter((r) => r.title !== item.title);
    const clean = { title: item.title, path: item.path, subtitle: item.subtitle || "" };
    localStorage.setItem(RECENT_KEY, JSON.stringify([clean, ...prev].slice(0, MAX_RECENT)));
  } catch {}
}

/**
 * Intelligent Multi-Token Highlighter
 * Highlights any matching word even if typed in different order or with partial match.
 */
function highlight(text, query) {
  if (!text) return "";
  if (!query || !query.trim()) return text;

  const raw = String(text);
  const tokens = query
    .trim()
    .split(/\s+/)
    .filter((t) => t.length > 0)
    .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));

  if (tokens.length === 0) return raw;

  try {
    const regex = new RegExp(`(${tokens.join("|")})`, "gi");
    const parts = raw.split(regex);

    return (
      <>
        {parts.map((part, i) =>
          regex.test(part) ? (
            <mark
              key={i}
              style={{
                background: "rgba(0,102,204,0.35)",
                color: "#60AAFF",
                borderRadius: "3px",
                padding: "0 3px",
                fontWeight: 600,
              }}
            >
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  } catch {
    return raw;
  }
}

function fmt(amount) {
  if (amount == null) return null;
  return `₹${Number(amount).toLocaleString("en-IN")}`;
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
      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition-all duration-150 group cursor-pointer ${
        isActive
          ? "bg-[#0066CC]/20 border border-[#0066CC]/50 shadow-[0_0_15px_rgba(0,102,204,0.2)]"
          : "hover:bg-white/5 border border-transparent"
      }`}
    >
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
          isActive ? "bg-[#0066CC]/35" : "bg-white/5 group-hover:bg-white/10"
        }`}
      >
        {item.avatar ? (
          <span className="text-xs font-bold text-white">{item.avatar}</span>
        ) : IconComp ? (
          <IconComp
            className={`w-4 h-4 transition-colors ${
              isActive ? "text-[#54A7FF]" : "text-gray-400 group-hover:text-blue-400"
            }`}
          />
        ) : null}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-xs font-medium text-white truncate leading-snug">
            {highlight(String(item.title || ""), query)}
          </p>
          {item.tag && (
            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-white/10 text-zinc-400">
              {item.tag}
            </span>
          )}
        </div>
        {item.subtitle && (
          <p className="text-[10px] text-zinc-400 truncate mt-0.5 leading-snug">
            {highlight(String(item.subtitle || ""), query)}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {item.badge && (
          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
              item.badgeColor || "bg-white/10 text-gray-400"
            }`}
          >
            {item.badge}
          </span>
        )}
        <ChevronRight
          className={`w-3.5 h-3.5 transition-all ${
            isActive ? "text-[#54A7FF] translate-x-0.5" : "text-gray-600 opacity-0 group-hover:opacity-100"
          }`}
        />
      </div>
    </button>
  );
}

function SectionHeader({ label, count }) {
  return (
    <div className="flex items-center justify-between px-3 py-1.5 mt-2 mb-1">
      <span className="text-[9px] font-bold text-zinc-500 tracking-widest uppercase">{label}</span>
      {count != null && (
        <span className="text-[9px] text-zinc-500 bg-white/5 px-2 py-0.5 rounded-full font-medium">
          {count}
        </span>
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
  const [suggestedQuery, setSuggestedQuery] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setProducts([]);
      setCustomers([]);
      setSuppliers([]);
      setSales([]);
      setExpenses([]);
      setSuggestedQuery(null);
      setActiveIdx(0);
      setActiveTab("all");
      setRecents(getRecents());
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [isOpen]);

  // Fast debounced search execution (120ms for instant feel)
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setProducts([]);
      setCustomers([]);
      setSuppliers([]);
      setSales([]);
      setExpenses([]);
      setSuggestedQuery(null);
      setLoading(false);
      return;
    }

    let mounted = true;
    setLoading(true);

    const timer = setTimeout(async () => {
      try {
        const should = (tab) => activeTab === "all" || activeTab === tab;
        const prodLimit = activeTab === "products" ? 20 : 8;

        const [pR, cR, sR, slR, eR] = await Promise.allSettled([
          should("products") ? searchProducts({ q: trimmed, limit: prodLimit }) : Promise.resolve(null),
          should("customers") ? searchCustomers(trimmed, 6) : Promise.resolve(null),
          should("suppliers") ? searchSuppliers(trimmed, 6) : Promise.resolve(null),
          should("sales") ? getSales({ search: trimmed, limit: 5 }) : Promise.resolve(null),
          should("expenses") ? getExpenses({ search: trimmed, limit: 5 }) : Promise.resolve(null),
        ]);

        if (!mounted) return;

        if (pR.status === "fulfilled" && pR.value) {
          const res = pR.value;
          const d = res.data ?? res;
          setProducts(Array.isArray(d) ? d : []);
          setSuggestedQuery(res.suggestedQuery || null);
        } else {
          setProducts([]);
          setSuggestedQuery(null);
        }

        if (cR.status === "fulfilled" && cR.value) {
          const d = cR.value?.data ?? cR.value;
          setCustomers((Array.isArray(d) ? d : d?.customers ?? []).slice(0, 6));
        } else {
          setCustomers([]);
        }

        if (sR.status === "fulfilled" && sR.value) {
          const d = sR.value?.data ?? sR.value;
          setSuppliers((Array.isArray(d) ? d : d?.suppliers ?? []).slice(0, 6));
        } else {
          setSuppliers([]);
        }

        if (slR.status === "fulfilled" && slR.value) {
          const d = slR.value?.data ?? slR.value;
          setSales((Array.isArray(d) ? d : d?.sales ?? []).slice(0, 5));
        } else {
          setSales([]);
        }

        if (eR.status === "fulfilled" && eR.value) {
          const d = eR.value?.data ?? eR.value;
          setExpenses((Array.isArray(d) ? d : d?.expenses ?? []).slice(0, 5));
        } else {
          setExpenses([]);
        }
      } catch (err) {
        console.error("Universal Search error:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }, 120);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [query, activeTab]);

  const filteredPages = query.trim()
    ? PAGES.filter((p) => {
        const q = query.toLowerCase();
        return p.title.toLowerCase().includes(q) || (p.desc && p.desc.toLowerCase().includes(q));
      })
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
      filteredPages.forEach((p) =>
        items.push({
          key: `page-${p.path}`,
          section: "Pages & Modules",
          icon: p.icon,
          title: p.title,
          subtitle: p.desc,
          action: () => go(p.path, { title: p.title, subtitle: p.desc }),
        })
      );
    }

    if (show("products")) {
      products.forEach((p) => {
        let badge = fmt(p.sellingPrice);
        let badgeColor = "bg-orange-500/15 text-orange-400";
        let tag = null;

        // Exact Barcode / SKU / Name match boost
        if (
          p.matchType === "EXACT_BARCODE" ||
          p.matchType === "EXACT_SKU" ||
          p.matchType === "EXACT_NAME"
        ) {
          badge = "Exact Match";
          badgeColor = "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30";
          tag = "EXACT";
        } else if (p.matchType === "FUZZY_TYPO") {
          badge = "Similar Item";
          badgeColor = "bg-purple-500/20 text-purple-300 border border-purple-500/30";
          tag = "TYPO MATCH";
        } else if (p.availableStock !== undefined && p.availableStock <= 0) {
          badge = "Out of Stock";
          badgeColor = "bg-red-500/20 text-red-400";
        }

        const subtitleParts = [p.sku, p.barcode, p.category?.name].filter(Boolean);

        items.push({
          key: `prod-${p._id || p.id}`,
          section: "Products Catalog",
          icon: Package,
          title: p.name,
          subtitle: subtitleParts.join(" • ") || "SKU N/A",
          badge,
          badgeColor,
          tag,
          action: () => go("/products", { title: p.name, subtitle: p.sku }),
        });
      });
    }

    if (show("customers")) {
      customers.forEach((c) =>
        items.push({
          key: `cust-${c._id || c.id}`,
          section: "Customers (Khata / CRM)",
          icon: Users,
          title: c.name,
          subtitle: c.phone || "No phone registered",
          avatar: (c.name || "C").slice(0, 2).toUpperCase(),
          badge: c.currentBalance > 0 ? `Udhaar: ${fmt(c.currentBalance)}` : "All Clear",
          badgeColor: c.currentBalance > 0 ? "bg-red-500/20 text-red-400" : "bg-emerald-500/20 text-emerald-400",
          action: () => go("/customers", { title: c.name, subtitle: c.phone }),
        })
      );
    }

    if (show("suppliers")) {
      suppliers.forEach((s) =>
        items.push({
          key: `supp-${s._id || s.id}`,
          section: "Suppliers & Vendors",
          icon: Truck,
          title: s.company || s.contactName || "Supplier",
          subtitle: [s.contactName, s.phone, s.city].filter(Boolean).join(" • "),
          badge: s.currentBalance > 0 ? `Payable: ${fmt(s.currentBalance)}` : null,
          badgeColor: "bg-orange-500/20 text-orange-400",
          action: () => go("/suppliers", { title: s.company || s.contactName, subtitle: s.phone }),
        })
      );
    }

    if (show("sales")) {
      sales.forEach((s) =>
        items.push({
          key: `sale-${s._id || s.id}`,
          section: "Sales & Invoices",
          icon: Receipt,
          title: s.invoiceNumber || `Invoice #${(s._id || "").slice(-6)}`,
          subtitle: `${s.customerName || "Walk-in"} • ${s.paymentMode || "Paid"}`,
          badge: fmt(s.grandTotal ?? s.totalAmount),
          badgeColor: "bg-green-500/15 text-green-400",
          action: () => go("/sales", { title: s.invoiceNumber, subtitle: s.customerName }),
        })
      );
    }

    if (show("expenses")) {
      expenses.forEach((e) =>
        items.push({
          key: `exp-${e._id || e.id}`,
          section: "Expenses & OpEx",
          icon: Wallet,
          title: e.description || e.expenseNumber || "Expense",
          subtitle: [e.category, e.paymentMethod].filter(Boolean).join(" • "),
          badge: fmt(e.amount),
          badgeColor: "bg-red-500/15 text-red-400",
          action: () => go("/expenses", { title: e.description || "Expense" }),
        })
      );
    }

    return items;
  }, [filteredPages, products, customers, suppliers, sales, expenses, activeTab]);

  const allItems = buildItems();

  useEffect(() => {
    setActiveIdx(0);
  }, [query, activeTab]);

  const handleKeyDown = (e) => {
    if (e.key === "Escape") return onClose();
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, allItems.length - 1));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    }
    if (e.key === "Enter" && allItems[activeIdx]) {
      allItems[activeIdx].action();
    }
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
    if (item.section !== curSec) {
      curSec = item.section;
      sections.push({ label: item.section, items: [] });
    }
    sections[sections.length - 1].items.push(item);
  });

  let flatIdx = 0;
  const hasResults = allItems.length > 0;
  const showRecents = !query.trim() && recents.length > 0;
  const emptyState = !loading && !hasResults && query.trim().length > 0;

  // Check if typo suggestion exists
  const hasTypoCorrection = suggestedQuery && products.length > 0 && products[0].matchType === "FUZZY_TYPO";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4" style={{ paddingTop: "7vh" }}>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <div
        className="relative w-full max-w-xl z-10 overflow-hidden flex flex-col rounded-2xl border border-white/12"
        style={{
          maxHeight: "82vh",
          background: "rgba(18, 18, 20, 0.98)",
          boxShadow: "0 32px 90px rgba(0,0,0,0.85)",
          backdropFilter: "blur(40px)",
        }}
      >
        {/* Search Input Bar */}
        <div
          className="flex items-center gap-3 px-4 border-b border-white/10"
          style={{ paddingTop: "14px", paddingBottom: "14px" }}
        >
          {loading ? (
            <div className="w-4 h-4 rounded-full border-2 border-[#0066CC] border-t-transparent animate-spin shrink-0" />
          ) : (
            <Search className="w-4 h-4 text-[#0066CC] shrink-0" />
          )}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search products by name/barcode/SKU, customers, suppliers..."
            className="w-full bg-transparent text-sm text-white outline-none font-normal placeholder-zinc-500"
            style={{ caretColor: "#0066CC" }}
            autoComplete="off"
          />
          <div className="flex items-center gap-2 shrink-0">
            {query && (
              <button
                onClick={() => setQuery("")}
                className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <kbd className="hidden sm:flex items-center text-[9px] text-zinc-500 bg-white/5 px-2 py-1 rounded-lg border border-white/10 font-mono">
              ESC
            </kbd>
          </div>
        </div>

        {/* Filter Tabs Bar */}
        <div
          className="flex items-center gap-1.5 px-3 py-2 border-b border-white/8 overflow-x-auto scrollbar-none"
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="px-3 py-1 text-[11px] font-semibold rounded-full whitespace-nowrap transition-all duration-150 cursor-pointer"
              style={
                activeTab === tab.id
                  ? { background: "#0066CC", color: "white", boxShadow: "0 0 12px rgba(0,102,204,0.4)" }
                  : { color: "#8E8E93", background: "rgba(255,255,255,0.04)" }
              }
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Typo Suggestion Banner */}
        {hasTypoCorrection && (
          <div className="mx-3 mt-2 px-3 py-2 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-between text-xs transition-all">
            <div className="flex items-center gap-2 text-purple-300 truncate">
              <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
              <span className="truncate">
                Showing similar items for <strong>"{query}"</strong>. Did you mean{" "}
                <strong className="text-white">"{suggestedQuery}"</strong>?
              </span>
            </div>
            <button
              onClick={() => setQuery(suggestedQuery)}
              className="text-[11px] font-semibold text-purple-400 hover:text-white underline cursor-pointer shrink-0 ml-2"
            >
              Search exact
            </button>
          </div>
        )}

        {/* Results Container */}
        <div className="overflow-y-auto flex-1 p-2 scrollbar-thin">
          {/* Recent Searches */}
          {showRecents && (
            <div>
              <SectionHeader label="Recent Searches" />
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

          {/* Empty Prompt / Keyboard Hints */}
          {!query.trim() && !showRecents && (
            <div className="text-center py-8">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
                style={{ background: "rgba(0,102,204,0.1)", border: "1px solid rgba(0,102,204,0.25)" }}
              >
                <Search className="w-5 h-5 text-blue-400" />
              </div>
              <p className="text-xs text-white font-semibold mb-1">Global Smart Search</p>
              <p className="text-[11px] text-zinc-400">
                Type keywords, SKU, scan barcode, or search by customer name
              </p>
              <div className="flex items-center justify-center gap-4 mt-5">
                {[
                  ["↑↓", "Navigate"],
                  ["↵", "Open"],
                  ["Tab", "Switch Filter"],
                  ["ESC", "Close"],
                ].map(([key, label]) => (
                  <div key={key} className="flex items-center gap-1.5 text-[10px] text-zinc-500">
                    <kbd className="bg-white/5 border border-white/10 px-1.5 py-0.5 rounded font-mono text-[9px] text-zinc-400">
                      {key}
                    </kbd>
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Grouped Results */}
          {hasResults &&
            sections.map((section) => {
              const sectionStart = flatIdx;
              flatIdx += section.items.length;
              return (
                <div key={section.label}>
                  <SectionHeader label={section.label} count={section.items.length} />
                  {section.items.map((item, i) => {
                    const idx = sectionStart + i;
                    return (
                      <ResultItem
                        key={item.key}
                        item={item}
                        isActive={activeIdx === idx}
                        query={query}
                        onClick={item.action}
                      />
                    );
                  })}
                </div>
              );
            })}

          {/* Empty State */}
          {emptyState && (
            <div className="text-center py-10 px-4">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mx-auto mb-3">
                <Search className="w-4 h-4 text-zinc-500" />
              </div>
              <p className="text-xs text-white font-medium mb-1">No items found for "{query}"</p>
              <p className="text-[11px] text-zinc-500 max-w-sm mx-auto">
                No exact or similar items matched your query. Check if the product or customer is registered.
              </p>
            </div>
          )}

          {/* Loading Shimmer */}
          {loading && query.trim().length > 0 && (
            <div className="space-y-1 p-1">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl">
                  <div className="w-8 h-8 rounded-lg bg-white/5 animate-pulse" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-2.5 w-36 bg-white/5 rounded animate-pulse" />
                    <div className="h-2 w-24 bg-white/5 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          className="flex items-center justify-between px-4 py-2.5 border-t border-white/8 text-[10px] text-zinc-500"
          style={{ background: "rgba(255,255,255,0.02)" }}
        >
          <div className="flex items-center gap-1.5">
            <Keyboard className="w-3.5 h-3.5 text-zinc-400" />
            <span>
              {allItems.length > 0
                ? `${allItems.length} result${allItems.length !== 1 ? "s" : ""} found`
                : "Type to search"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-zinc-400">
              <strong className="text-zinc-300">Exact & Typo-Resilient</strong> Search
            </span>
            <div className="flex items-center gap-1">
              <kbd className="bg-white/5 border border-white/10 px-1.5 py-0.5 rounded font-mono text-[9px]">
                Ctrl+K
              </kbd>
              <span>anywhere</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
