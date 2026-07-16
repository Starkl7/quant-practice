"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

const OPTIONS = [
  { key: "system", label: "Auto" },
  { key: "light", label: "Light" },
  { key: "dark", label: "Dark" },
] as const;

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount flag to avoid SSR/client theme mismatch
    setMounted(true);
  }, []);

  return (
    <div className="flex items-center gap-1 rounded-md border border-[var(--border)] p-0.5">
      {OPTIONS.map((o) => (
        <button
          key={o.key}
          onClick={() => setTheme(o.key)}
          className={`rounded px-2 py-1 font-mono text-[0.65rem] tracking-wide uppercase transition ${
            mounted && theme === o.key
              ? "bg-[var(--accent-blue)] text-[var(--background)]"
              : "text-[var(--text-secondary)] hover:text-[var(--foreground)]"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
