import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Boxes,
  Users,
  Truck,
  Receipt,
  LogOut,
  PanelLeftClose,
  PanelLeft,
  Store,
  X,
  AlertTriangle,
  Sparkles,
} from "lucide-react";

export default function Sidebar({
  business,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
  onLogout,
}) {
  const location = useLocation();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const popoverRef = useRef(null);

  const businessName =
    business?.businessName ||
    business?.business_name ||
    business?.name ||
    "VendorOS";

  const navItems = [
    { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { label: "POS Terminal", path: "/pos", icon: ShoppingCart },
    { label: "Products", path: "/products", icon: Package },
    { label: "Inventory", path: "/inventory", icon: Boxes },
    { label: "Customers", path: "/customers", icon: Users },
    { label: "Suppliers", path: "/suppliers", icon: Truck },
    { label: "Sales & Invoices", path: "/sales", icon: Receipt },
  ];

  // Close popover on outside click
  useEffect(() => {
    if (!showLogoutConfirm) return;
    const handleClick = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setShowLogoutConfirm(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showLogoutConfirm]);

  const renderContent = (isMobile = false) => {
    const collapsed = isMobile ? false : isCollapsed;

    return (
      <div className="flex flex-col h-full bg-[#161617]/95 backdrop-blur-2xl border-r border-[#D2D2D7]/12 select-none text-[#D2D2D7]">
        {/* 1. TOP SECTION: Logo & Business Branding */}
        <div className="h-16 px-4 border-b border-[#D2D2D7]/10 flex items-center justify-between transition-colors">
          {!collapsed ? (
            <>
              <Link
                to="/dashboard"
                className="flex items-center gap-3 min-w-0 group"
                onClick={isMobile ? onCloseMobile : undefined}
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#1D1D1F] to-[#2C2C2E] border border-[#D2D2D7]/20 flex items-center justify-center font-bold text-white shrink-0 shadow-sm group-hover:border-[#0066CC]/60 transition-all duration-300 group-hover:scale-105">
                  {business?.logo ? (
                    <img
                      src={business.logo}
                      alt={businessName}
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : (
                    <Store className="w-4 h-4 text-white" />
                  )}
                </div>
                <div className="truncate">
                  <span className="font-semibold text-xs text-white truncate block group-hover:text-white transition-colors">
                    {businessName}
                  </span>
                  <span className="text-[10px] text-[#6E6E73] font-medium tracking-tight block">
                    Retail Engine
                  </span>
                </div>
              </Link>

              {/* Close / Collapse Button */}
              {isMobile ? (
                <button
                  onClick={onCloseMobile}
                  className="p-1.5 rounded-full text-[#6E6E73] hover:text-white hover:bg-white/10 active:scale-90 transition-all cursor-pointer"
                  title="Close Menu"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={onToggleCollapse}
                  className="p-1.5 rounded-full text-[#6E6E73] hover:text-white hover:bg-white/10 active:scale-90 transition-all cursor-pointer"
                  title="Collapse Sidebar"
                >
                  <PanelLeftClose className="w-4 h-4" />
                </button>
              )}
            </>
          ) : (
            /* Desktop Collapsed: Center Open Button */
            <div className="w-full flex items-center justify-center">
              <button
                onClick={onToggleCollapse}
                className="p-2 rounded-full text-[#6E6E73] hover:text-white hover:bg-white/10 active:scale-90 transition-all cursor-pointer"
                title="Expand Sidebar"
              >
                <PanelLeft className="w-5 h-5 text-white" />
              </button>
            </div>
          )}
        </div>

        {/* 2. MIDDLE SECTION: Apple Navigation Menu */}
        <div className="flex-1 py-4 px-2.5 space-y-1.5 overflow-y-auto">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                location.pathname === item.path ||
                (item.path !== "/dashboard" && location.pathname.startsWith(item.path));

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={isMobile ? onCloseMobile : undefined}
                  title={collapsed ? item.label : undefined}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-full text-xs font-medium transition-all duration-300 group active:scale-[0.98] ${
                    isActive
                      ? "bg-[#0066CC] text-white shadow-[0_2px_12px_rgba(0,102,204,0.35)]"
                      : "text-[#D2D2D7]/80 hover:bg-white/10 hover:text-white"
                  } ${collapsed ? "justify-center px-0" : ""}`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-transform duration-300 group-hover:scale-110 ${
                      isActive ? "text-white" : "text-[#6E6E73] group-hover:text-white"
                    }`}
                  />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* 3. BOTTOM SECTION: Logout Confirmation */}
        <div className="p-3 border-t border-[#D2D2D7]/10">
          <div className="relative" ref={popoverRef}>
            {/* Confirmation Popover */}
            {showLogoutConfirm && (
              <div
                className="absolute bottom-full mb-2 left-0 right-0 z-50 animate-modal-pop"
              >
                <div className="bg-[#1D1D1F]/95 backdrop-blur-2xl border border-[#D2D2D7]/20 rounded-[18px] shadow-[0_16px_36px_rgba(0,0,0,0.5)] overflow-hidden">
                  <div className="px-3.5 pt-3 pb-2.5 border-b border-[#D2D2D7]/10">
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-[#B64400]/20 border border-[#B64400]/40 flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-3 h-3 text-[#FF791B]" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-white">Sign Out?</p>
                        <p className="text-[10px] text-[#6E6E73] leading-tight">
                          Active session will be closed safely.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-2 flex gap-1.5">
                    <button
                      onClick={() => setShowLogoutConfirm(false)}
                      className="flex-1 py-1.5 rounded-full text-xs font-medium text-[#D2D2D7] hover:text-white bg-white/10 hover:bg-white/15 transition-all cursor-pointer active:scale-95"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        setShowLogoutConfirm(false);
                        onLogout();
                      }}
                      className="flex-1 py-1.5 rounded-full text-xs font-semibold text-white bg-[#B64400] hover:bg-[#FF791B] transition-all cursor-pointer active:scale-95 shadow-sm"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Logout Button */}
            <button
              onClick={() => setShowLogoutConfirm((p) => !p)}
              title={collapsed ? "Sign Out" : undefined}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-full text-xs font-medium transition-all duration-300 cursor-pointer active:scale-95 ${
                showLogoutConfirm
                  ? "bg-[#B64400]/20 text-[#FF791B] border border-[#B64400]/40"
                  : "text-[#6E6E73] hover:text-[#FF791B] hover:bg-[#B64400]/10"
              } ${collapsed ? "justify-center px-0" : ""}`}
            >
              <LogOut className="w-4 h-4 shrink-0" />
              {!collapsed && <span>Sign Out</span>}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col shrink-0 h-screen sticky top-0 transition-[width] duration-300 ease-[cubic-bezier(0,0,0.5,1)] ${
          isCollapsed ? "w-16" : "w-60"
        }`}
      >
        {renderContent(false)}
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex animate-fade-in">
          <div
            onClick={onCloseMobile}
            className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
          />
          <div className="relative w-64 max-w-[80vw] h-full shadow-2xl z-10 animate-slide-in-right">
            {renderContent(true)}
          </div>
        </div>
      )}
    </>
  );
}
