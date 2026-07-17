import type { Metadata } from "next";
import { Cormorant_Garamond, Geist_Mono, Manrope } from "next/font/google";
import "./globals.css";
import AppShell from "./components/AppShell";

// Force dynamic rendering at runtime instead of static generation at build time
// This prevents build-time database connection attempts
export const dynamic = 'force-dynamic';

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

const SITE_URL = "https://carvipix.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "CARVIPIX — Plataforma Profesional de Trading",
    template: "%s | CARVIPIX",
  },
  description:
    "CARVIPIX es la plataforma profesional de trading con Bot EA MT5, alertas en vivo, programa de fondeo y comunidad de traders. Opera con claridad y estructura.",
  keywords: [
    "CARVIPIX",
    "trading profesional",
    "bot MT5",
    "alertas de trading",
    "programa de fondeo",
    "señales de trading",
    "XAUUSD",
    "forex",
    "plataforma trading",
  ],
  authors: [{ name: "CARVIPIX", url: SITE_URL }],
  creator: "CARVIPIX",
  publisher: "CARVIPIX",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: SITE_URL,
    siteName: "CARVIPIX",
    title: "CARVIPIX — Plataforma Profesional de Trading",
    description:
      "Bot EA MT5, alertas en vivo, programa de fondeo y comunidad de traders. Opera con claridad y estructura.",
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "CARVIPIX — Plataforma Profesional de Trading",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CARVIPIX — Plataforma Profesional de Trading",
    description:
      "Bot EA MT5, alertas en vivo, programa de fondeo y comunidad de traders.",
    images: [`${SITE_URL}/og-image.png`],
    creator: "@carvipix",
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION ?? undefined,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${manrope.variable} ${geistMono.variable} ${cormorant.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "CARVIPIX",
              url: "https://carvipix.com",
              logo: "https://carvipix.com/og-image.png",
              description:
                "Plataforma profesional de trading con Bot EA MT5, alertas en vivo, programa de fondeo y comunidad de traders.",
              sameAs: [],
              contactPoint: {
                "@type": "ContactPoint",
                contactType: "customer support",
                email: "soporte@carvipix.com",
              },
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              url: "https://carvipix.com",
              name: "CARVIPIX",
              potentialAction: {
                "@type": "SearchAction",
                target: {
                  "@type": "EntryPoint",
                  urlTemplate: "https://carvipix.com/servicios",
                },
              },
            }),
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col bg-[#030303] text-[#FFFFFF]">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}