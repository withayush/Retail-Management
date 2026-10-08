import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { googleAuthUser } from "../../../services/auth.api";
import { useAuth } from "../../../context/AuthContext";
import toast from "react-hot-toast";
import { AlertCircle } from "lucide-react";

export default function GoogleAuthButton({
  text = "continue_with", // "continue_with" | "signin_with" | "signup_with"
  onError = () => {},
  className = "",
}) {
  const containerRef = useRef(null);
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [configError, setConfigError] = useState("");

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  // Handle Google Credential Response from GIS
  const handleCredentialResponse = async (response) => {
    if (!response || !response.credential) {
      const err = "No credential received from Google.";
      onError(err);
      toast.error(err);
      return;
    }

    setLoading(true);
    try {
      const res = await googleAuthUser(response.credential);
      const data = res?.data || {};
      const account = data.account || data.user || data;
      const accessToken = data.accessToken;
      const vendor = data.vendor;

      await login(account, accessToken);

      if (vendor) {
        localStorage.setItem("vendor", JSON.stringify(vendor));
      }

      toast.success(
        account?.fullName
          ? `Welcome, ${account.fullName}!`
          : "Signed in successfully with Google!"
      );

      navigate("/dashboard");
    } catch (err) {
      console.error("Google Auth API Error:", err);
      const message =
        err.response?.data?.message ||
        "Google authentication failed. Please try again.";
      onError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // Ensure GIS library is available
  useEffect(() => {
    if (!clientId) {
      setConfigError(
        "VITE_GOOGLE_CLIENT_ID is not configured in Frontend/.env"
      );
      return;
    }

    let intervalId = null;

    const checkGsi = () => {
      if (window.google?.accounts?.id) {
        setScriptLoaded(true);
        if (intervalId) clearInterval(intervalId);
      }
    };

    if (window.google?.accounts?.id) {
      setScriptLoaded(true);
    } else {
      intervalId = setInterval(checkGsi, 200);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [clientId]);

  // Initialize and render the official Google button
  useEffect(() => {
    if (!scriptLoaded || !containerRef.current || !clientId) return;

    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      // Clear previous button content if re-rendering
      containerRef.current.innerHTML = "";

      // Calculate width based on container width or fallback to 360
      const targetWidth = Math.min(
        Math.max(containerRef.current.offsetWidth || 340, 240),
        400
      );

      window.google.accounts.id.renderButton(containerRef.current, {
        theme: "outline",
        size: "large",
        type: "standard",
        shape: "rectangular",
        text: text,
        logo_alignment: "left",
        width: targetWidth,
      });
    } catch (e) {
      console.error("Failed to render Google button:", e);
    }
  }, [scriptLoaded, clientId, text]);

  if (configError) {
    return (
      <div className="flex items-center gap-2 p-3 text-xs bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl">
        <AlertCircle className="w-4 h-4 flex-shrink-0" />
        <span>{configError}</span>
      </div>
    );
  }

  return (
    <div className={`w-full flex flex-col items-center relative ${className}`}>
      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-xl border border-border">
          <div className="flex items-center gap-2 text-xs font-medium text-foreground">
            <svg
              className="animate-spin h-4 w-4 text-primary"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span>Connecting with Google...</span>
          </div>
        </div>
      )}

      {/* Official Google Button Container */}
      <div
        ref={containerRef}
        className="w-full flex justify-center [&>div]:w-full [&>div>iframe]:!w-full [&>div>iframe]:!rounded-xl"
        style={{ minHeight: "44px" }}
      >
        {!scriptLoaded && (
          <div className="w-full h-11 rounded-xl bg-secondary/50 border border-border/70 flex items-center justify-center gap-2.5 text-xs text-muted-foreground animate-pulse">
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Loading Google Sign-In...</span>
          </div>
        )}
      </div>
    </div>
  );
}
