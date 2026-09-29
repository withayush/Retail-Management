import React, { useState, useRef, useEffect } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { Search, ChevronRight, Menu, User, LogOut, ChevronDown, Sparkles } from "lucide-react";

const HOME = { label: "Dashboard", path: "/dashboard" };

const getRouteMeta = (pathname) => {
  // Dashboard — single root crumb
  if (pathname === "/dashboard") {
    return {
      breadcrumbs: [{ label: "Dashboard" }],
    };
  }

  // Profile
  if (pathname.startsWith("/profile")) {
    return {
      breadcrumbs: [HOME, { label: "My Profile" }],
    };
  }

  // POS Terminal
  if (pathname.startsWith("/pos")) {
    return {
      breadcrumbs: [HOME, { label: "POS Terminal" }],
    };
  }

  // Products
  if (pathname.startsWith("/products")) {
    return {
      breadcrumbs: [HOME, { label: "Products" }],
    };
  }

  // Inventory
  if (pathname.startsWith("/inventory")) {
    return {
      breadcrumbs: [HOME, { label: "Inventory" }],
    };
  }

  // Customers & Khata
  if (pathname.startsWith("/customers")) {
    return {
      breadcrumbs: [HOME, { label: "Customers & Khata" }],
    };
  }

  // Suppliers
  if (pathname.startsWith("/suppliers")) {
    return {
      breadcrumbs: [HOME, { label: "Suppliers" }],
    };
  }

  // Sales & Invoices
  if (pathname.startsWith("/sales") || pathname.startsWith("/invoices")) {
    return {
      breadcrumbs: [HOME, { label: "Sales & Invoices" }],
    };
  }

  // Fallback
  return {
    breadcrumbs: [{ label: "Dashboard" }],
  };
};

export default function Header({
  user,
  onOpenMobileSidebar,
  onOpenSearch,
  onLogout,
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const meta = getRouteMeta(location.pathname);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const userName = user?.fullName || user?.phone || "Vendor";
  const userInitials = (userName.slice(0, 2) || "VO").toUpperCase();

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  return (
    <header className="h-16 bg-black/75 backdrop-blur-2xl border-b border-[#D2D2D7]/12 px-4 md:px-7 flex items-center justify-between gap-4 sticky top-0 z-30 select-none transition-all">
      {/* ─────────────────────────────────────────────────────────────
          1. LEFT SIDE: Apple Breadcrumbs & Navigation
      ───────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile Hamburger */}
        <button
          onClick={onOpenMobileSidebar}
          className="md:hidden p-2 -ml-1 rounded-full text-[#6E6E73] hover:text-white hover:bg-white/10 active:scale-95 transition-all"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Apple Stylized Breadcrumbs */}
        <nav className="flex items-center gap-2 text-xs text-[#6E6E73] leading-none min-w-0">
          {meta.breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-[#6E6E73]/60 shrink-0" />}
              {crumb.path ? (
                <Link
                  to={crumb.path}
                  className="hover:text-white transition-colors duration-200 truncate font-medium text-xs text-[#6E6E73]"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-white font-semibold text-xs tracking-tight truncate flex items-center gap-1.5">
                  {crumb.label}
                </span>
              )}
            </React.Fragment>
          ))}
        </nav>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. CENTER: Apple Pill Universal Search Bar
      ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 max-w-sm md:max-w-md mx-auto">
        <button
          onClick={onOpenSearch}
          className="w-full flex items-center gap-2.5 px-4 py-2 rounded-full bg-[#1D1D1F]/90 border border-[#D2D2D7]/15 text-xs text-[#6E6E73] hover:border-[#0066CC]/60 hover:text-white hover:shadow-[0_0_15px_-3px_rgba(0,102,204,0.25)] transition-all duration-300 text-left cursor-pointer group"
        >
          <Search className="w-4 h-4 shrink-0 text-[#6E6E73] group-hover:text-[#0066CC] transition-colors" />
          <span className="truncate flex-1 font-normal">Search products, invoices, customers...</span>
          <kbd className="hidden sm:inline-flex items-center text-[10px] text-[#D2D2D7]/70 bg-white/5 px-2 py-0.5 rounded-full border border-white/10 font-mono">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. RIGHT SIDE: Apple Profile Button with Frosted Dropdown
      ───────────────────────────────────────────────────────────── */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen((prev) => !prev)}
          className="flex items-center gap-2.5 p-1.5 pl-2 pr-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 cursor-pointer active:scale-95"
          title="Account Menu"
        >
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#0066CC] to-[#0099FF] text-white text-xs font-semibold flex items-center justify-center shrink-0 shadow-sm">
            {userInitials}
          </div>
          <span className="hidden lg:inline text-xs font-medium text-white max-w-[120px] truncate">
            {userName}
          </span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-[#6E6E73] transition-transform duration-300 ${
              dropdownOpen ? "rotate-180 text-white" : ""
            }`}
          />
        </button>

        {/* Frosted Dropdown Menu */}
        {dropdownOpen && (
          <div className="absolute right-0 top-full mt-2 w-60 bg-[#1D1D1F]/95 backdrop-blur-2xl border border-[#D2D2D7]/16 rounded-[18px] shadow-[0_16px_36px_rgba(0,0,0,0.5)] p-2 z-50 animate-modal-pop">
            {/* Header info */}
            <div className="px-3 py-2.5 border-b border-[#D2D2D7]/10 mb-1">
              <p className="text-xs font-semibold text-white truncate">{userName}</p>
              <p className="text-[11px] text-[#6E6E73] truncate mt-0.5">
                {user?.phone || user?.email || "Vendor Account"}
              </p>
            </div>

            {/* Links */}
            <div className="space-y-1">
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  navigate("/profile");
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#D2D2D7] hover:text-white hover:bg-white/10 rounded-xl transition-all text-left cursor-pointer"
              >
                <User className="w-4 h-4 text-[#0066CC]" />
                <span>My Profile & Business Settings</span>
              </button>
            </div>

            {/* Logout */}
            <div className="pt-1 mt-1 border-t border-[#D2D2D7]/10">
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  if (onLogout) onLogout();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#FF791B] hover:bg-[#FF791B]/10 rounded-xl transition-all text-left cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
