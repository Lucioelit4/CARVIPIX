"use client";

import { useState } from "react";

interface CertificationExportProps {
  isReady: boolean;
  isLoading: boolean;
}

export function CertificationExport({ isReady, isLoading }: CertificationExportProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const response = await fetch("/api/internal/certification-logs/export", {
        method: "GET",
        headers: {
          Authorization: "Bearer admin",
        },
      });

      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `acta-certificacion-v3-${new Date().toISOString().split("T")[0]}.md`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (error) {
      console.error("Export error:", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex gap-4 mb-6">
      <button
        onClick={handleExport}
        disabled={isLoading || isExporting || !isReady}
        className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
          isReady && !isLoading && !isExporting
            ? "bg-blue-600 text-white hover:bg-blue-700"
            : "bg-gray-300 text-gray-500 cursor-not-allowed"
        }`}
      >
        {isExporting ? "Exportando..." : "📥 Exportar Acta de Certificación"}
      </button>

      {exportSuccess && (
        <div className="text-green-600 font-semibold flex items-center gap-2">
          ✅ Descargado exitosamente
        </div>
      )}

      {!isReady && (
        <div className="text-yellow-600 font-semibold flex items-center gap-2">
          ⏳ Esperando 3 ciclos completados...
        </div>
      )}
    </div>
  );
}
