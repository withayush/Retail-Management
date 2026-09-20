import { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { verifyOTP, resendOTP } from "../../services/auth.api";
import { motion } from "framer-motion";
import { Phone, CheckCircle, RotateCcw, ArrowLeft, KeyRound } from "lucide-react";
import toast from "react-hot-toast";

export default function VerifyOTP() {
  const navigate = useNavigate();
  const location = useLocation();

  const phoneFromRegister = location.state?.phone || "";
  const initialDebugOtp = location.state?.debugOtp || "";

  const [phone, setPhone] = useState(phoneFromRegister);
  const [otp, setOtp] = useState(initialDebugOtp ? String(initialDebugOtp) : "");
  const [debugOtp, setDebugOtp] = useState(initialDebugOtp);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!otp.trim() || otp.trim().length !== 6) {
      return setError("Please enter a valid 6-digit OTP code");
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      await verifyOTP({ phone: phone.trim(), otp: otp.trim() });
      toast.success("Phone verified successfully! Please sign in.");
      navigate("/login");
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Invalid OTP. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setMessage("");

    try {
      const response = await resendOTP({ phone: phone.trim() });
      const newDebugOtp = response?.data?.debugOtp;
      toast.success("New OTP sent successfully!");
      setMessage("New OTP generated!");

      if (newDebugOtp) {
        setDebugOtp(newDebugOtp);
        setOtp(String(newDebugOtp));
      }
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Failed to resend OTP. Try again later."
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 gradient-bg">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="glass-card rounded-2xl p-8 md:p-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-success mb-4">
              <Phone className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold gradient-text">Verify Phone</h1>
            <p className="text-muted-foreground mt-2">
              Enter the 6-digit code sent to your phone
            </p>
          </div>

          {debugOtp && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 p-4 bg-accent/10 border border-accent/20 rounded-xl"
            >
              <p className="text-sm text-accent font-medium">🔑 Development OTP</p>
              <p className="text-2xl font-bold tracking-widest text-accent mt-1">{debugOtp}</p>
            </motion.div>
          )}

          <form onSubmit={handleVerify} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-secondary/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 text-foreground placeholder:text-muted-foreground"
                  placeholder="+91XXXXXXXXXX"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                OTP Code
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  maxLength={6}
                  className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 text-foreground text-center text-2xl tracking-[1em] placeholder:text-muted-foreground placeholder:text-base"
                  placeholder="••••••"
                  required
                />
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm"
              >
                {error}
              </motion.div>
            )}

            {message && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-3 bg-accent/10 border border-accent/20 rounded-xl text-accent text-sm"
              >
                {message}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full gradient-success text-white py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-accent/25 transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Verifying...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Verify OTP
                </span>
              )}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-between">
            <button
              type="button"
              onClick={handleResend}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Resend OTP
            </button>
            <Link
              to="/register"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Register
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
