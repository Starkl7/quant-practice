// Parses a numeric answer written any reasonable way: "0.066", "6/91", "35/1296",
// "(4/9)^4", "1 - 1/e", "6.59%", "3.5e-2". Returns null if the input isn't a
// valid expression. Recursive descent over + - * / ^ ( ) and numbers — no eval.
export function parseAnswer(raw: string): number | null {
  let s = raw.trim().replace(/−/g, "-").replace(/\s+/g, "");
  if (!s) return null;

  let percent = false;
  if (s.endsWith("%")) {
    percent = true;
    s = s.slice(0, -1);
  }

  let pos = 0;

  function peek(): string {
    return s[pos] ?? "";
  }

  function number(): number | null {
    const m = /^\d*\.?\d+(e[+-]?\d+)?/i.exec(s.slice(pos));
    // Reject exponents immediately followed by more digits mis-parsed elsewhere;
    // the regex is anchored so a failed match means malformed input here.
    if (!m) return null;
    pos += m[0].length;
    return parseFloat(m[0]);
  }

  function base(): number | null {
    if (peek() === "(") {
      pos++;
      const v = expr();
      if (v === null || peek() !== ")") return null;
      pos++;
      return v;
    }
    if (peek() === "-") {
      pos++;
      const v = base();
      return v === null ? null : -v;
    }
    // Allow e and pi as constants ("1-1/e", "pi/4")
    if (/^pi/i.test(s.slice(pos))) {
      pos += 2;
      return Math.PI;
    }
    if (/^e(?![\d.])/i.test(s.slice(pos))) {
      pos += 1;
      return Math.E;
    }
    return number();
  }

  function power(): number | null {
    const b = base();
    if (b === null) return null;
    if (peek() === "^") {
      pos++;
      const e = power(); // right-associative
      if (e === null) return null;
      return Math.pow(b, e);
    }
    return b;
  }

  function term(): number | null {
    let v = power();
    if (v === null) return null;
    while (peek() === "*" || peek() === "/") {
      const op = s[pos++];
      const r = power();
      if (r === null) return null;
      v = op === "*" ? v * r : v / r;
    }
    return v;
  }

  function expr(): number | null {
    let v = term();
    if (v === null) return null;
    while (peek() === "+" || peek() === "-") {
      const op = s[pos++];
      const r = term();
      if (r === null) return null;
      v = op === "+" ? v + r : v - r;
    }
    return v;
  }

  const result = expr();
  if (result === null || pos !== s.length || !isFinite(result)) return null;
  return percent ? result / 100 : result;
}
