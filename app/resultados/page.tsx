"use client";

import { useEffect, useState } from "react";
import { getGlobalResults, getResultsHistory, getPlatformResults, type GlobalResultsSnapshot } from "@/app/lib/client-data-helpers";
import type { PlatformResults, ResultsHistory } from "@/app/lib/modules/results/types";
import DataSourceBanner from "@/app/components/DataSourceBanner";
import ResultsPremiumView from "./ResultsPremiumView";

export default function ResultadosPage() {
  const [, setMonthlyData] = useState<Array<{ month: string; value: number }>>([]);
  const [, setPlatformResults] = useState<PlatformResults | null>(null);
  const [globalResults, setGlobalResults] = useState<GlobalResultsSnapshot | null>(null);

  useEffect(() => {
    const loadResultsData = async () => {
      try {
        const [history, currentResults, centralResults] = await Promise.all([
          getResultsHistory(12),
          getPlatformResults("monthly"),
          getGlobalResults(),
        ]);

        setPlatformResults(currentResults);
        setGlobalResults(centralResults);

        if (history && history.length > 0) {
          const transformedData = history.map((item: ResultsHistory, index: number) => {
            const monthName = (item.month ?? "").toString();
            const metricValue = Number(item.metrics?.alertas?.totalTrades ?? 0) + Number(item.metrics?.bot?.totalTrades ?? 0);

            return {
              month: monthName.substring(0, 3) || `${index + 1}`,
              value: metricValue,
            };
          });

          setMonthlyData(transformedData);
        }
      } catch {
        setMonthlyData([]);
        setPlatformResults(null);
        setGlobalResults(null);
      }
    };

    void loadResultsData();
  }, []);

  return (
    <main className="min-h-screen bg-[#030303] text-white">
      <div className="cv-workspace max-w-7xl pt-6">
        <DataSourceBanner />
      </div>
      <ResultsPremiumView results={globalResults} />
    </main>
  );
}