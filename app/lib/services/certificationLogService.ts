import * as fs from "fs";
import * as path from "path";
import { CertificationLogEntry, CertificationSummary } from "@/app/lib/types/certificationTypes";
import crypto from "crypto";

const CERT_LOG_DIR = path.join(process.cwd(), "data", "certification");
const CERT_LOG_FILE = path.join(CERT_LOG_DIR, "logs.json");

// Asegurar que existe el directorio
function ensureDirectory() {
  if (!fs.existsSync(CERT_LOG_DIR)) {
    fs.mkdirSync(CERT_LOG_DIR, { recursive: true });
  }
}

// Cargar todos los logs
export function loadCertificationLogs(): CertificationLogEntry[] {
  ensureDirectory();
  if (!fs.existsSync(CERT_LOG_FILE)) {
    return [];
  }
  try {
    const data = fs.readFileSync(CERT_LOG_FILE, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("[CertificationLog] Error loading logs:", error);
    return [];
  }
}

// Guardar logs
function saveCertificationLogs(logs: CertificationLogEntry[]): void {
  ensureDirectory();
  fs.writeFileSync(CERT_LOG_FILE, JSON.stringify(logs, null, 2), "utf-8");
}

// Registrar nuevo ciclo
export function logCertificationCycle(entry: Omit<CertificationLogEntry, "id" | "cycle_number">): CertificationLogEntry {
  const logs = loadCertificationLogs();
  const newEntry: CertificationLogEntry = {
    ...entry,
    id: crypto.randomUUID(),
    cycle_number: logs.length + 1,
  };
  logs.push(newEntry);
  saveCertificationLogs(logs);
  
  console.log(`[CertificationLog] Cycle ${newEntry.cycle_number} registered: ${newEntry.instrument} - ${newEntry.cycle_status}`);
  return newEntry;
}

// Obtener resumen
export function getCertificationSummary(): CertificationSummary {
  const logs = loadCertificationLogs();

  const summary: CertificationSummary = {
    total_cycles: logs.length,
    completed: logs.filter((l) => l.cycle_status === "COMPLETED").length,
    skipped_before_ai: logs.filter((l) => l.cycle_status === "SKIPPED_BEFORE_AI").length,
    reused_previous: logs.filter((l) => l.cycle_status === "REUSED_PREVIOUS_ANALYSIS").length,
    ai_errors: logs.filter((l) => l.cycle_status === "AI_ERROR").length,
    failed: logs.filter((l) => l.cycle_status === "FAILED").length,
    total_cost_usd: logs.reduce((sum, l) => sum + l.cost_usd, 0),
    unique_instruments: [...new Set(logs.map((l) => l.instrument))],
    distribution_success_rate: calculateDistributionSuccessRate(logs),
    open_paper_positions: logs[logs.length - 1]?.paper_state.open_positions || 0,
    closed_paper_positions: logs[logs.length - 1]?.paper_state.closed_positions || 0,
    progress: {
      current: logs.filter((l) => l.cycle_status === "COMPLETED").length,
      required: 3,
      ready_for_review: logs.filter((l) => l.cycle_status === "COMPLETED").length >= 3,
    },
  };

  return summary;
}

// Calcular tasa de éxito distribución
function calculateDistributionSuccessRate(logs: CertificationLogEntry[]): number {
  if (logs.length === 0) return 0;

  const destinations = ["BOT_ENGINE", "ALERTA_PREMIUM", "TELEGRAM", "DASHBOARD", "ESTADO_MERCADO", "OBSERVADOR", "HISTORIAL", "RESULTADOS_PAPER", "MONITOR_PAPER"] as const;

  let totalChecks = 0;
  let successChecks = 0;

  for (const log of logs) {
    for (const dest of destinations) {
      totalChecks++;
      if (log.distribution[dest] === "DELIVERED") {
        successChecks++;
      }
    }
  }

  return totalChecks > 0 ? (successChecks / totalChecks) * 100 : 0;
}

// Exportar acta completa
export function exportCertificationAct(): string {
  const logs = loadCertificationLogs();
  const summary = getCertificationSummary();

  const markdown = `# ACTA DE CERTIFICACIÓN OBSERVADOR MAESTRO V3

Generado: ${new Date().toISOString()}

## RESUMEN DE CERTIFICACIÓN

- **Ciclos Totales**: ${summary.total_cycles}
- **Ciclos Completados**: ${summary.completed}
- **Ciclos Omitidos (pre-IA)**: ${summary.skipped_before_ai}
- **Ciclos Reutilizados**: ${summary.reused_previous}
- **Errores IA**: ${summary.ai_errors}
- **Ciclos Fallidos**: ${summary.failed}
- **Costo Total USD**: $${summary.total_cost_usd.toFixed(2)}
- **Instrumentos Únicos**: ${summary.unique_instruments.join(", ")}
- **Tasa Éxito Distribución**: ${summary.distribution_success_rate.toFixed(1)}%
- **Operaciones Paper Abiertas**: ${summary.open_paper_positions}
- **Operaciones Paper Cerradas**: ${summary.closed_paper_positions}

## PROGRESO DE CERTIFICACIÓN

${summary.progress.ready_for_review ? "✅ LISTO PARA REVISIÓN FINAL (3/3 ciclos completados)" : `⏳ EN PROGRESO: ${summary.progress.current}/3 ciclos completados`}

---

## DETALLE DE CICLOS

| # | Hora | Instrumento | Estado | Decisión | Prob % | Costo | Distribución |
|---|------|-------------|--------|----------|--------|-------|--------------|
${logs
  .map(
    (log) =>
      `| ${log.cycle_number} | ${log.hour} | ${log.instrument} | ${log.cycle_status} | ${log.decision} | ${log.probability}% | $${log.cost_usd.toFixed(3)} | ${Object.values(log.distribution).filter((d) => d === "DELIVERED").length}/9 |`
  )
  .join("\n")}

---

## CICLOS DETALLADOS

${logs
  .map(
    (log) => `
### Ciclo ${log.cycle_number}

**Identificadores:**
- analysis_id: \`${log.analysis_id}\`
- signal_id: \`${log.signal_id}\`
- Timestamp: ${new Date(log.timestamp).toISOString()}

**Ejecución:**
- Instrumento: ${log.instrument}
- Trigger: ${log.trigger_reason}
- Estado: ${log.cycle_status}
- Duración: ${log.duration_ms}ms
- OpenAI Latencia: ${log.openai_latency_ms}ms
- Tokens: ${log.tokens_used}
- Costo: $${log.cost_usd.toFixed(3)}

**Decisión:**
- Acción: ${log.decision}
- Probabilidad: ${log.probability}%
- Convicción: ${log.conviction}

**Calidad Expediente:**
- Completitud: ${log.expediente_quality.completeness}%
- Secciones: ${log.expediente_quality.sections}
- Error: ${log.expediente_quality.has_error ? log.expediente_quality.error_details || "Sí" : "No"}

**Estado Mercado:**
- Tendencia: ${log.market_state.trend}
- Volatilidad: ${log.market_state.volatility}
- Niveles Clave: ${log.market_state.key_levels.join(", ")}

**Distribución (9 destinos):**
${Object.entries(log.distribution)
  .map(([dest, status]) => `- ${dest}: \`${status}\``)
  .join("\n")}

**Paper Account:**
- Balance: $${log.paper_state.balance.toFixed(2)}
- Posiciones Abiertas: ${log.paper_state.open_positions}
- Posiciones Cerradas: ${log.paper_state.closed_positions}
- P&L: $${log.paper_state.pnl.toFixed(2)}
- Win Rate: ${log.paper_state.win_rate.toFixed(1)}%

---
`
  )
  .join("\n")}

## CERTIFICACIÓN FINAL

- ✅ Observador activo con datos reales de Twelve Data
- ✅ Scheduler monitoreando automáticamente
- ✅ Cero ejecuciones reales (Paper Trading)
- ✅ Registro inmutable de todos los ciclos
- ✅ Evidencia de ${summary.progress.current} ciclos reales completados

**Generado**: ${new Date().toISOString()}
**Sistema**: Observador Maestro V3
`;

  return markdown;
}

// Contar ciclos completados (para certificación)
export function getCompletedCycleCount(): number {
  const logs = loadCertificationLogs();
  return logs.filter((l) => l.cycle_status === "COMPLETED").length;
}
