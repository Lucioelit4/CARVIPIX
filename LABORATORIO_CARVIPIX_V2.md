# LABORATORIO CARVIPIX V2

Estado: Documento de auditoria y diseno (sin programacion)
Alcance: Solo laboratorio de pruebas. Sin cambios en UI, motor, APIs, pagina, admin.
Fecha: 2026-07-03

---

## 1) Auditoria del sistema actual de Backtesting

### 1.1 Inventario real detectado

El sistema actual SI tiene modulo de backtesting operativo en entorno privado (admin), con estos bloques:

- Motor de backtest: app/engine/backtesting/backtestEngine.ts
- Ejecucion demo: app/engine/backtesting/runBacktest.ts
- Datos historicos: app/engine/backtesting/historicalData.ts
- Importador CSV y archivos grandes: csvImporter.ts, largeFileImporter.ts
- Monte Carlo: app/engine/backtesting/monteCarlo.ts
- Walk Forward: app/engine/backtesting/walkForward.ts
- Optimizador de parametros: app/engine/backtesting/optimizer/
- Integracion de uso: app/admin/components/BacktestExecutor.tsx

### 1.2 Hallazgos clave (tecnicos y metodologicos)

1. El flujo actual es principalmente DEMO, no laboratorio cuantitativo institucional.
2. Parte central del motor usa componentes aleatorios (Math.random) para indicadores, noticias, aprendizaje y scoring.
3. El cargador de historicos por defecto retorna datos simulados aun cuando no se pida demo.
4. La logica de ejecucion es simplificada: una sola operacion activa a la vez.
5. No hay modelado completo de costos reales: comision, spread dinamico, swap, latencia, impacto de mercado, deslizamiento realista por sesion.
6. Walk Forward existe, pero no implementa ciclo profesional de optimizacion en train + congelacion + validacion OOS real; hoy ejecuta train/test con misma logica sin recalibracion explicita.
7. Monte Carlo existe, pero su modo preserveSequence no re-muestrea secuencia (copia simple), limitando valor estadistico.
8. Metricas importantes se calculan con simplificaciones fuertes (ejemplo: consensusApprovalRate fijo en 95).
9. No se detecta suite formal de tests automatizados de robustez de laboratorio.
10. Estrategia oficial documentada sigue con reglas criticas en estado PENDING (v1.1), lo cual impide validacion seria end-to-end.

### 1.3 Riesgos concretos de validez

- Riesgo de sobreestimar performance por datos simulados y componentes aleatorios.
- Riesgo de falsa estabilidad por ausencia de costos y fricciones de mercado completas.
- Riesgo de sobreajuste no controlado por pipeline WFO incompleto.
- Riesgo de sesgo de implementacion por reglas de estrategia todavia no cerradas.

---

## 2) Analisis: sirve para validar estrategias reales?

Respuesta directa: sirve para prototipado interno y pruebas visuales; NO sirve aun como validador profesional de estrategias reales con criterio de despliegue.

### 2.1 Nivel de madurez actual (escala laboratorio cuant)

- Infraestructura base: 7/10
- Calidad de datos para research institucional: 4/10
- Realismo de ejecucion: 3/10
- Validez estadistica: 4/10
- Robustez anti-sobreajuste: 3/10
- Reporting profesional para decision de capital: 4/10

Promedio operativo aproximado: 4.2/10

### 2.2 Conclusiones de aptitud

- Apto para:
  - exploracion de ideas
  - pruebas de interfaces privadas
  - chequeos tecnicos iniciales
- No apto aun para:
  - aprobacion de estrategia para dinero real
  - comparativa cuantitativa robusta entre versiones
  - auditoria de riesgo institucional

---

## 3) Flujo profesional de pruebas (Laboratorio V2)

Objetivo: pasar de backtest demo a pipeline cuantitativo reproducible, auditable y antifraude estadistico.

### 3.1 Pipeline maestro (stage-gate)

1. Definicion de estrategia congelada
- Versionado de reglas (sin reglas ambiguas/PENDING)
- Hipotesis explicita
- Universo de activos y sesiones definido

2. Data Intake y Data QA
- Ingestion bruta
- Validacion de integridad
- Normalizacion de zona horaria y calendario
- Deteccion de gaps/outliers/duplicados
- Puntaje de calidad por dataset

3. Simulacion base deterministica
- Ejecucion candle-by-candle reproducible
- Logging completo por trade y por decision
- Costos realistas configurables

4. Validacion estadistica principal
- In-Sample (IS)
- Out-of-Sample (OOS)
- Walk Forward completo
- Monte Carlo avanzado

5. Pruebas de robustez
- Stress de costos, latencia, spread
- Sensibilidad de parametros
- Subperiodos y subregimenes

6. Decision gate de produccion
- Aceptar, iterar o descartar
- Informe ejecutivo + informe tecnico
- Trazabilidad total

### 3.2 Criterios de aprobacion sugeridos

- Muestra minima por setup: >= 300 trades (ideal >= 500)
- Profit Factor OOS >= 1.25
- Max Drawdown OOS <= umbral de riesgo del programa
- Estabilidad por subperiodo: sin colapso estructural
- Sin evidencia de sobreajuste severo en WFO + MC + robustez

---

## 4) Diseno del sistema de Monte Carlo (V2)

### 4.1 Objetivo

Medir distribucion de resultados posibles y riesgo de ruina bajo incertidumbre realista.

### 4.2 Tipos de Monte Carlo requeridos

1. Trade Resampling Bootstrap
- Muestreo con reemplazo sobre secuencia de trades
- Preserva distribuciones de P/L, rachas y dependencia parcial

2. Block Bootstrap (por regimen)
- Re-muestreo por bloques temporales para preservar autocorrelacion
- Bloques por sesion/regimen de volatilidad

3. Path Perturbation
- Perturbar ejecucion: spread, slippage, fill delay, comision
- Simular degradacion de edge operativa

4. Parameter Perturbation
- Alterar parametros en banda pequena (ejemplo +/-5 a +/-15%)
- Medir fragilidad del setup

5. Regime-Conditioned Monte Carlo
- Simular mezcla distinta de regmenes (trend/range/high vol)
- Evaluar dependencia del edge al contexto

### 4.3 Salidas obligatorias

- Distribucion de equity final
- Distribucion de max drawdown
- Probabilidad de perdida mensual/trimestral
- Value at Risk (VaR) y Conditional VaR (CVaR)
- Probabilidad de superar umbral de capital minimo
- Probabilidad de ruina

### 4.4 Reglas de calidad Monte Carlo

- Minimo iteraciones: 5,000 (ideal 10,000)
- Reproducibilidad con seed controlada
- Reporte de convergencia de percentiles

---

## 5) Diseno de Walk Forward profesional (V2)

### 5.1 Objetivo

Validar capacidad de generalizacion temporal y detectar sobreajuste real.

### 5.2 Arquitectura WFO propuesta

Dos modos:

1. Anchored WFO
- Train crece en el tiempo
- Test fijo por ventana

2. Rolling WFO
- Train y test se desplazan con ventana movil
- Mejor para cambios de regimen

### 5.3 Protocolo por ventana

1. Optimizar SOLO en IS (train)
2. Congelar parametros ganadores
3. Ejecutar OOS (test) sin retocar
4. Registrar degradacion y estabilidad
5. Repetir ventana siguiente

### 5.4 Metricas WFO clave

- WFE (Walk Forward Efficiency)
- Degradacion IS->OOS
- Consistencia de win rate y drawdown
- Estabilidad del ranking de parametros
- Porcentaje de ventanas saludables

### 5.5 Semaforo de sobreajuste

- Verde: OOS robusto, degradacion controlada
- Amarillo: edge sensible, requiere ajustes
- Rojo: edge no generaliza, descartar

---

## 6) Diseno de pruebas de Robustez (V2)

### 6.1 Matriz de stress minima

1. Cost Stress
- Comision x1.0, x1.5, x2.0
- Spread p50, p75, p90
- Slippage normal y extremo (noticias)

2. Execution Stress
- Delay de entrada/salida (ms y velas)
- Fill parcial
- Requotes simulados

3. Data Stress
- Gaps aleatorios
- Velas faltantes
- Outliers de precio/volumen
- Latencia de feed

4. Regime Stress
- Segmentos trend fuerte
- Segmentos rango prolongado
- Alta volatilidad
- Baja liquidez

5. Parameter Stability
- Analisis local de sensibilidad
- Superficie de estabilidad (plateau vs pico fragil)

### 6.2 Criterio robusto

La estrategia debe mantenerse rentable o aceptable en mayoria de escenarios adversos, sin depender de un solo entorno benigno.

---

## 7) Diseno de estadisticas avanzadas (V2)

### 7.1 Bloque de performance

- CAGR
- MAR Ratio
- Calmar Ratio
- Expectancy por trade
- Edge Ratio
- Profit Factor por regimen y por sesion

### 7.2 Bloque de riesgo

- Max DD, Avg DD, DD Duration
- Ulcer Index
- Tail Ratio
- VaR/CVaR por horizonte
- Risk of Ruin

### 7.3 Bloque de estabilidad

- Rolling Sharpe/Sortino
- Drift de parametros
- Autocorrelacion de retornos
- Dependencia de pocas operaciones (concentration risk)

### 7.4 Bloque de calidad de ejecucion

- Slippage medio y percentiles
- Fill quality
- Costo total por trade (all-in)
- Degradacion de PnL bruto a neto

---

## 8) Diseno de reportes profesionales (V2)

### 8.1 Reporte Ejecutivo (1 pagina)

- Veredicto: aprobar / iterar / rechazar
- KPI principales OOS
- Riesgos mayores
- Condiciones para siguiente gate

### 8.2 Reporte Tecnico (completo)

1. Tesis de estrategia y version
2. Dataset y calidad
3. Metodologia de simulacion
4. Resultados IS/OOS/WFO/MC
5. Robustez y sensibilidad
6. Riesgo operativo y de mercado
7. Recomendacion final con evidencia

### 8.3 Anexos obligatorios

- Bitacora de configuraciones
- Semillas usadas
- Parametros por corrida
- Tabla de trades
- Evidencia de reproducibilidad

---

## 9) Diseno de estructura para importar historicos (V2)

Objetivo: ingestion escalable, limpia y auditable para research y validacion.

### 9.1 Arquitectura por capas

1. RAW (Bronze)
- Archivo original intacto
- Metadata de origen y checksum

2. CLEAN (Silver)
- Normalizado (timezone, formato, schema)
- Calidad validada (gaps, duplicados, outliers)

3. RESEARCH (Gold)
- Dataset listo para backtest
- Versionado y etiquetado por activo/timeframe/regimen

### 9.2 Contrato de datos minimo

Campos obligatorios:
- timestamp_utc
- symbol
- timeframe
- open, high, low, close
- volume

Campos recomendados:
- spread
- bid/ask
- session
- source_id
- quality_flags

### 9.3 Validaciones obligatorias de import

- Esquema y tipos
- Orden temporal estricto
- Duplicados
- Gaps por calendario esperado
- Integridad OHLC
- Rango de precios razonable
- Reporte de calidad con score final

### 9.4 Politica de versionado

- dataset_id inmutable
- semantic version para transformaciones
- trazabilidad completa de cambios

---

## 10) Plan de adopcion del Laboratorio V2 (sin programar aun)

Fase A - Cierre metodologico
- Congelar reglas estrategia v1.1 sin pendientes
- Definir criterios de aprobacion oficiales

Fase B - Estandar de datos
- Definir contrato de datos y quality gates
- Definir catalogo de datasets certificables

Fase C - Estandar estadistico
- Definir set final de metricas y umbrales
- Definir protocolo WFO + MC + Robustez

Fase D - Gobernanza
- Definir plantillas de reporte
- Definir proceso formal de decision de release

---

## 11) Veredicto del Director del Laboratorio

CARVIPIX ya tiene una base funcional util para pruebas internas, pero todavia no cumple el estandar de laboratorio profesional para validar estrategias reales.

La prioridad no es agregar mas features aisladas. La prioridad es cerrar metodologia:
- datos certificados
- simulacion realista
- validacion OOS/WFO/MC robusta
- reporting de decision institucional

Con este documento, queda definido el blueprint de LABORATORIO CARVIPIX V2.

Fin.
