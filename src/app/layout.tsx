import type { Metadata } from "next";
import { Inter, IBM_Plex_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const description =
  "Mental math drills, an inventory-aware market-making simulator, and probability & stats problems for quant trading interview prep.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "Quant Practice | Dhrubojeet Haldar",
  description,
  openGraph: {
    title: "Quant Practice",
    description,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Quant Practice",
    description,
  },
  verification: {
    google: "cXwu-zJTiAql34PRiW-Cj_T-7zC82XkJ78nLhcH5Hjc",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${plexMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-[var(--background)] text-[var(--foreground)]">
        <ThemeProvider attribute="data-theme" defaultTheme="system" enableSystem>
          {children}
          <footer className="border-t border-[var(--border)] py-6 text-center font-mono text-xs text-[var(--text-muted)]">
            <a href="/privacy" className="hover:text-[var(--text-secondary)]">
              Privacy Policy
            </a>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
