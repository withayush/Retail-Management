import React from "react";
import { X, Keyboard, Command, Zap } from "lucide-react";

export default function POSKeyboardShortcutsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const shortcuts = [
    { key: "F2", label: "Focus Product Search / Barcode Input", category: "Navigation" },
    { key: "F4", label: "Open Customer Selector & Search Modal", category: "Customer" },
    { key: "F8", label: "Focus Order Discount Input", category: "Pricing" },
    { key: "F9 / Ctrl+Enter", label: "Complete Sale / Instant Checkout", category: "Checkout", highlight: true },
    { key: "Ctrl + 1", label: "Select CASH Payment", category: "Payment" },
    { key: "Ctrl + 2", label: "Select UPI Payment", category: "Payment" },
    { key: "Ctrl + 3", label: "Select CARD Payment", category: "Payment" },
    { key: "Ctrl + 4", label: "Select UDHAAR (Credit) Payment", category: "Payment" },
    { key: "Ctrl + D", label: "Clear Cart", category: "Cart" },
    { key: "Enter (in search)", label: "Scan Barcode / Select First Item", category: "Catalog" },
    { key: "Esc", label: "Close Modal / Blur Search Focus", category: "General" },
    { key: "F1 / ?", label: "Toggle This Shortcuts Guide", category: "Help" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fadeIn">
      <div className="bg-[#111113] border border-[#27272a] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-scaleUp">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#27272a] bg-[#141417]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-100">
              <Keyboard className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                POS Terminal Keyboard Shortcuts
                <span className="text-[10px] bg-amber-400/10 text-amber-400 px-1.5 py-0.5 rounded border border-amber-400/20 font-mono">
                  SPEED MODE
                </span>
              </h2>
              <p className="text-[11px] text-zinc-400">Operate the billing terminal completely without a mouse</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Shortcuts List */}
        <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto">
          {shortcuts.map((s, idx) => (
            <div
              key={idx}
              className={`flex items-center justify-between p-2.5 rounded-xl border transition-colors ${
                s.highlight
                  ? "bg-amber-400/5 border-amber-400/30 text-white"
                  : "bg-[#18181b] border-[#27272a] text-zinc-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium">{s.label}</span>
                <span className="text-[9px] text-zinc-500 uppercase tracking-wider bg-zinc-900 px-1.5 py-0.5 rounded">
                  {s.category}
                </span>
              </div>
              <kbd className="px-2.5 py-1 text-xs font-mono font-bold bg-zinc-900 border border-zinc-700 text-zinc-200 rounded-md shadow-inner">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#141417] border-t border-[#27272a] flex items-center justify-between text-[11px] text-zinc-500">
          <span className="flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-amber-400" /> Fast POS Billing Engine
          </span>
          <span>Press <kbd className="px-1 bg-zinc-800 rounded font-mono text-zinc-300">Esc</kbd> to close</span>
        </div>
      </div>
    </div>
  );
}
