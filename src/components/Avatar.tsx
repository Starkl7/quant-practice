import Image from "next/image";
import type { User } from "@supabase/supabase-js";

export default function Avatar({ user, size = 28 }: { user: User; size?: number }) {
  const src = user.user_metadata?.avatar_url ?? user.user_metadata?.picture;
  const initial = (user.user_metadata?.full_name ?? user.email ?? "?").charAt(0).toUpperCase();

  if (src) {
    return (
      <Image
        src={src}
        alt=""
        width={size}
        height={size}
        className="shrink-0 rounded-full border border-[var(--border)]"
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-secondary)] font-mono text-xs text-[var(--text-secondary)]"
      style={{ width: size, height: size }}
    >
      {initial}
    </div>
  );
}
