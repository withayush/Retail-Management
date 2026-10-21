import { useState, useEffect, useCallback, useRef } from "react";
import { getSalesTrends } from "../services/salesAnalyticsApi";
import toast from "react-hot-toast";

/**
 * useSalesTrends - Custom hook for managing T61 sales performance state,
 * grouping modes (hour, day, week, month), metric selection (revenue, orderCount),
 * date filtering, and safe async request synchronization.
 */
export function useSalesTrends() {
  const [groupBy, setGroupBy] = useState("day");
  const [selectedMetric, setSelectedMetric] = useState("revenue"); // "revenue" | "orderCount"
  const [periodPreset, setPeriodPreset] = useState("THIS_MONTH");
  const [customRange, setCustomRange] = useState({
    from: "",
    to: "",
  });
  const [singleDate, setSingleDate] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const requestIdRef = useRef(0);

  const fetchTrends = useCallback(async () => {
    const currentRequestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);

    try {
      const params = {
        groupBy,
      };

      if (groupBy === "hour") {
        params.date = singleDate;
      } else if (periodPreset === "CUSTOM") {
        if (!customRange.from || !customRange.to) {
          setLoading(false);
          return;
        }
        params.from = customRange.from;
        params.to = customRange.to;
      } else {
        params.periodPreset = periodPreset;
      }

      const response = await getSalesTrends(params);

      if (currentRequestId === requestIdRef.current) {
        if (response?.success && response?.data) {
          setData(response.data);
        } else {
          throw new Error(response?.message || "Failed to load sales performance data.");
        }
      }
    } catch (err) {
      if (currentRequestId === requestIdRef.current) {
        const errorMsg =
          err.response?.data?.message || err.message || "Failed to load sales performance data.";
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [groupBy, periodPreset, customRange, singleDate]);

  useEffect(() => {
    fetchTrends();
  }, [fetchTrends]);

  return {
    groupBy,
    setGroupBy,
    selectedMetric,
    setSelectedMetric,
    periodPreset,
    setPeriodPreset,
    customRange,
    setCustomRange,
    singleDate,
    setSingleDate,
    data,
    loading,
    error,
    refresh: fetchTrends,
  };
}

export default useSalesTrends;
