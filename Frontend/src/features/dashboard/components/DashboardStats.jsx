import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Package,
  IndianRupee,
  AlertTriangle,
  Users,
  ChevronRight,
} from "lucide-react";

export default function DashboardStats({ invSummary, customersCount, loading }) {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: Catalog SKUs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        onClick={() => navigate("/products")}
        className="group p-5 rounded-2xl bg-gradient-to-b from-neutral-900/90 to-neutral-900/40 border border-neutral-800 hover:border-neutral-700 transition-all cursor-pointer shadow-sm relative overflow-hidden"
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Catalog SKUs
            </p>
            <h3 className="text-3xl font-black tracking-tight text-foreground mt-2 font-mono">
              {loading ? "..." : invSummary.totalProducts}
            </h3>
          </div>
          <div className="p-2.5 rounded-xl bg-neutral-800/80 border border-neutral-700/60 text-primary group-hover:scale-110 transition-transform">
            <Package className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            {invSummary.inStockCount} In-Stock
          </span>
          <span className="flex items-center gap-1 text-muted-foreground group-hover:text-foreground transition-colors">
            View Catalog <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </motion.div>

      {/* Card 2: Total Asset Valuation */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.05 }}
        onClick={() => navigate("/inventory")}
        className="group p-5 rounded-2xl bg-gradient-to-b from-neutral-900/90 to-neutral-900/40 border border-neutral-800 hover:border-neutral-700 transition-all cursor-pointer shadow-sm relative overflow-hidden"
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Asset Valuation
            </p>
            <h3 className="text-3xl font-black tracking-tight text-emerald-400 mt-2 font-mono">
              {loading ? "..." : `₹${(invSummary.totalValuation || 0).toLocaleString("en-IN")}`}
            </h3>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 group-hover:scale-110 transition-transform">
            <IndianRupee className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
          <span className="text-muted-foreground font-mono">
            {invSummary.totalStockQuantity} total physical units
          </span>
          <span className="flex items-center gap-1 text-muted-foreground group-hover:text-foreground transition-colors">
            Store Audit <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </motion.div>

      {/* Card 3: Stock Health & Low Stock Alerts */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.1 }}
        onClick={() => navigate("/inventory")}
        className="group p-5 rounded-2xl bg-gradient-to-b from-neutral-900/90 to-neutral-900/40 border border-neutral-800 hover:border-amber-500/30 transition-all cursor-pointer shadow-sm relative overflow-hidden"
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Stock Alerts
            </p>
            <div className="flex items-baseline gap-2 mt-2">
              <h3 className="text-3xl font-black tracking-tight text-amber-400 font-mono">
                {loading ? "..." : invSummary.lowStockCount + invSummary.outOfStockCount}
              </h3>
              <span className="text-xs text-muted-foreground font-medium">SKUs to restock</span>
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 group-hover:scale-110 transition-transform">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-xs">
          <span className="text-rose-400 font-semibold">
            {invSummary.outOfStockCount} Out of Stock
          </span>
          <span className="text-amber-400 font-semibold">
            {invSummary.lowStockCount} Low Stock
          </span>
        </div>
      </motion.div>

      {/* Card 4: Customers & Khata */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.15 }}
        onClick={() => navigate("/customers")}
        className="group p-5 rounded-2xl bg-gradient-to-b from-neutral-900/90 to-neutral-900/40 border border-neutral-800 hover:border-neutral-700 transition-all cursor-pointer shadow-sm relative overflow-hidden"
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Registered Customers
            </p>
            <h3 className="text-3xl font-black tracking-tight text-foreground mt-2 font-mono">
              {loading ? "..." : customersCount}
            </h3>
          </div>
          <div className="p-2.5 rounded-xl bg-neutral-800/80 border border-neutral-700/60 text-primary group-hover:scale-110 transition-transform">
            <Users className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
          <span>Khata Ledger Ready</span>
          <span className="flex items-center gap-1 text-muted-foreground group-hover:text-foreground transition-colors">
            Manage <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </motion.div>
    </div>
  );
}
