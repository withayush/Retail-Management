import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Enterprise-grade Markdown Renderer for AI responses
 * Full support for Tables, Headings, Ordered/Unordered Lists, Code blocks, Dividers, and Inline Highlights
 */
export default function AiMessageRenderer({ content }) {
  if (!content) return null;

  return (
    <div className="ai-markdown-content text-zinc-200 select-text leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // ── Headings ──
          h1: ({ node, ...props }) => (
            <h1
              className="text-lg sm:text-xl font-bold text-white mt-5 mb-3 pb-2 border-b border-zinc-800/80 flex items-center gap-2.5 tracking-tight"
              {...props}
            />
          ),
          h2: ({ node, ...props }) => (
            <h2
              className="text-base sm:text-lg font-bold text-indigo-200 mt-4 mb-2 pb-1.5 border-b border-zinc-800/40 flex items-center gap-2"
              {...props}
            />
          ),
          h3: ({ node, ...props }) => (
            <h3
              className="text-sm sm:text-base font-semibold text-white mt-3.5 mb-2 flex items-center gap-2"
              {...props}
            />
          ),
          h4: ({ node, ...props }) => (
            <h4
              className="text-xs sm:text-sm font-semibold text-zinc-300 mt-2.5 mb-1"
              {...props}
            />
          ),

          // ── Paragraphs & Text ──
          p: ({ node, ...props }) => (
            <p className="text-xs sm:text-[13px] text-zinc-200 leading-relaxed my-2" {...props} />
          ),
          strong: ({ node, ...props }) => (
            <strong className="font-semibold text-white tracking-wide" {...props} />
          ),
          em: ({ node, ...props }) => (
            <em className="italic text-zinc-300" {...props} />
          ),

          // ── Lists ──
          ul: ({ node, ...props }) => (
            <ul className="my-2.5 pl-5 space-y-1.5 list-disc text-xs sm:text-[13px] text-zinc-200 marker:text-indigo-400" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="my-2.5 pl-5 space-y-1.5 list-decimal text-xs sm:text-[13px] text-zinc-200 marker:text-indigo-400 marker:font-semibold" {...props} />
          ),
          li: ({ node, ...props }) => (
            <li className="leading-relaxed pl-1" {...props} />
          ),

          // ── Tables (Markdown GFM) ──
          table: ({ node, ...props }) => (
            <div className="my-4 overflow-x-auto rounded-xl border border-zinc-700/60 bg-[#121214] shadow-xl">
              <table className="w-full text-left text-xs border-collapse min-w-[500px]" {...props} />
            </div>
          ),
          thead: ({ node, ...props }) => (
            <thead className="bg-[#1C1C20] border-b border-zinc-700/70 text-zinc-200 uppercase tracking-wider text-[11px] font-semibold" {...props} />
          ),
          th: ({ node, ...props }) => (
            <th className="px-4 py-3 font-semibold text-zinc-100 border-r border-zinc-800/80 last:border-r-0 whitespace-nowrap bg-zinc-900/90" {...props} />
          ),
          tbody: ({ node, ...props }) => (
            <tbody className="divide-y divide-zinc-800/60 text-zinc-300" {...props} />
          ),
          tr: ({ node, ...props }) => (
            <tr className="hover:bg-white/[0.04] transition-colors even:bg-white/[0.015]" {...props} />
          ),
          td: ({ node, ...props }) => (
            <td className="px-4 py-2.5 text-xs text-zinc-300 border-r border-zinc-800/40 last:border-r-0 align-top leading-relaxed" {...props} />
          ),

          // ── Code & Code Blocks ──
          code: ({ node, inline, className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || "");
            const lang = match ? match[1] : "";
            
            // Inline code
            if (inline || !String(children).includes("\n")) {
              return (
                <code
                  className="px-1.5 py-0.5 rounded-md bg-[#252528] text-indigo-300 font-mono text-[11px] border border-zinc-700/60"
                  {...props}
                >
                  {children}
                </code>
              );
            }

            // Multi-line code block
            return (
              <div className="my-3 rounded-xl overflow-hidden border border-zinc-800 bg-[#121214] shadow-md">
                {lang && (
                  <div className="bg-[#1C1C1F] px-3.5 py-1.5 text-[11px] font-mono text-zinc-400 border-b border-zinc-800 flex justify-between items-center">
                    <span>{lang}</span>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-widest">code</span>
                  </div>
                )}
                <pre className="p-3.5 text-xs font-mono text-emerald-300 overflow-x-auto leading-relaxed">
                  <code>{children}</code>
                </pre>
              </div>
            );
          },

          // ── Blockquote ──
          blockquote: ({ node, ...props }) => (
            <blockquote
              className="my-3 pl-4 py-1 border-l-2 border-indigo-500 bg-indigo-500/[0.03] text-zinc-300 italic text-xs leading-relaxed rounded-r-lg"
              {...props}
            />
          ),

          // ── Divider ──
          hr: ({ node, ...props }) => (
            <hr className="my-4 border-t border-zinc-800/80" {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
