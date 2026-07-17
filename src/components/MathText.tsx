"use client";

import { useMemo } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

// Splits out $$...$$ (display) and $...$ (inline) math so plain text is
// HTML-escaped and math is rendered by KaTeX. Double newlines become
// paragraph breaks so multi-step solutions read cleanly.
const MATH_SPLIT = /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function toHtml(text: string): string {
  return text
    .split(MATH_SPLIT)
    .map((seg) => {
      if (seg.startsWith("$$") && seg.endsWith("$$")) {
        return katex.renderToString(seg.slice(2, -2), {
          displayMode: true,
          throwOnError: false,
        });
      }
      if (seg.startsWith("$") && seg.endsWith("$") && seg.length > 2) {
        return katex.renderToString(seg.slice(1, -1), { throwOnError: false });
      }
      return escapeHtml(seg).replace(/\n\n/g, '<span class="math-par"></span>');
    })
    .join("");
}

export default function MathText({ text, className }: { text: string; className?: string }) {
  const html = useMemo(() => toHtml(text), [text]);
  return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}
