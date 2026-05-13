import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { BottomNav } from "@/src/components/ui/bottom-nav";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FitAI Pro MVP",
  description: "Socle metier fitness avec Next.js + Prisma + Neon",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <div className="app-shell">
          <main className="screen">{children}</main>
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
