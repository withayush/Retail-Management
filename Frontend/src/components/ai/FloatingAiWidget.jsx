import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Sparkles,
  X,
  Send,
  Bot,
  User,
  Maximize2,
  RotateCcw,
  Minimize2,
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

  // If already on the dedicated AI page, hide the floating button to prevent clutter
  // (Must be after all React hooks to satisfy React Hook Rules)
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
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 text-white shadow-2xl shadow-indigo-600/40 hover:shadow-indigo-500/60 hover:scale-105 active:scale-95 transition-all duration-300 border border-white/20 group cursor-pointer"
          title="Open VendorOS AI Copilot"
        >
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
          </span>
          <Sparkles className="w-4 h-4 text-white group-hover:rotate-12 transition-transform" />
          <span className="text-xs font-semibold tracking-wide">Ask AI</span>
        </button>
      )}

      {/* ── Slide-up Floating Chat Window ── */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[92vw] sm:w-[420px] h-[550px] max-h-[85vh] bg-[#161618] border border-white/15 rounded-3xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-2xl animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="p-3.5 bg-[#1C1C1E] border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                  VendorOS AI Copilot
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                </h3>
                <p className="text-[10px] text-zinc-400 font-mono">openai/gpt-oss-120b</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Link
                to="/ai-assistant"
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/10 text-zinc-400 hover:text-white rounded-lg transition-colors"
                title="Open full page"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </Link>
              {messages.length > 0 && (
                <button
                  onClick={() => setMessages([])}
                  className="p-1.5 hover:bg-white/10 text-zinc-400 hover:text-white rounded-lg transition-colors"
                  title="Clear chat"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/10 text-zinc-400 hover:text-white rounded-lg transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4">
                <Bot className="w-10 h-10 text-indigo-400/80 mb-2" />
                <h4 className="text-xs font-semibold text-white">Ask your AI Assistant</h4>
                <p className="text-[11px] text-zinc-400 mt-1 max-w-[240px]">
                  Directly query anything right here or navigate to the full screen AI page.
                </p>
                <div className="mt-4 flex flex-col gap-1.5 w-full">
                  <button
                    onClick={() => {
                      setInput("Why do parrots talk?");
                    }}
                    className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/5 text-[11px] text-zinc-300 text-left transition-colors truncate"
                  >
                    🦜 Why do parrots talk?
                  </button>
                  <button
                    onClick={() => {
                      setInput("How do I boost retail profit margin?");
                    }}
                    className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/5 text-[11px] text-zinc-300 text-left transition-colors truncate"
                  >
                    📈 How do I boost retail profit margin?
                  </button>
                </div>
              </div>
            ) : (
              messages.map((m, idx) => {
                const isUser = m.role === "user";
                return (
                  <div
                    key={idx}
                    className={`flex items-start gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}
                  >
                    <div
                      className={`w-6 h-6 rounded-lg shrink-0 flex items-center justify-center text-[10px] ${
                        isUser
                          ? "bg-blue-600 text-white"
                          : "bg-indigo-950 text-indigo-300 border border-indigo-700/50"
                      }`}
                    >
                      {isUser ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                    </div>
                    <div
                      className={`max-w-[85%] rounded-2xl p-2.5 text-xs shadow-md ${
                        isUser
                          ? "bg-[#0066CC] text-white rounded-tr-none"
                          : "bg-[#1F1F23] border border-white/10 text-zinc-200 rounded-tl-none"
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
              <div className="flex items-center gap-2 text-xs text-zinc-400 bg-zinc-900/50 p-2.5 rounded-xl border border-white/5">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping"></span>
                <span>Thinking with Groq...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <div className="p-2.5 bg-[#1C1C1E] border-t border-white/10 flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSend();
              }}
              placeholder="Ask a question..."
              disabled={isLoading}
              className="flex-1 bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
