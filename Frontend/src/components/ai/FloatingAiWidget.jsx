import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Sparkles,
  X,
  ArrowUp,
  Bot,
  Maximize2,
  RotateCcw,
} from "lucide-react";
import toast from "react-hot-toast";
import { askAiAgent } from "../../services/ai.api";
import AiMessageRenderer from "./AiMessageRenderer";

export default function FloatingAiWidget() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isLoading]);

  // If already on the dedicated AI page, hide the floating button
  const isAiPage =
    location.pathname.startsWith("/ai-assistant") ||
    location.pathname.startsWith("/ai-agent");

  if (isAiPage) {
    return null;
  }

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMsg = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const res = await askAiAgent(
        text,
        newMessages.map((m) => ({ role: m.role, content: m.content }))
      );
      if (res?.success && res.reply) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: res.reply },
        ]);
      }
    } catch (err) {
      const errMsg =
        err?.response?.data?.message || err?.message || "AI request failed";
      toast.error(errMsg);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `⚠️ **Error**: ${errMsg}` },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* ── Floating Launcher Button ── */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-[#18181B] hover:bg-[#222226] text-white shadow-xl border border-zinc-700/60 hover:border-zinc-500 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer group"
          title="Open AI Copilot"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <Sparkles className="w-3.5 h-3.5 text-indigo-400 group-hover:rotate-12 transition-transform" />
          <span className="text-xs font-medium tracking-tight">AI Copilot</span>
        </button>
      )}

      {/* ── Clean Floating Drawer/Modal ── */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[92vw] sm:w-[410px] h-[520px] max-h-[85vh] bg-[#111114] border border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-2xl animate-in fade-in slide-in-from-bottom-3 duration-200">
          {/* Header */}
          <div className="px-4 py-3 bg-[#151518] border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-zinc-800 border border-zinc-750 flex items-center justify-center text-zinc-300">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-white">AI Copilot</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Link
                to="/ai-assistant"
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-md transition-colors"
                title="Open full page"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </Link>
              {messages.length > 0 && (
                <button
                  onClick={() => setMessages([])}
                  className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-md transition-colors cursor-pointer"
                  title="Clear chat"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-md transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin scrollbar-thumb-zinc-800">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4">
                <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 mb-2.5">
                  <Bot className="w-5 h-5 text-indigo-400" />
                </div>
                <h4 className="text-xs font-semibold text-white">Store AI Assistant</h4>
                <p className="text-[11px] text-zinc-400 mt-1 max-w-[240px] leading-relaxed">
                  Connected to MongoDB. Ask about your inventory, sales, or customer khata.
                </p>
                <div className="mt-4 flex flex-col gap-1.5 w-full">
                  <button
                    onClick={() => {
                      setInput("Check live inventory and any low-stock items");
                    }}
                    className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-[11px] text-zinc-300 text-left transition-colors truncate cursor-pointer"
                  >
                    📦 Check live inventory & stock
                  </button>
                  <button
                    onClick={() => {
                      setInput("Show customer khata balances and pending udhaar");
                    }}
                    className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-[11px] text-zinc-300 text-left transition-colors truncate cursor-pointer"
                  >
                    👥 Show customer khata balances
                  </button>
                </div>
              </div>
            ) : (
              messages.map((m, idx) => {
                const isUser = m.role === "user";
                return (
                  <div
                    key={idx}
                    className={`flex items-start gap-2 ${isUser ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-xl p-3 text-xs leading-relaxed ${
                        isUser
                          ? "bg-[#1C1C20] border border-zinc-800 text-white rounded-tr-none"
                          : "bg-[#141416] border border-zinc-850 text-zinc-300 rounded-tl-none"
                      }`}
                    >
                      {isUser ? (
                        <p className="whitespace-pre-wrap">{m.content}</p>
                      ) : (
                        <AiMessageRenderer content={m.content} />
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {isLoading && (
              <div className="flex items-center gap-2 text-xs text-zinc-400 bg-zinc-900/40 p-2.5 rounded-xl border border-zinc-800/80">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping"></span>
                <span>Querying MongoDB...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Clean Input Box */}
          <div className="p-2.5 bg-[#141417] border-t border-zinc-800 flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSend();
              }}
              placeholder="Ask AI about your store..."
              disabled={isLoading}
              className="flex-1 bg-zinc-900/90 border border-zinc-800 focus:border-zinc-700 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="w-7 h-7 rounded-lg bg-white text-black hover:bg-zinc-200 disabled:opacity-30 disabled:bg-zinc-800 disabled:text-zinc-500 flex items-center justify-center transition-all cursor-pointer"
            >
              <ArrowUp className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
