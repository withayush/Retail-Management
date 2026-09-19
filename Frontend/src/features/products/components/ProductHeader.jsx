import React from "react";
import { motion } from "framer-motion";
import { ChevronLeft, Plus, Sparkles, Box } from "lucide-react";

export default function ProductHeader({ onNavigateDashboard, onOpenAddModal }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div>
        <button
          onClick={onNavigateDashboard}
          className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground mb-2 transition-colors text-xs font-medium cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Dashboard
        </button>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Box className="w-5 h-5" />
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-foreground">
            Product Catalog
          </h1>
          <span className="inline-flex items-center gap-1 text-[11px] bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 rounded-full font-semibold">
            <Sparkles className="w-3 h-3" /> Real-time Indexed
          </span>
        </div>
        <p className="text-muted-foreground text-xs md:text-sm mt-1">
          Multi-tenant indexed search by SKU, Name, Barcode & Category with instant margin calculations
        </p>
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onOpenAddModal}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 self-start md:self-auto cursor-pointer"
      >
        <Plus className="w-4 h-4" /> Add Product
      </motion.button>
    </div>
  );
}
