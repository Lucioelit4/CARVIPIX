# Auditoria Trading Engine - Cadena de Decisiones

Fecha: 2026-07-09
Objetivo: explicar por que el motor compra, vende, espera o rechaza.

## Cadena de decision observada
1. Validacion de calidad de datos (OHLC, spread, latencia, freshness).
2. Safety gates pre-trade (liquidez, volatilidad, noticias, salud de cuenta, correlacion).
3. Evaluacion de contexto multi-timeframe (1H, 45M, 5M).
4. Scoring de 11 agentes.
5. Consenso ponderado con agentes criticos.
6. Reglas de bloqueo y hardening.
7. Generacion de senal o rechazo.
8. Registro de razonamiento, evidencia y evento.

## Reglas explicables clave
- Aprobacion por consenso dinamico y confianza minima: app/engine/core/decisionEngine.ts
- Rechazo critico por agentes clave <40: app/engine/core/decisionEngine.ts
- Bloqueo de ejecucion con SAFE_MODE activo: app/engine/core/intelligenceDirector.ts
- Bloqueos por filtros de riesgo: app/engine/core/safetyGates.ts
- WAIT/NO_TRADE/BUY/SELL por desalineacion o confirmacion: app/engine/core/signalGenerationEngine.ts

## Preguntas de auditoria por decision
- BUY: que condiciones 1H, 45M y 5M estuvieron alineadas y con que score.
- SELL: misma traza, en direccion opuesta.
- WAIT: cual condicion faltante impidio la operacion.
- NO_TRADE: cual veto critico disparo el rechazo.
- INVALIDACION: que regla de estructura/riesgo invalido la oportunidad.

## Gap de explicabilidad institucional
- El motor ya genera razonamiento textual, pero no existe aun una plantilla unica de cadena causal matematica por decision.
- Se recomienda formato canonico por evento:
  - Datos de entrada
  - Indicadores exactos
  - Resultado por agente
  - Resultado por gate
  - Umbral y consenso
  - Decision final

## Estado
- Explicabilidad base: disponible.
- Explicabilidad institucional formal por auditoria externa: pendiente.
