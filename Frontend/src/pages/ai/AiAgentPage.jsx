import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  ArrowUp,
  RotateCcw,
  Boxes,
  Truck,
  Users,
  TrendingUp,
  Copy,
  Check,
  Database,
  Bot,
  User as UserIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import { askAiAgent, getAiAgentStatus } from "../../services/ai.api";
import AiMessageRenderer from "../../components/ai/AiMessageRenderer";

const SUGGESTED_PROMPTS = [
  {
    icon: Boxes,
    title: "Live Stock & Inventory",
    desc: "Check available stock levels & low-inventory alerts",
    prompt: "Check live inventory and show any low-stock items in our database",
  },
  {
    icon: Truck,
    title: "Supplier Balances",
    desc: "View active suppliers & pending payable dues",
    prompt: "Who are our suppliers and how much money do we owe them?",
  },
  {
    icon: Users,
    title: "Customer Khata & Udhaar",
    desc: "Review customers with outstanding balances",
    prompt: "Show customer khata balances and pending udhaar debts",
  },
  {
    icon: TrendingUp,
    title: "Store Overview & KPIs",
    desc: "High-level summary of store health and performance",
    prompt: "Give me an overview of our store metrics and business health",
  },
];

export default function AiAgentPage() {
  const [messages, setMessages] = useState(() => {
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    try {
      localStorage.setItem("vendoros_ai_chat", JSON.stringify(messages));
    } catch {
      // Ignore
    }
  }, [messages]);

  useEffect(() => {
    getAiAgentStatus()
      .then((data) => {
        if (data?.model) {
          setStatus({ online: true, model: data.model });
        }
      })
      .catch(() => {});
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
          content: `⚠️ **Error**: ${errMsg}\n\nPlease verify that your \`GROQ_API_KEY\` in the backend is active.`,
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
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleClearChat = () => {
    if (messages.length === 0) return;
    setMessages([]);
    localStorage.removeItem("vendoros_ai_chat");
    toast.success("Conversation cleared");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-black text-white selection:bg-zinc-800 select-text">
      {/* ── 1. MINIMAL PROFESSIONAL TOP BAR ── */}
      <header className="h-14 px-4 sm:px-8 border-b border-zinc-800/80 bg-black/40 backdrop-blur-md flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-white tracking-tight">AI Copilot</span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-zinc-400 bg-zinc-900 border border-zinc-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Connected
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono text-zinc-400 bg-zinc-900/80 border border-zinc-800/80">
            <Database className="w-3 h-3 text-zinc-500" />
            MongoDB Tools Active
          </span>

          {messages.length > 0 && (
            <button
              onClick={handleClearChat}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent hover:border-zinc-800 transition-all cursor-pointer"
              title="Clear conversation"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clear</span>
            </button>
          )}
        </div>
      </header>

      {/* ── 2. MAIN CONVERSATION / EMPTY STATE AREA ── */}
      <div className="flex-1 overflow-y-auto px-4 py-6 scrollbar-thin scrollbar-thumb-zinc-800">
        <div className="max-w-3xl mx-auto w-full h-full flex flex-col justify-between">
          {messages.length === 0 ? (
            /* Clean Empty / Welcome View */
            <div className="my-auto py-8 text-center flex flex-col items-center">
              <div className="w-12 h-12 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-center text-zinc-300 mb-5 shadow-inner">
                <Sparkles className="w-5 h-5 text-indigo-400" />
              </div>

              <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight mb-2">
                How can I assist your store today?
              </h2>
              <p className="text-sm text-zinc-400 max-w-md mb-8 leading-relaxed">
                Directly connected to your live MongoDB database. Ask about inventory, suppliers, sales, or customer udhaar.
              </p>

              {/* Minimalist 4 Prompt Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-left">
                {SUGGESTED_PROMPTS.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(item.prompt)}
                      className="p-4 rounded-xl bg-[#0F0F12] hover:bg-[#151518] border border-zinc-800/80 hover:border-zinc-700 transition-all duration-200 text-left group cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <div className="w-6 h-6 rounded-md bg-zinc-900 flex items-center justify-center text-zinc-400 group-hover:text-white transition-colors">
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-medium text-white group-hover:text-indigo-300 transition-colors">
                          {item.title}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 line-clamp-1 leading-normal pl-8.5">
                        {item.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Message Stream */
            <div className="space-y-6 pb-6">
              {messages.map((msg, index) => {
                const isUser = msg.role === "user";

                if (isUser) {
                  return (
                    <div key={index} className="flex justify-end">
                      <div className="max-w-[85%] sm:max-w-[75%] bg-[#1A1A1E] text-zinc-100 border border-zinc-800/80 rounded-2xl rounded-tr-sm px-4 py-3 text-sm shadow-sm leading-relaxed whitespace-pre-wrap">
                        {msg.content}
                      </div>
                    </div>
                  );
                }

                // AI Response
                return (
                  <div key={index} className="flex items-start gap-3.5">
                    <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 shrink-0 mt-1">
                      <Bot className="w-4 h-4 text-indigo-400" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-white">VendorOS Copilot</span>
                          <span className="text-[10px] text-zinc-500 font-mono">
                            {msg.timestamp}
                          </span>
                        </div>

                        <button
                          onClick={() => handleCopy(msg.content, index)}
                          className="p-1 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900 rounded transition-colors cursor-pointer"
                          title="Copy answer"
                        >
                          {copiedIndex === index ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      <div className="bg-[#0D0D10] border border-zinc-850/80 rounded-2xl p-4 sm:p-5 shadow-sm">
                        <AiMessageRenderer content={msg.content} />
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Clean Thinking Indicator */}
              {isLoading && (
                <div className="flex items-start gap-3.5 animate-in fade-in duration-300">
                  <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 shrink-0 mt-1">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                  </div>
                  <div className="bg-[#0D0D10] border border-zinc-850/80 rounded-2xl px-4 py-3 flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                      <span
                        className="w-2 h-2 rounded-full bg-indigo-500/70 animate-pulse"
                        style={{ animationDelay: "200ms" }}
                      ></span>
                      <span
                        className="w-2 h-2 rounded-full bg-indigo-500/40 animate-pulse"
                        style={{ animationDelay: "400ms" }}
                      ></span>
                    </div>
                    <span className="text-xs text-zinc-400 font-medium">
                      Querying MongoDB & analyzing data...
                    </span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* ── 3. FLOATING MINIMALIST BOTTOM INPUT BAR ── */}
      <div className="shrink-0 max-w-3xl mx-auto w-full px-4 pb-4">
        {/* Quick prompt suggestions when active */}
        {messages.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-2 scrollbar-none">
            {SUGGESTED_PROMPTS.map((sp, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(sp.prompt)}
                disabled={isLoading}
                className="shrink-0 px-2.5 py-1 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px] text-zinc-300 hover:text-white transition-all cursor-pointer whitespace-nowrap"
              >
                {sp.title}
              </button>
            ))}
          </div>
        )}

        <div className="bg-[#121215] border border-zinc-800 focus-within:border-zinc-700 rounded-2xl p-2.5 shadow-2xl transition-all">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about inventory, sales, suppliers, or store performance..."
            disabled={isLoading}
            className="w-full bg-transparent text-white placeholder-zinc-500 text-sm resize-none focus:outline-none min-h-[38px] max-h-36 px-2 py-1 leading-relaxed"
          />

          <div className="flex items-center justify-between pt-1 px-1 border-t border-zinc-850/60 mt-1">
            <span className="text-[11px] text-zinc-500 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/80"></span>
              Live MongoDB Data Access
            </span>

            <button
              onClick={() => handleSendMessage()}
              disabled={!input.trim() || isLoading}
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                input.trim() && !isLoading
                  ? "bg-white text-black hover:bg-zinc-200 cursor-pointer scale-100 active:scale-95"
                  : "bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-40"
              }`}
              title="Send (Enter)"
            >
              <ArrowUp className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>

        <p className="text-center text-[10px] text-zinc-600 mt-2">
          Press <kbd className="font-mono text-zinc-500">Enter</kbd> to send • <kbd className="font-mono text-zinc-500">Shift + Enter</kbd> for newline
        </p>
      </div>
    </div>
  );
}
