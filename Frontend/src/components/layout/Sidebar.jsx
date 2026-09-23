import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Boxes,
  Users,
  Receipt,
  LogOut,
  PanelLeftClose,
  PanelLeft,
  Store,
  X,
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
    { label: "Sales & Invoices", path: "/sales", icon: Receipt },
  ];

  const renderContent = (isMobile = false) => {
    const collapsed = isMobile ? false : isCollapsed;

    return (
      <div className="flex flex-col h-full bg-[#0c0c0e] border-r border-[#1f1f23] select-none text-zinc-300">
        {/* 1. TOP SECTION: Logo & Name + Open/Close Toggle */}
        <div className="h-16 px-3 border-b border-[#1f1f23] flex items-center justify-between transition-colors">
          {!collapsed ? (
            <>
              <Link
                to="/dashboard"
                className="flex items-center gap-2.5 min-w-0 group"
                onClick={isMobile ? onCloseMobile : undefined}
              >
                <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700/80 flex items-center justify-center font-bold text-white shrink-0 shadow-sm group-hover:border-zinc-500 transition-all duration-200 group-hover:scale-105">
                  {business?.logo ? (
                    <img
                      src={business.logo}
                      alt={businessName}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <Store className="w-4 h-4 text-zinc-300" />
                  )}
                </div>
                <span className="font-semibold text-sm text-zinc-100 truncate group-hover:text-white transition-colors">
                  {businessName}
                </span>
              </Link>

              {/* Close Button */}
              {isMobile ? (
                <button
                  onClick={onCloseMobile}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/80 active:scale-90 transition-all cursor-pointer"
                  title="Close Sidebar"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={onToggleCollapse}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/80 active:scale-90 transition-all cursor-pointer"
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
                className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/80 active:scale-90 transition-all cursor-pointer"
                title="Open Sidebar"
              >
                <PanelLeft className="w-5 h-5 text-zinc-300" />
              </button>
            </div>
          )}
        </div>

        {/* 2. MIDDLE SECTION: Navigation Menu */}
        <div className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
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
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 group active:scale-[0.98] ${
                    isActive
                      ? "bg-zinc-800 text-white font-medium shadow-xs"
                      : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200 hover:translate-x-0.5"
                  } ${collapsed ? "justify-center px-0 hover:translate-x-0" : ""}`}
                >
                  <Icon className={`w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110 ${isActive ? "text-white" : "text-zinc-400 group-hover:text-zinc-200"}`} />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* 3. BOTTOM SECTION: Logout Option */}
        <div className="p-3 border-t border-[#1f1f23]">
          <button
            onClick={onLogout}
            title={collapsed ? "Logout" : undefined}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 active:scale-95 transition-all duration-200 cursor-pointer ${
              collapsed ? "justify-center px-0" : ""
            }`}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col shrink-0 h-screen sticky top-0 transition-[width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
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
            className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
          />
          <div className="relative w-64 max-w-[80vw] h-full shadow-2xl z-10 animate-slide-in-right">
            {renderContent(true)}
          </div>
        </div>
      )}
    </>
  );
}
