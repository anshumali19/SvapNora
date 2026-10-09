import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { tokenizeGlow } from "../../lib/highlight";

interface CodeBlockProps {
  code: string;
  filename?: string;
  showLineNumbers?: boolean;
  className?: string;
  copyable?: boolean;
}

export function CodeBlock({
  code,
  filename,
  showLineNumbers = false,
  className = "",
  copyable = true,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const tokens = tokenizeGlow(code);
  const lines = code.split("\n");

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className={`code-panel ${className}`}>
      <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2.5">
        <span className="flex gap-1.5" aria-hidden>
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        </span>
        {filename ? (
          <span className="ml-1 font-mono text-xs text-white/50">{filename}</span>
        ) : (
          <span className="ml-1 font-mono text-xs text-white/50">glowlang</span>
        )}
        {copyable ? (
          <button
            type="button"
            onClick={copy}
            className="copy-btn ml-auto"
            aria-label="Copy code to clipboard"
          >
            {copied ? <Check className="h-3.5 w-3.5" aria-hidden /> : <Copy className="h-3.5 w-3.5" aria-hidden />}
            {copied ? "Copied" : "Copy"}
          </button>
        ) : null}
      </div>
      <div className="code-scroll">
        <pre className="code-block p-4">
          <code>
            {showLineNumbers ? (
              <table className="border-separate border-spacing-0">
                <tbody>
                  {lines.map((_, idx) => (
                    <tr key={idx}>
                      <td className="select-none pr-4 text-right text-white/25">{idx + 1}</td>
                      <td>
                        <Line tokens={tokens} lineIndex={idx} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <span>
                {tokens.map((t, idx) => (
                  <span key={idx} className={`tok-${t.type}`}>
                    {t.value}
                  </span>
                ))}
              </span>
            )}
          </code>
        </pre>
      </div>
    </div>
  );
}

function Line({
  tokens,
  lineIndex,
}: {
  tokens: { type: string; value: string }[];
  lineIndex: number;
}) {
  // Re-split the already-tokenized stream by line for numbered rendering.
  const flat = tokens.flatMap((t) => {
    const parts = t.value.split("\n");
    return parts.map((p, i) => ({
      token: t,
      value: p,
      hasNewline: i < parts.length - 1,
    }));
  });

  let currentLine = 0;
  const out: React.ReactNode[] = [];
  for (let i = 0; i < flat.length; i++) {
    const item = flat[i]!;
    if (currentLine === lineIndex && item.value.length > 0) {
      out.push(
        <span key={i} className={`tok-${item.token.type}`}>
          {item.value}
        </span>,
      );
    }
    if (item.hasNewline) currentLine++;
    if (currentLine > lineIndex) break;
  }
  return <>{out.length ? out : "\u00A0"}</>;
}
