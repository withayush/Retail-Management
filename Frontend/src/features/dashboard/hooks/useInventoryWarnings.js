import { useState, useEffect, useCallback } from "react";
import { getInventoryWarnings } from "../services/inventoryWarningApi";

/**
 * Phase 10 - Task T63: Hook for Inventory Warning Center Widget
 * Manages fetching, active status filtering (ALL, OUT_OF_STOCK, LOW_STOCK),
 * local search, loading states, and error handling.
 */
export function useInventoryWarnings(options = {}) {
  const { initialLimit = 10, autoRefresh = false, refreshInterval = 30000 } = options;

  const [data, setData] = useState({
    summary: {
      outOfStock: 0,
      lowStock: 0,
      totalWarnings: 0,
    },
    items: [],
    pagination: {
      total: 0,
      page: 1,
      limit: initialLimit,
      totalPages: 0,
    },
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("ALL"); // "ALL" | "OUT_OF_STOCK" | "LOW_STOCK"
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const fetchWarnings = useCallback(
    async (isBackground = false) => {
      if (isBackground) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const params = {
          page,
          limit: initialLimit,
        };

        if (statusFilter !== "ALL") {
          params.status = statusFilter;
        }

        if (search.trim()) {
          params.search = search.trim();
        }

        const res = await getInventoryWarnings(params);

        if (res && res.success && res.data) {
          setData({
            summary: res.data.summary || {
              outOfStock: 0,
              lowStock: 0,
              totalWarnings: 0,
            },
            items: Array.isArray(res.data.items) ? res.data.items : [],
            pagination: res.data.pagination || {
              total: 0,
              page: 1,
              limit: initialLimit,
              totalPages: 0,
            },
          });
        }
      } catch (err) {
        const message =
          err.response?.data?.message ||
          err.message ||
          "Failed to load inventory warnings.";
        setError(message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [page, initialLimit, statusFilter, search]
  );

  useEffect(() => {
    fetchWarnings(false);
  }, [fetchWarnings]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchWarnings(true);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchWarnings]);

  const refresh = () => fetchWarnings(true);

  return {
    summary: data.summary,
    items: data.items,
    pagination: data.pagination,
    loading,
    refreshing,
    error,
    statusFilter,
    setStatusFilter: (filter) => {
      setStatusFilter(filter);
      setPage(1);
    },
    search,
    setSearch: (s) => {
      setSearch(s);
      setPage(1);
    },
    page,
    setPage,
    refresh,
  };
}

export default useInventoryWarnings;

