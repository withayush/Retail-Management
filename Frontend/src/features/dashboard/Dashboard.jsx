import { useAuth } from "../../context/AuthContext";
import { Link } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Boxes,
  Users,
  ShoppingCart,
  LogOut,
  Building,
} from "lucide-react";

export default function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* Sidebar */}
      <aside className="w-64 sidebar flex flex-col justify-between hidden md:flex">
        <div className="space-y-6">
          <div className="flex items-center gap-2 px-2">
            <span className="badge badge-primary">VendorOS</span>
          </div>

          <nav className="space-y-1">
            <Link to="/dashboard" className="sidebar-item active flex items-center gap-3">
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </Link>
            <Link to="/pos" className="sidebar-item flex items-center gap-3">
              <ShoppingCart className="w-4 h-4" />
              <span>POS Terminal</span>
            </Link>
            <Link to="/products" className="sidebar-item flex items-center gap-3">
              <Package className="w-4 h-4" />
              <span>Products</span>
            </Link>
            <Link to="/inventory" className="sidebar-item flex items-center gap-3">
              <Boxes className="w-4 h-4" />
              <span>Inventory</span>
            </Link>
            <Link to="/customers" className="sidebar-item flex items-center gap-3">
              <Users className="w-4 h-4" />
              <span>Customers</span>
            </Link>
          </nav>
        </div>

        <div className="pt-4 border-t border-border space-y-3">
          <div className="px-2">
            <p className="text-xs text-muted-foreground uppercase font-semibold">Account</p>
            <p className="text-sm font-medium truncate">{user?.fullName || user?.phone || "Vendor"}</p>
          </div>
          <button
            onClick={logout}
            className="sidebar-item w-full flex items-center gap-2 text-destructive hover:bg-secondary"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Overview of your business operations and real-time activity
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/pos" className="btn btn-primary">
              <ShoppingCart className="w-4 h-4" />
              Open POS
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase">Today Sales</p>
            <p className="text-2xl font-bold">₹0.00</p>
          </div>
          <div className="card space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase">Active Orders</p>
            <p className="text-2xl font-bold">0</p>
          </div>
          <div className="card space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase">Low Stock Alerts</p>
            <p className="text-2xl font-bold text-yellow-500">0</p>
          </div>
          <div className="card space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase">Total Customers</p>
            <p className="text-2xl font-bold">0</p>
          </div>
        </div>
      </main>
    </div>
  );
}
