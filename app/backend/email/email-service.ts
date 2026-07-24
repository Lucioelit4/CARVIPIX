/**
 * Email Service
 * Envia correos transaccionales via Resend
 */

import { Resend } from "resend";

let resend: Resend | null = null;

function getResend(): Resend {
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }

  return resend;
}

export const emailService = {
  /**
   * Enviar correo de bienvenida con licencia y enlace de descarga
   */
  async sendLicenseEmail(
    userEmail: string,
    userName: string,
    licenseKey: string,
    orderId: string,
    expiresAt: Date
  ) {
    const downloadLink = `https://carvipix.com/api/bot/download?license=${encodeURIComponent(
      licenseKey
    )}&token=${Buffer.from(`${licenseKey}:${orderId}`).toString("base64")}`;

    const expiresDate = new Date(expiresAt).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); color: white; padding: 40px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; }
        .content { padding: 40px; }
        .section { margin-bottom: 30px; }
        .section h2 { color: #333; font-size: 18px; margin-bottom: 12px; }
        .license-box { background: #f9f9f9; border-left: 4px solid #2a5298; padding: 15px; margin: 15px 0; font-family: monospace; }
        .button { display: inline-block; background: #2a5298; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
        .button:hover { background: #1e3c72; }
        .footer { background: #f5f5f5; padding: 20px; text-align: center; color: #666; font-size: 12px; }
        .expiry { color: #d9534f; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🤖 Tu Bot CARVIPIX está listo</h1>
        </div>
        
        <div class="content">
            <div class="section">
                <h2>Hola ${userName},</h2>
                <p>¡Gracias por tu compra! Tu acceso al Bot CARVIPIX ha sido activado exitosamente.</p>
            </div>

            <div class="section">
                <h2>📋 Información de tu Licencia</h2>
                <p><strong>ID de Orden:</strong></p>
                <div class="license-box">${orderId}</div>
                
                <p><strong>Clave de Licencia:</strong></p>
                <div class="license-box">${licenseKey}</div>
                
                <p><strong>Válida hasta:</strong> <span class="expiry">${expiresDate}</span></p>
            </div>

            <div class="section">
                <h2>⬇️ Descargar tu EA</h2>
                <p>Haz clic en el botón para descargar el archivo ejecutable (.ex5):</p>
                <a href="${downloadLink}" class="button">Descargar Bot CARVIPIX</a>
            </div>

            <div class="section">
                <h2>📖 Instrucciones de Instalación</h2>
                <ol>
                    <li>Descarga el archivo EA (.ex5)</li>
                    <li>Abre MetaTrader 5 en tu cuenta REAL</li>
                    <li>Ve a: Archivo → Carpeta de Datos → MQL5 → Experts</li>
                    <li>Copia el archivo descargado a esa carpeta</li>
                    <li>Reinicia MetaTrader 5</li>
                    <li>Abre el gráfico XAUUSD (oro) en temporalidad H1</li>
                    <li>Arrastra el EA al gráfico</li>
                    <li>Habilita trading automático (botón azul en esquina superior)</li>
                </ol>
            </div>

            <div class="section" style="background: #fffacd; padding: 15px; border-radius: 6px;">
                <h2 style="margin-top: 0;">⚠️ Importante</h2>
                <ul>
                    <li>Usa SOLO en tu cuenta REAL (broker recomendado: OANDA, Forex.com)</li>
                    <li>No compartas tu clave de licencia</li>
                    <li>El EA inicia a las 1:00 AM UTC (horario de apertura de Nueva York)</li>
                    <li>Riesgo máximo por orden: configurable en los parámetros</li>
                </ul>
            </div>

            <div class="section">
                <h2>📞 Soporte</h2>
                <p>Si tienes problemas con la instalación o el EA:</p>
                <p>
                    📧 <a href="mailto:soporte@carvipix.com">soporte@carvipix.com</a><br>
                    🌐 <a href="https://carvipix.com">www.carvipix.com</a>
                </p>
            </div>
        </div>

        <div class="footer">
            <p>CARVIPIX Bot de Trading Automático | © 2026 - Todos los derechos reservados</p>
            <p>Este correo fue enviado a: ${userEmail}</p>
        </div>
    </div>
</body>
</html>
    `;

    try {
      const result = await getResend().emails.send({
        from: process.env.RESEND_FROM_EMAIL || "noreply@carvipix.com",
        to: userEmail,
        subject: "Tu Bot CARVIPIX está listo",
        html,
      });

      console.log("[EMAIL-SERVICE] License email sent:", {
        messageId: result.data?.id,
        to: userEmail,
        timestamp: new Date().toISOString(),
      });

      return { ok: true, messageId: result.data?.id };
    } catch (error) {
      console.error("[EMAIL-SERVICE-ERROR]", {
        error: error instanceof Error ? error.message : String(error),
        to: userEmail,
        timestamp: new Date().toISOString(),
      });

      return {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },

  /**
   * Enviar correo de soporte
   */
  async sendSupportEmail(
    userEmail: string,
    subject: string,
    message: string
  ) {
    try {
      const result = await getResend().emails.send({
        from: process.env.EMAIL_SUPPORT_ADDRESS || "soporte@carvipix.com",
        to: userEmail,
        subject,
        html: `<p>${message}</p>`,
      });

      return { ok: true, messageId: result.data?.id };
    } catch (error) {
      console.error("[EMAIL-SERVICE-ERROR-SUPPORT]", {
        error: error instanceof Error ? error.message : String(error),
      });

      return {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
};
