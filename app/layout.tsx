import type { Metadata } from "next";
import { Cormorant_Garamond, Geist_Mono, Manrope } from "next/font/google";
import "./globals.css";
import AppShell from "./components/AppShell";

const manrope = Manrope({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "CARVIPIX",
  description: "Plataforma profesional de trading, automatización y fondeo.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${manrope.variable} ${geistMono.variable} ${cormorant.variable}`}>
      <body className="min-h-screen flex flex-col bg-[#05070b] text-[#f5f1e8]">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}