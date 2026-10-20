import React from "react";
import { Loader2 } from "lucide-react";

export default function PageLoader({ message = "Loading..." }) {
  return (
    <div
      role="status"
      aria-label="Loading page content"
      className="flex-1 w-full min-h-[60vh] flex flex-col items-center justify-center bg-black/90 text-white p-6 transition-opacity duration-300"
    >
      <div className="relative flex items-center justify-center">
        {/* Ambient glow effect */}
        <div className="absolute w-16 h-16 rounded-full bg-blue-500/20 blur-xl animate-pulse" />
        
        {/* Core spinner */}
        <Loader2 className="w-9 h-9 text-blue-500 animate-spin relative z-10" />
      </div>

      <div className="mt-4 flex flex-col items-center space-y-1">
        <p className="text-sm font-medium tracking-wide text-zinc-300">{message}</p>
        <span className="text-xs text-zinc-600 font-mono">VenderOS Intelligent Retail</span>
      </div>
    </div>
  );
}
