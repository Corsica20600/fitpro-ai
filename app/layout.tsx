import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { AccountPill } from "@/src/components/auth/account-pill";
import { BottomNav } from "@/src/components/ui/bottom-nav";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FitAI Pro",
  description: "Coach fitness intelligent",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "FitAI Pro",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0b0f14",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <div className="app-shell">
          <header className="app-topbar">
            <div className="app-brand">
              <span className="app-brand-main">FitAI</span>
              <span className="app-brand-pro">PRO</span>
            </div>
            <AccountPill />
          </header>
          <main className="screen">{children}</main>
          <BottomNav />
        </div>
        <Script id="pwa-sw-register" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function () {
                navigator.serviceWorker.register('/sw.js').catch(function () {});
              });
            }
          `}
        </Script>
      </body>
    </html>
  );
}
