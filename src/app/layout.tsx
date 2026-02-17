import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import AnalyticsTracker from "./components/AnalyticsTracker";
import { Suspense } from "react";
import { Analytics } from "@vercel/analytics/next";
import Script from "next/script";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="hydrated" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${geistMono.variable} antialiased fonts-loaded`}
      >
        <Suspense fallback={null}>
          <AnalyticsTracker />
        </Suspense>
        {children}
        <Analytics />
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var root = document.documentElement;
                var theme = null;
                try {
                  var raw = localStorage.getItem('site-theme');
                  if (raw) {
                    var parsed = JSON.parse(raw);
                    theme = parsed.mode;
                  }
                } catch (e) {}
                var isDark = false;
                if (theme === 'dark') isDark = true;
                else if (theme === 'light') isDark = false;
                else {
                  isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                }
                root.classList.toggle('dark', isDark);
                root.classList.toggle('light', !isDark);
              })();
            `,
          }}
        />
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
      </body>
    </html>
  );
}
