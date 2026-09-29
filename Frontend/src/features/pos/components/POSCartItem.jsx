import React from "react";
import { Plus, Minus, Trash2 } from "lucide-react";

export default function POSCartItem({ item, onUpdateQuantity, onSetQuantity, onRemove }) {
  const id = item.id || item._id;
  const lineTotal = item.sellingPrice * item.quantity;

  return (
    <div className="pt-2.5 first:pt-0 pb-1.5 flex items-center justify-between gap-3 group">
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-xs text-white truncate group-hover:text-white transition-colors tracking-tight">
          {item.name}
        </h4>
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#6E6E73] mt-0.5">
          <span>₹{item.sellingPrice.toFixed(2)}</span>
          <span className="text-[#6E6E73]/40">/</span>
          <span>{item.unit || "pcs"}</span>
        </div>
      </div>

      {/* Quantity Stepper Controller */}
      <div className="flex items-center gap-1 bg-[#1D1D1F] border border-[#D2D2D7]/14 rounded-full p-0.5 shadow-xs">
        <button
          type="button"
          onClick={() => onUpdateQuantity(id, -1)}
          className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-white/10 text-[#6E6E73] hover:text-white cursor-pointer active:scale-90 transition-transform"
        >
          <Minus className="w-3 h-3" />
        </button>

        <input
          type="number"
          min="1"
          max={item.availableStock || 9999}
          value={item.quantity}
          onChange={(e) => {
            const val = parseInt(e.target.value, 10);
            if (!isNaN(val) && val > 0) {
              if (onSetQuantity) onSetQuantity(id, val);
            }
          }}
          className="w-8 text-center font-mono font-bold text-xs text-white bg-transparent focus:outline-none rounded py-0.5"
        />

        <button
          type="button"
          onClick={() => onUpdateQuantity(id, 1)}
          className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-white/10 text-[#6E6E73] hover:text-white cursor-pointer active:scale-90 transition-transform"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>

      {/* Total & Remove */}
      <div className="text-right min-w-[70px] flex flex-col items-end">
        <span className="font-bold font-mono text-xs text-white">
          ₹{lineTotal.toFixed(2)}
        </span>
        <button
          type="button"
          onClick={() => onRemove(id)}
          title="Remove item"
          className="text-[#6E6E73] hover:text-[#FF791B] p-0.5 transition-colors cursor-pointer"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
