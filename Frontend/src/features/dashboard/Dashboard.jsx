import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
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

// Modular Sub-Components
import DashboardSidebar from "./components/DashboardSidebar";
import DashboardHeader from "./components/DashboardHeader";
import DashboardStats from "./components/DashboardStats";
import DashboardStockHealth from "./components/DashboardStockHealth";
import DashboardQuickActions from "./components/DashboardQuickActions";
import DashboardRecentLedger from "./components/DashboardRecentLedger";
import DashboardPriorityAlerts from "./components/DashboardPriorityAlerts";
import DashboardRecentProducts from "./components/DashboardRecentProducts";

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
      {/* ── Sidebar (Desktop & Mobile Drawer) ── */}
      <DashboardSidebar
        user={user}
        business={business}
        totalProducts={invSummary.totalProducts}
        hasAlerts={invSummary.lowStockCount + invSummary.outOfStockCount > 0}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        onLogout={logout}
      />

      {/* ── Main Content Area ── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Sticky Header */}
        <DashboardHeader
          business={business}
          currentTime={currentTime}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onSearchSubmit={handleSearchSubmit}
          refreshing={refreshing}
          onRefresh={() => fetchDashboardData(true)}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        />

        {/* Dashboard Body Content */}
        <div className="p-4 md:p-8 space-y-6 max-w-7xl w-full mx-auto">
          {/* 1. KPI Metric Cards */}
          <DashboardStats
            invSummary={invSummary}
            customersCount={customersCount}
            loading={loading}
          />

          {/* 2. Store Stock Health Visualizer */}
          <DashboardStockHealth
            invSummary={invSummary}
            inStockPct={inStockPct}
            lowStockPct={lowStockPct}
            outOfStockPct={outOfStockPct}
          />

          {/* 3. Quick Action Hub */}
          <DashboardQuickActions />

          {/* 4. Split Grid: Recent Movements vs Priority Restock Queue */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <DashboardRecentLedger
              recentLedger={recentLedger}
              loading={loading}
            />

            <DashboardPriorityAlerts
              activeAlerts={activeAlerts}
              alertsSummary={alertsSummary}
              loading={loading}
            />
          </div>

          {/* 5. Recent Products Catalog Snapshot */}
          <DashboardRecentProducts
            recentProducts={recentProducts}
            totalProducts={invSummary.totalProducts}
            loading={loading}
          />
        </div>
      </main>
    </div>
  );
}
