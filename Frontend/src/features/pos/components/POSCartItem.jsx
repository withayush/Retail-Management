import React from "react";
import { Plus, Minus, Trash2 } from "lucide-react";

export default function POSCartItem({ item, onUpdateQuantity, onSetQuantity, onRemove }) {
  const id = item.id || item._id;
  const lineTotal = item.sellingPrice * item.quantity;

  return (
    <div className="pt-2 first:pt-0 pb-1 flex items-center justify-between gap-2 group">
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-xs text-zinc-100 truncate group-hover:text-white transition-colors">
          {item.name}
        </h4>
        <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-400">
          <span>₹{item.sellingPrice.toFixed(2)}</span>
          <span className="text-zinc-600">/</span>
          <span className="text-zinc-500">{item.unit || "pcs"}</span>
        </div>
      </div>

      {/* Quantity Controller with Direct Input */}
      <div className="flex items-center gap-1 bg-[#141417] border border-[#27272a] rounded-lg p-0.5">
        <button
          type="button"
          onClick={() => onUpdateQuantity(id, -1)}
          className="w-5 h-5 rounded flex items-center justify-center hover:bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer active:scale-90 transition-transform"
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
          className="w-8 text-center font-mono font-bold text-xs text-zinc-100 bg-transparent focus:outline-none focus:bg-zinc-800 rounded py-0.5"
        />

        <button
          type="button"
          onClick={() => onUpdateQuantity(id, 1)}
          className="w-5 h-5 rounded flex items-center justify-center hover:bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer active:scale-90 transition-transform"
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
          className="text-zinc-500 hover:text-red-400 p-0.5 transition-colors cursor-pointer"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
