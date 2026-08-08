import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "CARVIPIX Trader",
  description: "Aplicacion PWA enfocada en alertas, resultados, bot y membresia para clientes activos.",
  robots: { index: false, follow: false },
};

export default function TraderLayout() {
  redirect("/dashboard");
}
