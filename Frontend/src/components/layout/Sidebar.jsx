
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
  ShieldCheck,
  Wallet,
  TrendingUp,
  ShoppingBag,
  BarChart3,
  Layers,
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

  // Original navigation data preserved.
  const navItems = [
    { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { label: "AI Assistant", path: "/ai-assistant", icon: Sparkles, isAi: true },
    { label: "POS Terminal", path: "/pos", icon: ShoppingCart },
    { label: "Products", path: "/products", icon: Package },
    { label: "Inventory", path: "/inventory", icon: Boxes },
    { label: "Customers", path: "/customers", icon: Users },
    { label: "Suppliers", path: "/suppliers", icon: Truck },
    { label: "Purchase Orders", path: "/purchases", icon: ShoppingBag },
    { label: "Sales & Invoices", path: "/sales", icon: Receipt },
    { label: "Sales Trends", path: "/sales-analytics", icon: BarChart3 },
    { label: "Expenses", path: "/expenses", icon: Wallet },
    { label: "Profit & Analytics", path: "/analytics", icon: TrendingUp },
    { label: "Profit Waterfall", path: "/profit", icon: Layers },
    { label: "Reconciliation", path: "/reconciliation", icon: ShieldCheck },
  ];

  // Close logout confirmation on outside click or Escape.
  useEffect(() => {
    if (!showLogoutConfirm) return;

    const handleClick = (e) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target)
      ) {
        setShowLogoutConfirm(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setShowLogoutConfirm(false);
      }
    };

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showLogoutConfirm]);

  const renderContent = (isMobile = false) => {
    const collapsed = isMobile ? false : isCollapsed;

    return (
      <div className="
        flex flex-col h-full
        bg-[#161617]/95
        backdrop-blur-2xl
        border-r border-[#D2D2D7]/12
        select-none text-[#D2D2D7]
      ">

        {/* HEADER: Business Branding */}
        <div className="
          h-16 px-4 shrink-0
          border-b border-[#D2D2D7]/10
          flex items-center justify-between
        ">
          {!collapsed ? (
            <>
              <Link
                to="/dashboard"
                onClick={isMobile ? onCloseMobile : undefined}
                className="flex items-center gap-3 min-w-0 group"
              >
                <div className="
                  w-8 h-8 shrink-0
                  rounded-xl overflow-hidden
                  bg-gradient-to-tr from-[#1D1D1F] to-[#2C2C2E]
                  border border-[#D2D2D7]/20
                  flex items-center justify-center
                  font-bold text-white
                  shadow-sm
                  transition-all duration-200 ease-out
                  group-hover:border-[#0066CC]/60
                  group-hover:scale-[1.04]
                ">
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

                <div className="min-w-0 truncate">
                  <span className="
                    block truncate
                    font-semibold text-xs text-white
                    group-hover:text-white
                    transition-colors duration-200
                  ">
                    {businessName}
                  </span>

                  <span className="
                    block text-[10px]
                    text-[#6E6E73] font-medium tracking-tight
                  ">
                    Retail Engine
                  </span>
                </div>
              </Link>

              {isMobile ? (
                <button
                  type="button"
                  onClick={onCloseMobile}
                  title="Close Menu"
                  aria-label="Close Menu"
                  className="
                    p-1.5 rounded-full
                    text-[#6E6E73]
                    hover:text-white hover:bg-white/10
                    active:scale-90
                    transition-all duration-200
                  "
                >
                  <X className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onToggleCollapse}
                  title="Collapse Sidebar"
                  aria-label="Collapse Sidebar"
                  className="
                    p-1.5 rounded-full
                    text-[#6E6E73]
                    hover:text-white hover:bg-white/10
                    active:scale-90
                    transition-all duration-200
                  "
                >
                  <PanelLeftClose className="w-4 h-4" />
                </button>
              )}
            </>
          ) : (
            <div className="w-full flex items-center justify-center">
              <button
                type="button"
                onClick={onToggleCollapse}
                title="Expand Sidebar"
                aria-label="Expand Sidebar"
                className="
                  p-2 rounded-full
                  text-[#6E6E73]
                  hover:text-white hover:bg-white/10
                  active:scale-90
                  transition-all duration-200
                "
              >
                <PanelLeft className="w-5 h-5 text-white" />
              </button>
            </div>
          )}
        </div>

        {/* NAVIGATION */}
        <div className="
          flex-1 min-h-0
          py-4 px-2.5
          space-y-1.5
          overflow-y-auto overflow-x-hidden
          sidebar-scroll
        ">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;

              const isActive =
                location.pathname === item.path ||
                (
                  item.path !== "/dashboard" &&
                  location.pathname.startsWith(`${item.path}/`)
                );

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={isMobile ? onCloseMobile : undefined}
                  title={collapsed ? item.label : undefined}
                  aria-current={isActive ? "page" : undefined}
                  className={`
                    relative flex items-center gap-3
                    px-3.5 py-2.5
                    rounded-full
                    text-xs font-medium
                    transition-all duration-200 ease-out
                    group active:scale-[0.98]
                    ${isActive
                      ? "bg-[#0066CC] text-white shadow-none"
                      : "text-[#D2D2D7]/80 hover:bg-white/10 hover:text-white"
                    }
                    ${collapsed ? "justify-center px-0" : ""}
                  `}
                >
                  <Icon
                    strokeWidth={isActive ? 2.2 : 1.8}
                    className={`
                      w-4 h-4 shrink-0
                      transition-transform duration-200 ease-out
                      group-hover:scale-110
                      ${isActive
                        ? "text-white"
                        : item.isAi
                          ? "text-indigo-400 group-hover:text-indigo-300"
                          : "text-[#6E6E73] group-hover:text-white"
                      }
                    `}
                  />

                  {!collapsed && (
                    <div className="
                      flex items-center justify-between
                      flex-1 min-w-0
                    ">
                      <span className="truncate">
                        {item.label}
                      </span>

                      {item.isAi && (
                        <span className="
                          ml-1.5 px-1.5 py-0.5
                          rounded-full shrink-0
                          text-[9px] font-bold
                          bg-gradient-to-r from-indigo-500 to-purple-500
                          text-white
                          shadow-sm shadow-indigo-500/20
                          tracking-wider
                        ">
                          GROQ
                        </span>
                      )}
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* FOOTER: LOGOUT */}
        <div className="
          relative shrink-0
          p-3
          border-t border-[#D2D2D7]/10
        ">
          <div className="relative" ref={popoverRef}>

            {/* LOGOUT CONFIRMATION */}
            {showLogoutConfirm && (
              <div className="
                absolute bottom-full mb-2
                left-0 right-0 z-50
                animate-modal-pop
              ">
                <div className="
                  bg-[#1D1D1F]/95
                  backdrop-blur-2xl
                  border border-[#D2D2D7]/20
                  rounded-[18px]
                  shadow-[0_16px_36px_rgba(0,0,0,0.5)]
                  overflow-hidden
                ">
                  <div className="
                    px-3.5 pt-3 pb-2.5
                    border-b border-[#D2D2D7]/10
                  ">
                    <div className="flex items-center gap-2.5">
                      <div className="
                        w-7 h-7 rounded-full shrink-0
                        bg-[#B64400]/20
                        border border-[#B64400]/40
                        flex items-center justify-center
                      ">
                        <AlertTriangle className="w-3.5 h-3.5 text-[#FF791B]" />
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-white">
                          Sign Out?
                        </p>

                        <p className="
                          text-[10px] text-[#6E6E73]
                          leading-tight mt-0.5
                        ">
                          Active session will be closed safely.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-2 flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setShowLogoutConfirm(false)}
                      className="
                        flex-1 py-1.5 rounded-full
                        text-xs font-medium
                        text-[#D2D2D7]
                        hover:text-white
                        bg-white/10 hover:bg-white/15
                        transition-all duration-200
                        active:scale-95
                      "
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowLogoutConfirm(false);
                        onLogout();
                      }}
                      className="
                        flex-1 py-1.5 rounded-full
                        text-xs font-semibold text-white
                        bg-[#B64400]
                        hover:bg-[#FF791B]
                        transition-all duration-200
                        active:scale-95
                        shadow-sm
                      "
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* LOGOUT BUTTON */}
            <button
              type="button"
              onClick={() => setShowLogoutConfirm((p) => !p)}
              title={collapsed ? "Sign Out" : undefined}
              aria-label="Sign Out"
              aria-expanded={showLogoutConfirm}
              className={`
                w-full flex items-center gap-2.5
                px-3 py-2
                rounded-full
                text-xs font-medium
                transition-all duration-200
                cursor-pointer active:scale-95
                ${showLogoutConfirm
                  ? "bg-[#B64400]/20 text-[#FF791B] border border-[#B64400]/40"
                  : "text-[#6E6E73] hover:text-[#FF791B] hover:bg-[#B64400]/10"
                }
                ${collapsed ? "justify-center px-0" : ""}
              `}
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
      {/* DESKTOP SIDEBAR */}
      <aside
        className={`
          hidden md:flex flex-col
          shrink-0 h-screen sticky top-0
          overflow-hidden
          transition-[width] duration-300
          ease-[cubic-bezier(0.22,1,0.36,1)]
          ${isCollapsed ? "w-16" : "w-60"}
        `}
      >
        {renderContent(false)}
      </aside>

      {/* MOBILE DRAWER */}
      {isMobileOpen && (
        <div className="
          fixed inset-0 z-50
          md:hidden flex animate-fade-in
        ">
          <button
            type="button"
            aria-label="Close sidebar"
            onClick={onCloseMobile}
            className="
              fixed inset-0
              bg-black/80 backdrop-blur-md
            "
          />

          <div className="
            relative w-64 max-w-[80vw]
            h-full shadow-2xl z-10
            animate-slide-in-right
          ">
            {renderContent(true)}
          </div>
        </div>
      )}
    </>
  );
}
