import React, { useState, useEffect } from "react";
import { Users, X } from "lucide-react";

export default function CustomerFormModal({
  isOpen,
  onClose,
  customer = null,
  onSubmit,
  submitting = false,
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [creditLimit, setCreditLimit] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    if (customer) {
      setName(customer.name || "");
      setPhone(customer.phone || "");
      setCreditLimit(customer.creditLimit ? customer.creditLimit.toString() : "");
      setAddress(customer.address || "");
    } else {
      setName("");
      setPhone("");
      setCreditLimit("");
      setAddress("");
    }
  }, [customer, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      name: name.trim(),
      phone: phone.trim() || undefined,
      creditLimit: creditLimit ? parseFloat(creditLimit) : 0,
      address: address.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in-50 zoom-in-95">
        <div className="flex items-center justify-between p-4 border-b border-border bg-secondary/30">
          <div className="flex items-center gap-2 text-primary">
            <Users className="w-4 h-4" />
            <h3 className="font-bold text-sm text-foreground">
              {customer ? "Edit Customer Profile" : "Register New Customer"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3.5 text-xs">
          {/* Full Name */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase">
              Customer Full Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Rahul Verma"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Contact Phone */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase">
              Phone Number
            </label>
            <input
              type="tel"
              placeholder="e.g. 9876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Credit Limit */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase">
              Credit Limit (₹)
            </label>
            <input
              type="number"
              step="any"
              min="0"
              placeholder="e.g. 5000"
              value={creditLimit}
              onChange={(e) => setCreditLimit(e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Address / Notes */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase">
              Address / Notes
            </label>
            <textarea
              rows={2}
              placeholder="Shop # / locality / landmark..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-background border border-border rounded-xl p-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-secondary cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs shadow-sm cursor-pointer disabled:opacity-50"
            >
              {submitting ? "Saving..." : customer ? "Update Profile" : "Register Customer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
