import Link from "next/link";
import { Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="mt-12 border-t border-[#2A2A2A] bg-[#030303] text-white">
      <div className="mx-auto max-w-7xl px-6 py-8 sm:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Info */}
          <div>
            <h3 className="text-sm font-semibold text-[#D4AF37] uppercase tracking-widest mb-4">
              CARVIPIX
            </h3>
            <p className="text-sm text-zinc-400">
              Plataforma tecnologica para traders con herramientas, automatizacion y contenido operativo.
            </p>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="text-sm font-semibold text-[#D4AF37] uppercase tracking-widest mb-4">
              Legal
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/trust-center"
                  className="text-[#B5B5B5] transition hover:text-[#F4C542]"
                >
                  CARVIPIX Transparency & Trust Center
                </Link>
              </li>
              <li>
                <Link
                  href="/legal"
                  className="text-[#B5B5B5] transition hover:text-[#F4C542]"
                >
                  Aviso Legal
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-[#B5B5B5] transition hover:text-[#F4C542]"
                >
                  Términos y Condiciones
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-[#B5B5B5] transition hover:text-[#F4C542]"
                >
                  Política de Privacidad
                </Link>
              </li>
              <li>
                <Link
                  href="/risk-disclosure"
                  className="text-[#B5B5B5] transition hover:text-[#F4C542]"
                >
                  Divulgación de Riesgos
                </Link>
              </li>
              <li>
                <Link
                  href="/cookies"
                  className="text-[#B5B5B5] transition hover:text-[#F4C542]"
                >
                  Política de Cookies
                </Link>
              </li>
              <li>
                <Link
                  href="/cancelacion"
                  className="text-[#B5B5B5] transition hover:text-[#F4C542]"
                >
                  Política de Cancelación
                </Link>
              </li>
              <li>
                <Link
                  href="/reembolsos"
                  className="text-[#B5B5B5] transition hover:text-[#F4C542]"
                >
                  Política de Reembolso
                </Link>
              </li>
              <li>
                <Link
                  href="/pagos-recurrentes"
                  className="text-[#B5B5B5] transition hover:text-[#F4C542]"
                >
                  Pagos Recurrentes
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold text-[#D4AF37] uppercase tracking-widest mb-4">
              Contacto
            </h3>
            <Link
              href="/soporte"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-lg px-2 text-sm text-[#B5B5B5] transition duration-200 hover:text-[#F4C542]"
            >
              <Mail size={16} />
              Soporte
            </Link>
            <Link
              href="/trust-center/contacto"
              className="mt-2 inline-flex min-h-[44px] items-center gap-2 rounded-lg px-2 text-sm text-[#B5B5B5] transition duration-200 hover:text-[#F4C542]"
            >
              Canales oficiales
            </Link>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="border-t border-[#2A2A2A] pt-6">
          <p className="text-xs leading-relaxed text-[#B5B5B5]">
            <strong>Aviso importante:</strong> CARVIPIX proporciona herramientas y servicios informativos. El trading implica riesgo significativo y CARVIPIX no garantiza resultados especificos. Si necesitas una evaluacion legal, fiscal o financiera individual, consulta a un profesional independiente.
          </p>
        </div>

        {/* Copyright */}
        <div className="mt-6 border-t border-[#2A2A2A] pt-6">
          <p className="text-center text-xs text-[#7E7E7E]">
            © 2026 CARVIPIX. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
