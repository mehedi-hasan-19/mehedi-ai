import React, { useState } from 'react';
import { Check, Copy, ExternalLink } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
  sources?: Array<{ uri: string; title: string }>;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, sources }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopyCode = (code: string, idx: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 1800);
  };

  // Split content by fenced code blocks ```lang ... ```
  const blocks = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-3 text-sm leading-relaxed text-slate-800 dark:text-slate-200">
      {blocks.map((block, index) => {
        if (block.startsWith('```') && block.endsWith('```')) {
          const lines = block.slice(3, -3).trim().split('\n');
          const firstLine = lines[0]?.trim() || '';
          const hasLang = /^[a-zA-Z0-9_-]+$/.test(firstLine);
          const lang = hasLang ? firstLine : 'code';
          const codeBody = hasLang ? lines.slice(1).join('\n') : lines.join('\n');

          return (
            <div
              key={index}
              className="my-3 overflow-hidden rounded-lg border border-slate-200 bg-slate-900 text-slate-100 dark:border-slate-800 dark:bg-[#070A10]"
            >
              <div className="flex items-center justify-between border-b border-slate-800 px-3.5 py-2 text-xs text-slate-400">
                <span className="font-mono">{lang}</span>
                <button
                  type="button"
                  onClick={() => handleCopyCode(codeBody, index)}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-white transition-colors whitespace-nowrap shrink-0"
                >
                  {copiedIndex === index ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy code</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="overflow-x-auto p-3.5 font-mono text-xs leading-relaxed text-slate-100">
                <code>{codeBody}</code>
              </pre>
            </div>
          );
        }

        // Render normal markdown paragraphs, headings, and lists cleanly
        const paragraphs = block
          .split('\n\n')
          .map((p) => p.trim())
          .filter(Boolean);

        return (
          <React.Fragment key={index}>
            {paragraphs.map((para, pIdx) => {
              if (para.startsWith('### ')) {
                return (
                  <h4
                    key={pIdx}
                    className="pt-2 font-display text-base font-semibold text-slate-900 dark:text-white"
                  >
                    {para.replace(/^###\s+/, '')}
                  </h4>
                );
              }
              if (para.startsWith('## ')) {
                return (
                  <h3
                    key={pIdx}
                    className="pt-3 font-display text-lg font-semibold text-slate-900 dark:text-white"
                  >
                    {para.replace(/^##\s+/, '')}
                  </h3>
                );
              }
              if (para.startsWith('# ')) {
                return (
                  <h2
                    key={pIdx}
                    className="pt-3 font-display text-xl font-bold text-slate-900 dark:text-white"
                  >
                    {para.replace(/^#\s+/, '')}
                  </h2>
                );
              }

              const lines = para.split('\n');
              const isList = lines.every(
                (l) => l.trim().startsWith('- ') || l.trim().startsWith('* ') || /^\d+\.\s/.test(l.trim())
              );

              if (isList) {
                return (
                  <ul key={pIdx} className="space-y-1.5 pl-4 list-disc marker:text-blue-500">
                    {lines.map((item, lIdx) => (
                      <li key={lIdx} className="text-slate-700 dark:text-slate-300">
                        {formatInlineBold(item.replace(/^(-|\*|\d+\.)\s+/, ''))}
                      </li>
                    ))}
                  </ul>
                );
              }

              return (
                <p key={pIdx} className="whitespace-pre-line text-slate-700 dark:text-slate-300">
                  {formatInlineBold(para)}
                </p>
              );
            })}
          </React.Fragment>
        );
      })}

      {sources && sources.length > 0 && (
        <div className="mt-4 border-t border-slate-200 pt-3 dark:border-slate-800/80">
          <p className="mb-2 text-xs font-medium text-slate-500 dark:text-slate-400">
            Verified Grounding Sources
          </p>
          <div className="flex flex-wrap gap-3">
            {sources.map((src, idx) => (
              <a
                key={idx}
                href={src.uri}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:underline dark:text-blue-400"
              >
                <ExternalLink className="h-3 w-3 shrink-0" />
                <span className="truncate max-w-[240px]">{src.title || src.uri}</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

function formatInlineBold(text: string): React.ReactNode {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-slate-900 dark:text-slate-100">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}
