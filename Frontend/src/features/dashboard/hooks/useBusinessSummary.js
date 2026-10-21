import { useState, useEffect, useCallback, useRef } from "react";
import { getBusinessSummary } from "../services/dashboardApi";
import toast from "react-hot-toast";

/**
 * useBusinessSummary - Custom hook for managing T60 dashboard state,
 * period-filtering, race-condition safe data fetching, and refresh behavior.
 */
export function useBusinessSummary() {
  const [periodPreset, setPeriodPreset] = useState("THIS_MONTH");
  const [customRange, setCustomRange] = useState({
    from: "",
    to: "",
  });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Counter to reject out-of-order responses from stale requests
  const requestIdRef = useRef(0);

  const fetchSummary = useCallback(async () => {
    const currentRequestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);

    try {
      const params = {};
      if (periodPreset === "CUSTOM") {
        if (!customRange.from || !customRange.to) {
          // Waiting for user to select both dates
          setLoading(false);
          return;
        }
        params.from = customRange.from;
        params.to = customRange.to;
      } else {
        params.periodPreset = periodPreset;
      }

      const response = await getBusinessSummary(params);

      // Verify request is still current before updating state
      if (currentRequestId === requestIdRef.current) {
        if (response?.success && response?.data) {
          setData(response.data);
        } else {
          throw new Error(response?.message || "Failed to load business summary");
        }
      }
    } catch (err) {
      if (currentRequestId === requestIdRef.current) {
        const errorMsg =
          err.response?.data?.message || err.message || "Failed to load dashboard metrics.";
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [periodPreset, customRange]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return {
    periodPreset,
    setPeriodPreset,
    customRange,
    setCustomRange,
    data,
    loading,
    error,
    refresh: fetchSummary,
  };
}

export default useBusinessSummary;
