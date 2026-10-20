import React, { Component } from "react";
import { AlertTriangle, RefreshCw, Home, Copy, Check, ChevronDown, ChevronUp } from "lucide-react";

/**
 * VendorOS Global React Error Boundary
 * Prevents blank-screen crashes by gracefully catching rendering errors in any component tree
 * and presenting a sleek, merchant-friendly fallback interface with auto-recovery options.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      copied: false,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error("[VendorOS ErrorBoundary] Uncaught runtime exception:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = "/dashboard";
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      copied: false,
      showDetails: false,
    });
  };

  handleCopyDetails = () => {
    const { error, errorInfo } = this.state;
    const text = `VendorOS Error Report
Timestamp: ${new Date().toISOString()}
URL: ${window.location.href}
Message: ${error?.message || "Unknown error"}
Stack: ${error?.stack || "No stack trace"}
Component Stack: ${errorInfo?.componentStack || "No component stack"}`;

    navigator.clipboard.writeText(text).then(() => {
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback({
          error: this.state.error,
          resetErrorBoundary: this.handleReset,
        });
      }

      const isDev = Boolean(import.meta.env?.DEV);

      return (
        <div className="min-h-screen bg-[#09090b] text-zinc-100 flex items-center justify-center p-4 selection:bg-rose-500/30">
          <div className="w-full max-w-xl bg-[#121214] border border-[#27272a] rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            {/* Top decorative gradient bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600" />

            {/* Header Icon & Title */}
            <div className="flex items-center gap-3.5 mb-4">
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0 shadow-inner">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  Kuch Galat Ho Gaya / Application Error
                </h1>
                <p className="text-xs text-zinc-400 mt-0.5">
                  An unexpected error occurred while rendering this screen.
                </p>
              </div>
            </div>

            {/* Brief Friendly Description */}
            <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-3.5 mb-6 text-xs text-zinc-300 leading-relaxed">
              <p>
                Aapka data database me safe hai. Yeh aam taur par temporary data format ya connection issue ki wajah se hota hai.
                Neeche diye gaye buttons se page reload karein ya dashboard par wapas jayein.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={this.handleReload}
                className="px-4 py-2.5 rounded-xl bg-white text-zinc-950 font-bold text-xs hover:bg-zinc-200 transition-all flex items-center gap-2 cursor-pointer shadow-sm active:scale-95"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Reload Page
              </button>

              <button
                type="button"
                onClick={this.handleGoHome}
                className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs transition-all flex items-center gap-2 cursor-pointer border border-zinc-700 active:scale-95"
              >
                <Home className="w-3.5 h-3.5" /> Go to Dashboard
              </button>

              <button
                type="button"
                onClick={this.handleCopyDetails}
                className="px-3.5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white font-medium text-xs transition-all flex items-center gap-1.5 cursor-pointer border border-[#27272a] ml-auto"
                title="Copy error details for technical support"
              >
                {this.state.copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Error</span>
                  </>
                )}
              </button>
            </div>

            {/* Collapsible Error Diagnostics (for debugging) */}
            <div className="mt-6 pt-5 border-t border-[#27272a]">
              <button
                type="button"
                onClick={() => this.setState((prev) => ({ showDetails: !prev.showDetails }))}
                className="text-[11px] font-mono text-zinc-500 hover:text-zinc-300 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Technical Details {isDev ? "(Dev Mode)" : ""}</span>
                {this.state.showDetails ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>

              {this.state.showDetails && (
                <div className="mt-3 p-3 bg-black/60 rounded-xl border border-zinc-800 text-[11px] font-mono text-rose-300/90 overflow-x-auto max-h-48 scrollbar-thin">
                  <p className="font-bold text-rose-400 mb-1">
                    {this.state.error?.name}: {this.state.error?.message}
                  </p>
                  {this.state.error?.stack && (
                    <pre className="text-zinc-500 text-[10px] whitespace-pre-wrap leading-tight mt-2">
                      {this.state.error.stack}
                    </pre>
                  )}
                  {this.state.errorInfo?.componentStack && (
                    <pre className="text-zinc-600 text-[9px] whitespace-pre-wrap leading-tight mt-2 pt-2 border-t border-zinc-800/80">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
