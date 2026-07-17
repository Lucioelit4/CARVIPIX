import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Herramientas — CARVIPIX",
  robots: { index: false, follow: false },
};
export default function HerramientasLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
