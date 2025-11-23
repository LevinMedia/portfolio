import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import AnalyticsTracker from "./components/AnalyticsTracker";
import { Suspense } from "react";
import { Analytics } from "@vercel/analytics/next";
import Script from "next/script";
import { ThemeProvider } from "@/lib/themes/ThemeProvider";
import { createClient } from "@supabase/supabase-js";
import { defaultThemeId } from "@/lib/themes/registry";
import { getActiveThemeId, syncThemesTable } from "@/lib/themes/theme-store";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: "LevinMedia / %s",
    default: "LevinMedia"
  },
  description: "David Levin's portfolio and work history",
};

async function resolveActiveThemeId() {
  try {
    const client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    await syncThemesTable(client);
    return await getActiveThemeId(client);
  } catch (error) {
    console.error("Unable to resolve active theme. Falling back to default.", error);
    return defaultThemeId;
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const activeThemeId = await resolveActiveThemeId();

  return (
    <html lang="en" className="hydrated">
      <body
        className={`${inter.variable} ${geistMono.variable} antialiased fonts-loaded`}
      >
        <ThemeProvider initialThemeId={activeThemeId}>
          <Suspense fallback={null}>
            <AnalyticsTracker />
          </Suspense>
          {children}
          <Analytics />
          <Script
            id="prevent-fouc"
            strategy="beforeInteractive"
            dangerouslySetInnerHTML={{
              __html: `
              document.documentElement.classList.add('hydrated');
              document.body.classList.add('fonts-loaded');
            `,
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
