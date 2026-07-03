import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { parseHistDataRealLine, validateSingleCandle } from '@/app/engine/backtesting/csvImporter';
import { Candle } from '@/app/engine/types/marketData';

// GET /api/datasets?action=list  or  /api/datasets?action=load&file=...
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action') || 'list';

  if (action === 'list') {
    return listDatasets();
  } else if (action === 'load') {
    const file = searchParams.get('file');
    if (!file) {
      return NextResponse.json({ error: 'File parameter required' }, { status: 400 });
    }
    return loadDataset(file);
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}

/**
 * Listar todos los archivos HistData disponibles
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

        return {
          name: f,
          path: path.join(dataDir, f),
          month,
          year,
        };
      })
      .filter((f) => f !== null);

    return NextResponse.json({ files: datasets });
  } catch (error) {
    console.error('Error listing datasets:', error);
    return NextResponse.json({ error: 'Failed to list datasets' }, { status: 500 });
  }
}

/**
 * Cargar un dataset específico
 */
async function loadDataset(filePath: string) {
  try {
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Leer archivo línea por línea
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.trim().split('\n');

    const candles: Candle[] = [];
    let duplicates = 0;

    for (let i = 0; i < lines.length; i++) {
      try {
        const candle = parseHistDataRealLine(lines[i], 'XAUUSD', '5M');
        const validation = validateSingleCandle(candle);

        if (validation.valid) {
          candles.push(candle);
        }
      } catch (e) {
        // Ignorar líneas malformadas
        console.warn(`Skipping malformed line ${i + 1}`);
      }
    }

    return NextResponse.json({
      candles,
      duplicates: duplicates,
      count: candles.length,
    });
  } catch (error) {
    console.error('Error loading dataset:', error);
    return NextResponse.json({ error: 'Failed to load dataset' }, { status: 500 });
  }
}
