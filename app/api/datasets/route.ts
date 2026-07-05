/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// GET /api/datasets?action=list  or  /api/datasets?action=load&file=...
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action') || 'list';

  if (action === 'list') {
    return listDatasets();
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}

/**
 * Listar todos los archivos HistData disponibles - SOLO METADATOS
 * Busca en data/market-history/ y public/datasets/
 */
async function listDatasets() {
  try {
    const datasets: any[] = [];

    // Búsqueda en ambas carpetas
    const searchDirs = [
      path.join(process.cwd(), 'data', 'market-history'),
      path.join(process.cwd(), 'public', 'datasets'),
    ];

    for (const dataDir of searchDirs) {
      if (!fs.existsSync(dataDir)) {
        continue;
      }

      const files = fs.readdirSync(dataDir);
      const dirDatasets = files
        .filter((f) => f.startsWith('DAT_ASCII_XAUUSD_M1_') && f.endsWith('.csv'))
        .map((f) => {
          // Extraer mes y año: DAT_ASCII_XAUUSD_M1_2025.csv -> 2025
          // DAT_ASCII_XAUUSD_M1_202606.csv -> 202606
          const match = f.match(/DAT_ASCII_XAUUSD_M1_(\d+)\.csv/);
          if (!match) return null;

          const dateStr = match[1];
          let month: string, year: string;

          if (dateStr.length === 4) {
            // YYYY format - año completo (full year)
            year = dateStr;
            month = 'all'; // Todos los meses del año
          } else if (dateStr.length === 6) {
            // YYYYMM format
            year = dateStr.substring(0, 4);
            month = dateStr.substring(4, 6);
          } else {
            return null;
          }

          const filePath = path.join(dataDir, f);
          const stat = fs.statSync(filePath);

          return {
            name: f,
            path: filePath,
            month,
            year,
            size: stat.size,
          };
        })
        .filter((f) => f !== null);

      datasets.push(...dirDatasets);
    }

    // Deduplicar por nombre (si existe en ambas carpetas, tomar la primera)
    const seen = new Set<string>();
    const uniqueDatasets = datasets.filter((d) => {
      if (seen.has(d.name)) {
        return false;
      }
      seen.add(d.name);
      return true;
    });

    return NextResponse.json({ files: uniqueDatasets });
  } catch (error) {
    console.error('Error listing datasets:', error);
    return NextResponse.json({ error: 'Failed to list datasets' }, { status: 500 });
  }
}

