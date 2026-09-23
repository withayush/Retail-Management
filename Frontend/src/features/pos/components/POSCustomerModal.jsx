import React, { useState, useEffect, useRef } from "react";
import { X, Search, UserPlus, Phone, User, Check, AlertCircle, Wallet } from "lucide-react";
import toast from "react-hot-toast";
import { getCustomers, createCustomer } from "../../../services/customer.api";

export default function POSCustomerModal({ isOpen, onClose, onSelectCustomer, currentCustomer }) {
  const inputRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // New Customer Form State
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newCreditLimit, setNewCreditLimit] = useState("0");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowAddForm(false);
      setSearchTerm("");
      loadCustomers("");
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 100);
    }
  }, [isOpen]);

  const loadCustomers = async (search = "") => {
    setLoading(true);
    try {
      const res = await getCustomers(search);
      const list = res.data?.customers || res.data || [];
      setCustomers(list);
    } catch (err) {
      console.error("Failed to load customers:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    loadCustomers(val);
  };

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) {
      return toast.error("Customer Name and Phone are required.");
    }

    setCreating(true);
    try {
      const res = await createCustomer({
        name: newName.trim(),
        phone: newPhone.trim(),
        creditLimit: Number(newCreditLimit) || 0,
      });
      const created = res.data || res;
      toast.success(`Customer "${created.name}" registered!`);
      onSelectCustomer(created);
      onClose();
    } catch (err) {
      console.error("Failed to create customer:", err);
      toast.error(err.response?.data?.message || "Failed to register customer.");
    } finally {
      setCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fadeIn">
      <div className="bg-[#111113] border border-[#27272a] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-scaleUp">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#27272a] bg-[#141417]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-100">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Select Customer (F4)</h2>
              <p className="text-[11px] text-zinc-400">Search existing customer or register new</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {!showAddForm ? (
          <div className="p-4 space-y-3">
            {/* Search Input */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  ref={inputRef}
                  value={searchTerm}
                  onChange={handleSearchChange}
                  placeholder="Search customer by name or phone..."
                  className="w-full bg-[#18181b] border border-[#27272a] rounded-xl pl-9 pr-4 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500"
                />
              </div>
              <button
                onClick={() => {
                  setNewName(searchTerm);
                  setShowAddForm(true);
                }}
                className="px-3 py-2 rounded-xl bg-white text-zinc-950 font-bold text-xs hover:bg-zinc-200 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
              >
                <UserPlus className="w-3.5 h-3.5" /> New
              </button>
            </div>

            {/* Customers List */}
            <div className="max-h-[300px] overflow-y-auto space-y-1.5 divide-y divide-[#1f1f23] pr-1">
              {loading ? (
                <div className="py-8 text-center text-xs text-zinc-500 flex items-center justify-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-zinc-400 border-t-transparent animate-spin" />
                  Loading customers...
                </div>
              ) : customers.length === 0 ? (
                <div className="py-8 text-center text-xs text-zinc-500">
                  <p>No customers found matching "{searchTerm}".</p>
                  <button
                    onClick={() => {
                      setNewName(searchTerm);
                      setShowAddForm(true);
                    }}
                    className="mt-2 text-amber-400 hover:underline text-[11px]"
                  >
                    + Register "{searchTerm}" as new customer
                  </button>
                </div>
              ) : (
                customers.map((c) => {
                  const isSelected =
                    (currentCustomer?.id || currentCustomer?._id) === (c.id || c._id);
                  const hasDebt = (c.currentBalance || 0) > 0;

                  return (
                    <div
                      key={c.id || c._id}
                      onClick={() => {
                        onSelectCustomer(c);
                        onClose();
                      }}
                      className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        isSelected
                          ? "bg-zinc-800/80 border-zinc-600"
                          : "bg-[#141417] border-[#27272a] hover:border-zinc-500 hover:bg-[#18181c]"
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-zinc-100">{c.name}</span>
                          {hasDebt && (
                            <span className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 px-1.5 py-0.2 rounded font-mono">
                              Debt: ₹{c.currentBalance.toFixed(2)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-zinc-400">
                          <span className="flex items-center gap-1 font-mono">
                            <Phone className="w-3 h-3 text-zinc-500" /> {c.phone}
                          </span>
                          {c.creditLimit > 0 && (
                            <span className="text-zinc-500 font-mono text-[10px]">
                              Limit: ₹{c.creditLimit}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {isSelected ? (
                          <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20">
                            <Check className="w-3.5 h-3.5" /> Selected
                          </span>
                        ) : (
                          <button className="text-[11px] font-medium text-zinc-400 hover:text-white bg-zinc-800 px-2.5 py-1 rounded-lg">
                            Attach
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          /* Inline New Customer Registration Form */
          <form onSubmit={handleCreateCustomer} className="p-4 space-y-3">
            <div className="space-y-2">
              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">Customer Full Name *</label>
                <input
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full bg-[#18181b] border border-[#27272a] rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-zinc-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">Mobile Phone Number *</label>
                <input
                  required
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full bg-[#18181b] border border-[#27272a] rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-zinc-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                  Credit Limit (₹) <span className="text-zinc-500 font-normal">(0 = unlimited)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={newCreditLimit}
                  onChange={(e) => setNewCreditLimit(e.target.value)}
                  placeholder="0"
                  className="w-full bg-[#18181b] border border-[#27272a] rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-zinc-500 font-mono"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#27272a]">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-xs hover:bg-zinc-700 transition-colors cursor-pointer"
              >
                Back to Search
              </button>
              <button
                type="submit"
                disabled={creating}
                className="px-4 py-2 rounded-xl bg-white text-zinc-950 font-bold text-xs hover:bg-zinc-200 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {creating ? "Registering..." : "Save & Attach Customer"}
              </button>
            </div>
          </form>
        )}

        {/* Footer */}
        <div className="p-3 bg-[#141417] border-t border-[#27272a] flex items-center justify-between text-[11px] text-zinc-500">
          <span>Press <kbd className="px-1 bg-zinc-800 rounded font-mono text-zinc-300">Esc</kbd> to exit</span>
          {currentCustomer && (
            <button
              onClick={() => {
                onSelectCustomer(null);
                onClose();
              }}
              className="text-red-400 hover:underline cursor-pointer"
            >
              Detach Customer (Walk-in)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
