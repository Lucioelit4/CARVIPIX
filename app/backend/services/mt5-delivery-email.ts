import { Resend } from "resend";

let resend: Resend | null = null;

function getResend(): Resend {
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }

  return resend;
}

export type MT5DeliveryEmailParams = {
  to: string;
  userName: string;
  licenseKey: string;
  downloadUrl: string;
  installationManualUrl: string;
};

export async function sendMT5DeliveryEmail(params: MT5DeliveryEmailParams): Promise<boolean> {
  try {
    const { to, userName, licenseKey, downloadUrl, installationManualUrl } = params;

    const result = await getResend().emails.send({
      from: "CARVIPIX Support <support@carvipix.com>",
      to,
      subject: "Tu EA MT5 CARVIPIX está listo para descargar",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; }
              .content { padding: 20px; background: #f9f9f9; }
              .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 10px 0; }
              .code { background: #f0f0f0; padding: 10px; border-radius: 4px; font-family: monospace; margin: 10px 0; word-break: break-all; }
              .section { margin: 20px 0; padding: 15px; border-left: 4px solid #667eea; background: white; }
              .step { margin: 10px 0; }
              .step-number { display: inline-block; background: #667eea; color: white; width: 24px; height: 24px; border-radius: 50%; text-align: center; line-height: 24px; margin-right: 10px; }
              .footer { text-align: center; color: #999; font-size: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🚀 EA MT5 CARVIPIX</h1>
                <p>Tu robot automático está listo</p>
              </div>

              <div class="content">
                <p>Hola ${userName},</p>

                <p>¡Tu pago ha sido aprobado! Aquí está tu EA MT5 CARVIPIX v1.0.0, listo para instalar y comenzar a operar.</p>

                <div class="section">
                  <h3>📥 Descargar el EA</h3>
                  <p>
                    <a href="${downloadUrl}" class="button">Descargar EA (CARVIPIX_EA_MT5_V1.ex5)</a>
                  </p>
                  <p style="font-size: 12px; color: #999;">Este enlace expira en 24 horas</p>
                </div>

                <div class="section">
                  <h3>🔑 Tu Licencia</h3>
                  <p>Usa esta clave para activar tu EA en MetaTrader 5:</p>
                  <div class="code">${licenseKey}</div>
                  <p style="font-size: 12px; color: #666;">Guarda esta clave en un lugar seguro. La necesitarás para activar el EA.</p>
                </div>

                <div class="section">
                  <h3>📖 Pasos de Instalación</h3>
                  
                  <div class="step">
                    <span class="step-number">1</span>
                    Descarga el archivo <code>CARVIPIX_EA_MT5_V1.ex5</code> en el botón de arriba
                  </div>

                  <div class="step">
                    <span class="step-number">2</span>
                    Abre MetaTrader 5 en tu computadora
                  </div>

                  <div class="step">
                    <span class="step-number">3</span>
                    Ve a <code>File → Open Data Folder</code>
                  </div>

                  <div class="step">
                    <span class="step-number">4</span>
                    Entra a la carpeta <code>MQL5 → Experts</code>
                  </div>

                  <div class="step">
                    <span class="step-number">5</span>
                    Copia el archivo <code>CARVIPIX_EA_MT5_V1.ex5</code> aquí
                  </div>

                  <div class="step">
                    <span class="step-number">6</span>
                    Reinicia MetaTrader 5
                  </div>

                  <div class="step">
                    <span class="step-number">7</span>
                    En el Market Watch, busca el EA y arrastralo al gráfico
                  </div>

                  <div class="step">
                    <span class="step-number">8</span>
                    En la ventana de Inputs, ingresa tu licencia:
                    <div class="code">${licenseKey}</div>
                  </div>

                  <div class="step">
                    <span class="step-number">9</span>
                    Asegúrate de habilitar <strong>WebRequest</strong> en Tools → Options → Expert Advisors → Allow WebRequests
                  </div>

                  <div class="step">
                    <span class="step-number">10</span>
                    Haz clic en OK. El EA comenzará a conectarse con CARVIPIX
                  </div>
                </div>

                <div class="section">
                  <h3>🔗 URLs Importantes</h3>
                  <p>
                    El EA debe autorizar estas URLs en MT5:
                  </p>
                  <div class="code">https://carvipix.com/api/bot/mt5/*</div>
                </div>

                <div class="section">
                  <h3>✅ Verificar Conexión</h3>
                  <p>Una vez instalado, el EA enviará un heartbeat a CARVIPIX cada 5 segundos. Para verificar que está conectado:</p>
                  <ol>
                    <li>Ve a tu panel de cliente en <strong>carvipix.com/bot-mt5</strong></li>
                    <li>Deberías ver "Conectado" en verde</li>
                    <li>Si ves un error, revisa la sección de Errores en el mismo panel</li>
                  </ol>
                </div>

                <div class="section">
                  <h3>❓ Solución de Problemas</h3>
                  <ul>
                    <li><strong>No conecta:</strong> Asegúrate de que WebRequest esté habilitado y que ingresaste la licencia correctamente</li>
                    <li><strong>Error de licencia:</strong> Copia y pega la licencia exactamente, sin espacios</li>
                    <li><strong>Licencia expirada:</strong> Tu EA entrará en modo lectura (sin nuevas operaciones)</li>
                  </ul>
                </div>

                <p style="margin-top: 30px;">Si necesitas ayuda, escribe a <strong>soporte@carvipix.com</strong></p>

                <p>¡Bienvenido a CARVIPIX! 🎯</p>
              </div>

              <div class="footer">
                <p>© 2026 CARVIPIX. Todos los derechos reservados.</p>
                <p>Este correo contiene información sensible. No lo compartas con terceros.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (result.error) {
      console.error("[MT5 Email] Error enviando correo:", result.error);
      return false;
    }

    console.log("[MT5 Email] Correo enviado exitosamente:", result.data?.id);
    return true;
  } catch (error) {
    console.error("[MT5 Email] Excepción:", error);
    return false;
  }
}
