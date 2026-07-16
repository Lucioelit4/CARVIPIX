/**
 * GET /api/internal/shadow-production/final-report
 * Genera reporte final de los 7 días
 */

import { NextRequest, NextResponse } from 'next/server';
import { isSameOriginRequest } from '@/app/api/admin/_shared/security';
import { generateFinalReport } from '@/app/lib/shadow-production/persistence';

export async function GET(req: NextRequest): Promise<NextResponse> {
  if (!isSameOriginRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const report = await generateFinalReport();

    // Formatear para presentación
    const formatted = `
╔════════════════════════════════════════════════════════════════════════════╗
║                    SHADOW PRODUCTION — REPORTE FINAL                       ║
║                          7 DÍAS DE OBSERVACIÓN                            ║
╚════════════════════════════════════════════════════════════════════════════╝

📅 PERÍODO
  Inicio: ${report.start_date}
  Fin: ${report.end_date}
  Duración: ${report.duration_days} días

═══════════════════════════════════════════════════════════════════════════════

📊 RESUMEN EJECUCIÓN

  Análisis realizados: ${report.total_analyses}
  Alertas generadas: ${report.total_alerts}
  Costo OpenAI total: $${report.total_cost_usd.toFixed(2)}
  Disponibilidad del sistema: ${report.uptime_pct.toFixed(2)}%
  Errores registrados: ${report.total_errors}

═══════════════════════════════════════════════════════════════════════════════

📈 RENDIMIENTO PAPER ACCOUNT

  P&L Final: $${report.paper_account_final_pnl.toFixed(2)}
  Win Rate: ${report.paper_account_win_rate.toFixed(1)}%
  Max Drawdown: $${report.paper_account_max_drawdown.toFixed(2)}

═══════════════════════════════════════════════════════════════════════════════

📱 PUBLICACIONES EN TELEGRAM

  Total enviadas: ${report.total_publications}
  Promedio diario: ${report.avg_publications_per_day.toFixed(1)}
  Estado: SOLO CANAL TEST ✓

═══════════════════════════════════════════════════════════════════════════════

💰 CONVERSIÓN & TRUST ENGINE

  Sugerencias generadas: ${report.total_suggestions_generated}
  Clics totales: ${report.total_clics}
  Registros: ${report.total_registrations}
  Pagos atribuidos: ${report.total_payments}

═══════════════════════════════════════════════════════════════════════════════

⚠️  ISSUES & ANOMALÍAS

  Total anomalías registradas: ${report.total_anomalies}
  Críticas: ${report.critical_issues}
  Mayores: ${report.major_issues}
  Menores: ${report.minor_issues}

═══════════════════════════════════════════════════════════════════════════════

🔧 ESTADO DE MÓDULOS

${Object.entries(report.modules_status)
  .map(
    ([module, status]) =>
      `  ${module.padEnd(25)} | ${status.active ? '✓' : '✗'} Active | Errors: ${status.errors} | Status: ${status.status}`,
  )
  .join('\n')}

═══════════════════════════════════════════════════════════════════════════════

📋 RECOMENDACIONES

${report.recommendations.map(r => `  • ${r}`).join('\n')}

═══════════════════════════════════════════════════════════════════════════════

✅ LISTO PARA PRODUCCIÓN: ${report.ready_for_production ? 'SÍ' : 'NO'}

═════════════════════════════════════════════════════════════════════════════════
Generado: ${new Date().toISOString()}
═════════════════════════════════════════════════════════════════════════════════
    `.trim();

    return NextResponse.json({
      ok: true,
      report,
      formatted,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[SHADOW] Error generando reporte final:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
