import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Send,
  Bot,
  User,
  Users,
  Copy,
  Check,
  RotateCcw,
  Lightbulb,
  ArrowRight,
  TrendingUp,
  Package,
  Boxes,
  Truck,
  ShoppingCart,
  MessageSquare,
  AlertCircle,
  HelpCircle,
  Database,
} from "lucide-react";
import toast from "react-hot-toast";
import { askAiAgent, getAiAgentStatus } from "../../services/ai.api";
import AiMessageRenderer from "../../components/ai/AiMessageRenderer";

const SUGGESTED_PROMPTS = [
  {
    icon: Boxes,
    label: "Check live inventory and any low-stock items in our database",
    category: "Live Stock",
    color: "from-blue-500/20 to-cyan-500/10 text-blue-400 border-blue-500/20",
  },
  {
    icon: Truck,
    label: "Who are our suppliers and how much money do we owe them?",
    category: "Procurement",
    color: "from-purple-500/20 to-pink-500/10 text-purple-400 border-purple-500/20",
  },
  {
    icon: Users,
    label: "Show customer khata balances and pending udhaar debts",
    category: "Customer Khata",
    color: "from-amber-500/20 to-orange-500/10 text-amber-400 border-amber-500/20",
  },
  {
    icon: TrendingUp,
    label: "Give me an overview of our store metrics and business health",
    category: "Store Overview",
    color: "from-emerald-500/20 to-teal-500/10 text-emerald-400 border-emerald-500/20",
  },
];

export default function AiAgentPage() {
  const [messages, setMessages] = useState(() => {
    // Check localStorage for saved conversation
    try {
      const saved = localStorage.getItem("vendoros_ai_chat");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [status, setStatus] = useState({ online: true, model: "openai/gpt-oss-120b" });

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Auto-scroll on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Persist conversation
  useEffect(() => {
    try {
      localStorage.setItem("vendoros_ai_chat", JSON.stringify(messages));
    } catch {
      // Ignore storage errors
    }
  }, [messages]);

  // Fetch AI agent status on mount
  useEffect(() => {
    getAiAgentStatus()
      .then((data) => {
        if (data?.model) {
          setStatus({ online: true, model: data.model });
        }
      })
      .catch(() => {
        // Still online if server is active
      });
  }, []);

  const handleSendMessage = async (textToSend) => {
    const query = (textToSend || input).trim();
    if (!query || isLoading) return;

    const userMessage = {
      role: "user",
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      // Format history for the backend
      const historyPayload = newMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await askAiAgent(query, historyPayload);

      if (res?.success && res.reply) {
        const aiMessage = {
          role: "assistant",
          content: res.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          model: res.model || status.model,
        };
        setMessages((prev) => [...prev, aiMessage]);
      } else {
        toast.error("Failed to get response from AI. Please try again.");
      }
    } catch (err) {
      console.error("AI error:", err);
      const errMsg =
        err?.response?.data?.message || err?.message || "Error connecting to AI backend.";
      toast.error(errMsg);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `⚠️ **Error**: ${errMsg}\n\nPlease verify that your \`GROQ_API_KEY\` in the backend is valid and active.`,
          isError: true,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsLoading(false);
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleClearChat = () => {
    if (messages.length === 0) return;
    setMessages([]);
    localStorage.removeItem("vendoros_ai_chat");
    toast.success("Conversation cleared.");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-6xl mx-auto px-4 py-4 select-text">
      {/* ── 1. TOP HEADER BAR ── */}
      <div className="bg-[#18181B]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-4 mb-4 flex flex-wrap items-center justify-between gap-4 shadow-xl shrink-0">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 border border-white/20">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-lg font-bold text-white tracking-tight">VendorOS AI Copilot</h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                Online
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5 flex items-center gap-2">
              <span>Powered by Groq</span>
              <span className="text-zinc-600">•</span>
              <code className="text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded text-[10px] font-mono border border-indigo-500/20">
                {status.model}
              </code>
            </p>
          </div>
        </div>

        {/* Header Right Action Buttons */}
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <button
              onClick={handleClearChat}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-white/10 text-xs font-medium transition-all"
              title="Clear conversation"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Clear Chat
            </button>
          )}
        </div>
      </div>

      {/* ── 2. MAIN CHAT SCROLL AREA ── */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4 rounded-2xl scrollbar-thin scrollbar-thumb-zinc-800">
        {messages.length === 0 ? (
          /* Empty / Welcome State */
          <div className="h-full flex flex-col items-center justify-center text-center p-6 max-w-2xl mx-auto">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-indigo-500/20 via-purple-500/20 to-blue-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-5 shadow-2xl">
              <Bot className="w-8 h-8" />
            </div>

            <h2 className="text-2xl font-bold text-white mb-2">
              What would you like to ask today?
            </h2>
            <p className="text-sm text-zinc-400 max-w-md mb-8 leading-relaxed">
              Ask anything from retail analytics, inventory optimization, and customer khata to general questions. Direct AI execution from your backend.
            </p>

            {/* Quick Prompt Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-left">
              {SUGGESTED_PROMPTS.map((prompt, idx) => {
                const Icon = prompt.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(prompt.label)}
                    className={`p-3.5 rounded-xl border bg-gradient-to-br ${prompt.color} hover:border-indigo-400/50 hover:scale-[1.02] transition-all duration-200 text-left group`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                        {prompt.category}
                      </span>
                      <Icon className="w-4 h-4 text-zinc-300 group-hover:text-white transition-colors" />
                    </div>
                    <p className="text-xs font-medium text-white group-hover:text-indigo-200 transition-colors">
                      {prompt.label}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* Conversation Stream */
          <div className="space-y-4">
            {messages.map((msg, index) => {
              const isUser = msg.role === "user";

              return (
                <div
                  key={index}
                  className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-xs font-bold shadow-md ${
                      isUser
                        ? "bg-gradient-to-tr from-blue-600 to-indigo-600 text-white border border-blue-400/30"
                        : "bg-gradient-to-tr from-[#1E1B4B] to-[#312E81] text-indigo-300 border border-indigo-500/30"
                    }`}
                  >
                    {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>

                  {/* Message Bubble Card */}
                  <div
                    className={`rounded-2xl shadow-xl transition-all ${
                      isUser
                        ? "max-w-[85%] sm:max-w-[70%] p-4 bg-[#0066CC] text-white rounded-tr-sm"
                        : "w-full max-w-[96%] sm:max-w-[92%] md:max-w-[90%] p-4 sm:p-6 bg-[#161619] border border-white/10 text-zinc-200 rounded-tl-sm backdrop-blur-md"
                    }`}
                  >
                    {/* Header inside bubble */}
                    <div className="flex items-center justify-between gap-4 mb-1.5 pb-1 border-b border-white/10">
                      <span className="text-[10px] font-semibold text-zinc-300 flex items-center gap-1.5">
                        {isUser ? "You" : "VendorOS AI"}
                        {!isUser && msg.model && (
                          <span className="text-[9px] text-indigo-400 bg-indigo-950/60 px-1 py-0.2 rounded border border-indigo-800/40 font-mono">
                            {msg.model}
                          </span>
                        )}
                      </span>
                      <div className="flex items-center gap-1 text-[10px] text-zinc-400">
                        <span>{msg.timestamp}</span>
                        {!isUser && (
                          <button
                            onClick={() => handleCopy(msg.content, index)}
                            className="ml-1 p-1 hover:text-white hover:bg-white/10 rounded transition-colors"
                            title="Copy reply"
                          >
                            {copiedIndex === index ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3 text-zinc-400" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    {isUser ? (
                      <p className="text-xs text-white whitespace-pre-wrap leading-relaxed">
                        {msg.content}
                      </p>
                    ) : (
                      <AiMessageRenderer content={msg.content} />
                    )}
                  </div>
                </div>
              );
            })}

            {/* Loading Indicator while AI is responding */}
            {isLoading && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl shrink-0 flex items-center justify-center bg-gradient-to-tr from-[#1E1B4B] to-[#312E81] text-indigo-300 border border-indigo-500/30">
                  <Bot className="w-4 h-4 animate-bounce" />
                </div>
                <div className="bg-[#18181B] border border-white/10 rounded-2xl rounded-tl-sm p-4 shadow-lg backdrop-blur-md flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping"></span>
                    <span
                      className="w-2 h-2 rounded-full bg-indigo-400 animate-ping"
                      style={{ animationDelay: "150ms" }}
                    ></span>
                    <span
                      className="w-2 h-2 rounded-full bg-indigo-300 animate-ping"
                      style={{ animationDelay: "300ms" }}
                    ></span>
                  </div>
                  <span className="text-xs text-zinc-400 font-medium">
                    Groq AI model is thinking & generating response...
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* ── 3. BOTTOM INPUT FORM ── */}
      <div className="shrink-0 bg-[#18181B]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-2.5 shadow-2xl">
        {/* Quick Suggestion Chips (when conversation is active) */}
        {messages.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-2 scrollbar-none">
            <span className="text-[10px] text-zinc-500 flex items-center gap-1 shrink-0 pl-1">
              <Lightbulb className="w-3 h-3 text-amber-400" />
              Quick:
            </span>
            {SUGGESTED_PROMPTS.map((sp, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(sp.label)}
                disabled={isLoading}
                className="shrink-0 px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-white/5 text-[11px] text-zinc-300 hover:text-white transition-all truncate max-w-[220px]"
              >
                {sp.label}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-end gap-2 bg-[#121214] border border-white/10 rounded-xl p-2 focus-within:border-indigo-500/70 focus-within:ring-1 focus-within:ring-indigo-500/40 transition-all">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask your AI agent anything (e.g., Why do parrots talk? How to improve sales?)..."
            disabled={isLoading}
            className="flex-1 bg-transparent text-white placeholder-zinc-500 text-xs sm:text-sm resize-none focus:outline-none min-h-[38px] max-h-32 px-2 py-1.5 leading-relaxed"
          />

          <button
            onClick={() => handleSendMessage()}
            disabled={!input.trim() || isLoading}
            className={`p-2.5 rounded-xl font-medium text-white transition-all flex items-center justify-center shrink-0 ${
              input.trim() && !isLoading
                ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-md shadow-indigo-500/25 cursor-pointer scale-100 hover:scale-105 active:scale-95"
                : "bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-50"
            }`}
            title="Send query"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-between px-2 pt-2 text-[10px] text-zinc-500">
          <span>
            Press <kbd className="px-1 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">Enter ↵</kbd> to send, <kbd className="px-1 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">Shift+Enter</kbd> for newline
          </span>
          <span className="hidden sm:inline">Model: Groq (openai/gpt-oss-120b)</span>
        </div>
      </div>
    </div>
  );
}
