import React, { useState } from "react";
import { Calendar, Search, Filter, ArrowUpDown } from "lucide-react";

/**
 * DailyProfitLedgerTable - Phase 9 (Task T56)
 * Daily Net Profit Breakdown Ledger
 * High-density Apple-style table displaying daily bottom-line truth
 */
export default function DailyProfitLedgerTable({ dailyData, loading = false }) {
  const [filterType, setFilterType] = useState("ALL"); // ALL | PROFIT | LOSS | ACTIVE

  const formatINR = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(val) || 0);
  };

  const dailyItems = dailyData?.dailyBreakdown || [];
  const monthName = dailyData?.monthName || (dailyData?.month ? `Month ${dailyData.month}` : "Current Month");
  const year = dailyData?.year || new Date().getUTCFullYear();

  // Filter daily records
  const filteredItems = dailyItems.filter((item) => {
    if (filterType === "ACTIVE") return (item.revenue > 0 || item.opex > 0);
    if (filterType === "PROFIT") return item.netProfit > 0;
    if (filterType === "LOSS") return item.netProfit < 0;
    return true;
  });

  return (
    <div className="p-6 bg-[#161617]/90 backdrop-blur-2xl border border-[#D2D2D7]/12 rounded-[18px] shadow-[0_4px_24px_rgba(0,0,0,0.3)] space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-white tracking-tight">
              Daily Net Profit Ledger
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-[#0066CC]/15 text-[#54A7FF] border border-[#0066CC]/30">
              {dailyItems.length} Days Recorded
            </span>
          </div>
          <p className="text-xs text-[#6E6E73] mt-0.5">
            Day-by-day bottom line accounting reconciling Revenue, COGS, and Cash Burn
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-black/20 p-1 rounded-xl border border-[#D2D2D7]/10 text-xs">
          {["ALL", "ACTIVE", "PROFIT", "LOSS"].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all text-[11px] cursor-pointer ${
                filterType === type
                  ? "bg-[#0066CC] text-white shadow-sm"
                  : "text-[#6E6E73] hover:text-[#D2D2D7]"
              }`}
            >
              {type === "ACTIVE" ? "Active Days Only" : type}
            </button>
          ))}
        </div>
      </div>

      {/* ── HIGH DENSITY TABLE ── */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead>
            <tr className="border-b border-[#D2D2D7]/10 text-[#6E6E73]">
              <th className="pb-3 font-semibold font-sans">Date</th>
              <th className="pb-3 font-semibold font-sans">Day</th>
              <th className="pb-3 font-semibold font-sans text-right">Revenue (T52)</th>
              <th className="pb-3 font-semibold font-sans text-right">COGS (T53)</th>
              <th className="pb-3 font-semibold font-sans text-right">Gross Profit (T54)</th>
              <th className="pb-3 font-semibold font-sans text-right">OpEx (T55)</th>
              <th className="pb-3 font-semibold font-sans text-right">Net Profit (T56)</th>
              <th className="pb-3 font-semibold font-sans text-right">Net Margin</th>
              <th className="pb-3 font-semibold font-sans text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#D2D2D7]/6">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan="9" className="py-8 text-center text-[#6E6E73] font-sans">
                  No daily records match the selected filter.
                </td>
              </tr>
            ) : (
              filteredItems.map((day) => {
                const isProfitable = (day.netProfit || 0) > 0;
                const isLoss = (day.netProfit || 0) < 0;
                const isZero = (day.netProfit || 0) === 0;

                return (
                  <tr
                    key={day.date || day.day}
                    className="hover:bg-white/[0.03] transition-colors group"
                  >
                    <td className="py-2.5 text-[#D2D2D7] font-medium font-sans">
                      {day.date}
                    </td>
                    <td className="py-2.5 text-[#6E6E73]">Day {day.day}</td>
                    <td className="py-2.5 text-right text-white font-medium">
                      {formatINR(day.revenue)}
                    </td>
                    <td className="py-2.5 text-right text-sky-400">
                      {formatINR(day.cogs)}
                    </td>
                    <td className="py-2.5 text-right text-[#D2D2D7]">
                      {formatINR(day.grossProfit)}
                    </td>
                    <td className="py-2.5 text-right text-amber-400">
                      {formatINR(day.opex)}
                    </td>
                    <td
                      className={`py-2.5 text-right font-bold ${
                        isProfitable
                          ? "text-emerald-400"
                          : isLoss
                          ? "text-rose-400"
                          : "text-[#6E6E73]"
                      }`}
                    >
                      {formatINR(day.netProfit)}
                    </td>
                    <td
                      className={`py-2.5 text-right ${
                        isProfitable
                          ? "text-emerald-400"
                          : isLoss
                          ? "text-rose-400"
                          : "text-[#6E6E73]"
                      }`}
                    >
                      {day.margin}%
                    </td>
                    <td className="py-2.5 text-right">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold font-sans uppercase ${
                          isProfitable
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                            : isLoss
                            ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                            : "bg-zinc-500/15 text-zinc-400 border border-zinc-500/30"
                        }`}
                      >
                        {day.status || (isProfitable ? "PROFIT" : isLoss ? "LOSS" : "ZERO")}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
