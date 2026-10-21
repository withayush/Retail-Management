import React, { useState } from "react";
import { Calendar, RefreshCw, Filter, ChevronDown, Check } from "lucide-react";
import toast from "react-hot-toast";

/**
 * ProfitPeriodFilter (Phase 10 - Task T62)
 * Clean date-range filter toolbar supporting presets and custom date boundaries.
 */
export default function ProfitPeriodFilter({
  periodPreset,
  setPeriodPreset,
  customRange,
  onApplyCustomRange,
  loading,
  onRefresh,
  currentPeriod,
}) {
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [localFrom, setLocalFrom] = useState(customRange.from || "");
  const [localTo, setLocalTo] = useState(customRange.to || "");

  const presets = [
    { id: "THIS_MONTH", label: "This Month" },
    { id: "PREVIOUS_MONTH", label: "Previous Month" },
    { id: "LAST_30_DAYS", label: "Last 30 Days" },
    { id: "THIS_YEAR", label: "This Year" },
  ];

  const handlePresetClick = (id) => {
    setShowCustomModal(false);
    setPeriodPreset(id);
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!localFrom || !localTo) {
      toast.error("Please select both start and end dates.");
      return;
    }
    if (new Date(localFrom) > new Date(localTo)) {
      toast.error("Start date cannot be after end date.");
      return;
    }
    onApplyCustomRange(localFrom, localTo);
    setShowCustomModal(false);
  };

  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 p-3.5 bg-[#161617]/90 backdrop-blur-xl border border-[#D2D2D7]/12 rounded-2xl shadow-sm">
      {/* Preset Pill Buttons */}
      <div className="flex items-center flex-wrap gap-1.5 w-full md:w-auto">
        {presets.map((p) => {
          const isActive = periodPreset === p.id;
          return (
            <button
              key={p.id}
              onClick={() => handlePresetClick(p.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-xl transition-all duration-200 cursor-pointer ${
                isActive
                  ? "bg-[#0066CC] text-white shadow-[0_2px_10px_rgba(0,102,204,0.3)] font-semibold"
                  : "bg-white/[0.04] text-[#86868B] hover:text-white hover:bg-white/[0.08]"
              }`}
            >
              {p.label}
            </button>
          );
        })}

        {/* Custom Range Toggle */}
        <div className="relative">
          <button
            onClick={() => setShowCustomModal(!showCustomModal)}
            className={`px-3 py-1.5 text-xs font-medium rounded-xl transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
              periodPreset === "CUSTOM"
                ? "bg-[#0066CC] text-white shadow-[0_2px_10px_rgba(0,102,204,0.3)] font-semibold"
                : "bg-white/[0.04] text-[#86868B] hover:text-white hover:bg-white/[0.08]"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Custom Range</span>
            <ChevronDown className="w-3 h-3 opacity-70" />
          </button>

          {/* Custom Date Popover */}
          {showCustomModal && (
            <div className="absolute left-0 sm:right-0 sm:left-auto top-full mt-2 z-50 w-72 p-4 bg-[#1C1C1E] border border-[#D2D2D7]/20 rounded-2xl shadow-2xl space-y-3.5 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="text-xs font-semibold text-white">Select Date Range</span>
                <span className="text-[10px] text-[#86868B]">UTC Normalized</span>
              </div>
              <form onSubmit={handleCustomSubmit} className="space-y-3">
                <div>
                  <label className="block text-[11px] text-[#86868B] mb-1 font-mono">From (Start)</label>
                  <input
                    type="date"
                    value={localFrom}
                    onChange={(e) => setLocalFrom(e.target.value)}
                    className="w-full bg-[#2C2C2E] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#0066CC]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#86868B] mb-1 font-mono">To (End)</label>
                  <input
                    type="date"
                    value={localTo}
                    onChange={(e) => setLocalTo(e.target.value)}
                    className="w-full bg-[#2C2C2E] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#0066CC]"
                    required
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowCustomModal(false)}
                    className="px-2.5 py-1 text-xs text-[#86868B] hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 bg-[#0066CC] hover:bg-[#0077ED] text-white text-xs font-medium rounded-lg flex items-center gap-1 shadow-sm"
                  >
                    <Check className="w-3 h-3" />
                    Apply
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Right Side: Active Range Display & Refresh Button */}
      <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
        {currentPeriod?.from && currentPeriod?.to && (
          <div className="text-[11px] font-mono text-[#86868B] bg-white/[0.03] px-2.5 py-1 rounded-lg border border-white/5">
            <span className="text-[#A1A1A6]">{currentPeriod.from}</span>
            <span className="mx-1.5 opacity-50">→</span>
            <span className="text-[#A1A1A6]">{currentPeriod.to}</span>
          </div>
        )}

        <button
          onClick={onRefresh}
          disabled={loading}
          className="p-2 bg-white/[0.04] hover:bg-white/[0.08] text-[#86868B] hover:text-white rounded-xl transition-all duration-200 border border-white/5 disabled:opacity-50 cursor-pointer"
          title="Refresh Financial Data"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#0066CC]" : ""}`} />
        </button>
      </div>
    </div>
  );
}
