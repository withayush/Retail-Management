import { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { verifyOTP, resendOTP } from "../../services/auth.api";
import { motion } from "framer-motion";
import { Phone, CheckCircle, RotateCcw, ArrowLeft, AlertCircle, ArrowRight } from "lucide-react";

export default function VerifyOTP() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const phoneFromRegister = location.state?.phone || "";
  const initialDebugOtp = location.state?.debugOtp || "";

  const [phone, setPhone] = useState(phoneFromRegister);
  const [otp, setOtp] = useState("");
  const [debugOtp, setDebugOtp] = useState(initialDebugOtp);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!phone.trim()) {
      setError("Please enter your mobile phone number.");
      return;
    }
    if (!otp || otp.length !== 6) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await verifyOTP({ phone: phone.trim(), otp: otp.trim() });
      console.log("Verification Success:", response);

      const data = response.data || {};
      const accessToken = data.accessToken;
      const refreshToken = data.refreshToken;
      const account = data.account;
      const vendor = data.vendor;

      if (accessToken && account) {
        await login(account, accessToken, refreshToken);
        if (vendor) {
          localStorage.setItem("vendor", JSON.stringify(vendor));
        }
        navigate("/dashboard");
      } else {
        navigate("/login");
      }
    } catch (err) {
      console.error("Verification Error:", err);
      const resData = err.response?.data;
      setError(
        resData?.message || "Invalid verification code. Please check and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!phone.trim()) {
      setError("Please enter your mobile phone number to resend OTP.");
      return;
    }

    setResending(true);
    setError("");
    setMessage("");

    try {
      const response = await resendOTP({ phone: phone.trim() });
      setMessage("A new 6-digit verification code has been sent.");

      if (response?.data?.debugOtp) {
        setDebugOtp(response.data.debugOtp);
      }
    } catch (err) {
      const resData = err.response?.data;
      setError(
        resData?.message || "Failed to resend code. Please try again in a few moments."
      );
    } finally {
      setResending(false);
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
              <Phone className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              Verify Your Phone
            </h1>
            <p className="text-muted-foreground text-sm mt-1.5 font-medium">
              Enter the 6-digit verification code sent to your mobile number
            </p>
          </div>

          {debugOtp && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 p-3 bg-primary/10 border border-primary/20 rounded-xl text-center"
            >
              <p className="text-xs text-primary font-semibold uppercase tracking-wider">Development OTP</p>
              <p className="text-2xl font-bold tracking-widest text-primary mt-0.5">{debugOtp}</p>
            </motion.div>
          )}

          <form onSubmit={handleVerify} className="space-y-4" noValidate>
            {/* Phone Number */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Mobile Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-secondary/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all duration-200 text-foreground text-sm placeholder:text-muted-foreground/60"
                  placeholder="Enter your 10-digit mobile number"
                  required
                />
              </div>
            </div>

            {/* OTP Code */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                6-Digit Verification Code
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  maxLength={6}
                  className="w-full px-4 py-2.5 bg-secondary/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all duration-200 text-foreground text-center text-xl tracking-[0.5em] font-mono placeholder:text-muted-foreground/60 placeholder:tracking-normal placeholder:font-sans placeholder:text-sm"
                  placeholder="Enter 6-digit code"
                  required
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-3 bg-destructive/10 border border-destructive/25 rounded-xl text-destructive text-xs leading-relaxed flex items-start gap-2.5"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p className="font-medium">{error}</p>
              </motion.div>
            )}

            {/* Success Message */}
            {message && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-xl text-emerald-500 text-xs leading-relaxed flex items-start gap-2.5"
              >
                <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p className="font-medium">{message}</p>
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
                  <span>Verifying Code...</span>
                </>
              ) : (
                <>
                  <span>Verify & Proceed to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer Actions */}
          <div className="mt-6 pt-4 border-t border-border/50 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground font-medium transition-colors disabled:opacity-50"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${resending ? "animate-spin" : ""}`} />
              <span>{resending ? "Resending..." : "Resend Code"}</span>
            </button>
            <Link
              to="/register"
              className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground font-medium transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Register</span>
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}