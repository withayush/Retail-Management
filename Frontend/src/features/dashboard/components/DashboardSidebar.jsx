import React from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Package,
  Boxes,
  Users,
  ShoppingCart,
  LogOut,
  X,
} from "lucide-react";

export default function DashboardSidebar({
  user,
  business,
  totalProducts = 0,
  hasAlerts = false,
  mobileMenuOpen = false,
  setMobileMenuOpen,
  onLogout,
}) {
  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="w-64 border-r border-border/80 bg-card/40 backdrop-blur-md flex-col justify-between hidden md:flex shrink-0 p-4 sticky top-0 h-screen">
        <div className="space-y-6">
          {/* Brand Logo */}
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

          {/* Nav Items */}
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
                <span className="text-xs text-muted-foreground font-mono">{totalProducts}</span>
              </div>
            </Link>
            <Link
              to="/inventory"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-neutral-800/40 transition-all group"
            >
              <Boxes className="w-4 h-4 text-neutral-400 group-hover:text-primary transition-colors" />
              <div className="flex items-center justify-between flex-1">
                <span>Inventory & Ledger</span>
                {hasAlerts && <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />}
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

        {/* User Card & Logout */}
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
                <p className="text-[11px] text-muted-foreground truncate">
                  {user?.phone || user?.email}
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/20 border border-transparent transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Drawer */}
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
                  onClick={onLogout}
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
    </>
  );
}
