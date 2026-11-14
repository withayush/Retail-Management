import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Copy, Check } from "lucide-react";

/**
 * Enterprise-grade Markdown Renderer for AI responses
 * Clean, professional, and minimalist styling matching modern developer tools
 */
export default function AiMessageRenderer({ content }) {
  if (!content) return null;

  return (
    <div className="ai-markdown-content text-zinc-300 select-text leading-relaxed text-sm space-y-3">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // ── Headings ──
          h1: ({ node, ...props }) => (
            <h1
              className="text-lg font-semibold text-white tracking-tight mt-5 mb-2 pb-1.5 border-b border-zinc-800/80 flex items-center gap-2"
              {...props}
            />
          ),
          h2: ({ node, ...props }) => (
            <h2
              className="text-base font-semibold text-white tracking-tight mt-4 mb-2 pb-1 border-b border-zinc-800/50 flex items-center gap-2"
              {...props}
            />
          ),
          h3: ({ node, ...props }) => (
            <h3
              className="text-sm font-semibold text-zinc-100 mt-3 mb-1.5 tracking-tight"
              {...props}
            />
          ),
          h4: ({ node, ...props }) => (
            <h4
              className="text-xs font-semibold text-zinc-300 mt-2.5 mb-1"
              {...props}
            />
          ),

          // ── Paragraphs & Text ──
          p: ({ node, ...props }) => (
            <p className="text-sm text-zinc-300 leading-relaxed my-1.5" {...props} />
          ),
          strong: ({ node, ...props }) => (
            <strong className="font-semibold text-white" {...props} />
          ),
          em: ({ node, ...props }) => (
            <em className="italic text-zinc-300" {...props} />
          ),

          // ── Lists ──
          ul: ({ node, ...props }) => (
            <ul className="my-2 pl-5 space-y-1.5 list-disc text-sm text-zinc-300 marker:text-zinc-500" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="my-2 pl-5 space-y-1.5 list-decimal text-sm text-zinc-300 marker:text-zinc-400 marker:font-medium" {...props} />
          ),
          li: ({ node, ...props }) => (
            <li className="leading-relaxed pl-1" {...props} />
          ),

          // ── Tables (Clean Modern Data Table) ──
          table: ({ node, ...props }) => (
            <div className="my-3.5 overflow-x-auto rounded-xl border border-zinc-800 bg-[#0F0F12] shadow-sm">
              <table className="w-full text-left text-xs border-collapse min-w-[480px]" {...props} />
            </div>
          ),
          thead: ({ node, ...props }) => (
            <thead className="bg-zinc-900/90 border-b border-zinc-800 text-zinc-400 uppercase tracking-wider text-[11px] font-medium" {...props} />
          ),
          th: ({ node, ...props }) => (
            <th className="px-3.5 py-2.5 font-medium text-zinc-300 border-r border-zinc-800/60 last:border-r-0 whitespace-nowrap" {...props} />
          ),
          tbody: ({ node, ...props }) => (
            <tbody className="divide-y divide-zinc-800/60 text-zinc-300" {...props} />
          ),
          tr: ({ node, ...props }) => (
            <tr className="hover:bg-zinc-800/30 transition-colors even:bg-zinc-900/20" {...props} />
          ),
          td: ({ node, ...props }) => (
            <td className="px-3.5 py-2.5 text-xs text-zinc-300 border-r border-zinc-800/40 last:border-r-0 align-top leading-relaxed" {...props} />
          ),

          // ── Code & Code Blocks ──
          code: ({ node, inline, className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || "");
            const lang = match ? match[1] : "";
            
            // Inline code
            if (inline || !String(children).includes("\n")) {
              return (
                <code
                  className="px-1.5 py-0.5 rounded-md bg-zinc-800/80 text-zinc-200 font-mono text-xs border border-zinc-700/50"
                  {...props}
                >
                  {children}
                </code>
              );
            }

            // Multi-line code block
            return (
              <div className="my-3 rounded-xl overflow-hidden border border-zinc-800 bg-[#111113]">
                {lang && (
                  <div className="bg-zinc-900/80 px-3.5 py-1.5 text-[11px] font-mono text-zinc-400 border-b border-zinc-800 flex justify-between items-center">
                    <span>{lang}</span>
                    <span className="text-[10px] text-zinc-500 uppercase">code</span>
                  </div>
                )}
                <pre className="p-3.5 text-xs font-mono text-zinc-200 overflow-x-auto leading-relaxed">
                  <code>{children}</code>
                </pre>
              </div>
            );
          },

          // ── Blockquote ──
          blockquote: ({ node, ...props }) => (
            <blockquote
              className="my-3 pl-3.5 py-1 border-l-2 border-zinc-600 bg-zinc-900/30 text-zinc-400 italic text-xs leading-relaxed rounded-r"
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
