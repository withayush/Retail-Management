import React, { useState } from "react";
import { Calendar, Filter, ChevronDown, Check } from "lucide-react";

const PRESETS = [
  { id: "THIS_MONTH", label: "This Month" },
  { id: "PREVIOUS_MONTH", label: "Previous Month" },
  { id: "LAST_7_DAYS", label: "Last 7 Days" },
  { id: "LAST_30_DAYS", label: "Last 30 Days" },
  { id: "THIS_YEAR", label: "This Year" },
  { id: "CUSTOM", label: "Custom Range" },
];

export function DateRangeFilter({
  periodPreset,
  onSelectPreset,
  customRange,
  onCustomRangeChange,
  activePeriodLabel,
}) {
  const [showCustomInputs, setShowCustomInputs] = useState(periodPreset === "CUSTOM");

  const handlePresetClick = (presetId) => {
    onSelectPreset(presetId);
    setShowCustomInputs(presetId === "CUSTOM");
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Preset Pills */}
      <div className="flex items-center flex-wrap gap-1.5 p-1 bg-[#1A1A1E] border border-[#D2D2D7]/15 rounded-xl">
        {PRESETS.map((p) => {
          const isActive = periodPreset === p.id;
          return (
            <button
              key={p.id}
              onClick={() => handlePresetClick(p.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? "bg-[#0066CC] text-white shadow-sm font-semibold"
                  : "text-[#A1A1AA] hover:text-white hover:bg-white/[0.05]"
              }`}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {/* Custom Date Range Picker Accordion / Modal Drawer */}
      {showCustomInputs && (
        <div className="p-3 bg-[#161617] border border-[#D2D2D7]/20 rounded-xl flex flex-wrap items-center gap-3 text-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <span className="text-[#A1A1AA]">From:</span>
            <input
              type="date"
              value={customRange.from}
              onChange={(e) =>
                onCustomRangeChange({ ...customRange, from: e.target.value })
              }
              className="bg-[#242428] border border-[#D2D2D7]/20 text-white rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-[#0066CC]"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#A1A1AA]">To:</span>
            <input
              type="date"
              value={customRange.to}
              onChange={(e) =>
                onCustomRangeChange({ ...customRange, to: e.target.value })
              }
              className="bg-[#242428] border border-[#D2D2D7]/20 text-white rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-[#0066CC]"
            />
          </div>
          {customRange.from && customRange.to && (
            <span className="text-emerald-400 text-[11px] font-medium flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              Range selected
            </span>
          )}
        </div>
      )}

      {/* Active Period Label Display */}
      {activePeriodLabel && (
        <div className="flex items-center gap-2 text-xs text-[#8E8E93]">
          <Calendar className="w-3.5 h-3.5 text-[#0066CC]" />
          <span>Reporting Period:</span>
          <span className="font-medium text-[#D2D2D7] font-mono">{activePeriodLabel}</span>
        </div>
      )}
    </div>
  );
}

export default DateRangeFilter;
