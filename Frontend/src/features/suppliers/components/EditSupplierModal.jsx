import React, { useState, useEffect } from "react";
import { X, Truck, Building2, User, Phone, Mail, MapPin, FileText, Tag, Loader2, Power } from "lucide-react";
import { updateSupplier } from "../../../services/supplier.api";
import toast from "react-hot-toast";

export default function EditSupplierModal({ isOpen, onClose, supplier, onSupplierUpdated }) {
  const [formData, setFormData] = useState({
    company: "",
    contactName: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    gstin: "",
    notes: "",
    status: "ACTIVE",
    tagsInput: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (supplier) {
      setFormData({
        company: supplier.company || "",
        contactName: supplier.contactName || "",
        phone: supplier.phone || "",
        email: supplier.email || "",
        address: supplier.address || "",
        city: supplier.city || "",
        state: supplier.state || "",
        pincode: supplier.pincode || "",
        gstin: supplier.gstin || "",
        notes: supplier.notes || "",
        status: supplier.status || "ACTIVE",
        tagsInput: Array.isArray(supplier.tags) ? supplier.tags.join(", ") : "",
      });
    }
  }, [supplier]);

  if (!isOpen || !supplier) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.company.trim()) {
      toast.error("Supplier company name is required.");
      return;
    }

    setSubmitting(true);
    try {
      const tags = formData.tagsInput
        ? formData.tagsInput
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : [];

      const payload = {
        company: formData.company.trim(),
        contactName: formData.contactName.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        pincode: formData.pincode.trim(),
        gstin: formData.gstin.trim(),
        notes: formData.notes.trim(),
        status: formData.status,
        tags,
      };

      const res = await updateSupplier(supplier._id, payload);
      toast.success(res.message || "Supplier updated successfully!");
      if (onSupplierUpdated) onSupplierUpdated(res.data);
      onClose();
    } catch (err) {
      console.error("Update supplier error:", err);
      toast.error(err.response?.data?.message || err.message || "Failed to update supplier.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#121214] border border-[#27272a] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#27272a] bg-[#18181b]/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Edit Supplier Profile</h2>
              <p className="text-xs text-zinc-400">Update vendor details and status (T38)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Company & Contact Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-400" />
                Company / Firm Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                name="company"
                required
                value={formData.company}
                onChange={handleChange}
                placeholder="e.g. ABC Distributors"
                className="w-full bg-[#18181b] border border-[#27272a] focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-zinc-400" />
                Contact Person Name
              </label>
              <input
                type="text"
                name="contactName"
                value={formData.contactName}
                onChange={handleChange}
                placeholder="e.g. Amit Sharma"
                className="w-full bg-[#18181b] border border-[#27272a] focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 outline-none transition-colors"
              />
            </div>
          </div>

          {/* Phone & Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                Mobile Phone
              </label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="e.g. 9876543210"
                className="w-full bg-[#18181b] border border-[#27272a] focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-zinc-400" />
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="orders@supplier.com"
                className="w-full bg-[#18181b] border border-[#27272a] focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 outline-none transition-colors"
              />
            </div>
          </div>

          {/* Status & GSTIN */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                <Power className="w-3.5 h-3.5 text-amber-400" />
                Supplier Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full bg-[#18181b] border border-[#27272a] focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none transition-colors"
              >
                <option value="ACTIVE">ACTIVE (Operational)</option>
                <option value="INACTIVE">INACTIVE (Archived)</option>
                <option value="BLOCKED">BLOCKED (Suspended)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                GSTIN
              </label>
              <input
                type="text"
                name="gstin"
                value={formData.gstin}
                onChange={handleChange}
                placeholder="08AAAAA0000A1Z5"
                className="w-full bg-[#18181b] border border-[#27272a] focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-sm text-white uppercase placeholder-zinc-500 outline-none transition-colors"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-zinc-400" />
              Warehouse / Office Address
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="e.g. Plot 42, Transport Nagar"
              className="w-full bg-[#18181b] border border-[#27272a] focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 outline-none transition-colors"
            />
          </div>

          {/* City, State, Pincode */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">City</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="Jaipur"
                className="w-full bg-[#18181b] border border-[#27272a] focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">State</label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                placeholder="Rajasthan"
                className="w-full bg-[#18181b] border border-[#27272a] focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Pincode</label>
              <input
                type="text"
                name="pincode"
                value={formData.pincode}
                onChange={handleChange}
                placeholder="302003"
                className="w-full bg-[#18181b] border border-[#27272a] focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 outline-none transition-colors"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-violet-400" />
              Tags (Comma-separated)
            </label>
            <input
              type="text"
              name="tagsInput"
              value={formData.tagsInput}
              onChange={handleChange}
              placeholder="WHOLESALER, FMCG, DIRECT_FACTORY"
              className="w-full bg-[#18181b] border border-[#27272a] focus:border-violet-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 outline-none transition-colors"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Merchant Notes / Terms</label>
            <textarea
              name="notes"
              rows="2"
              value={formData.notes}
              onChange={handleChange}
              placeholder="e.g. Net-15 credit terms"
              className="w-full bg-[#18181b] border border-[#27272a] focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 outline-none transition-colors resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#27272a]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm flex items-center gap-2 transition-all shadow-md shadow-blue-600/20 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Supplier"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
