import type { Metadata } from "next";
import TraderClientShell from "./components/TraderClientShell";

export const metadata: Metadata = {
  title: "CARVIPIX Trader",
  description: "Aplicacion PWA enfocada en alertas, resultados, bot y membresia para clientes activos.",
  robots: { index: false, follow: false },
};

export default function TraderLayout({ children }: { children: React.ReactNode }) {
  return <TraderClientShell>{children}</TraderClientShell>;
}
