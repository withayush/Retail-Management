import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { getMe } from "../../services/auth.api";
import { getMyBusiness } from "../../services/business.api";
import {
  User,
  Store,
  Phone,
  Mail,
  MapPin,
  Calendar,
  ShieldCheck,
  Building2,
  Receipt,
  Clock,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";

export default function ProfilePage() {
  const { user: contextUser, business: contextBusiness, refetchBusiness } = useAuth();

  const [user, setUser] = useState(contextUser);
  const [business, setBusiness] = useState(contextBusiness);
  const [loading, setLoading] = useState(false);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const [meRes, bizRes] = await Promise.allSettled([
        getMe(),
        getMyBusiness(),
      ]);

      if (meRes.status === "fulfilled" && (meRes.value?.data?.account || meRes.value?.data)) {
        setUser(meRes.value.data.account || meRes.value.data);
      }

      if (bizRes.status === "fulfilled" && bizRes.value?.data) {
        const bData = Array.isArray(bizRes.value.data)
          ? bizRes.value.data[0]
          : bizRes.value.data?.business || bizRes.value.data;
        setBusiness(bData);
      }
    } catch (err) {
      console.error("Profile refresh error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const businessName =
    business?.businessName ||
    business?.business_name ||
    business?.name ||
    "Not Configured";

  const userName = user?.fullName || user?.phone || "Vendor";
  const userInitials = (userName.slice(0, 2) || "VO").toUpperCase();

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="p-6 md:p-8 w-full space-y-6">
      {/* ─────────────────────────────────────────────────────────────
          TOP PROFILE HEADER CARD
      ───────────────────────────────────────────────────────────── */}
      <div className="p-6 bg-[#141416] border border-[#242427] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-zinc-800 border border-zinc-700 text-white font-bold text-xl flex items-center justify-center shrink-0">
            {userInitials}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white">{userName}</h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <ShieldCheck className="w-3 h-3" />
                Verified
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">{businessName}</p>
          </div>
        </div>

        <button
          onClick={() => {
            fetchProfile();
            refetchBusiness();
            toast.success("Profile refreshed!");
          }}
          className="self-start sm:self-auto flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium bg-zinc-900 text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Details</span>
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          1. PERSONAL / ACCOUNT INFORMATION
      ───────────────────────────────────────────────────────────── */}
      <div className="p-6 bg-[#141416] border border-[#242427] rounded-2xl space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-[#242427]">
          <User className="w-4 h-4 text-zinc-400" />
          <h2 className="text-sm font-semibold text-white">Account Information</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3 bg-zinc-900/60 border border-zinc-800/80 rounded-xl space-y-1">
            <span className="text-zinc-500 font-medium">Full Name</span>
            <p className="text-sm font-semibold text-zinc-200">{user?.fullName || "N/A"}</p>
          </div>

          <div className="p-3 bg-zinc-900/60 border border-zinc-800/80 rounded-xl space-y-1">
            <span className="text-zinc-500 font-medium">Phone Number</span>
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-zinc-400" />
              <p className="text-sm font-semibold text-zinc-200">{user?.phone || "N/A"}</p>
            </div>
          </div>

          <div className="p-3 bg-zinc-900/60 border border-zinc-800/80 rounded-xl space-y-1">
            <span className="text-zinc-500 font-medium">Email Address</span>
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-zinc-400" />
              <p className="text-sm font-semibold text-zinc-200 truncate">{user?.email || "N/A"}</p>
            </div>
          </div>

          <div className="p-3 bg-zinc-900/60 border border-zinc-800/80 rounded-xl space-y-1">
            <span className="text-zinc-500 font-medium">Registered Date</span>
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-zinc-400" />
              <p className="text-sm font-semibold text-zinc-200">{formatDate(user?.createdAt)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. BUSINESS & STORE ONBOARDING INFORMATION
      ───────────────────────────────────────────────────────────── */}
      <div className="p-6 bg-[#141416] border border-[#242427] rounded-2xl space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-[#242427]">
          <Building2 className="w-4 h-4 text-zinc-400" />
          <h2 className="text-sm font-semibold text-white">Business & Store Profile</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3 bg-zinc-900/60 border border-zinc-800/80 rounded-xl space-y-1">
            <span className="text-zinc-500 font-medium">Business / Shop Name</span>
            <p className="text-sm font-semibold text-zinc-200">{businessName}</p>
          </div>

          <div className="p-3 bg-zinc-900/60 border border-zinc-800/80 rounded-xl space-y-1">
            <span className="text-zinc-500 font-medium">Retail Category / Segment</span>
            <p className="text-sm font-semibold text-zinc-200">
              {business?.retailSegment || business?.category || business?.businessType || "Retail"}
            </p>
          </div>

          <div className="p-3 bg-zinc-900/60 border border-zinc-800/80 rounded-xl space-y-1">
            <span className="text-zinc-500 font-medium">Business Contact Phone</span>
            <p className="text-sm font-semibold text-zinc-200">
              {business?.businessPhone || business?.phone || user?.phone || "N/A"}
            </p>
          </div>

          <div className="p-3 bg-zinc-900/60 border border-zinc-800/80 rounded-xl space-y-1">
            <span className="text-zinc-500 font-medium">Tax Mode</span>
            <div className="flex items-center gap-1.5">
              <Receipt className="w-3.5 h-3.5 text-zinc-400" />
              <p className="text-sm font-semibold text-zinc-200">{business?.taxMode || "GST"}</p>
            </div>
          </div>

          <div className="sm:col-span-2 p-3 bg-zinc-900/60 border border-zinc-800/80 rounded-xl space-y-1">
            <span className="text-zinc-500 font-medium">Store Address</span>
            <div className="flex items-start gap-2 pt-0.5">
              <MapPin className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
              <p className="text-sm text-zinc-200">
                {[business?.addressLine, business?.city, business?.state, business?.pincode]
                  .filter(Boolean)
                  .join(", ") || "No address specified"}
              </p>
            </div>
          </div>

          <div className="p-3 bg-zinc-900/60 border border-zinc-800/80 rounded-xl space-y-1">
            <span className="text-zinc-500 font-medium">Default Currency</span>
            <p className="text-sm font-semibold text-zinc-200">{business?.currency || "INR (₹)"}</p>
          </div>

          <div className="p-3 bg-zinc-900/60 border border-zinc-800/80 rounded-xl space-y-1">
            <span className="text-zinc-500 font-medium">Store Status</span>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <p className="text-sm font-semibold text-emerald-400">
                {business?.status || "ACTIVE"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
