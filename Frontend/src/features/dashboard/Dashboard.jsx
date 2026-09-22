import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import DashboardMetrics from "./components/DashboardMetrics";
import { getSales, getSalesSummary } from "../../services/sale.api";
import {
  getInventoryAlertsSummary,
  getStoreState,
} from "../../services/inventory.api";
import {
  getBusinessOutstandingTotals,
  getCustomers,
} from "../../services/customer.api";
import { downloadInvoicePdf, previewInvoicePdf } from "../../services/sale.api";
import { ExternalLink, Download } from "lucide-react";
import toast from "react-hot-toast";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);

  const [salesSummary, setSalesSummary] = useState(null);
  const [recentSales, setRecentSales] = useState([]);
  const [inventoryAlerts, setInventoryAlerts] = useState({
    outOfStockCount: 0,
    lowStockCount: 0,
  });
  const [customerStats, setCustomerStats] = useState({
    totalCustomers: 0,
    totalOutstanding: 0,
  });

  const loadDashboardData = useCallback(async () => {
    try {
      const [
        salesSummaryRes,
        recentSalesRes,
        alertsSummaryRes,
        outstandingRes,
        customersRes,
      ] = await Promise.allSettled([
        getSalesSummary(),
        getSales({ limit: 5, page: 1 }),
        getInventoryAlertsSummary(),
        getBusinessOutstandingTotals(),
        getCustomers(),
      ]);

      if (salesSummaryRes.status === "fulfilled" && salesSummaryRes.value?.data) {
        setSalesSummary(salesSummaryRes.value.data);
      }

      if (recentSalesRes.status === "fulfilled" && recentSalesRes.value?.data) {
        const salesData = Array.isArray(recentSalesRes.value.data)
          ? recentSalesRes.value.data
          : recentSalesRes.value.data?.sales || [];
        setRecentSales(salesData);
      }

      if (alertsSummaryRes.status === "fulfilled" && alertsSummaryRes.value?.data) {
        setInventoryAlerts(alertsSummaryRes.value.data);
      }

      let outstandingTotal = 0;
      let totalCustCount = 0;

      if (outstandingRes.status === "fulfilled" && outstandingRes.value?.data) {
        outstandingTotal =
          outstandingRes.value.data?.totalOutstanding ||
          outstandingRes.value.data?.totalDebt ||
          0;
      }

      if (customersRes.status === "fulfilled" && customersRes.value?.data) {
        const cList = Array.isArray(customersRes.value.data)
          ? customersRes.value.data
          : customersRes.value.data?.customers || [];
        totalCustCount = cList.length;
      }

      setCustomerStats({
        totalCustomers: totalCustCount,
        totalOutstanding: outstandingTotal,
      });
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleDownload = async (sale) => {
    try {
      await downloadInvoicePdf(sale._id, sale.invoiceNumber);
    } catch (err) {
      toast.error("Failed to download PDF");
    }
  };

  const handlePreview = async (sale) => {
    try {
      await previewInvoicePdf(sale._id);
    } catch (err) {
      toast.error("Failed to preview PDF");
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 w-full">
      {/* KPI Metrics */}
      <DashboardMetrics
        totalSalesAmount={salesSummary?.totalSalesAmount || 0}
        totalInvoicesCount={salesSummary?.totalInvoicesCount || 0}
        pendingCount={salesSummary?.pendingCount || 0}
        lowStockAlerts={inventoryAlerts?.lowStockCount || 0}
        outOfStockAlerts={inventoryAlerts?.outOfStockCount || 0}
        totalCustomers={customerStats.totalCustomers}
        totalOutstanding={customerStats.totalOutstanding}
        loading={loading}
      />

      {/* Recent Sales Table */}
      <div className="p-4 bg-[#141416] border border-[#242427] rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Recent Sales</h2>
          <Link to="/sales" className="text-xs text-zinc-400 hover:text-white">
            View all
          </Link>
        </div>

        <div className="overflow-x-auto">
          {recentSales.length === 0 && !loading ? (
            <p className="text-xs text-zinc-500 py-6 text-center">No sales recorded yet.</p>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#242427] text-zinc-400">
                  <th className="pb-2 font-medium">Invoice</th>
                  <th className="pb-2 font-medium">Customer</th>
                  <th className="pb-2 font-medium">Total</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222225]">
                {recentSales.map((sale) => (
                  <tr key={sale._id} className="hover:bg-zinc-800/30">
                    <td className="py-2.5 font-mono text-zinc-300">{sale.invoiceNumber}</td>
                    <td className="py-2.5 text-zinc-300">{sale.customerName || "Walk-in"}</td>
                    <td className="py-2.5 font-medium text-white">₹{sale.total || 0}</td>
                    <td className="py-2.5">
                      <span className="text-[11px] text-zinc-300">
                        {sale.paymentStatus}
                      </span>
                    </td>
                    <td className="py-2.5 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => handlePreview(sale)}
                          title="Preview"
                          className="p-1 rounded text-zinc-400 hover:text-white"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDownload(sale)}
                          title="Download"
                          className="p-1 rounded text-zinc-400 hover:text-white"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
