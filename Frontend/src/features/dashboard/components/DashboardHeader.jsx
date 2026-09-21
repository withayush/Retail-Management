import React from "react";
import { Link } from "react-router-dom";
import {
  Menu,
  Search,
  RefreshCw,
  Plus,
  ShoppingCart,
} from "lucide-react";

export default function DashboardHeader({
  business,
  currentTime,
  searchQuery,
  setSearchQuery,
  onSearchSubmit,
  refreshing,
  onRefresh,
  onOpenMobileMenu,
}) {
  return (
    <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/70 px-4 md:px-8 py-3.5 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="p-2 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-neutral-800 md:hidden cursor-pointer"
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
        <form onSubmit={onSearchSubmit} className="relative hidden lg:block w-64">
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
          onClick={onRefresh}
          disabled={refreshing}
          title="Refresh Dashboard Data"
          className="p-2 rounded-xl border border-border/80 text-muted-foreground hover:text-foreground hover:bg-neutral-800/80 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
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
  );
}
