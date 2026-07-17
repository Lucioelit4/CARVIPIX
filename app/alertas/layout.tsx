import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Alertas — CARVIPIX",
  robots: { index: false, follow: false },
};
export default function AlertasLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
