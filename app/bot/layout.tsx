import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Bot — CARVIPIX",
  robots: { index: false, follow: false },
};
export default function BotLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
