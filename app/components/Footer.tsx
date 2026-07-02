import Link from "next/link";
import { Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#05070B] text-white mt-12">
      <div className="mx-auto max-w-7xl px-6 py-8 sm:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Info */}
          <div>
            <h3 className="text-sm font-semibold text-[#D4AF37] uppercase tracking-widest mb-4">
              CARVIPIX
            </h3>
            <p className="text-sm text-zinc-400">
              Plataforma de trading, automatización y educación financiera.
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
                  href="/legal"
                  className="text-zinc-400 hover:text-[#D4AF37] transition"
                >
                  Aviso Legal
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-zinc-400 hover:text-[#D4AF37] transition"
                >
                  Términos y Condiciones
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-zinc-400 hover:text-[#D4AF37] transition"
                >
                  Política de Privacidad
                </Link>
              </li>
              <li>
                <Link
                  href="/risk-disclosure"
                  className="text-zinc-400 hover:text-[#D4AF37] transition"
                >
                  Divulgación de Riesgos
                </Link>
              </li>
              <li>
                <Link
                  href="/cookies"
                  className="text-zinc-400 hover:text-[#D4AF37] transition"
                >
                  Política de Cookies
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
              className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-[#D4AF37] transition"
            >
              <Mail size={16} />
              Soporte
            </Link>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="border-t border-white/10 pt-6">
          <p className="text-xs text-zinc-500 leading-relaxed">
            <strong>Aviso importante:</strong> CARVIPIX proporciona herramientas y servicios informativos. El trading implica riesgo significativo, incluida pérdida total de capital. CARVIPIX no garantiza rendimientos ni resultados específicos. Consulta asesores financieros autorizados antes de decisiones de inversión. Parte del contenido puede utilizar datos simulados.
          </p>
        </div>

        {/* Copyright */}
        <div className="border-t border-white/10 mt-6 pt-6">
          <p className="text-xs text-zinc-600 text-center">
            © 2026 CARVIPIX. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
