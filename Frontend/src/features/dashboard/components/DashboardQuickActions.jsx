import React from "react";
import { Link } from "react-router-dom";
import {
  ShoppingCart,
  Plus,
  Boxes,
  Users,
  ArrowUpRight,
} from "lucide-react";

export default function DashboardQuickActions() {
  return (
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
  );
}
