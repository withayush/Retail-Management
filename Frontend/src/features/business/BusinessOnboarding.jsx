import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createBusiness } from "../../services/business.api";
import { useAuth } from "../../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Globe,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  Store,
  Layers,
  Receipt,
  Clock,
  CheckCircle2,
  FileText,
  DollarSign,
} from "lucide-react";

const RETAIL_SEGMENTS = [
  "Retail/Kirana",
  "Kirana",
  "General Retail",
  "Grocery",
  "Supermarket",
  "FMCG",
  "Electronics",
  "Clothing",
  "Hardware",
  "Pharmacy",
  "Wholesale",
  "Service",
  "Other",
];

const TAX_MODES = [
  { value: "GST", label: "Regular GST (Standard Invoicing)" },
  { value: "COMPOSITION", label: "GST Composition Scheme" },
  { value: "NON_GST", label: "Non-GST / Exempted Business" },
];

export default function BusinessOnboarding() {
  const navigate = useNavigate();
  const { refreshBusinessStatus } = useAuth();
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    businessName: "",
    retailSegment: "Retail/Kirana",
    businessType: "Retail",
    category: "",
    description: "",
    businessEmail: "",
    businessPhone: "",
    whatsappNumber: "",
    website: "",
    addressLine: "",
    city: "",
    state: "",
    pincode: "",
    currency: "INR",
    taxMode: "GST",
    inventoryTracking: true,
    operatingHours: {
      open: "09:00 AM",
      close: "09:00 PM",
      days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    },
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleNestedHours = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      operatingHours: {
        ...prev.operatingHours,
        [field]: value,
      },
    }));
  };

  const nextStep = () => setStep((prev) => Math.min(prev + 1, 4));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.businessName.trim()) {
      setError("Business Name is required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const payload = {
        businessName: formData.businessName.trim(),
        retailSegment: formData.retailSegment,
        businessType: formData.businessType.trim() || "Retail",
        category: formData.category.trim() || undefined,
        description: formData.description.trim() || undefined,
        businessEmail: formData.businessEmail.trim() || undefined,
        businessPhone: formData.businessPhone.trim() || undefined,
        whatsappNumber: formData.whatsappNumber.trim() || undefined,
        website: formData.website.trim() || undefined,
        addressLine: formData.addressLine.trim() || undefined,
        city: formData.city.trim() || undefined,
        state: formData.state.trim() || undefined,
        pincode: formData.pincode.trim() || undefined,
        currency: formData.currency || "INR",
        taxMode: formData.taxMode || "GST",
        inventoryTracking: Boolean(formData.inventoryTracking),
        operatingHours: formData.operatingHours,
      };

      await createBusiness(payload);
      await refreshBusinessStatus();
      navigate("/dashboard", { replace: true });
    } catch (err) {
      console.error("Onboarding Error:", err);
      setError(
        err.response?.data?.message || "Failed to create business profile. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { icon: Store, title: "Identity", subtitle: "Business basics & retail segment" },
    { icon: Phone, title: "Contact & Location", subtitle: "Where customers find you" },
    { icon: Receipt, title: "Tax & Settings", subtitle: "GST mode, currency & inventory" },
    { icon: CheckCircle, title: "Review & Confirm", subtitle: "Confirm details and launch" },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 gradient-bg">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        <div className="glass-card rounded-2xl p-6 sm:p-8 md:p-10 border border-border">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl gradient-primary mb-3 text-white">
              <Building2 className="w-7 h-7" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold gradient-text">Setup Your Business</h1>
            <p className="text-muted-foreground text-xs sm:text-sm mt-1">
              Step {step} of 4: {steps[step - 1].title}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-secondary/50 rounded-full h-1.5 mb-6">
            <motion.div
              initial={{ width: `${((step - 1) / 3) * 100}%` }}
              animate={{ width: `${((step - 1) / 3) * 100}%` }}
              transition={{ duration: 0.3 }}
              className="h-full rounded-full gradient-primary"
            />
          </div>

          {/* Step Indicators */}
          <div className="flex justify-between mb-8">
            {steps.map((s, index) => (
              <div key={index} className="flex flex-col items-center">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 ${
                    index + 1 === step
                      ? "gradient-primary text-white shadow-lg shadow-primary/25 font-bold"
                      : index + 1 < step
                      ? "bg-accent text-white font-bold"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {index + 1 < step ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <s.icon className="w-4 h-4" />
                  )}
                </div>
                <span className="text-[11px] text-muted-foreground mt-1 hidden sm:block font-medium">
                  {s.title}
                </span>
              </div>
            ))}
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-xs sm:text-sm mb-5"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit}>
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {/* STEP 1: Store Identity & Segment */}
                {step === 1 && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                        Business / Store Name *
                      </label>
                      <div className="relative">
                        <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                          name="businessName"
                          value={formData.businessName}
                          onChange={handleChange}
                          className="w-full pl-10 pr-4 py-2.5 bg-secondary/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm text-foreground placeholder:text-muted-foreground"
                          placeholder="e.g. Sharma Kirana & General Store"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                          Retail Segment *
                        </label>
                        <select
                          name="retailSegment"
                          value={formData.retailSegment}
                          onChange={handleChange}
                          className="w-full px-3.5 py-2.5 bg-secondary/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm text-foreground cursor-pointer"
                        >
                          {RETAIL_SEGMENTS.map((seg) => (
                            <option key={seg} value={seg}>
                              {seg}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                          Business Type
                        </label>
                        <select
                          name="businessType"
                          value={formData.businessType}
                          onChange={handleChange}
                          className="w-full px-3.5 py-2.5 bg-secondary/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm text-foreground cursor-pointer"
                        >
                          <option value="Retail">Retail Store / Kirana</option>
                          <option value="Wholesale">Wholesale / Trade</option>
                          <option value="Distributor">Distributor / Stockist</option>
                          <option value="Service">Service / Repair</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                        Category Tag (Optional)
                      </label>
                      <input
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2.5 bg-secondary/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm text-foreground placeholder:text-muted-foreground"
                        placeholder="e.g. Grocery, FMCG, Dairy, Spices"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                        Description (Optional)
                      </label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={2}
                        className="w-full px-3.5 py-2.5 bg-secondary/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm text-foreground placeholder:text-muted-foreground resize-none"
                        placeholder="Brief tagline or description of your store..."
                      />
                    </div>
                  </>
                )}

                {/* STEP 2: Location & Contact */}
                {step === 2 && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                          Business Phone
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <input
                            name="businessPhone"
                            value={formData.businessPhone}
                            onChange={handleChange}
                            className="w-full pl-10 pr-4 py-2.5 bg-secondary/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm text-foreground placeholder:text-muted-foreground"
                            placeholder="e.g. 9876543210"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                          WhatsApp Order Number
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <input
                            name="whatsappNumber"
                            value={formData.whatsappNumber}
                            onChange={handleChange}
                            className="w-full pl-10 pr-4 py-2.5 bg-secondary/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm text-foreground placeholder:text-muted-foreground"
                            placeholder="e.g. 9876543210"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                        Business Email (Optional)
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                          name="businessEmail"
                          type="email"
                          value={formData.businessEmail}
                          onChange={handleChange}
                          className="w-full pl-10 pr-4 py-2.5 bg-secondary/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm text-foreground placeholder:text-muted-foreground"
                          placeholder="store@example.com"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                        Store Address
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                          name="addressLine"
                          value={formData.addressLine}
                          onChange={handleChange}
                          className="w-full pl-10 pr-4 py-2.5 bg-secondary/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm text-foreground placeholder:text-muted-foreground"
                          placeholder="e.g. Shop 4, Main Market Road"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                          City
                        </label>
                        <input
                          name="city"
                          value={formData.city}
                          onChange={handleChange}
                          className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground"
                          placeholder="Jaipur"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                          State
                        </label>
                        <input
                          name="state"
                          value={formData.state}
                          onChange={handleChange}
                          className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground"
                          placeholder="Rajasthan"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                          Pincode
                        </label>
                        <input
                          name="pincode"
                          value={formData.pincode}
                          onChange={handleChange}
                          className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground font-mono"
                          placeholder="302001"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* STEP 3: Tax Mode, Currency & Operating Hours */}
                {step === 3 && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                        GST & Tax Billing Mode *
                      </label>
                      <div className="space-y-2">
                        {TAX_MODES.map((t) => (
                          <label
                            key={t.value}
                            className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                              formData.taxMode === t.value
                                ? "bg-primary/10 border-primary/40 text-foreground font-semibold"
                                : "bg-secondary/30 border-border text-muted-foreground hover:bg-secondary/50"
                            }`}
                          >
                            <input
                              type="radio"
                              name="taxMode"
                              value={t.value}
                              checked={formData.taxMode === t.value}
                              onChange={handleChange}
                              className="accent-primary"
                            />
                            <span className="text-xs">{t.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                          Currency
                        </label>
                        <div className="flex items-center gap-2 px-3.5 py-2.5 bg-secondary/50 border border-border rounded-xl text-sm font-semibold text-foreground">
                          <DollarSign className="w-4 h-4 text-primary" />
                          <span>INR (₹ Indian Rupee)</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                          Inventory Tracking
                        </label>
                        <label className="flex items-center gap-2 px-3.5 py-2.5 bg-secondary/50 border border-border rounded-xl text-xs font-medium text-foreground cursor-pointer">
                          <input
                            type="checkbox"
                            name="inventoryTracking"
                            checked={formData.inventoryTracking}
                            onChange={handleChange}
                            className="accent-primary w-4 h-4"
                          />
                          <span>Enable Live Stock Ledger</span>
                        </label>
                      </div>
                    </div>

                    <div className="p-3.5 bg-secondary/30 border border-border rounded-xl space-y-2">
                      <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                        <Clock className="w-3.5 h-3.5 text-primary" />
                        <span>Daily Store Timings</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-[10px] text-muted-foreground block mb-1">Opening Time</span>
                          <input
                            value={formData.operatingHours.open}
                            onChange={(e) => handleNestedHours("open", e.target.value)}
                            className="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-xs"
                            placeholder="09:00 AM"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] text-muted-foreground block mb-1">Closing Time</span>
                          <input
                            value={formData.operatingHours.close}
                            onChange={(e) => handleNestedHours("close", e.target.value)}
                            className="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-xs"
                            placeholder="09:00 PM"
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* STEP 4: Review & Final Confirmation */}
                {step === 4 && (
                  <div className="p-4 bg-secondary/20 border border-border rounded-xl space-y-3 text-xs">
                    <h3 className="text-sm font-bold text-foreground border-b border-border pb-2">
                      Review Business Profile
                    </h3>
                    <div className="grid grid-cols-2 gap-y-2 text-muted-foreground">
                      <span>Business Name:</span>
                      <strong className="text-foreground text-right">{formData.businessName}</strong>

                      <span>Retail Segment:</span>
                      <strong className="text-foreground text-right">{formData.retailSegment}</strong>

                      <span>Business Type:</span>
                      <strong className="text-foreground text-right">{formData.businessType}</strong>

                      <span>Tax Billing Mode:</span>
                      <strong className="text-foreground text-right">{formData.taxMode}</strong>

                      <span>Store Contact:</span>
                      <strong className="text-foreground text-right">{formData.businessPhone || "None"}</strong>

                      <span>Location:</span>
                      <strong className="text-foreground text-right">
                        {formData.city ? `${formData.city}, ${formData.state || ""}` : "Not specified"}
                      </strong>
                    </div>

                    <div className="flex items-center gap-2 p-2.5 bg-primary/5 border border-primary/15 rounded-lg text-[11px] text-primary">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>Ready to initialize your multi-tenant catalog and POS registers.</span>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center mt-6 pt-4 border-t border-border">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={prevStep}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-border bg-secondary/50 text-foreground text-xs font-semibold hover:bg-secondary cursor-pointer transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
              ) : (
                <div />
              )}

              {step < 4 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 cursor-pointer shadow-md shadow-primary/20 transition-all"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 cursor-pointer shadow-lg shadow-primary/25 disabled:opacity-60 transition-all"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
                      Initializing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" /> Complete & Launch Store
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
