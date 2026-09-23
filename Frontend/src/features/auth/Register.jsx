import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser } from "../../services/auth.api";
import { motion } from "framer-motion";
import { User, Mail, Phone, Lock, Eye, EyeOff, UserPlus, AlertCircle, ArrowRight } from "lucide-react";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
  });

  const [fieldErrors, setFieldErrors] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
  });

  const [touched, setTouched] = useState({
    fullName: false,
    email: false,
    phone: false,
    password: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  // Field-specific validation rules
  const validateField = (name, value) => {
    const trimmed = value.trim();

    if (name === "fullName") {
      if (!trimmed) {
        return "Please enter your full name.";
      }
      if (trimmed.length < 2) {
        return "Full name must be at least 2 characters long.";
      }
      if (trimmed.length > 100) {
        return "Full name must not exceed 100 characters.";
      }
    }

    if (name === "email") {
      if (!trimmed) {
        return "Please enter your email address.";
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmed)) {
        return "Please enter a valid email address (e.g. name@company.com).";
      }
    }

    if (name === "phone") {
      if (!trimmed) {
        return "Please enter your mobile phone number.";
      }
      const cleanDigits = trimmed.replace(/\D/g, "");
      if (!/^(\+91|91)?[6-9]\d{9}$/.test(trimmed) && !(cleanDigits.length === 10 && /^[6-9]/.test(cleanDigits))) {
        return "Please enter a valid 10-digit mobile number (e.g. 9876543210).";
      }
    }

    if (name === "password") {
      if (!value) {
        return "Please create a secure password.";
      }
      if (value.length < 8) {
        return "Password must be at least 8 characters long.";
      }
      if (!/[a-z]/.test(value)) {
        return "Password must contain at least one lowercase letter.";
      }
      if (!/[A-Z]/.test(value)) {
        return "Password must contain at least one uppercase letter.";
      }
      if (!/\d/.test(value)) {
        return "Password must contain at least one number.";
      }
      if (!/[^A-Za-z0-9]/.test(value)) {
        return "Password must contain at least one special character (e.g. @, #, $, !).";
      }
    }

    return "";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (serverError) setServerError("");

    if (touched[name]) {
      const errorMsg = validateField(name, value);
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate all fields
    const fullNameErr = validateField("fullName", form.fullName);
    const emailErr = validateField("email", form.email);
    const phoneErr = validateField("phone", form.phone);
    const passwordErr = validateField("password", form.password);

    setTouched({
      fullName: true,
      email: true,
      phone: true,
      password: true,
    });

    setFieldErrors({
      fullName: fullNameErr,
      email: emailErr,
      phone: phoneErr,
      password: passwordErr,
    });

    if (fullNameErr || emailErr || phoneErr || passwordErr) {
      return;
    }

    setLoading(true);
    setServerError("");

    try {
      const response = await registerUser({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
      });

      console.log("Registration Success:", response);
      const debugOtp = response.data?.debugOtp;

      navigate("/verify-otp", {
        state: {
          phone: form.phone.trim(),
          debugOtp: debugOtp,
        },
      });
    } catch (err) {
      console.error("Registration Error:", err);
      const resData = err.response?.data;

      // Handle backend field validation errors
      if (resData?.errors && Array.isArray(resData.errors)) {
        const backendFieldErrors = {};
        resData.errors.forEach((errItem) => {
          if (errItem.field) {
            backendFieldErrors[errItem.field] = errItem.message;
          }
        });
        setFieldErrors((prev) => ({ ...prev, ...backendFieldErrors }));
      }

      // Handle specific conflict codes
      if (resData?.code === "EMAIL_ALREADY_EXISTS") {
        setFieldErrors((prev) => ({
          ...prev,
          email: "This email is already registered. Please sign in or use another email.",
        }));
      } else if (resData?.code === "PHONE_ALREADY_EXISTS") {
        setFieldErrors((prev) => ({
          ...prev,
          phone: "This mobile number is already registered. Please sign in or use another number.",
        }));
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
        setServerError("Registration could not be completed. Please review your details and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 gradient-bg">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="glass-card rounded-2xl p-8 md:p-10 shadow-2xl border border-border/50">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl gradient-primary mb-3 shadow-md shadow-primary/20">
              <UserPlus className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              Create Your Account
            </h1>
            <p className="text-muted-foreground text-sm mt-1.5 font-medium">
              Join <span className="gradient-text font-bold">VendorOS</span> to manage and scale your store
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  name="fullName"
                  type="text"
                  value={form.fullName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full pl-10 pr-4 py-2.5 bg-secondary/50 border rounded-xl focus:outline-none transition-all duration-200 text-foreground text-sm placeholder:text-muted-foreground/60 ${
                    fieldErrors.fullName && touched.fullName
                      ? "border-destructive focus:ring-2 focus:ring-destructive/30"
                      : "border-border focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  }`}
                  placeholder="Enter your full name"
                  autoComplete="name"
                />
              </div>

              {fieldErrors.fullName && touched.fullName && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-1.5 mt-1.5 text-xs text-destructive font-medium"
                >
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{fieldErrors.fullName}</span>
                </motion.div>
              )}
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full pl-10 pr-4 py-2.5 bg-secondary/50 border rounded-xl focus:outline-none transition-all duration-200 text-foreground text-sm placeholder:text-muted-foreground/60 ${
                    fieldErrors.email && touched.email
                      ? "border-destructive focus:ring-2 focus:ring-destructive/30"
                      : "border-border focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  }`}
                  placeholder="Enter your email address"
                  autoComplete="email"
                />
              </div>

              {fieldErrors.email && touched.email && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-1.5 mt-1.5 text-xs text-destructive font-medium"
                >
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{fieldErrors.email}</span>
                </motion.div>
              )}
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Mobile Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full pl-10 pr-4 py-2.5 bg-secondary/50 border rounded-xl focus:outline-none transition-all duration-200 text-foreground text-sm placeholder:text-muted-foreground/60 ${
                    fieldErrors.phone && touched.phone
                      ? "border-destructive focus:ring-2 focus:ring-destructive/30"
                      : "border-border focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  }`}
                  placeholder="Enter your 10-digit mobile number"
                  autoComplete="tel"
                />
              </div>

              {fieldErrors.phone && touched.phone && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-1.5 mt-1.5 text-xs text-destructive font-medium"
                >
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{fieldErrors.phone}</span>
                </motion.div>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full pl-10 pr-11 py-2.5 bg-secondary/50 border rounded-xl focus:outline-none transition-all duration-200 text-foreground text-sm placeholder:text-muted-foreground/60 ${
                    fieldErrors.password && touched.password
                      ? "border-destructive focus:ring-2 focus:ring-destructive/30"
                      : "border-border focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  }`}
                  placeholder="Create a password (min. 8 chars, 1 uppercase, 1 symbol)"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {fieldErrors.password && touched.password && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-1.5 mt-1.5 text-xs text-destructive font-medium"
                >
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{fieldErrors.password}</span>
                </motion.div>
              )}
            </div>

            {/* Server-level Error Alert */}
            {serverError && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-3 bg-destructive/10 border border-destructive/25 rounded-xl text-destructive text-xs leading-relaxed flex items-start gap-2.5"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium">{serverError}</p>
                </div>
              </motion.div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 gradient-primary text-white py-3 rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-primary/25 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account & Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-border/50 text-center">
            <p className="text-muted-foreground text-xs">
              Already have an account?{" "}
              <Link to="/login" className="text-primary hover:underline font-semibold transition-all">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}