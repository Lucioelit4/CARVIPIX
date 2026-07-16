/**
 * Email Service for CARVIPIX EA
 * Envía correos automáticos después del pago
 */

import nodemailer from "nodemailer";

interface EmailLicenseData {
  license_id: string;
  user_email: string;
  user_name: string;
  subscription_tier: string;
  expires_at: Date;
  download_link: string;
}

interface EmailSignalData {
  user_email: string;
  user_name: string;
  signal_id: string;
  symbol: string;
  direction: string;
  entry: number;
  stop_loss: number;
  take_profit: number;
}

interface EmailExecutionData {
  user_email: string;
  user_name: string;
  symbol: string;
  direction: string;
  entry_price: number;
  ticket: number;
  lot_size: number;
}

// Configurar transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: parseInt(process.env.EMAIL_PORT || "587"),
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

//+------------------------------------------------------------------+
// SEND LICENSE EMAIL (Post-Payment)
//+------------------------------------------------------------------+

export async function sendLicenseEmail(data: EmailLicenseData) {
  try {
    const expirationDate = new Date(data.expires_at).toLocaleDateString("es-ES");

    const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; }
          .header { text-align: center; margin-bottom: 30px; }
          .header h1 { color: #2563eb; margin: 0; font-size: 32px; }
          .license-box { background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%); color: white; padding: 20px; border-radius: 10px; margin: 30px 0; }
          .license-id { font-family: monospace; font-size: 18px; font-weight: bold; word-break: break-all; }
          .section { margin: 30px 0; }
          .section h2 { color: #1e40af; font-size: 18px; border-bottom: 2px solid #2563eb; padding-bottom: 10px; }
          .button { display: inline-block; background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 40px; border-top: 1px solid #ddd; padding-top: 20px; }
          .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚀 ¡BIENVENIDO A CARVIPIX!</h1>
            <p style="color: #666; margin: 10px 0 0 0;">Tu Licencia está Activa</p>
          </div>

          <p>Hola ${data.user_name},</p>
          <p>🎉 ¡Gracias por tu compra! Tu licencia de CARVIPIX está lista para usar.</p>

          <div class="license-box">
            <p style="margin: 0 0 10px 0;">TU LICENSE KEY:</p>
            <div class="license-id">${data.license_id}</div>
            <p style="margin: 10px 0 0 0; font-size: 12px;">Copia esta licencia para usar en el EA</p>
          </div>

          <div class="section">
            <h2>📋 Detalles de tu Plan</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Plan:</strong></td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">${data.subscription_tier}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Vence:</strong></td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">${expirationDate}</td>
              </tr>
              <tr>
                <td style="padding: 10px;"><strong>Estado:</strong></td>
                <td style="padding: 10px;">✅ ACTIVA</td>
              </tr>
            </table>
          </div>

          <div class="section">
            <h2>🚀 Próximos Pasos</h2>
            <ol style="line-height: 1.8;">
              <li><strong>Descargar el EA:</strong> Accede a tu panel y descarga el archivo .ex5</li>
              <li><strong>Instalar en MT5:</strong> Copia el archivo a tu carpeta de Experts</li>
              <li><strong>Configurar:</strong> Ingresa tu License Key en los inputs del EA</li>
              <li><strong>Activar:</strong> Habilita AutoTrading y el EA comienza a operar</li>
            </ol>
          </div>

          <a href="${data.download_link}" class="button">📥 Descargar mi EA</a>

          <div class="warning">
            <strong>⚠️ Importante:</strong> 
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li>No compartas tu License Key con otros</li>
              <li>El EA requiere conexión a Internet constante</li>
              <li>Habilita WebRequest en las opciones de MT5</li>
              <li>Usa cuenta DEMO primero para probar</li>
            </ul>
          </div>

          <div class="section">
            <h2>📞 Soporte</h2>
            <p>Si tienes preguntas, contáctanos en:</p>
            <p>Email: support@carvipix.com<br>
            WhatsApp: +34 XXX XXX XXX</p>
          </div>

          <div class="footer">
            <p>Este correo contiene información sensible. Guárdalo en un lugar seguro.</p>
            <p>© 2026 CARVIPIX. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
    </html>
    `;

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || "noreply@carvipix.com",
      to: data.user_email,
      subject: `🚀 Tu Licencia CARVIPIX está Lista - ${data.license_id}`,
      html: htmlContent,
    });

    console.log(`[EMAIL] License sent to ${data.user_email}`);
  } catch (error) {
    console.error("[EMAIL] Error sending license email:", error);
    throw error;
  }
}

//+------------------------------------------------------------------+
// SEND SIGNAL NOTIFICATION (Real-time)
//+------------------------------------------------------------------+

export async function sendSignalNotification(data: EmailSignalData) {
  try {
    const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
          .container { max-width: 500px; margin: 0 auto; }
          .signal { padding: 20px; border-radius: 10px; background: ${
            data.direction === "BUY"
              ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
              : "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"
          }; color: white; text-align: center; }
          .signal h2 { margin: 0; font-size: 32px; font-weight: bold; }
          .details { background: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 10px; }
          .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #ddd; }
          .detail-label { font-weight: bold; color: #666; }
          .detail-value { font-family: monospace; font-weight: bold; color: #000; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="signal">
            <h2>${data.direction === "BUY" ? "🟢 SEÑAL BUY" : "🔴 SEÑAL SELL"}</h2>
            <p>${data.symbol}</p>
          </div>

          <div class="details">
            <div class="detail-row">
              <span class="detail-label">Símbolo:</span>
              <span class="detail-value">${data.symbol}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Entry:</span>
              <span class="detail-value">${data.entry.toFixed(4)}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Stop Loss:</span>
              <span class="detail-value">${data.stop_loss.toFixed(4)}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Take Profit:</span>
              <span class="detail-value">${data.take_profit.toFixed(4)}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Signal ID:</span>
              <span class="detail-value">${data.signal_id}</span>
            </div>
          </div>

          <p style="text-align: center; color: #666; font-size: 12px;">
            Esta señal fue enviada automáticamente a tu EA. Las operaciones se ejecutan de forma automática.
          </p>
        </div>
      </body>
    </html>
    `;

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || "noreply@carvipix.com",
      to: data.user_email,
      subject: `📊 ${data.direction} ${data.symbol} - Signal #${data.signal_id}`,
      html: htmlContent,
    });

    console.log(`[EMAIL] Signal notification sent to ${data.user_email}`);
  } catch (error) {
    console.error("[EMAIL] Error sending signal notification:", error);
    // No throw - signals are realtime and shouldn't block on email
  }
}

//+------------------------------------------------------------------+
// SEND EXECUTION CONFIRMATION
//+------------------------------------------------------------------+

export async function sendExecutionConfirmation(data: EmailExecutionData) {
  try {
    const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
          .container { max-width: 500px; margin: 0 auto; }
          .trade { padding: 20px; border-radius: 10px; background: ${
            data.direction === "BUY" ? "#dbeafe" : "#fee2e2"
          }; border-left: 4px solid ${data.direction === "BUY" ? "#0284c7" : "#dc2626"}; }
          .trade h2 { margin: 0; font-size: 24px; font-weight: bold; color: ${
            data.direction === "BUY" ? "#0284c7" : "#dc2626"
          }; }
          .details { background: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 10px; }
          .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #ddd; }
          .detail-label { font-weight: bold; color: #666; }
          .detail-value { font-family: monospace; font-weight: bold; color: #000; }
          .ticket { background: #fbbf24; color: #000; padding: 10px; border-radius: 5px; font-weight: bold; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="trade">
            <h2>✅ OPERACIÓN EJECUTADA</h2>
            <p>${data.symbol} ${data.direction}</p>
          </div>

          <div class="details">
            <div class="detail-row">
              <span class="detail-label">Símbolo:</span>
              <span class="detail-value">${data.symbol}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Tipo:</span>
              <span class="detail-value">${data.direction}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Entry:</span>
              <span class="detail-value">${data.entry_price.toFixed(4)}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Lote:</span>
              <span class="detail-value">${data.lot_size}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label" style="border: none;">Ticket:</span>
              <span class="detail-value" style="border: none;">${data.ticket}</span>
            </div>
          </div>

          <div class="ticket">
            TICKET: #${data.ticket}
          </div>

          <p style="text-align: center; color: #666; font-size: 12px;">
            Tu operación fue ejecutada automáticamente por el EA CARVIPIX. Monitorea tu posición en MT5.
          </p>
        </div>
      </body>
    </html>
    `;

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || "noreply@carvipix.com",
      to: data.user_email,
      subject: `✅ Operación Ejecutada - ${data.symbol} ${data.direction} #${data.ticket}`,
      html: htmlContent,
    });

    console.log(`[EMAIL] Execution confirmation sent to ${data.user_email}`);
  } catch (error) {
    console.error("[EMAIL] Error sending execution email:", error);
  }
}

//+------------------------------------------------------------------+
// SEND DAILY SUMMARY
//+------------------------------------------------------------------+

export async function sendDailySummary(
  userEmail: string,
  userName: string,
  summary: {
    total_trades: number;
    total_pnl: number;
    win_rate: number;
    best_trade: number;
    worst_trade: number;
  }
) {
  try {
    const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; }
          .header { text-align: center; margin-bottom: 30px; }
          .stats { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 30px 0; }
          .stat-box { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px; text-align: center; }
          .stat-value { font-size: 32px; font-weight: bold; }
          .stat-label { font-size: 12px; margin-top: 5px; opacity: 0.9; }
          .positive { color: #10b981; }
          .negative { color: #ef4444; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📊 Resumen Diario CARVIPIX</h1>
            <p>${new Date().toLocaleDateString("es-ES")}</p>
          </div>

          <div class="stats">
            <div class="stat-box">
              <div class="stat-value">${summary.total_trades}</div>
              <div class="stat-label">Operaciones</div>
            </div>
            <div class="stat-box" style="background: linear-gradient(135deg, ${
              summary.total_pnl >= 0 ? "#10b981" : "#ef4444"
            } 0%, ${summary.total_pnl >= 0 ? "#059669" : "#dc2626"} 100%);">
              <div class="stat-value ${summary.total_pnl >= 0 ? "positive" : "negative"}">
                $${summary.total_pnl.toFixed(2)}
              </div>
              <div class="stat-label">P&L Total</div>
            </div>
            <div class="stat-box">
              <div class="stat-value">${summary.win_rate.toFixed(1)}%</div>
              <div class="stat-label">Win Rate</div>
            </div>
            <div class="stat-box">
              <div class="stat-value">${summary.best_trade > 0 ? "+" : ""}$${summary.best_trade.toFixed(2)}</div>
              <div class="stat-label">Mejor Trade</div>
            </div>
          </div>

          <p style="text-align: center; color: #666;">
            Accede a tu panel para ver detalles completos de tus operaciones.
          </p>
        </div>
      </body>
    </html>
    `;

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || "noreply@carvipix.com",
      to: userEmail,
      subject: `📊 Resumen Diario CARVIPIX - ${new Date().toLocaleDateString("es-ES")}`,
      html: htmlContent,
    });

    console.log(`[EMAIL] Daily summary sent to ${userEmail}`);
  } catch (error) {
    console.error("[EMAIL] Error sending daily summary:", error);
  }
}

export default {
  sendLicenseEmail,
  sendSignalNotification,
  sendExecutionConfirmation,
  sendDailySummary,
};
