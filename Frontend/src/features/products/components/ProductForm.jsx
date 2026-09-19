import React from "react";
import {
  Tag,
  Layers,
  Boxes,
  Hash,
  IndianRupee,
  TrendingUp,
  AlertCircle,
  Package,
  CheckCircle2,
  Loader2,
  Sparkles,
} from "lucide-react";
import { fmt, margin, inputCls } from "../utils/product.utils";

function Field({ label, icon: Icon, children }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
        {Icon && <Icon className="w-3.5 h-3.5 text-primary" />}
        {label}
      </label>
      {children}
    </div>
  );
}

export default function ProductForm({
  form,
  setForm,
  categories,
  onSubmit,
  submitLabel,
  submitting,
  isEdit,
  onCancel,
}) {
  const sellNum = parseFloat(form.sellingPrice) || 0;
  const costNum = parseFloat(form.costPrice) || 0;
  const profitMargin = margin(costNum, sellNum);
  const profitAmount = sellNum - costNum;

  // SKU Auto-generator helper
  const handleAutoGenerateSku = () => {
    if (!form.name.trim()) return;
    const clean = form.name
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 4);
    const rand = Math.floor(1000 + Math.random() * 9000);
    setForm({ ...form, sku: `${clean || "SKU"}-${rand}` });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Product Name */}
      <Field label="Product Name *" icon={Tag}>
        <input
          className={inputCls}
          required
          placeholder="e.g. Aashirvaad Superior MP Atta 10kg"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
      </Field>

      {/* Category and Packaging Unit */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Category *" icon={Layers}>
          <input
            list="categories-datalist"
            className={inputCls}
            required
            placeholder="e.g. Groceries, Dairy"
            value={form.categoryName}
            onChange={(e) => setForm({ ...form, categoryName: e.target.value })}
          />
          <datalist id="categories-datalist">
            {categories.map((c) => (
              <option key={c.id || c._id} value={c.name} />
            ))}
          </datalist>
        </Field>

        <Field label="Packaging Unit" icon={Boxes}>
          <input
            className={inputCls}
            placeholder="pcs, kg, bag, liter, box"
            value={form.unit}
            onChange={(e) => setForm({ ...form, unit: e.target.value })}
          />
        </Field>
      </div>

      {/* SKU and Barcode */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="SKU Code" icon={Hash}>
          <div className="relative">
            <input
              className={`${inputCls} pr-8 font-mono uppercase`}
              placeholder="e.g. ASH-ATT-10"
              value={form.sku}
              onChange={(e) => setForm({ ...form, sku: e.target.value.toUpperCase() })}
            />
            {!form.sku && form.name && (
              <button
                type="button"
                onClick={handleAutoGenerateSku}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                title="Auto-generate SKU"
              >
                <Sparkles className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </Field>

        <Field label="Barcode (UPC/EAN)" icon={Hash}>
          <input
            className={`${inputCls} font-mono`}
            placeholder="e.g. 8901725181222"
            value={form.barcode}
            onChange={(e) => setForm({ ...form, barcode: e.target.value })}
          />
        </Field>
      </div>

      {/* Cost Price and Selling Price */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Cost Price (₹)" icon={IndianRupee}>
          <input
            type="number"
            step="0.01"
            min="0"
            className={inputCls}
            placeholder="0.00"
            value={form.costPrice}
            onChange={(e) => setForm({ ...form, costPrice: e.target.value })}
          />
        </Field>

        <Field label="Selling Price (₹) *" icon={IndianRupee}>
          <input
            type="number"
            step="0.01"
            min="0"
            required
            className={inputCls}
            placeholder="0.00"
            value={form.sellingPrice}
            onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })}
          />
        </Field>
      </div>

      {/* Live margin & profit calculation preview */}
      {sellNum > 0 && (
        <div className="flex items-center justify-between p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs">
          <div className="flex items-center gap-2 text-emerald-400">
            <TrendingUp className="w-4 h-4 flex-shrink-0" />
            <span>
              Profit margin: <strong className="text-emerald-300 font-mono">{profitMargin}%</strong>
            </span>
          </div>
          <div className="text-emerald-400">
            Profit / unit: <strong className="text-emerald-300 font-mono">{fmt(profitAmount)}</strong>
          </div>
        </div>
      )}

      {/* Immutable ledger notification */}
      <div className="flex items-start gap-2 p-3 bg-secondary/40 border border-border rounded-xl text-xs text-muted-foreground">
        <AlertCircle className="w-4 h-4 flex-shrink-0 text-primary mt-0.5" />
        <span>
          Price updates apply to new invoices immediately. Historic invoices and accounting records remain immutable.
        </span>
      </div>

      {/* Opening Stock initialization (only for new products) */}
      {!isEdit && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-border" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Opening Stock (Optional)
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <div className="p-3.5 bg-primary/5 border border-primary/15 rounded-xl space-y-3">
            <div className="flex items-start gap-2">
              <Package className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Set initial physical stock. Seeds an audited <span className="font-semibold text-primary font-mono">OPENING</span> stock entry in your inventory ledger. Leave blank for 0 stock.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Opening Qty" icon={Boxes}>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className={inputCls}
                  placeholder="0"
                  value={form.openingStock}
                  onChange={(e) => setForm({ ...form, openingStock: e.target.value })}
                />
              </Field>
              <Field label="Opening Note" icon={Tag}>
                <input
                  className={inputCls}
                  placeholder="e.g. Starting stock count"
                  value={form.openingStockNotes}
                  onChange={(e) => setForm({ ...form, openingStockNotes: e.target.value })}
                />
              </Field>
            </div>

            {form.openingStock !== "" && parseFloat(form.openingStock) > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-primary font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>
                  Will seed initial balance of <strong className="font-mono">{form.openingStock} {form.unit || "pcs"}</strong>.
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2.5 border border-border rounded-xl text-sm font-medium text-muted-foreground hover:bg-secondary transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-primary/20"
        >
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
