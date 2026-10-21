import React from "react";
import { TrendingUp, TrendingDown, HelpCircle, AlertCircle, ArrowUpRight, ArrowDownRight, Clock } from "lucide-react";

export const formatINR = (val) => {
  if (val === null || val === undefined || isNaN(val)) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(val));
};

export function SummaryCard({
  title,
  value,
  isCurrency = true,
  suffix = "",
  subtitle,
  sourceTag,
  variant = "default", // default | profit | loss | alert | snapshot | unavailable
  unavailableMessage,
  isSnapshot = false,
  tooltip,
  icon: Icon,
}) {
  const isUnavailable = variant === "unavailable" || value === null;

  // Variant color mappings
  const variantStyles = {
    default: {
      border: "border-[#D2D2D7]/12",
      bg: "bg-[#161617]/90",
      accent: "text-white",
      pill: "bg-white/5 text-[#A1A1AA] border-[#D2D2D7]/10",
    },
    profit: {
      border: "border-emerald-500/25",
      bg: "bg-gradient-to-br from-[#161617] to-emerald-950/20",
      accent: "text-emerald-400",
      pill: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    },
    loss: {
      border: "border-rose-500/25",
      bg: "bg-gradient-to-br from-[#161617] to-rose-950/20",
      accent: "text-rose-400",
      pill: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    },
    alert: {
      border: "border-amber-500/25",
      bg: "bg-gradient-to-br from-[#161617] to-amber-950/20",
      accent: "text-amber-400",
      pill: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    },
    snapshot: {
      border: "border-sky-500/25",
      bg: "bg-gradient-to-br from-[#161617] to-sky-950/20",
      accent: "text-sky-400",
      pill: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    },
    unavailable: {
      border: "border-white/10",
      bg: "bg-[#161617]/60",
      accent: "text-[#6E6E73]",
      pill: "bg-white/5 text-[#8E8E93] border-white/10",
    },
  }[variant] || {
    border: "border-[#D2D2D7]/12",
    bg: "bg-[#161617]/90",
    accent: "text-white",
    pill: "bg-white/5 text-[#A1A1AA] border-[#D2D2D7]/10",
  };

  return (
    <div
      className={`p-5 rounded-2xl border backdrop-blur-xl ${variantStyles.border} ${variantStyles.bg} shadow-[0_4px_24px_rgba(0,0,0,0.25)] flex flex-col justify-between space-y-3 transition-all hover:border-[#D2D2D7]/30 hover:scale-[1.01]`}
    >
      {/* Top Header Row */}
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-0.5">
          <span className="text-xs font-medium text-[#8E8E93] tracking-normal flex items-center gap-1.5">
            {title}
            {tooltip && (
              <span title={tooltip} className="cursor-help text-[#6E6E73] hover:text-[#A1A1AA]">
                <HelpCircle className="w-3 h-3" />
              </span>
            )}
          </span>
          {isSnapshot && (
            <span className="inline-flex items-center gap-1 text-[10px] text-sky-400 font-mono">
              <Clock className="w-2.5 h-2.5" />
              Current Snapshot
            </span>
          )}
        </div>

        {sourceTag && (
          <span
            className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border ${variantStyles.pill}`}
          >
            {sourceTag}
          </span>
        )}
      </div>

      {/* Main Metric Value */}
      <div className="space-y-1">
        {isUnavailable ? (
          <div className="space-y-1">
            <span className="text-sm font-semibold text-[#8E8E93] italic">
              {unavailableMessage || "Unavailable (T59 Pending)"}
            </span>
            <p className="text-[11px] text-[#6E6E73]">
              Financial accounts module not yet implemented.
            </p>
          </div>
        ) : (
          <div className="flex items-baseline gap-1">
            <span className={`text-2xl md:text-3xl font-extrabold tracking-tight font-mono ${variantStyles.accent}`}>
              {isCurrency ? formatINR(value) : typeof value === "number" ? value : "—"}
            </span>
            {suffix && (
              <span className={`text-sm font-semibold ${variantStyles.accent}`}>{suffix}</span>
            )}
          </div>
        )}

        {/* Subtitle / Semantic Note */}
        {subtitle && !isUnavailable && (
          <p className="text-[11px] text-[#8E8E93] font-normal leading-tight">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

export default SummaryCard;
