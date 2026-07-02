// Servicio para Resultados (agregador de métricas)

import { PlatformResults, ResultsHistory } from "./types";
import { getDemoPlatformResults, getDemoResultsHistory } from "./demo-data";

export class ResultsService {
  private isDemoMode = true;

  // Obtener resultados actuales de la plataforma
  async getPlatformResults(period: "monthly" | "yearly" | "all-time" = "monthly"): Promise<PlatformResults> {
    if (this.isDemoMode) {
      return getDemoPlatformResults();
    }

    // FUTURE: Agregar métricas reales de:
    // - Servicio de alertas
    // - Servicio de bot
    // - Servicio de capital
    // - Servicio de fondeo
    // const results = await Promise.all([
    //   alertsService.getMetrics(period),
    //   botService.getMetrics(period),
    //   capitalService.getMetrics(period),
    //   fondeoService.getMetrics(period)
    // ]);

    throw new Error("API no conectada todavía");
  }

  // Obtener histórico de resultados
  async getResultsHistory(months: number = 12): Promise<ResultsHistory[]> {
    if (this.isDemoMode) {
      return getDemoResultsHistory().slice(0, months);
    }

    // FUTURE: Obtener desde base de datos
    throw new Error("API no conectada todavía");
  }

  // Obtener métricas por fuente específica
  async getMetricsBySource(source: "alertas" | "bot" | "capital" | "fondeo"): Promise<any> {
    const results = await this.getPlatformResults("monthly");

    return results.bySource[source];
  }

  // Generar reporte de resultados
  async generateResultsReport(period: "monthly" | "yearly" | "all-time"): Promise<{
    titulo: string;
    fecha: Date;
    contenido: PlatformResults;
  }> {
    const results = await this.getPlatformResults(period);

    return {
      titulo: `Reporte de Resultados ${period === "monthly" ? "Mensual" : period === "yearly" ? "Anual" : "Histórico"}`,
      fecha: new Date(),
      contenido: results,
    };
  }

  setDemoMode(isDemoMode: boolean) {
    this.isDemoMode = isDemoMode;
  }
}

export const resultsService = new ResultsService();
