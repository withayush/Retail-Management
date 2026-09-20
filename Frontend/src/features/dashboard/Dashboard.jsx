import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Boxes,
  Users,
  ShoppingCart,
  LogOut,
  Building2,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Layers,
  ChevronRight,
} from "lucide-react";
import { getProducts, getProductCategories } from "../../services/product.api";
import { fmt } from "../products/utils/product.utils";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [stats, setStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    categoriesCount: 0,
    avgMargin: "0.0",
    loading: true,
  });

  useEffect(() => {
    let isMounted = true;
    const loadDashboardData = async () => {
      try {
        const [prodRes, catRes] = await Promise.allSettled([
          getProducts({ limit: 100 }),
          getProductCategories(),
        ]);

        const products =
          prodRes.status === "fulfilled"
            ? prodRes.value?.data?.products || prodRes.value?.data || []
            : [];
        const categories =
          catRes.status === "fulfilled"
            ? catRes.value?.data?.categories || catRes.value?.data || []
            : [];

        const activeCount = products.filter(
          (p) => (p.isActive ?? p.is_active ?? true) && !p.isArchived
        ).length;

        const margin =
          products.length > 0
            ? (
                products.reduce((acc, p) => {
                  const cost = parseFloat(p.costPrice ?? p.cost_price ?? 0);
                  const sell = parseFloat(p.sellingPrice ?? p.selling_price ?? 0);
                  if (sell <= 0) return acc;
                  return acc + ((sell - cost) / sell) * 100;
                }, 0) / products.length
              ).toFixed(1)
            : "0.0";

        if (isMounted) {
          setStats({
            totalProducts: products.length,
            activeProducts: activeCount,
            categoriesCount: categories.length,
            avgMargin: margin,
            loading: false,
          });
        }
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
        if (isMounted) {
          setStats((prev) => ({ ...prev, loading: false }));
        }
      }
    };

    loadDashboardData();
    return () => {
      isMounted = false;
    };
  }, []);

  const navItems = [
    { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { label: "POS Terminal", path: "/pos", icon: ShoppingCart },
    { label: "Product Catalog", path: "/products", icon: Package },
    { label: "Inventory Audit", path: "/inventory", icon: Boxes },
    { label: "Customers & Khata", path: "/customers", icon: Users },
  ];

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* Sidebar (Desktop) */}
      <aside className="w-64 border-r border-border bg-card/40 flex flex-col justify-between hidden md:flex p-4">
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold shadow-md shadow-primary/20">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-sm text-foreground tracking-tight block">
                VendorOS
              </span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                Retail Engine
              </span>
            </div>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Account footer */}
        <div className="pt-4 border-t border-border space-y-3">
          <div className="px-3 py-2 rounded-xl bg-secondary/40 border border-border">
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
              Signed in as
            </p>
            <p className="text-xs font-semibold text-foreground truncate mt-0.5">
              {user?.fullName || user?.phone || user?.email || "Store Admin"}
            </p>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-destructive hover:bg-destructive/10 border border-destructive/20 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main View Area */}
      <main className="flex-1 p-4 md:p-8 space-y-6 overflow-y-auto max-w-7xl mx-auto w-full">
        {/* Mobile Nav Header */}
        <div className="flex md:hidden items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">
              <Building2 className="w-4 h-4" />
            </div>
            <span className="font-bold text-sm">VendorOS</span>
          </div>
          <button
            onClick={logout}
            className="p-2 rounded-lg bg-secondary text-destructive text-xs font-medium"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* Header section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">
              Store Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Real-time operational summary, catalog intelligence, and quick billing actions
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/pos"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-bold shadow-md shadow-primary/20 hover:bg-primary/90 transition-all"
            >
              <ShoppingCart className="w-4 h-4" />
              Open POS Register
            </Link>
          </div>
        </div>

        {/* Metric KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-card border border-border rounded-2xl p-4 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Total Products
              </span>
              <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <Package className="w-3.5 h-3.5" />
              </div>
            </div>
            <p className="text-2xl font-black text-foreground">
              {stats.loading ? "…" : stats.totalProducts}
            </p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-4 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Active Catalog
              </span>
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
            </div>
            <p className="text-2xl font-black text-emerald-400">
              {stats.loading ? "…" : stats.activeProducts}
            </p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-4 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Categories
              </span>
              <div className="w-7 h-7 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                <Layers className="w-3.5 h-3.5" />
              </div>
            </div>
            <p className="text-2xl font-black text-violet-400">
              {stats.loading ? "…" : stats.categoriesCount}
            </p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-4 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Avg Profit Margin
              </span>
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
            </div>
            <p className="text-2xl font-black text-amber-400">
              {stats.loading ? "…" : `${stats.avgMargin}%`}
            </p>
          </div>
        </div>

        {/* Quick Access Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <Link
            to="/products"
            className="group bg-card border border-border hover:border-primary/50 rounded-2xl p-5 shadow-xs transition-all space-y-3"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors flex items-center justify-between">
                <span>Manage Product Catalog</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Add products, edit barcodes & SKUs, adjust selling prices and track real-time margins.
              </p>
            </div>
          </Link>

          <Link
            to="/pos"
            className="group bg-card border border-border hover:border-emerald-500/50 rounded-2xl p-5 shadow-xs transition-all space-y-3"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground group-hover:text-emerald-400 transition-colors flex items-center justify-between">
                <span>Fast POS Billing</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Fast barcode scanning, instant line-item calculation, customer khata attribution, and print invoices.
              </p>
            </div>
          </Link>

          <Link
            to="/customers"
            className="group bg-card border border-border hover:border-violet-500/50 rounded-2xl p-5 shadow-xs transition-all space-y-3"
          >
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 group-hover:scale-105 transition-transform">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground group-hover:text-violet-400 transition-colors flex items-center justify-between">
                <span>Customer Khata & Ledger</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Credit accounts, outstanding balance snapshots, payment receipts, and reconciliation logs.
              </p>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}
