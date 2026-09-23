import React, { useState, useEffect } from "react";
import { X, UserCheck, Phone, User, Mail, MapPin, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { updateCustomer, archiveCustomer } from "../../../services/customer.api";

export default function EditCustomerModal({ isOpen, customer, onClose, onSuccess }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [creditLimit, setCreditLimit] = useState("0");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [showMore, setShowMore] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (customer) {
      setName(customer.name || "");
      setPhone(customer.phone || "");
      setEmail(customer.email || "");
      setAddress(customer.address || "");
      setCity(customer.city || "");
      setState(customer.state || "");
      setPincode(customer.pincode || "");
      setCreditLimit(String(customer.creditLimit || 0));
      setNotes(customer.notes || "");
      setStatus(customer.status || "ACTIVE");
      if (customer.city || customer.state || customer.pincode || customer.notes) {
        setShowMore(true);
      }
    }
  }, [customer]);

  if (!isOpen || !customer) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      return toast.error("Customer name is required.");
    }

    const customerId = customer.id || customer._id;
    setSubmitting(true);
    try {
      const res = await updateCustomer(customerId, {
        name: name.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        city: city.trim() || undefined,
        state: state.trim() || undefined,
        pincode: pincode.trim() || undefined,
        creditLimit: Number(creditLimit) || 0,
        notes: notes.trim() || undefined,
        status,
      });

      toast.success(`Customer "${name}" updated successfully! 🎉`);
      if (onSuccess) onSuccess(res.data || res);
      onClose();
    } catch (err) {
      console.error("Failed to update customer:", err);
      toast.error(err.response?.data?.message || "Failed to update customer.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleArchive = async () => {
    const customerId = customer.id || customer._id;
    if (!window.confirm(`Are you sure you want to deactivate customer "${customer.name}"? Historical invoices and ledgers will remain safe.`)) {
      return;
    }

    setSubmitting(true);
    try {
      await archiveCustomer(customerId);
      toast.success(`Customer "${customer.name}" archived successfully.`);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error("Failed to archive customer:", err);
      toast.error(err.response?.data?.message || "Failed to archive customer.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fadeIn">
      <div className="bg-[#111113] border border-[#27272a] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-scaleUp">
        {/* Header */}
        <div className="p-4 border-b border-[#1f1f23] bg-[#141417] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-800 text-white flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Edit Customer Profile</h2>
              <p className="text-[11px] text-zinc-400">Update demographic details, phone, and credit parameters</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Customer Name *</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="w-full bg-[#18181b] border border-[#27272a] rounded-xl px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Mobile Phone (Optional)</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 9876543210"
                className="w-full bg-[#18181b] border border-[#27272a] rounded-xl px-3 py-2 text-xs font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. rahul@example.com"
                className="w-full bg-[#18181b] border border-[#27272a] rounded-xl px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Credit Limit (₹)</label>
              <input
                type="number"
                min="0"
                value={creditLimit}
                onChange={(e) => setCreditLimit(e.target.value)}
                placeholder="0"
                className="w-full bg-[#18181b] border border-[#27272a] rounded-xl px-3 py-2 text-xs font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Address</label>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Shop #4, Main Market"
                className="w-full bg-[#18181b] border border-[#27272a] rounded-xl px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-[#18181b] border border-[#27272a] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-500 cursor-pointer"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
                <option value="BLOCKED">BLOCKED</option>
              </select>
            </div>
          </div>

          {/* Toggle More Demographics */}
          <div>
            <button
              type="button"
              onClick={() => setShowMore(!showMore)}
              className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
            >
              {showMore ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              {showMore ? "Hide Additional Demographics" : "Edit City, State, Pincode & Notes"}
            </button>
          </div>

          {showMore && (
            <div className="p-3 bg-[#18181b]/60 border border-[#27272a] rounded-xl space-y-3 animate-fadeIn">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1">City</label>
                  <input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Jaipur"
                    className="w-full bg-[#141417] border border-[#27272a] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1">State</label>
                  <input
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="e.g. Rajasthan"
                    className="w-full bg-[#141417] border border-[#27272a] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1">Pincode</label>
                  <input
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    placeholder="e.g. 302001"
                    className="w-full bg-[#141417] border border-[#27272a] rounded-lg px-2.5 py-1.5 text-xs font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">Notes / Remarks</label>
                <input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Regular wholesale buyer"
                  className="w-full bg-[#141417] border border-[#27272a] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
                />
              </div>
            </div>
          )}

          <div className="pt-2 flex items-center justify-between border-t border-[#1f1f23]">
            <button
              type="button"
              onClick={handleArchive}
              disabled={submitting}
              className="px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-500/10 text-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Deactivate</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-xs transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {submitting ? "Saving..." : "Update Customer"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
