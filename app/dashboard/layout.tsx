// layout.tsx for /dashboard — noindex (authenticated area)
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard — CARVIPIX",
  robots: { index: false, follow: false },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
