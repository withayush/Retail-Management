import React, { useState, useRef, useEffect } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { Search, ChevronRight, Menu, User, LogOut, ChevronDown } from "lucide-react";

const getRouteMeta = (pathname) => {
  if (pathname === "/dashboard") {
    return {
      title: "Dashboard",
      breadcrumbs: [{ label: "Home", path: "/dashboard" }, { label: "Dashboard" }],
    };
  }
  if (pathname.startsWith("/profile")) {
    return {
      title: "My Profile",
      breadcrumbs: [
        { label: "Home", path: "/dashboard" },
        { label: "Account Profile", path: "/profile" },
      ],
    };
  }
  if (pathname.startsWith("/pos")) {
    return {
      title: "POS Terminal",
      breadcrumbs: [
        { label: "Home", path: "/dashboard" },
        { label: "POS Terminal", path: "/pos" },
      ],
    };
  }
  if (pathname.startsWith("/products")) {
    return {
      title: "Products",
      breadcrumbs: [
        { label: "Home", path: "/dashboard" },
        { label: "Products", path: "/products" },
      ],
    };
  }
  if (pathname.startsWith("/inventory")) {
    return {
      title: "Inventory",
      breadcrumbs: [
        { label: "Home", path: "/dashboard" },
        { label: "Inventory", path: "/inventory" },
      ],
    };
  }
  if (pathname.startsWith("/customers")) {
    return {
      title: "Customers",
      breadcrumbs: [
        { label: "Home", path: "/dashboard" },
        { label: "Customers", path: "/customers" },
      ],
    };
  }
  if (pathname.startsWith("/sales") || pathname.startsWith("/invoices")) {
    return {
      title: "Sales & Invoices",
      breadcrumbs: [
        { label: "Home", path: "/dashboard" },
        { label: "Sales & Invoices", path: "/sales" },
      ],
    };
  }
  return {
    title: "VendorOS",
    breadcrumbs: [{ label: "Home", path: "/dashboard" }],
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
  const userInitials = (userName.slice(0, 2) || "U").toUpperCase();

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
    <header className="h-16 bg-[#0c0c0e] border-b border-[#1f1f23] px-4 md:px-6 flex items-center justify-between gap-4 sticky top-0 z-20 select-none">
      {/* ─────────────────────────────────────────────────────────────
          1. LEFT SIDE: Breadcrumbs & Page Heading
      ───────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile Hamburger */}
        <button
          onClick={onOpenMobileSidebar}
          className="md:hidden p-1.5 -ml-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors"
          aria-label="Open mobile menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Dynamic Breadcrumbs & Page Heading */}
        <div className="flex flex-col min-w-0">
          <nav className="flex items-center gap-1.5 text-xs text-zinc-400 leading-none">
            {meta.breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <ChevronRight className="w-3 h-3 text-zinc-600 shrink-0" />}
                {crumb.path ? (
                  <Link
                    to={crumb.path}
                    className="hover:text-zinc-200 transition-colors truncate"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-zinc-200 truncate">{crumb.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>

          <h1 className="text-sm md:text-base font-semibold text-white leading-tight mt-0.5 truncate">
            {meta.title}
          </h1>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. CENTER: Global Universal Search Input
      ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 max-w-sm md:max-w-md mx-auto">
        <button
          onClick={onOpenSearch}
          className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-[#141417] border border-[#27272a] text-xs text-zinc-400 hover:border-zinc-600 hover:text-zinc-200 transition-colors text-left cursor-pointer"
        >
          <Search className="w-4 h-4 shrink-0 text-zinc-500" />
          <span className="truncate flex-1">Search...</span>
          <kbd className="hidden sm:inline-block text-[10px] text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-700 font-mono">
            Ctrl+K
          </kbd>
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. RIGHT SIDE: Profile Icon with Interactive Dropdown
      ───────────────────────────────────────────────────────────── */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen((prev) => !prev)}
          className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-zinc-800/80 transition-colors cursor-pointer"
          title="Account Menu"
        >
          <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-semibold flex items-center justify-center shrink-0">
            {userInitials}
          </div>
          <span className="hidden lg:inline text-xs font-medium text-zinc-300 max-w-[120px] truncate">
            {userName}
          </span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-zinc-500 transition-transform ${
              dropdownOpen ? "rotate-180 text-zinc-300" : ""
            }`}
          />
        </button>

        {/* Dropdown Menu Modal */}
        {dropdownOpen && (
          <div className="absolute right-0 top-full mt-2 w-56 bg-[#141417] border border-[#27272a] rounded-xl shadow-2xl p-1.5 z-50 animate-fade-in">
            {/* Header info */}
            <div className="px-3 py-2 border-b border-zinc-800 mb-1">
              <p className="text-xs font-semibold text-white truncate">{userName}</p>
              <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                {user?.phone || user?.email || "Vendor Account"}
              </p>
            </div>

            {/* Links */}
            <div className="space-y-0.5">
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  navigate("/profile");
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-zinc-300 hover:text-white hover:bg-zinc-800/80 rounded-lg transition-colors text-left cursor-pointer"
              >
                <User className="w-4 h-4 text-zinc-400" />
                <span>My Profile</span>
              </button>
            </div>

            {/* Logout */}
            <div className="pt-1 mt-1 border-t border-zinc-800">
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  if (onLogout) onLogout();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-500/10 rounded-lg transition-colors text-left cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
