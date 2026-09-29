import React, { useState, useEffect } from "react";
import {
  X,
  ShoppingBag,
  Building2,
  Calendar,
  IndianRupee,
  Plus,
  Trash2,
  FileText,
  Truck,
  CheckCircle2,
  Info,
  Loader2,
  Clock,
} from "lucide-react";
import { getSuppliers } from "../../../services/supplier.api";
import { createPurchaseOrder } from "../../../services/purchaseOrder.api";
import { getProducts } from "../../../services/product.api";
import toast from "react-hot-toast";

export default function CreatePurchaseOrderModal({
  isOpen,
  onClose,
  preselectedSupplier = null,
  onPOCreated,
}) {
  const [suppliers, setSuppliers] = useState([]);
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    supplierId: "",
    orderDate: new Date().toISOString().split("T")[0],
    expectedDelivery: "",
    status: "PENDING", // "DRAFT" | "PENDING"
    shippingAddress: "",
    paymentTerms: "Net 30 Days",
    notes: "",
  });

  const [items, setItems] = useState([
    { productId: "", name: "", sku: "", quantity: 1, unitCost: 0, unit: "pcs" },
  ]);

  // Load suppliers and catalog products
  useEffect(() => {
    if (!isOpen) return;

    // Load catalog products for quick line-item population
    getProducts({ limit: 150 })
      .then((res) => {
        const prList = res.data || res.products || [];
        setCatalogProducts(prList);
      })
      .catch((err) => console.warn("Could not pre-load catalog products:", err));

    if (preselectedSupplier) {
      const sId = preselectedSupplier._id || preselectedSupplier.id;
      setFormData((prev) => ({
        ...prev,
        supplierId: sId,
        shippingAddress: prev.shippingAddress || preselectedSupplier.address || "",
      }));
    } else {
      setLoadingSuppliers(true);
      getSuppliers({ limit: 100, status: "ACTIVE" })
        .then((res) => {
          const list = res.data || res.suppliers || [];
          setSuppliers(list);
          if (list.length > 0 && !formData.supplierId) {
            setFormData((prev) => ({ ...prev, supplierId: list[0]._id || list[0].id }));
          }
        })
        .catch((err) => {
          console.error("Failed to load suppliers:", err);
          toast.error("Failed to load supplier list.");
        })
        .finally(() => setLoadingSuppliers(false));
    }
  }, [isOpen, preselectedSupplier]);

  if (!isOpen) return null;

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (index, field, value) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleSelectCatalogProduct = (index, prodId) => {
    if (!prodId) {
      handleItemChange(index, "productId", "");
      return;
    }
    const prod = catalogProducts.find((p) => (p._id || p.id) === prodId);
    if (prod) {
      setItems((prev) => {
        const next = [...prev];
        next[index] = {
          ...next[index],
          productId: prod._id || prod.id,
          name: prod.name,
          sku: prod.sku || "",
          unitCost: Number(prod.costPrice) || 0,
          unit: prod.unit || "pcs",
        };
        return next;
      });
    }
  };

  const addItemRow = () => {
    setItems((prev) => [
      ...prev,
      { productId: "", name: "", sku: "", quantity: 1, unitCost: 0, unit: "pcs" },
    ]);
  };

  const removeItemRow = (index) => {
    if (items.length <= 1) {
      toast.error("Purchase Order must contain at least one item.");
      return;
    }
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Grand Total Calculation
  const grandTotal = items.reduce((sum, item) => {
    const qty = Number(item.quantity) || 0;
    const cost = Number(item.unitCost) || 0;
    return sum + qty * cost;
  }, 0);

  const totalQuantity = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.supplierId) {
      toast.error("Please select a supplier.");
      return;
    }

    // Validate items
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.name || !item.name.trim()) {
        toast.error(`Item #${i + 1} is missing a name.`);
        return;
      }
      if (Number(item.quantity) <= 0) {
        toast.error(`Item #${i + 1} must have a quantity of at least 1.`);
        return;
      }
      if (Number(item.unitCost) < 0) {
        toast.error(`Item #${i + 1} cannot have a negative unit cost.`);
        return;
      }
    }

    setSubmitting(true);
    try {
      let orderDateVal = new Date().toISOString();
      if (formData.orderDate) {
        const d = new Date(formData.orderDate);
        if (!isNaN(d.getTime())) orderDateVal = d.toISOString();
      }

      let expectedDeliveryVal = null;
      if (formData.expectedDelivery && formData.expectedDelivery.trim()) {
        const d = new Date(formData.expectedDelivery);
        if (!isNaN(d.getTime())) expectedDeliveryVal = d.toISOString();
      }

      const payload = {
        supplierId: formData.supplierId,
        orderDate: orderDateVal,
        expectedDelivery: expectedDeliveryVal,
        status: formData.status || "PENDING",
        shippingAddress: (formData.shippingAddress || "").trim(),
        paymentTerms: (formData.paymentTerms || "").trim(),
        notes: (formData.notes || "").trim(),
        items: items.map((item) => ({
          productId: item.productId || null,
          name: (item.name || "").trim(),
          sku: (item.sku || "").trim().toUpperCase(),
          quantity: Number(item.quantity) || 1,
          unit: item.unit || "pcs",
          unitCost: Number(item.unitCost) || 0,
        })),
      };

      const res = await createPurchaseOrder(payload);
      toast.success(res.message || `Purchase Order created successfully!`);
      if (onPOCreated) onPOCreated(res.data || res);
      onClose();
    } catch (err) {
      console.error("Failed to create purchase order:", err);
      toast.error(err.response?.data?.message || err.message || "Failed to create Purchase Order.");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedSupplierName =
    preselectedSupplier?.company ||
    suppliers.find((s) => (s._id || s.id) === formData.supplierId)?.company ||
    "Supplier";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl bg-[#0e0e11] border border-[#27272a] shadow-2xl shadow-black/80 overflow-hidden text-zinc-100 animate-scaleUp">
        {/* ── Modal Header ─────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1f1f23] bg-[#141417]/90 backdrop-blur-sm sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold shadow-inner">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Create Purchase Order (T42)
              </h2>
              <p className="text-xs text-zinc-400">
                Official stock order request sent to supplier • {selectedSupplierName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Form Body ────────────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Architectural Info Banner */}
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs">
            <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-blue-200">Purchasing System Workflow: </span>
              A Purchase Order is a formal order commitment sent to a vendor. Creating a PO does not alter your live inventory stock or post accounts payable debt. Stock and ledger payables are recorded when goods and invoices are received.
            </div>
          </div>

          {/* Top Metadata Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Supplier Selector */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-400" />
                Supplier <span className="text-rose-400">*</span>
              </label>
              {preselectedSupplier ? (
                <input
                  type="text"
                  disabled
                  value={preselectedSupplier.company || "Selected Supplier"}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-zinc-300 text-xs font-medium cursor-not-allowed"
                />
              ) : (
                <select
                  name="supplierId"
                  value={formData.supplierId}
                  onChange={handleFormChange}
                  disabled={loadingSuppliers}
                  required
                  className="w-full px-3 py-2 bg-[#16161a] border border-zinc-800 rounded-xl text-zinc-200 text-xs focus:border-blue-500 focus:outline-hidden transition-colors"
                >
                  <option value="">-- Select Supplier --</option>
                  {suppliers.map((s) => (
                    <option key={s._id || s.id} value={s._id || s.id}>
                      {s.company} {s.contactName ? `(${s.contactName})` : ""}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Order Date */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                Order Date <span className="text-rose-400">*</span>
              </label>
              <input
                type="date"
                name="orderDate"
                value={formData.orderDate}
                onChange={handleFormChange}
                required
                className="w-full px-3 py-2 bg-[#16161a] border border-zinc-800 rounded-xl text-zinc-200 text-xs focus:border-blue-500 focus:outline-hidden transition-colors"
              />
            </div>

            {/* Expected Delivery Date */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-amber-400" />
                Expected Delivery Date
              </label>
              <input
                type="date"
                name="expectedDelivery"
                value={formData.expectedDelivery}
                onChange={handleFormChange}
                className="w-full px-3 py-2 bg-[#16161a] border border-zinc-800 rounded-xl text-zinc-200 text-xs focus:border-blue-500 focus:outline-hidden transition-colors"
              />
            </div>
          </div>

          {/* Order Status & Payment Terms Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                Initial Order Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleFormChange}
                className="w-full px-3 py-2 bg-[#16161a] border border-zinc-800 rounded-xl text-zinc-200 text-xs focus:border-blue-500 focus:outline-hidden transition-colors"
              >
                <option value="PENDING">PENDING (Place Order)</option>
                <option value="DRAFT">DRAFT (Save as Draft)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Payment Terms</label>
              <input
                type="text"
                name="paymentTerms"
                value={formData.paymentTerms}
                onChange={handleFormChange}
                placeholder="e.g. Net 30 Days, Immediate, 50% Advance"
                className="w-full px-3 py-2 bg-[#16161a] border border-zinc-800 rounded-xl text-zinc-200 text-xs focus:border-blue-500 focus:outline-hidden transition-colors placeholder:text-zinc-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Shipping / Dock Address</label>
              <input
                type="text"
                name="shippingAddress"
                value={formData.shippingAddress}
                onChange={handleFormChange}
                placeholder="e.g. Main Store Warehouse Dock #2"
                className="w-full px-3 py-2 bg-[#16161a] border border-zinc-800 rounded-xl text-zinc-200 text-xs focus:border-blue-500 focus:outline-hidden transition-colors placeholder:text-zinc-600"
              />
            </div>
          </div>

          {/* ── Line Items Section ─────────────────────────────────────────── */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
                <ShoppingBag className="w-3.5 h-3.5 text-blue-400" />
                Order Items ({items.length})
              </h3>
              <button
                type="button"
                onClick={addItemRow}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 text-xs font-semibold border border-blue-500/30 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Product Line
              </button>
            </div>

            <div className="border border-zinc-800/80 rounded-xl overflow-hidden bg-[#121215]">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#18181c] text-zinc-400 uppercase tracking-wider text-[11px] border-b border-zinc-800">
                    <tr>
                      <th className="px-3 py-2.5">#</th>
                      <th className="px-3 py-2.5 min-w-[180px]">Item / Product Name *</th>
                      <th className="px-3 py-2.5 w-28">SKU</th>
                      <th className="px-3 py-2.5 w-24 text-right">Quantity *</th>
                      <th className="px-3 py-2.5 w-20">Unit</th>
                      <th className="px-3 py-2.5 w-28 text-right">Unit Cost (₹) *</th>
                      <th className="px-3 py-2.5 w-28 text-right">Total (₹)</th>
                      <th className="px-3 py-2.5 w-12 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {items.map((item, index) => {
                      const lineTotal = (Number(item.quantity) || 0) * (Number(item.unitCost) || 0);
                      return (
                        <tr key={index} className="hover:bg-zinc-800/30 transition-colors">
                          <td className="px-3 py-2 text-zinc-500 font-mono text-[11px]">{index + 1}</td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              required
                              placeholder="e.g. Maggi 70g, Coca Cola"
                              value={item.name}
                              onChange={(e) => handleItemChange(index, "name", e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-[#16161a] border border-zinc-700/60 rounded-lg text-zinc-100 text-xs focus:border-blue-500 focus:outline-hidden"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              placeholder="SKU-101"
                              value={item.sku}
                              onChange={(e) => handleItemChange(index, "sku", e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-[#16161a] border border-zinc-700/60 rounded-lg text-zinc-200 text-xs uppercase font-mono focus:border-blue-500 focus:outline-hidden"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              required
                              min="1"
                              step="1"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-[#16161a] border border-zinc-700/60 rounded-lg text-zinc-100 text-xs text-right font-medium focus:border-blue-500 focus:outline-hidden"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <select
                              value={item.unit}
                              onChange={(e) => handleItemChange(index, "unit", e.target.value)}
                              className="w-full px-2 py-1.5 bg-[#16161a] border border-zinc-700/60 rounded-lg text-zinc-300 text-xs focus:border-blue-500 focus:outline-hidden"
                            >
                              <option value="pcs">pcs</option>
                              <option value="pack">pack</option>
                              <option value="box">box</option>
                              <option value="kg">kg</option>
                              <option value="ltr">ltr</option>
                              <option value="can">can</option>
                              <option value="units">units</option>
                            </select>
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              required
                              min="0"
                              step="0.01"
                              value={item.unitCost}
                              onChange={(e) => handleItemChange(index, "unitCost", e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-[#16161a] border border-zinc-700/60 rounded-lg text-zinc-100 text-xs text-right font-mono focus:border-blue-500 focus:outline-hidden"
                            />
                          </td>
                          <td className="px-3 py-2 text-right font-mono font-bold text-zinc-200">
                            ₹{lineTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <button
                              type="button"
                              onClick={() => removeItemRow(index)}
                              className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                              title="Remove Line"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Notes & Summary Footer Box */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start pt-2">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-zinc-400" />
                Order Notes / Special Instructions
              </label>
              <textarea
                name="notes"
                rows="3"
                value={formData.notes}
                onChange={handleFormChange}
                placeholder="Add special instructions, batch requirements, packaging instructions..."
                className="w-full px-3 py-2 bg-[#16161a] border border-zinc-800 rounded-xl text-zinc-200 text-xs focus:border-blue-500 focus:outline-hidden transition-colors resize-none placeholder:text-zinc-600"
              />
            </div>

            {/* Cost Summary Card */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-[#16161c] to-[#121215] border border-zinc-800 space-y-2.5">
              <div className="flex justify-between text-xs text-zinc-400">
                <span>Total Items:</span>
                <span className="font-semibold text-zinc-200">{items.length} line(s)</span>
              </div>
              <div className="flex justify-between text-xs text-zinc-400">
                <span>Total Quantity:</span>
                <span className="font-semibold text-zinc-200">{totalQuantity} units</span>
              </div>
              <div className="h-px bg-zinc-800 my-1" />
              <div className="flex justify-between items-baseline text-sm">
                <span className="font-bold text-zinc-200">Estimated Cost Total:</span>
                <span className="text-xl font-extrabold text-blue-400 font-mono">
                  ₹{grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </form>

        {/* ── Modal Footer ─────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#1f1f23] bg-[#141417]/90 backdrop-blur-sm sticky bottom-0 z-20">
          <div className="text-xs text-zinc-400">
            Total Expected Value: <span className="font-bold text-white font-mono">₹{grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/30 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating Order...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  {formData.status === "DRAFT" ? "Save PO Draft" : "Place Purchase Order"}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
