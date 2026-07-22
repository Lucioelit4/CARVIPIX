# Bloqueo exacto: backtest historico Maestro V3

Fecha: 2026-07-21

Estado: **BLOQUEADO. No ejecutar, sembrar ni publicar resultados.**

## Conclusion

Maestro V3 actual es un flujo de observacion en vivo. No existe un adaptador de replay historico que permita ejecutar cuatro meses de forma reproducible y sin efectos laterales. Construirlo exige modificar arquitectura congelada; por instruccion expresa, no se improviso ni se uso el motor legacy.

## Evidencia del bloqueo

1. **No hay reloj historico inyectable de extremo a extremo.**
   - `snapshotBuilderV3.ts` acepta `nowUtc`, pero `ShadowFlowV3.analyzeInstrument()` no lo recibe ni lo propaga.
   - IDs, memoria, expiraciones, latencia y cierres usan `Date.now()` y `new Date()` del tiempo real.
   - `paperTradeMonitor.ts` genera IDs con `Date.now()` y `Math.random()`, abre y expira operaciones con reloj de pared y no acepta timestamp de replay.

2. **El flujo Maestro V3 produce efectos laterales productivos.**
   - Una decision ENTER guarda Senal Maestra.
   - Actualiza memoria de escenarios, idempotencia, scheduler, monitor paper, observer y analysis store.
   - Ejecuta el dispatcher y puede enviar Telegram.
   - No existe modo `HISTORICAL_REPLAY` que aisle esos destinos.

3. **La ingestion existente no reproduce un periodo.**
   - `realDataIngestionService.ts` solicita solo ventanas recientes por `outputsize` y no recibe inicio/fin del backtest.
   - El pipeline conserva 500 velas por serie por defecto; cuatro meses de M5 requieren decenas de miles.
   - No existe caminata cronologica que alimente H1/M30/M5 sin anticipar datos futuros.

4. **Faltan costos historicos verificables.**
   - Twelve Data entrega OHLCV, no bid/ask historico broker-verificado en este adaptador.
   - Maestro V3 marca `spread_available=false`, `spread_source=NOT_AVAILABLE` y `paper_mode_note=NOT_BROKER_VERIFIED`.
   - El monitor paper no aplica spread, comision ni deslizamiento y declara que el P&L es simplificado sin lotaje broker.
   - Por tanto no se pueden registrar spread, comision y deslizamiento reales como exige la orden.

5. **La resolucion de operaciones no es un simulador historico.**
   - `paperTradeMonitor.tick()` recibe un precio puntual actual, no una vela historica ni ticks bid/ask.
   - No resuelve secuencia intravela cuando TP y SL quedan dentro de la misma vela.
   - El drawdown se calcula contra el balance inicial, no contra el pico de equity del replay.

6. **La decision AI no es reproducible.**
   - Cada paso llama OpenAI en vivo con `reasoning.effort=medium`.
   - No existe seed, cassette de respuestas congelado ni identificador inmutable de revision del modelo.
   - La version de prompt registrada es `CARVIPIX_MASTER_ANALYST_PROMPT_V1_DRAFT` y la estrategia se selecciona dinamicamente entre estrategias autorizadas.
   - Repetir los mismos datos no garantiza las mismas decisiones ni operaciones.

## Cambios arquitectonicos minimos requeridos para desbloquear

- Contexto de replay con reloj inyectable en ShadowFlow, memoria, scheduler y monitor paper.
- Modo sin efectos laterales que bloquee Senal Maestra, dispatcher, Telegram y stores productivos.
- Lector historico paginado H1/M30/M5 con hash del dataset y caminata sin look-ahead.
- Fuente broker historica de bid/ask, comisiones y reglas de deslizamiento versionadas.
- Simulador de ejecucion intravela/tick con politica determinista para TP/SL simultaneos.
- Contrato reproducible para decisiones AI: respuestas congeladas y hasheadas, o motor determinista aprobado.
- Version inmutable de estrategia, prompt, modelo, parametros y universo de activos.

Estos cambios afectan Cerebro/estrategia/ejecucion y requieren aprobacion arquitectonica previa.

## Decisiones de seguridad

- No se ejecuto el motor legacy.
- No se generaron operaciones, TP, SL, pips, win rate ni drawdown ficticios.
- No se aplico el esquema a produccion.
- No se sembraron los 60 perfiles ni los 24 perfiles Bot.
- No se desplego la rama y `HISTORICAL_BACKTEST_RESULTS_ENABLED` permanece desactivado.