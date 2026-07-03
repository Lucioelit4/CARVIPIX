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
 */
async function listDatasets() {
  try {
    const dataDir = path.join(process.cwd(), 'data', 'market-history');

    if (!fs.existsSync(dataDir)) {
      return NextResponse.json({ files: [] });
    }

    const files = fs.readdirSync(dataDir);
    const datasets = files
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

    return NextResponse.json({ files: datasets });
  } catch (error) {
    console.error('Error listing datasets:', error);
    return NextResponse.json({ error: 'Failed to list datasets' }, { status: 500 });
  }
}
