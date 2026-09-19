import { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { verifyPhone, resendPhoneOtp } from "../../services/auth.api";
import { useAuth } from "../../context/AuthContext";
import { motion } from "framer-motion";
import { KeyRound } from "lucide-react";

export default function VerifyOTP() {
  const location = useLocation();
  const navigate = useNavigate();
  const { refetchUser } = useAuth();

  const phone = location.state?.phone || "";
  const debugOtp = location.state?.debugOtp || "";

  const [otp, setOtp] = useState(debugOtp || "");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!phone) {
      setError("Phone number missing. Please register or sign in again.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      await verifyPhone({ phone, otp });
      await refetchUser();
      navigate("/onboarding");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Invalid or expired OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!phone) return;
    setResending(true);
    setError("");
    setMessage("");

    try {
      const response = await resendPhoneOtp({ phone });
      setMessage("A new OTP has been sent to your phone.");
      if (response?.data?.debugOtp) {
        setOtp(response.data.debugOtp);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to resend OTP.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="glass-card rounded-2xl p-8 md:p-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-secondary border border-border mb-4">
              <KeyRound className="w-8 h-8 text-foreground" />
            </div>
            <h1 className="text-3xl font-bold">Verify Phone</h1>
            <p className="text-muted-foreground mt-2">
              Enter the OTP sent to <span className="font-semibold text-foreground">{phone || "your phone"}</span>
            </p>
          </div>

          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                6-Digit OTP Code
              </label>
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full text-center tracking-widest text-2xl py-3 bg-secondary/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 text-foreground placeholder:text-muted-foreground"
                placeholder="000000"
                required
              />
            </div>

            {debugOtp && (
              <div className="p-3 bg-secondary border border-border rounded-xl text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">Dev Note:</span> Auto-detected Test OTP:{" "}
                <span className="font-mono text-foreground font-bold">{debugOtp}</span>
              </div>
            )}

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
              <div className="p-3 bg-success/10 border border-success/20 rounded-xl text-success text-sm">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || otp.length < 4}
              className="w-full btn btn-primary py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? "Verifying..." : "Verify & Continue"}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="text-primary hover:underline font-medium"
            >
              {resending ? "Sending..." : "Resend OTP"}
            </button>
            <Link to="/register" className="text-muted-foreground hover:underline">
              Change Number
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
