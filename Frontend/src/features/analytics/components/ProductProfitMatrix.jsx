import React from "react";
import { Package, Award, ArrowUpRight, Percent } from "lucide-react";

/**
 * ProductProfitMatrix - Phase 9 (Task T56 Gross Profit Connection)
 * Top 10 Product Profit Contribution Matrix
 * Identifies star performers driving store bottom-line profitability
 */
export default function ProductProfitMatrix({ products = [], loading = false }) {
  const formatINR = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(val) || 0);
  };

  return (
    <div className="p-6 bg-[#161617]/90 backdrop-blur-2xl border border-[#D2D2D7]/12 rounded-[18px] shadow-[0_4px_24px_rgba(0,0,0,0.3)] space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-white tracking-tight">
              Top Product Profitability Drivers
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-white/10 text-[#D2D2D7]">
              Product Level Contribution
            </span>
          </div>
          <p className="text-xs text-[#6E6E73] mt-0.5">
            Key items driving gross margin and funding store operational expenses
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead>
            <tr className="border-b border-[#D2D2D7]/10 text-[#6E6E73]">
              <th className="pb-3 font-semibold font-sans">Product / SKU</th>
              <th className="pb-3 font-semibold font-sans text-right">Units Sold</th>
              <th className="pb-3 font-semibold font-sans text-right">Historical Cost</th>
              <th className="pb-3 font-semibold font-sans text-right">Selling Price</th>
              <th className="pb-3 font-semibold font-sans text-right">Revenue</th>
              <th className="pb-3 font-semibold font-sans text-right">Gross Profit</th>
              <th className="pb-3 font-semibold font-sans text-right">Margin %</th>
              <th className="pb-3 font-semibold font-sans text-right">Profit Share</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#D2D2D7]/6">
            {products.length === 0 ? (
              <tr>
                <td colSpan="8" className="py-8 text-center text-[#6E6E73] font-sans">
                  No product sales recorded in the selected period.
                </td>
              </tr>
            ) : (
              products.map((p, idx) => {
                const margin = p.grossMarginPercentage ?? (p.totalRevenue > 0 ? Math.round(((p.grossProfit / p.totalRevenue) * 100) * 100) / 100 : 0);
                const isLoss = (p.grossProfit || 0) < 0;

                return (
                  <tr
                    key={p.productId || p.sku || idx}
                    className="hover:bg-white/[0.03] transition-colors group"
                  >
                    <td className="py-3 font-sans">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[#D2D2D7] shrink-0">
                          <Package className="w-3 h-3" />
                        </div>
                        <div>
                          <span className="font-medium text-white block group-hover:text-[#54A7FF] transition-colors">
                            {p.name}
                          </span>
                          <span className="text-[10px] text-[#6E6E73] font-mono block">
                            {p.sku}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-right text-[#D2D2D7]">
                      {p.unitsSold || 0}
                    </td>
                    <td className="py-3 text-right text-sky-400">
                      {formatINR(p.historicalCostPrice || (p.unitsSold ? (p.totalCogs / p.unitsSold) : 0))}
                    </td>
                    <td className="py-3 text-right text-[#D2D2D7]">
                      {formatINR(p.sellingPrice || (p.unitsSold ? (p.totalRevenue / p.unitsSold) : 0))}
                    </td>
                    <td className="py-3 text-right text-white font-medium">
                      {formatINR(p.totalRevenue)}
                    </td>
                    <td
                      className={`py-3 text-right font-bold ${
                        isLoss ? "text-rose-400" : "text-emerald-400"
                      }`}
                    >
                      {formatINR(p.grossProfit)}
                    </td>
                    <td
                      className={`py-3 text-right ${
                        isLoss ? "text-rose-400" : "text-emerald-400"
                      }`}
                    >
                      {margin}%
                    </td>
                    <td className="py-3 text-right">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#0066CC]/15 text-[#54A7FF] border border-[#0066CC]/30">
                        {p.profitContributionPercentage || 0}%
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
