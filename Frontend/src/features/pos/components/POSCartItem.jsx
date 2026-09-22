import React from "react";
import { Plus, Minus } from "lucide-react";

export default function POSCartItem({ item, onUpdateQuantity, onRemove }) {
  const id = item.id || item._id;
  const lineTotal = item.sellingPrice * item.quantity;

  return (
    <div className="pt-2.5 first:pt-0 flex items-center justify-between gap-2">
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-xs text-zinc-200 truncate">
          {item.name}
        </h4>
        <span className="text-[11px] font-mono text-zinc-500">
          ₹{item.sellingPrice.toFixed(2)} × {item.quantity}
        </span>
      </div>

      {/* Quantity Controller */}
      <div className="flex items-center gap-1 bg-[#141417] border border-[#27272a] rounded-lg p-0.5">
        <button
          onClick={() => onUpdateQuantity(id, -1)}
          className="w-5 h-5 rounded flex items-center justify-center hover:bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer"
        >
          <Minus className="w-3 h-3" />
        </button>
        <span className="w-5 text-center font-mono font-semibold text-xs text-zinc-200">
          {item.quantity}
        </span>
        <button
          onClick={() => onUpdateQuantity(id, 1)}
          className="w-5 h-5 rounded flex items-center justify-center hover:bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>

      <div className="text-right min-w-[65px]">
        <span className="font-semibold text-xs text-white block">
          ₹{lineTotal.toFixed(2)}
        </span>
        <button
          onClick={() => onRemove(id)}
          className="text-[10px] text-red-400 hover:text-red-300 hover:underline cursor-pointer"
        >
          Remove
        </button>
      </div>
    </div>
  );
}
