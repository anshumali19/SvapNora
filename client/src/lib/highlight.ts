export type TokenType =
  | "kw"
  | "type"
  | "str"
  | "num"
  | "comment"
  | "fn"
  | "punct"
  | "ident";

const KEYWORDS = new Set([
  "blueprint",
  "action",
  "show",
  "every",
  "when",
  "whenever",
  "let",
  "if",
  "else",
  "elif",
  "while",
  "for",
  "in",
  "return",
  "end",
  "and",
  "or",
  "not",
  "true",
  "false",
  "null",
  "self",
  "import",
  "from",
  "as",
  "try",
  "catch",
  "spawn",
]);

export interface Token {
  type: TokenType;
  value: string;
}

/** A small, dependency-free tokenizer used to render GlowLang samples. */
export function tokenizeGlow(code: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const n = code.length;

  while (i < n) {
    const ch = code[i]!;

    if (ch === "#") {
      let j = i;
      while (j < n && code[j] !== "\n") j++;
      tokens.push({ type: "comment", value: code.slice(i, j) });
      i = j;
      continue;
    }

    if (ch === '"' || ch === "'") {
      const quote = ch;
      let j = i + 1;
      while (j < n && code[j] !== quote) {
        if (code[j] === "\\") j++;
        j++;
      }
      tokens.push({ type: "str", value: code.slice(i, Math.min(j + 1, n)) });
      i = Math.min(j + 1, n);
      continue;
    }

    if (/[0-9]/.test(ch)) {
      let j = i;
      while (j < n && /[0-9._]/.test(code[j]!)) j++;
      tokens.push({ type: "num", value: code.slice(i, j) });
      i = j;
      continue;
    }

    if (/[A-Za-z_]/.test(ch)) {
      let j = i;
      while (j < n && /[A-Za-z0-9_]/.test(code[j]!)) j++;
      const word = code.slice(i, j);
      // A following "(" makes it a call.
      let k = j;
      while (k < n && code[k] === " ") k++;
      if (KEYWORDS.has(word)) tokens.push({ type: "kw", value: word });
      else if (word[0] && word[0] === word[0].toUpperCase() && /[a-z]/.test(word))
        tokens.push({ type: "type", value: word });
      else if (code[k] === "(") tokens.push({ type: "fn", value: word });
      else tokens.push({ type: "ident", value: word });
      i = j;
      continue;
    }

    if (/[=+\-*/%<>!&|.,:(){}[\]]/.test(ch)) {
      tokens.push({ type: "punct", value: ch });
      i++;
      continue;
    }

    // Fallback: whitespace and anything else keeps plain.
    let j = i;
    while (j < n && !/[A-Za-z0-9_#"'\n=+\-*/%<>!&|.,:(){}[\]]/.test(code[j]!)) j++;
    tokens.push({ type: "ident", value: code.slice(i, j) });
    i = j === i ? i + 1 : j;
  }

  return tokens;
}
