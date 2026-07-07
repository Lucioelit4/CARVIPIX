// Servicio para Resultados (agregador de métricas)

import { PlatformResults, ResultsHistory, ResultsBySource } from "./types";
import { ecosystemServices } from "@/app/backend";

export class ResultsService {
  // Obtener resultados actuales de la plataforma
  async getPlatformResults(period: "monthly" | "yearly" | "all-time" = "monthly"): Promise<PlatformResults> {
    return ecosystemServices.results.getPlatformResults(period);
  }

  // Obtener histórico de resultados
  async getResultsHistory(months: number = 12): Promise<ResultsHistory[]> {
    return ecosystemServices.results.getHistory(months);
  }

  // Obtener métricas por fuente específica
  async getMetricsBySource(source: "alertas" | "bot" | "capital" | "fondeo"): Promise<ResultsBySource[keyof ResultsBySource]> {
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

  setDemoMode(_isDemoMode: boolean) {
    void _isDemoMode;
    // No-op: la fuente de datos oficial es Backend Enterprise.
  }
}

export const resultsService = new ResultsService();
