import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Package,
  Boxes,
  Users,
  ShoppingCart,
  LogOut,
  AlertTriangle,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRightLeft,
  RefreshCw,
  Search,
  Plus,
  ChevronRight,
  Menu,
  X,
  History,
  Activity,
  IndianRupee,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  getInventorySummary,
  getInventoryLedger,
  getInventoryAlerts,
  getInventoryAlertsSummary,
} from "../../services/inventory.api";
import { getProducts } from "../../services/product.api";
import { getCustomers } from "../../services/customer.api";
import { getMyBusiness } from "../../services/business.api";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Navigation / UI State
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Data States
  const [business, setBusiness] = useState(null);
  const [invSummary, setInvSummary] = useState({
    totalProducts: 0,
    inStockCount: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    totalStockQuantity: 0,
    totalValuation: 0,
  });
  const [alertsSummary, setAlertsSummary] = useState({
    totalActive: 0,
    unreadCount: 0,
    acknowledgedCount: 0,
    criticalCount: 0,
    warningCount: 0,
  });
  const [recentLedger, setRecentLedger] = useState([]);
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [recentProducts, setRecentProducts] = useState([]);
  const [customersCount, setCustomersCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  // Live Clock Tick
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch all dashboard metrics
  const fetchDashboardData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const results = await Promise.allSettled([
        getInventorySummary(),
        getInventoryAlertsSummary(),
        getInventoryAlerts({ limit: 5 }),
        getInventoryLedger({ limit: 6 }),
        getProducts({ limit: 6 }),
        getCustomers(),
        getMyBusiness(),
      ]);

      // 1. Inventory Summary
      if (results[0].status === "fulfilled" && results[0].value) {
        const d = results[0].value.data || results[0].value;
        setInvSummary({
          totalProducts: d.totalProducts || 0,
          inStockCount: d.inStockCount || 0,
          lowStockCount: d.lowStockCount || 0,
          outOfStockCount: d.outOfStockCount || 0,
          totalStockQuantity: d.totalStockQuantity || 0,
          totalValuation: d.totalValuation || 0,
        });
      }

      // 2. Alerts Summary
      if (results[1].status === "fulfilled" && results[1].value) {
        const d = results[1].value.data || results[1].value;
        setAlertsSummary({
          totalActive: d.totalActive || 0,
          unreadCount: d.unreadCount || 0,
          acknowledgedCount: d.acknowledgedCount || 0,
          criticalCount: d.criticalCount || 0,
          warningCount: d.warningCount || 0,
        });
      }

      // 3. Priority Low-Stock Alerts
      if (results[2].status === "fulfilled" && results[2].value) {
        const d = results[2].value.data || results[2].value;
        setActiveAlerts(Array.isArray(d) ? d : d?.alerts || []);
      }

      // 4. Recent Stock Ledger Movements
      if (results[3].status === "fulfilled" && results[3].value) {
        const d = results[3].value.data || results[3].value;
        setRecentLedger(Array.isArray(d) ? d : d?.entries || []);
      }

      // 5. Recent Products
      if (results[4].status === "fulfilled" && results[4].value) {
        const d = results[4].value.data || results[4].value;
        setRecentProducts(Array.isArray(d) ? d : d?.products || []);
      }

      // 6. Customers Count
      if (results[5].status === "fulfilled" && results[5].value) {
        const d = results[5].value.data || results[5].value;
        const custs = Array.isArray(d) ? d : d?.customers || [];
        setCustomersCount(custs.length);
      }

      // 7. Business Info
      if (results[6].status === "fulfilled" && results[6].value) {
        const d = results[6].value.data || results[6].value;
        const biz = Array.isArray(d) ? d[0] : d?.business || d;
        if (biz) setBusiness(biz);
      }
    } catch (err) {
      console.error("Error loading dashboard metrics:", err);
      toast.error("Failed to load some dashboard data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Derived stock health percentages
  const totalTracked = invSummary.totalProducts || 1;
  const inStockPct = Math.round((invSummary.inStockCount / totalTracked) * 100) || 0;
  const lowStockPct = Math.round((invSummary.lowStockCount / totalTracked) * 100) || 0;
  const outOfStockPct = Math.round((invSummary.outOfStockCount / totalTracked) * 100) || 0;

  // Handle Quick Product Search Jump
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  return (
    <div className="min-h-screen flex bg-background text-foreground selection:bg-primary/20">
      {/* ── Sidebar (Desktop) ── */}
      <aside className="w-64 border-r border-border/80 bg-card/40 backdrop-blur-md flex-col justify-between hidden md:flex shrink-0 p-4 sticky top-0 h-screen">
        <div className="space-y-6">
          {/* Logo & Business Brand */}
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-neutral-700 to-neutral-900 border border-border flex items-center justify-center text-primary-foreground font-black text-lg shadow-sm">
              V
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base tracking-tight text-foreground">VendorOS</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                  PRO
                </span>
              </div>
              <p className="text-xs text-muted-foreground truncate max-w-[140px]">
                {business?.businessName || "Retail Store"}
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            <Link
              to="/dashboard"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium bg-neutral-800/90 text-foreground border border-neutral-700/50 shadow-sm transition-all"
            >
              <LayoutDashboard className="w-4 h-4 text-emerald-400" />
              <span>Dashboard</span>
            </Link>
            <Link
              to="/pos"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-neutral-800/40 transition-all group"
            >
              <ShoppingCart className="w-4 h-4 text-neutral-400 group-hover:text-primary transition-colors" />
              <div className="flex items-center justify-between flex-1">
                <span>POS Terminal</span>
                <span className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.2 rounded">
                  Live
                </span>
              </div>
            </Link>
            <Link
              to="/products"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-neutral-800/40 transition-all group"
            >
              <Package className="w-4 h-4 text-neutral-400 group-hover:text-primary transition-colors" />
              <div className="flex items-center justify-between flex-1">
                <span>Products Catalog</span>
                <span className="text-xs text-muted-foreground font-mono">
                  {invSummary.totalProducts}
                </span>
              </div>
            </Link>
            <Link
              to="/inventory"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-neutral-800/40 transition-all group"
            >
              <Boxes className="w-4 h-4 text-neutral-400 group-hover:text-primary transition-colors" />
              <div className="flex items-center justify-between flex-1">
                <span>Inventory & Ledger</span>
                {invSummary.lowStockCount + invSummary.outOfStockCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                )}
              </div>
            </Link>
            <Link
              to="/customers"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-neutral-800/40 transition-all group"
            >
              <Users className="w-4 h-4 text-neutral-400 group-hover:text-primary transition-colors" />
              <span>Customers & Khata</span>
            </Link>
          </nav>
        </div>

        {/* User / Store Bottom Card */}
        <div className="pt-4 border-t border-border/60 space-y-3">
          <div className="px-2 py-2 rounded-xl bg-neutral-900/50 border border-border/40">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-neutral-800 border border-border flex items-center justify-center text-xs font-semibold text-primary">
                {user?.fullName ? user.fullName[0].toUpperCase() : "V"}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-foreground truncate">
                  {user?.fullName || "Store Owner"}
                </p>
                <p className="text-[11px] text-muted-foreground truncate">{user?.phone || user?.email}</p>
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/20 border border-transparent transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ── Mobile Sidebar Drawer ── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-72 bg-card border-r border-border z-50 p-5 flex flex-col justify-between md:hidden shadow-2xl"
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-neutral-700 flex items-center justify-center text-primary-foreground font-black text-sm">
                      V
                    </div>
                    <span className="font-bold text-foreground">VendorOS</span>
                  </div>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-neutral-800"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <nav className="space-y-1.5">
                  <Link
                    to="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium bg-neutral-800 text-foreground"
                  >
                    <LayoutDashboard className="w-4 h-4 text-emerald-400" />
                    <span>Dashboard</span>
                  </Link>
                  <Link
                    to="/pos"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-neutral-800"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>POS Terminal</span>
                  </Link>
                  <Link
                    to="/products"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-neutral-800"
                  >
                    <Package className="w-4 h-4" />
                    <span>Products</span>
                  </Link>
                  <Link
                    to="/inventory"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-neutral-800"
                  >
                    <Boxes className="w-4 h-4" />
                    <span>Inventory & Ledger</span>
                  </Link>
                  <Link
                    to="/customers"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-neutral-800"
                  >
                    <Users className="w-4 h-4" />
                    <span>Customers</span>
                  </Link>
                </nav>
              </div>

              <div className="pt-4 border-t border-border space-y-3">
                <button
                  onClick={logout}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-500/10"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Main Content Area ── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Sticky Header */}
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/70 px-4 md:px-8 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-neutral-800 md:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-foreground">
                  {business?.businessName || "Store Dashboard"}
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Sync
                </span>
              </div>
              <p className="text-xs text-muted-foreground hidden sm:block">
                {currentTime.toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}{" "}
                • {currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>

          {/* Quick Search + Actions Header Bar */}
          <div className="flex items-center gap-2 sm:gap-3">
            <form onSubmit={handleSearchSubmit} className="relative hidden lg:block w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Quick SKU / product search..."
                className="w-full bg-neutral-900/80 border border-border/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
              />
            </form>

            <button
              onClick={() => fetchDashboardData(true)}
              disabled={refreshing}
              title="Refresh Dashboard Data"
              className="p-2 rounded-xl border border-border/80 text-muted-foreground hover:text-foreground hover:bg-neutral-800/80 transition-all active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-primary" : ""}`} />
            </button>

            <Link
              to="/products?action=add"
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-neutral-800 text-foreground border border-neutral-700/60 hover:bg-neutral-700/70 transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5 text-primary" />
              <span>Add Product</span>
            </Link>

            <Link
              to="/pos"
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-600 text-black hover:opacity-95 shadow-md shadow-emerald-500/10 transition-all active:scale-95"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Launch POS</span>
            </Link>
          </div>
        </header>

        {/* Dashboard Body Content */}
        <div className="p-4 md:p-8 space-y-6 max-w-7xl w-full mx-auto">
          {/* ── KPI Metric Cards Grid ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Catalog SKUs */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => navigate("/products")}
              className="group p-5 rounded-2xl bg-gradient-to-b from-neutral-900/90 to-neutral-900/40 border border-neutral-800 hover:border-neutral-700 transition-all cursor-pointer shadow-sm relative overflow-hidden"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Catalog SKUs
                  </p>
                  <h3 className="text-3xl font-black tracking-tight text-foreground mt-2 font-mono">
                    {loading ? "..." : invSummary.totalProducts}
                  </h3>
                </div>
                <div className="p-2.5 rounded-xl bg-neutral-800/80 border border-neutral-700/60 text-primary group-hover:scale-110 transition-transform">
                  <Package className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  {invSummary.inStockCount} In-Stock
                </span>
                <span className="flex items-center gap-1 text-muted-foreground group-hover:text-foreground transition-colors">
                  View Catalog <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </motion.div>

            {/* Card 2: Physical Inventory & Valuation */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: 0.05 }}
              onClick={() => navigate("/inventory")}
              className="group p-5 rounded-2xl bg-gradient-to-b from-neutral-900/90 to-neutral-900/40 border border-neutral-800 hover:border-neutral-700 transition-all cursor-pointer shadow-sm relative overflow-hidden"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Total Asset Valuation
                  </p>
                  <h3 className="text-3xl font-black tracking-tight text-emerald-400 mt-2 font-mono">
                    {loading ? "..." : `₹${(invSummary.totalValuation || 0).toLocaleString("en-IN")}`}
                  </h3>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 group-hover:scale-110 transition-transform">
                  <IndianRupee className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
                <span className="text-muted-foreground font-mono">
                  {invSummary.totalStockQuantity} total physical units
                </span>
                <span className="flex items-center gap-1 text-muted-foreground group-hover:text-foreground transition-colors">
                  Store Audit <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </motion.div>

            {/* Card 3: Stock Health & Low Stock Alerts */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: 0.1 }}
              onClick={() => navigate("/inventory")}
              className="group p-5 rounded-2xl bg-gradient-to-b from-neutral-900/90 to-neutral-900/40 border border-neutral-800 hover:border-amber-500/30 transition-all cursor-pointer shadow-sm relative overflow-hidden"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Stock Alerts
                  </p>
                  <div className="flex items-baseline gap-2 mt-2">
                    <h3 className="text-3xl font-black tracking-tight text-amber-400 font-mono">
                      {loading ? "..." : invSummary.lowStockCount + invSummary.outOfStockCount}
                    </h3>
                    <span className="text-xs text-muted-foreground font-medium">SKUs to restock</span>
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 group-hover:scale-110 transition-transform">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-xs">
                <span className="text-rose-400 font-semibold">
                  {invSummary.outOfStockCount} Out of Stock
                </span>
                <span className="text-amber-400 font-semibold">
                  {invSummary.lowStockCount} Low Stock
                </span>
              </div>
            </motion.div>

            {/* Card 4: Customers & Khata */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: 0.15 }}
              onClick={() => navigate("/customers")}
              className="group p-5 rounded-2xl bg-gradient-to-b from-neutral-900/90 to-neutral-900/40 border border-neutral-800 hover:border-neutral-700 transition-all cursor-pointer shadow-sm relative overflow-hidden"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Registered Customers
                  </p>
                  <h3 className="text-3xl font-black tracking-tight text-foreground mt-2 font-mono">
                    {loading ? "..." : customersCount}
                  </h3>
                </div>
                <div className="p-2.5 rounded-xl bg-neutral-800/80 border border-neutral-700/60 text-primary group-hover:scale-110 transition-transform">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
                <span>Khata Ledger Ready</span>
                <span className="flex items-center gap-1 text-muted-foreground group-hover:text-foreground transition-colors">
                  Manage <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </motion.div>
          </div>

          {/* ── Store Stock Health Breakdown Visualizer ── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="p-5 md:p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800/90 shadow-sm space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  Store Inventory Health Status
                </h4>
                <p className="text-xs text-muted-foreground">
                  Real-time stock ratio across {invSummary.totalProducts} tracked products
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  In Stock ({inStockPct}%)
                </span>
                <span className="flex items-center gap-1.5 text-amber-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  Low Stock ({lowStockPct}%)
                </span>
                <span className="flex items-center gap-1.5 text-rose-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  Out of Stock ({outOfStockPct}%)
                </span>
              </div>
            </div>

            {/* Visual Multi-Segment Bar */}
            <div className="w-full h-3.5 rounded-full bg-neutral-800 overflow-hidden flex p-0.5 border border-neutral-700/50">
              <div
                style={{ width: `${inStockPct}%` }}
                className="h-full bg-emerald-500 rounded-l-full transition-all duration-500 hover:brightness-110"
                title={`In Stock: ${invSummary.inStockCount} items (${inStockPct}%)`}
              />
              <div
                style={{ width: `${lowStockPct}%` }}
                className="h-full bg-amber-500 transition-all duration-500 hover:brightness-110"
                title={`Low Stock: ${invSummary.lowStockCount} items (${lowStockPct}%)`}
              />
              <div
                style={{ width: `${outOfStockPct}%` }}
                className="h-full bg-rose-500 rounded-r-full transition-all duration-500 hover:brightness-110"
                title={`Out of Stock: ${invSummary.outOfStockCount} items (${outOfStockPct}%)`}
              />
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-neutral-900/90 border border-neutral-800 text-center">
                <p className="text-[11px] text-muted-foreground uppercase font-semibold">Healthy Items</p>
                <p className="text-base font-bold text-emerald-400 mt-0.5 font-mono">
                  {invSummary.inStockCount} SKUs
                </p>
              </div>
              <div className="p-3 rounded-xl bg-neutral-900/90 border border-neutral-800 text-center">
                <p className="text-[11px] text-muted-foreground uppercase font-semibold">Low Limit Warnings</p>
                <p className="text-base font-bold text-amber-400 mt-0.5 font-mono">
                  {invSummary.lowStockCount} SKUs
                </p>
              </div>
              <div className="p-3 rounded-xl bg-neutral-900/90 border border-neutral-800 text-center">
                <p className="text-[11px] text-muted-foreground uppercase font-semibold">Zero Stock Critical</p>
                <p className="text-base font-bold text-rose-400 mt-0.5 font-mono">
                  {invSummary.outOfStockCount} SKUs
                </p>
              </div>
            </div>
          </motion.div>

          {/* ── Quick Action Command Hub ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
            <Link
              to="/pos"
              className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 hover:border-emerald-500/40 transition-all group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 group-hover:scale-110 transition-transform">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-emerald-400 opacity-60 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="mt-4">
                <p className="text-sm font-bold text-foreground group-hover:text-emerald-300 transition-colors">
                  POS Terminal
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">Quick barcode billing & receipts</p>
              </div>
            </Link>

            <Link
              to="/products?action=add"
              className="p-4 rounded-2xl bg-neutral-900/70 border border-neutral-800 hover:border-neutral-700 transition-all group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-xl bg-neutral-800 text-primary group-hover:scale-110 transition-transform">
                  <Plus className="w-5 h-5" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-60 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="mt-4">
                <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                  New Product
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">Create catalog item & pricing</p>
              </div>
            </Link>

            <Link
              to="/inventory"
              className="p-4 rounded-2xl bg-neutral-900/70 border border-neutral-800 hover:border-neutral-700 transition-all group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-xl bg-neutral-800 text-primary group-hover:scale-110 transition-transform">
                  <Boxes className="w-5 h-5" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-60 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="mt-4">
                <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                  Stock Movement
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">Stock IN / Adjust / Audit trail</p>
              </div>
            </Link>

            <Link
              to="/customers"
              className="p-4 rounded-2xl bg-neutral-900/70 border border-neutral-800 hover:border-neutral-700 transition-all group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-xl bg-neutral-800 text-primary group-hover:scale-110 transition-transform">
                  <Users className="w-5 h-5" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-60 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="mt-4">
                <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                  Khata & Ledger
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">Customer balances & credit</p>
              </div>
            </Link>
          </div>

          {/* ── Split Grid: Recent Ledger Activity vs Priority Alerts ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Live Stock Audit Ledger Feed */}
            <div className="lg:col-span-2 p-5 md:p-6 rounded-2xl bg-neutral-900/50 border border-neutral-800/90 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <History className="w-4 h-4 text-primary" />
                    Recent Stock Movements
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Immutable audit ledger of physical stock additions, sales, & reconciliations
                  </p>
                </div>
                <Link
                  to="/inventory"
                  className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                >
                  Full Ledger <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {loading ? (
                <div className="py-12 text-center text-xs text-muted-foreground">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-primary" />
                  Loading recent transactions...
                </div>
              ) : recentLedger.length === 0 ? (
                <div className="py-12 text-center border border-dashed border-neutral-800 rounded-xl space-y-2">
                  <Boxes className="w-8 h-8 text-neutral-600 mx-auto" />
                  <p className="text-xs font-medium text-muted-foreground">No stock movements recorded yet</p>
                  <Link to="/inventory" className="btn btn-secondary text-xs inline-flex py-1 px-3">
                    Record Stock In
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-border/40">
                  {recentLedger.map((entry) => {
                    const isPositive = entry.qtyChange > 0;
                    const isZero = entry.qtyChange === 0;

                    return (
                      <div
                        key={entry._id || entry.id}
                        className="py-3 flex items-center justify-between gap-3 hover:bg-neutral-800/30 px-2 rounded-xl transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Type Indicator Icon */}
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                              entry.type === "IN" || entry.type === "OPENING"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : entry.type === "OUT"
                                ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            }`}
                          >
                            {entry.type === "IN" ? (
                              <ArrowDownLeft className="w-4 h-4" />
                            ) : entry.type === "OUT" ? (
                              <ArrowUpRight className="w-4 h-4" />
                            ) : (
                              <ArrowRightLeft className="w-4 h-4" />
                            )}
                          </div>

                          <div className="min-w-0">
                            <p className="text-xs font-bold text-foreground truncate">
                              {entry.productId?.name || "Product Movement"}
                            </p>
                            <p className="text-[11px] text-muted-foreground truncate">
                              {entry.reason || entry.source} •{" "}
                              {new Date(entry.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>

                        {/* Quantity & Balance */}
                        <div className="text-right shrink-0">
                          <p
                            className={`text-xs font-bold font-mono ${
                              isPositive
                                ? "text-emerald-400"
                                : isZero
                                ? "text-muted-foreground"
                                : "text-rose-400"
                            }`}
                          >
                            {isPositive ? `+${entry.qtyChange}` : entry.qtyChange} units
                          </p>
                          <p className="text-[10px] text-muted-foreground font-mono">
                            Bal: {entry.balanceAfter}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right 1 Col: Priority Low-Stock Action Queue */}
            <div className="p-5 md:p-6 rounded-2xl bg-neutral-900/50 border border-neutral-800/90 shadow-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      Priority Restock Queue
                    </h3>
                    <p className="text-xs text-muted-foreground">Immediate low-stock threshold alerts</p>
                  </div>
                  <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    {alertsSummary.totalActive} Active
                  </span>
                </div>

                {loading ? (
                  <div className="py-8 text-center text-xs text-muted-foreground">
                    <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2 text-primary" />
                    Checking alerts...
                  </div>
                ) : activeAlerts.length === 0 ? (
                  <div className="py-8 text-center border border-dashed border-neutral-800 rounded-xl space-y-2">
                    <CheckCircle2 className="w-7 h-7 text-emerald-400 mx-auto" />
                    <p className="text-xs font-semibold text-foreground">Stock Levels Optimal</p>
                    <p className="text-[11px] text-muted-foreground">No active low-stock or out-of-stock items.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {activeAlerts.slice(0, 4).map((alert) => {
                      const isCritical = alert.severity === "CRITICAL" || alert.alertType === "OUT_OF_STOCK";

                      return (
                        <div
                          key={alert._id || alert.id}
                          className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800/80 space-y-1.5 hover:border-neutral-700 transition-colors"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-bold text-foreground truncate">
                              {alert.productId?.name || "Stock Alert"}
                            </p>
                            <span
                              className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                                isCritical
                                  ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                                  : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                              }`}
                            >
                              {isCritical ? "Out of Stock" : "Low Stock"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                            <span>
                              Stock: <b className={isCritical ? "text-rose-400" : "text-amber-400"}>{alert.currentStock}</b> / Min: {alert.reorderLevel}
                            </span>
                            <Link
                              to="/inventory"
                              className="text-xs font-semibold text-primary hover:underline flex items-center gap-0.5"
                            >
                              Restock <ChevronRight className="w-3 h-3" />
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <Link
                to="/inventory"
                className="w-full py-2.5 rounded-xl bg-neutral-800/80 border border-neutral-700/60 text-xs font-semibold text-foreground hover:bg-neutral-700/80 text-center block transition-all mt-4"
              >
                Manage All Alerts & Inventory
              </Link>
            </div>
          </div>

          {/* ── Recent Products Catalog Snapshot ── */}
          <div className="p-5 md:p-6 rounded-2xl bg-neutral-900/50 border border-neutral-800/90 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Package className="w-4 h-4 text-primary" />
                  Recent Products in Catalog
                </h3>
                <p className="text-xs text-muted-foreground">
                  Quick preview of active products, pricing, and category tags
                </p>
              </div>
              <Link
                to="/products"
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
              >
                View Catalog ({invSummary.totalProducts}) <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loading ? (
              <div className="py-8 text-center text-xs text-muted-foreground">Loading products...</div>
            ) : recentProducts.length === 0 ? (
              <div className="py-8 text-center border border-dashed border-neutral-800 rounded-xl space-y-2">
                <Package className="w-7 h-7 text-neutral-600 mx-auto" />
                <p className="text-xs text-muted-foreground">No products added yet.</p>
                <Link to="/products?action=add" className="btn btn-primary text-xs inline-flex">
                  Add Your First Product
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {recentProducts.map((prod) => (
                  <div
                    key={prod._id || prod.id}
                    onClick={() => navigate("/products")}
                    className="p-3.5 rounded-xl bg-neutral-900/80 border border-neutral-800/80 hover:border-neutral-700 transition-all cursor-pointer group flex items-center justify-between"
                  >
                    <div className="min-w-0 pr-3">
                      <p className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">
                        {prod.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-mono bg-neutral-800 text-muted-foreground px-1.5 py-0.5 rounded">
                          {prod.sku || "NO-SKU"}
                        </span>
                        {prod.categoryId?.name && (
                          <span className="text-[10px] text-muted-foreground truncate max-w-[100px]">
                            {prod.categoryId.name}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold text-emerald-400 font-mono">
                        ₹{prod.sellingPrice?.toLocaleString("en-IN")}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-mono">
                        Cost: ₹{prod.costPrice || 0}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
