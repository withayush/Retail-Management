import { useState, useEffect, useCallback, useRef } from "react";
import toast from "react-hot-toast";
import { getProfitBreakdown } from "../services/profitAnalyticsApi";

/**
 * useProfitAnalytics Hook (Phase 10 - Task T62)
 * Manages fetching, period filtering, refresh states, and race-condition guards.
 */
export function useProfitAnalytics() {
  const [periodPreset, setPeriodPreset] = useState("THIS_MONTH");
  const [customRange, setCustomRange] = useState({ from: "", to: "" });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const requestIdRef = useRef(0);

  const fetchBreakdown = useCallback(
    async (showToast = false) => {
      const currentRequestId = ++requestIdRef.current;
      setLoading(true);
      setError(null);

      try {
        const params = {};
        if (periodPreset === "CUSTOM") {
          if (!customRange.from || !customRange.to) {
            setLoading(false);
            return;
          }
          params.from = customRange.from;
          params.to = customRange.to;
        } else {
          params.periodPreset = periodPreset;
        }

        const res = await getProfitBreakdown(params);

        // Guard against out-of-order race conditions
        if (currentRequestId === requestIdRef.current) {
          if (res?.success && res?.data) {
            setData(res.data);
            if (showToast) {
              toast.success("Profit analytics updated");
            }
          } else {
            throw new Error(res?.message || "Failed to load profit breakdown");
          }
        }
      } catch (err) {
        if (currentRequestId === requestIdRef.current) {
          const msg =
            err?.response?.data?.message ||
            err?.message ||
            "Unable to retrieve profit analytics";
          setError(msg);
          toast.error(msg);
        }
      } finally {
        if (currentRequestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    },
    [periodPreset, customRange]
  );

  useEffect(() => {
    // Only auto-fetch custom when both from and to are set
    if (periodPreset === "CUSTOM") {
      if (customRange.from && customRange.to) {
        fetchBreakdown();
      }
    } else {
      fetchBreakdown();
    }
  }, [fetchBreakdown, periodPreset]);

  const handleApplyCustomRange = (from, to) => {
    setCustomRange({ from, to });
    setPeriodPreset("CUSTOM");
  };

  return {
    periodPreset,
    setPeriodPreset,
    customRange,
    setCustomRange,
    handleApplyCustomRange,
    data,
    loading,
    error,
    refresh: () => fetchBreakdown(true),
  };
}

export default useProfitAnalytics;
