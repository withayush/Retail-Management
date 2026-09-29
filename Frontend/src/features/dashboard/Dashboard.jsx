import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
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
import { ExternalLink, Download, ShoppingCart, ArrowRight, Sparkles, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";

export default function Dashboard() {
  const navigate = useNavigate();
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
        getSales({ limit: 6, page: 1 }),
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
    <div className="p-5 md:p-8 space-y-7 w-full max-w-7xl mx-auto">
      {/* ── Apple Hero Banner: Quick POS Checkout Access ── */}
      <div className="relative overflow-hidden rounded-[18px] bg-gradient-to-r from-[#161617] via-[#1D1D1F] to-[#161617] border border-[#D2D2D7]/12 p-6 md:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#0066CC]/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0066CC]/15 border border-[#0066CC]/30 text-[#54A7FF] text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>ACID Atomic Checkout & Idempotent Engine Active</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              Store Command Center
            </h1>
            <p className="text-xs md:text-sm text-[#6E6E73] font-normal leading-relaxed">
              Real-time inventory synchronization, instant barcode billing, and ledger reconciliation with zero-overselling guarantees.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => navigate("/pos")}
              className="apple-btn-primary shadow-[0_4px_20px_rgba(0,102,204,0.45)] hover:scale-105 active:scale-95 cursor-pointer text-xs"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Launch POS Terminal (F2)</span>
            </button>
          </div>
        </div>
      </div>

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
      <div className="p-6 bg-[#161617]/90 backdrop-blur-2xl border border-[#D2D2D7]/12 rounded-[18px] shadow-[0_4px_24px_rgba(0,0,0,0.3)] space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-white tracking-tight">Recent Transactions</h2>
            <p className="text-xs text-[#6E6E73] mt-0.5">Live transaction log across all store registers</p>
          </div>
          <Link
            to="/sales"
            className="apple-btn-secondary text-xs py-1.5 px-3.5"
          >
            <span>View All Records</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          {recentSales.length === 0 && !loading ? (
            <p className="text-xs text-[#6E6E73] py-10 text-center font-medium">No sales recorded yet. Process a sale in POS Terminal.</p>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#D2D2D7]/10 text-[#6E6E73]">
                  <th className="pb-3 font-semibold">Invoice Number</th>
                  <th className="pb-3 font-semibold">Customer</th>
                  <th className="pb-3 font-semibold">Payment Status</th>
                  <th className="pb-3 font-semibold">Total Amount</th>
                  <th className="pb-3 font-semibold text-right">Invoice Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D2D2D7]/6">
                {recentSales.map((sale) => (
                  <tr key={sale._id} className="hover:bg-white/[0.03] transition-colors group">
                    <td className="py-3.5 font-mono text-white font-medium">{sale.invoiceNumber}</td>
                    <td className="py-3.5 text-[#D2D2D7] font-normal">{sale.customerName || "Walk-in Customer"}</td>
                    <td className="py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                        sale.paymentStatus === "PAID"
                          ? "bg-[#0066CC]/15 text-[#54A7FF] border border-[#0066CC]/30"
                          : "bg-[#FF791B]/15 text-[#FFA466] border border-[#FF791B]/30"
                      }`}>
                        {sale.paymentStatus || "PAID"}
                      </span>
                    </td>
                    <td className="py-3.5 font-bold text-white text-sm">₹{sale.total || 0}</td>
                    <td className="py-3.5 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => handlePreview(sale)}
                          title="Preview Invoice"
                          className="p-1.5 rounded-full text-[#6E6E73] hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDownload(sale)}
                          title="Download PDF"
                          className="p-1.5 rounded-full text-[#6E6E73] hover:text-white hover:bg-white/10 transition-all cursor-pointer"
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
