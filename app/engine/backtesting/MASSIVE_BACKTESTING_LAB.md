# Massive Backtesting Lab

Laboratorio para ejecutar backtesting masivo en paralelo con todos los anios historicos disponibles.

## Objetivo

- Ejecutar backtesting por anio, activo y timeframe de forma paralela.
- Aprovechar CPU local con workers configurables.
- Generar estadisticas completas para comparativa historica.
- Dejar base lista para futuras optimizaciones y entrenamiento de agentes locales.
- No optimiza estrategias en esta fase.

## API

### 1) Inventario de datasets y plan recomendado

GET /api/backtesting/massive?action=plan

Respuesta:
- inventory.files
- inventory.availableYears
- inventory.availableAssets
- inventory.cpuCores
- inventory.suggestedWorkers

### 2) Ejecutar laboratorio masivo

POST /api/backtesting/massive

Body JSON:

{
  "initialBalance": 10000,
  "riskPerTrade": 1,
  "consensusThreshold": 7,
  "maxDrawdown": 50,
  "minWinRate": 40,
  "maxWorkers": 6,
  "includeMonteCarlo": true,
  "includeWalkForward": true,
  "years": ["2025", "2026"],
  "assets": ["XAUUSD"],
  "timeframes": ["5M", "45M", "1H"]
}

Campos opcionales:
- years: si se omite, usa todos los anios disponibles.
- assets: si se omite, usa todos los activos detectados en datasets.
- timeframes: si se omite, usa 5M, 45M y 1H.
- includeMonteCarlo / includeWalkForward: por defecto true.

Respuesta principal:
- result.jobs[]: detalle por job (anio-activo-timeframe)
- result.summary: estadisticas agregadas completas
- result.summary.dataCoverage: cobertura por anio

### 3) Ejecucion rapida por query params (interna)

PATCH /api/backtesting/massive?workers=6&years=2025,2026&assets=XAUUSD&timeframes=5M,45M,1H

## Notas operativas

- Los datasets se detectan automaticamente en:
  - data/market-history
  - public/datasets
- Se parsean formatos HistData comunes (CSV con comas y formato REAL con punto y coma).
- El sistema agrupa por anio y re-muestrea a 5M/45M/1H para ejecutar el engine.
- Minimo por job: 150 velas limpias.
