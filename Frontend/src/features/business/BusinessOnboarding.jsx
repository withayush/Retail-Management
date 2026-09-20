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
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  Store,
  Receipt,
  Clock,
  CheckCircle2,
  DollarSign,
  AlertCircle,
  ArrowRight,
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

  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  // Step-aware & field-level validation rules
  const validateField = (name, value) => {
    const val = typeof value === "string" ? value.trim() : value;

    if (name === "businessName") {
      if (!val) {
        return "Business name is required.";
      }
      if (val.length < 2) {
        return "Business name must be at least 2 characters long.";
      }
      if (val.length > 150) {
        return "Business name must not exceed 150 characters.";
      }
    }

    if (name === "businessEmail" && val) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(val)) {
        return "Please enter a valid email address (e.g. store@company.com).";
      }
    }

    if (name === "businessPhone" && val) {
      const cleanDigits = val.replace(/\D/g, "");
      if (!/^(\+91|91)?[6-9]\d{9}$/.test(val) && !(cleanDigits.length === 10 && /^[6-9]/.test(cleanDigits))) {
        return "Please enter a valid 10-digit Indian mobile number.";
      }
    }

    if (name === "whatsappNumber" && val) {
      const cleanDigits = val.replace(/\D/g, "");
      if (!/^(\+91|91)?[6-9]\d{9}$/.test(val) && !(cleanDigits.length === 10 && /^[6-9]/.test(cleanDigits))) {
        return "Please enter a valid 10-digit Indian WhatsApp number.";
      }
    }

    if (name === "pincode" && val) {
      if (!/^\d{6}$/.test(val)) {
        return "Pincode must be exactly 6 digits (e.g. 110001).";
      }
    }

    return "";
  };

  const validateStep = (currentStep) => {
    const stepErrors = {};
    const newTouched = { ...touched };

    if (currentStep === 1) {
      newTouched.businessName = true;
      const bNameErr = validateField("businessName", formData.businessName);
      if (bNameErr) stepErrors.businessName = bNameErr;
    }

    if (currentStep === 2) {
      newTouched.businessEmail = true;
      newTouched.businessPhone = true;
      newTouched.whatsappNumber = true;
      newTouched.pincode = true;

      const emailErr = validateField("businessEmail", formData.businessEmail);
      const phoneErr = validateField("businessPhone", formData.businessPhone);
      const waErr = validateField("whatsappNumber", formData.whatsappNumber);
      const pinErr = validateField("pincode", formData.pincode);

      if (emailErr) stepErrors.businessEmail = emailErr;
      if (phoneErr) stepErrors.businessPhone = phoneErr;
      if (waErr) stepErrors.whatsappNumber = waErr;
      if (pinErr) stepErrors.pincode = pinErr;
    }

    setTouched(newTouched);
    setFieldErrors((prev) => ({ ...prev, ...stepErrors }));
    return Object.keys(stepErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const finalVal = type === "checkbox" ? checked : value;

    setFormData((prev) => ({
      ...prev,
      [name]: finalVal,
    }));

    if (serverError) setServerError("");

    if (touched[name]) {
      const errorMsg = validateField(name, finalVal);
      setFieldErrors((prev) => ({
        ...prev,
        [name]: errorMsg,
      }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const errorMsg = validateField(name, value);
    setFieldErrors((prev) => ({
      ...prev,
      [name]: errorMsg,
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

  const nextStep = () => {
    if (validateStep(step)) {
      setStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const prevStep = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate all steps before submission
    const isStep1Valid = validateStep(1);
    const isStep2Valid = validateStep(2);

    if (!isStep1Valid) {
      setStep(1);
      return;
    }
    if (!isStep2Valid) {
      setStep(2);
      return;
    }

    setLoading(true);
    setServerError("");

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
      const resData = err.response?.data;

      // Handle backend field validation errors
      if (resData?.errors && Array.isArray(resData.errors)) {
        const backendFieldErrors = {};
        let targetStep = step;

        resData.errors.forEach((errItem) => {
          if (errItem.field) {
            backendFieldErrors[errItem.field] = errItem.message;
            if (["businessName", "retailSegment", "businessType"].includes(errItem.field)) {
              targetStep = Math.min(targetStep, 1);
            } else if (["businessPhone", "whatsappNumber", "businessEmail", "pincode", "addressLine"].includes(errItem.field)) {
              targetStep = Math.min(targetStep, 2);
            }
          }
        });

        setFieldErrors((prev) => ({ ...prev, ...backendFieldErrors }));
        setStep(targetStep);
      } else if (resData?.message && resData.message !== "Validation failed.") {
        setServerError(resData.message);
      } else if (err.code === "ERR_NETWORK" || !err.response) {
        const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
        setServerError(
          isLocal
            ? "Cannot connect to Backend at http://localhost:3001. Please ensure your backend server ('npm run dev') is running."
            : "Unable to connect to the server. Please check your internet connection."
        );
      } else {
        setServerError("Failed to create business profile. Please check your inputs and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { icon: Store, title: "Identity", subtitle: "Business basics & retail segment" },
    { icon: Phone, title: "Contact & Location", subtitle: "Store address & phone details" },
    { icon: Receipt, title: "Tax & Settings", subtitle: "GST mode, currency & timings" },
    { icon: CheckCircle, title: "Review & Confirm", subtitle: "Confirm details and launch" },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 gradient-bg">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-2xl"
      >
        <div className="glass-card rounded-2xl p-6 sm:p-8 md:p-10 shadow-2xl border border-border/50">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl gradient-primary mb-3 text-white shadow-md shadow-primary/20">
              <Building2 className="w-7 h-7" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Setup Your Business Profile
            </h1>
            <p className="text-muted-foreground text-xs sm:text-sm mt-1.5 font-medium">
              Step {step} of 4: <span className="text-foreground font-semibold">{steps[step - 1].title}</span> — {steps[step - 1].subtitle}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-secondary/50 rounded-full h-1.5 mb-6 overflow-hidden">
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
                      ? "bg-emerald-500 text-white font-bold"
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

          {serverError && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-3 bg-destructive/10 border border-destructive/25 rounded-xl text-destructive text-xs leading-relaxed flex items-start gap-2.5 mb-5"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p className="font-medium">{serverError}</p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} noValidate>
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
                        <Store className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                          name="businessName"
                          value={formData.businessName}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          className={`w-full pl-10 pr-4 py-2.5 bg-secondary/50 border rounded-xl focus:outline-none transition-all duration-200 text-sm text-foreground placeholder:text-muted-foreground/60 ${
                            fieldErrors.businessName && touched.businessName
                              ? "border-destructive focus:ring-2 focus:ring-destructive/30"
                              : "border-border focus:ring-2 focus:ring-primary/40 focus:border-primary"
                          }`}
                          placeholder="Enter your registered business or store name"
                          required
                        />
                      </div>
                      {fieldErrors.businessName && touched.businessName && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center gap-1.5 mt-1.5 text-xs text-destructive font-medium"
                        >
                          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>{fieldErrors.businessName}</span>
                        </motion.div>
                      )}
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
                          className="w-full px-3.5 py-2.5 bg-secondary/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary text-sm text-foreground cursor-pointer"
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
                          className="w-full px-3.5 py-2.5 bg-secondary/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary text-sm text-foreground cursor-pointer"
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
                        className="w-full px-3.5 py-2.5 bg-secondary/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary text-sm text-foreground placeholder:text-muted-foreground/60"
                        placeholder="Enter primary categories (e.g. Grocery, Dairy, Spices)"
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
                        className="w-full px-3.5 py-2.5 bg-secondary/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary text-sm text-foreground placeholder:text-muted-foreground/60 resize-none"
                        placeholder="Enter a brief tagline or description for your business"
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
                          <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <input
                            name="businessPhone"
                            type="tel"
                            value={formData.businessPhone}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            className={`w-full pl-10 pr-4 py-2.5 bg-secondary/50 border rounded-xl focus:outline-none transition-all duration-200 text-sm text-foreground placeholder:text-muted-foreground/60 ${
                              fieldErrors.businessPhone && touched.businessPhone
                                ? "border-destructive focus:ring-2 focus:ring-destructive/30"
                                : "border-border focus:ring-2 focus:ring-primary/40 focus:border-primary"
                            }`}
                            placeholder="Enter 10-digit store phone"
                          />
                        </div>
                        {fieldErrors.businessPhone && touched.businessPhone && (
                          <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-1.5 mt-1.5 text-xs text-destructive font-medium"
                          >
                            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>{fieldErrors.businessPhone}</span>
                          </motion.div>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                          WhatsApp Order Number
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <input
                            name="whatsappNumber"
                            type="tel"
                            value={formData.whatsappNumber}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            className={`w-full pl-10 pr-4 py-2.5 bg-secondary/50 border rounded-xl focus:outline-none transition-all duration-200 text-sm text-foreground placeholder:text-muted-foreground/60 ${
                              fieldErrors.whatsappNumber && touched.whatsappNumber
                                ? "border-destructive focus:ring-2 focus:ring-destructive/30"
                                : "border-border focus:ring-2 focus:ring-primary/40 focus:border-primary"
                            }`}
                            placeholder="Enter 10-digit WhatsApp number"
                          />
                        </div>
                        {fieldErrors.whatsappNumber && touched.whatsappNumber && (
                          <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-1.5 mt-1.5 text-xs text-destructive font-medium"
                          >
                            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>{fieldErrors.whatsappNumber}</span>
                          </motion.div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                        Business Email (Optional)
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                          name="businessEmail"
                          type="email"
                          value={formData.businessEmail}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          className={`w-full pl-10 pr-4 py-2.5 bg-secondary/50 border rounded-xl focus:outline-none transition-all duration-200 text-sm text-foreground placeholder:text-muted-foreground/60 ${
                            fieldErrors.businessEmail && touched.businessEmail
                              ? "border-destructive focus:ring-2 focus:ring-destructive/30"
                              : "border-border focus:ring-2 focus:ring-primary/40 focus:border-primary"
                          }`}
                          placeholder="Enter official business email"
                        />
                      </div>
                      {fieldErrors.businessEmail && touched.businessEmail && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center gap-1.5 mt-1.5 text-xs text-destructive font-medium"
                        >
                          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>{fieldErrors.businessEmail}</span>
                        </motion.div>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                        Store Address
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                          name="addressLine"
                          value={formData.addressLine}
                          onChange={handleChange}
                          className="w-full pl-10 pr-4 py-2.5 bg-secondary/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary text-sm text-foreground placeholder:text-muted-foreground/60"
                          placeholder="Enter shop / building number, street and locality"
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
                          className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40"
                          placeholder="Enter city"
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
                          className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40"
                          placeholder="Enter state"
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
                          onBlur={handleBlur}
                          className={`w-full px-3 py-2 bg-secondary/50 border rounded-xl text-xs text-foreground placeholder:text-muted-foreground/60 font-mono focus:outline-none transition-all ${
                            fieldErrors.pincode && touched.pincode
                              ? "border-destructive focus:ring-2 focus:ring-destructive/30"
                              : "border-border focus:ring-2 focus:ring-primary/40"
                          }`}
                          placeholder="6-digit pincode"
                          maxLength={6}
                        />
                      </div>
                    </div>
                    {fieldErrors.pincode && touched.pincode && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-1.5 text-xs text-destructive font-medium"
                      >
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{fieldErrors.pincode}</span>
                      </motion.div>
                    )}
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
                            className="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
                            placeholder="09:00 AM"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] text-muted-foreground block mb-1">Closing Time</span>
                          <input
                            value={formData.operatingHours.close}
                            onChange={(e) => handleNestedHours("close", e.target.value)}
                            className="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
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
                      <strong className="text-foreground text-right">{formData.businessPhone || "Not specified"}</strong>

                      <span>WhatsApp Number:</span>
                      <strong className="text-foreground text-right">{formData.whatsappNumber || "Not specified"}</strong>

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
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl gradient-primary text-white text-xs font-semibold hover:shadow-lg hover:shadow-primary/25 cursor-pointer shadow-md shadow-primary/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  <span>Next Step</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl gradient-primary text-white text-xs font-bold hover:shadow-lg hover:shadow-primary/25 cursor-pointer shadow-lg shadow-primary/25 disabled:opacity-60 disabled:cursor-not-allowed transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Initializing Store...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Complete & Launch Store</span>
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

