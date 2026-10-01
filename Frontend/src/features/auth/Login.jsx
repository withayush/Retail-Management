import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { loginUser } from "../../services/auth.api";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, LogIn, AlertCircle, ArrowRight } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    identifier: "",
    password: "",
  });
  const [fieldErrors, setFieldErrors] = useState({
    identifier: "",
    password: "",
  });
  const [touched, setTouched] = useState({
    identifier: false,
    password: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [unverifiedPhone, setUnverifiedPhone] = useState(null);

  // Field-specific validation rule
  const validateField = (name, value) => {
    const trimmed = value.trim();

    if (name === "identifier") {
      if (!trimmed) {
        return "Please enter your registered email address or mobile number.";
      }
      const isEmail = trimmed.includes("@");
      const isNumeric = /^[0-9+\s()-]+$/.test(trimmed);

      if (isEmail) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmed)) {
          return "Invalid email format. Please check for typos (e.g. name@domain.com).";
        }
      } else if (isNumeric) {
        const cleanDigits = trimmed.replace(/\D/g, "");
        if (!/^(\+91|91)?[6-9]\d{9}$/.test(trimmed) && !(cleanDigits.length === 10 && /^[6-9]/.test(cleanDigits))) {
          return "Invalid mobile number. Please enter a valid 10-digit number (e.g. 9876543210).";
        }
      } else {
        return "Please enter a valid email address or 10-digit mobile number.";
      }
    }

    if (name === "password") {
      if (!value) {
        return "Password is required to sign in.";
      }
      if (value.length < 6) {
        return "Password must be at least 6 characters long.";
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
    const identifierErr = validateField("identifier", form.identifier);
    const passwordErr = validateField("password", form.password);

    setTouched({ identifier: true, password: true });
    setFieldErrors({
      identifier: identifierErr,
      password: passwordErr,
    });

    if (identifierErr || passwordErr) {
      return;
    }

    setLoading(true);
    setServerError("");
    setUnverifiedPhone(null);

    try {
      const response = await loginUser({
        identifier: form.identifier.trim(),
        password: form.password,
      });

      const data = response.data || {};
      const accessToken = data.accessToken;
      const account = data.account || data.user || data;
      const vendor = data.vendor;

      await login(account, accessToken);

      if (vendor) {
        localStorage.setItem("vendor", JSON.stringify(vendor));
      }

      navigate("/dashboard");
    } catch (err) {
      console.error("Login Error:", err);
      const resData = err.response?.data;

      // Handle backend field-specific validation errors if returned
      if (resData?.errors && Array.isArray(resData.errors)) {
        const backendFieldErrors = {};
        resData.errors.forEach((errItem) => {
          if (errItem.field === "identifier" || errItem.field === "email" || errItem.field === "phone") {
            backendFieldErrors.identifier = errItem.message;
          } else if (errItem.field === "password") {
            backendFieldErrors.password = errItem.message;
          }
        });
        setFieldErrors((prev) => ({ ...prev, ...backendFieldErrors }));
      }

      // Check specific error codes
      if (resData?.code === "PHONE_VERIFICATION_REQUIRED") {
        setUnverifiedPhone(resData?.data?.phone || form.identifier);
        setServerError("Your phone number is not verified yet. Please complete mobile verification to continue.");
      } else if (resData?.code === "INVALID_CREDENTIALS" || resData?.message === "Invalid credentials.") {
        setServerError("Incorrect email/phone or password. Please verify your login credentials and try again.");
      } else if (resData?.message && resData.message !== "Validation failed.") {
        setServerError(resData.message);
      } else if (err.code === "ERR_NETWORK" || !err.response) {
        const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
        setServerError(
          isLocal
            ? "Cannot connect to Backend at http://localhost:3001. Please ensure your backend server ('npm run dev') is running."
            : "Unable to connect to the server. Please check your internet connection and try again."
        );
      } else {
        setServerError("Unable to sign in. Please verify your details and try again.");
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
              <LogIn className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              Welcome to <span className="gradient-text font-extrabold">VendorOS</span>
            </h1>
            <p className="text-muted-foreground text-sm mt-1.5 font-medium">
              Sign in to manage your store and proceed to dashboard
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Identifier (Email / Phone) */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Email or Mobile Number
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  name="identifier"
                  type="text"
                  value={form.identifier}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full pl-10 pr-4 py-2.5 bg-secondary/50 border rounded-xl focus:outline-none transition-all duration-200 text-foreground text-sm placeholder:text-muted-foreground/60 ${
                    fieldErrors.identifier && touched.identifier
                      ? "border-destructive focus:ring-2 focus:ring-destructive/30"
                      : "border-border focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  }`}
                  placeholder="Enter your email or 10-digit mobile number"
                  autoComplete="username"
                />
              </div>

              {/* Specific Field Error */}
              {fieldErrors.identifier && touched.identifier && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-1.5 mt-1.5 text-xs text-destructive font-medium"
                >
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{fieldErrors.identifier}</span>
                </motion.div>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Password
                </label>
              </div>
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
                  placeholder="Enter your password"
                  autoComplete="current-password"
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

              {/* Specific Field Error */}
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
                  {unverifiedPhone && (
                    <button
                      type="button"
                      onClick={() => navigate("/verify-otp", { state: { phone: unverifiedPhone } })}
                      className="mt-2 inline-flex items-center gap-1 text-xs font-semibold underline hover:opacity-80 transition-opacity"
                    >
                      Verify phone number now <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
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
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Proceed to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-border/50 text-center">
            <p className="text-muted-foreground text-xs">
              Don&apos;t have an account yet?{" "}
              <Link to="/register" className="text-primary hover:underline font-semibold transition-all">
                Create Account
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}