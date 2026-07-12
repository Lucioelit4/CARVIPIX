# CARVIPIX AI DECISION PROTOCOL V1

## Propósito

Este documento congela el protocolo oficial de comunicacion entre CARVIPIX y ChatGPT para la fase de analisis.

No define el Prompt Maestro definitivo.

No define preguntas cerradas.

No limita el razonamiento de ChatGPT.

Su unica funcion es definir con exactitud que expediente recibe el analista principal antes de emitir una decision.

## Filosofia Operativa

- CARVIPIX prepara el expediente.
- ChatGPT analiza el expediente.
- Los validadores de CARVIPIX protegen integridad, formato, riesgo y restricciones tecnicas.
- ChatGPT conserva libertad de criterio dentro de las estrategias autorizadas.
- CARVIPIX no sustituye el analisis.
- ChatGPT no inventa estrategias nuevas.

## Limites de Esta Fase

- No se escribe el Prompt Maestro definitivo.
- No se redacta el mensaje completo a OpenAI.
- No se redactan instrucciones largas para ChatGPT.
- No se modifican reglas operativas.
- No se modifica Risk Engine.
- No se modifican Safety Gates.
- No se habilita ejecucion automatica.
- No se cambia el comportamiento funcional del sistema.

## Expediente Oficial

El expediente que recibe ChatGPT debe ser completo, objetivo, coherente y reproducible.

Debe incluir simultaneamente identidad, datos del mercado, indicadores autorizados, temporalidades separadas, informacion visual y catalogo de estrategias autorizadas.

### 1. Identidad

Campos minimos obligatorios:

- analysis_id
- symbol
- broker_symbol
- timestamp_utc
- strategy_version
- engine_version
- context_version
- schema_version

Campos de apoyo recomendados:

- strategy_id
- horizon
- expected_duration
- analysis_reason

La identidad debe ser unica, trazable y estable.

### 2. Datos del Mercado

El expediente debe transportar datos objetivos y no interpretados.

Debe incluir como minimo:

- provider
- connection_status
- latency_ms
- latest_closed_candle_utc
- gaps
- duplicates
- out_of_order_timestamps
- incomplete_candles
- sync_status
- data_ready
- bid
- ask
- spread
- spread_avg
- spread_vs_atr
- session
- market_open
- volatility_now
- volatility_percentile
- economic_event_relevant
- next_relevant_event_utc

Estos datos son la base objetiva del analisis.

### 3. Indicadores

El expediente debe incluir todos los indicadores autorizados y sus valores exactos.

Cada indicador debe estar claramente identificado por temporalidad y no puede duplicarse de forma ambigua.

Indicadores base actualmente contemplados:

- EMA20
- EMA50
- EMA200
- ATR
- ADX
- estructura direccional
- maxima estructural
- minima estructural
- distancia a zona
- slopes de EMAs

Los indicadores no deben resumirse de manera que pierdan trazabilidad.

### 4. Temporalidades

El expediente debe incluir simultaneamente estas tres temporalidades:

- 1H
- 45M
- 5M

Cada temporalidad debe mantener su propia identidad y su propio bloque.

Nunca deben mezclarse los datos entre temporalidades.

Cada bloque temporal debe poder leerse y auditarse por separado.

#### Temporalidad 1H

Debe representar el contexto estructural principal.

Debe incluir velas, EMAs, estructura, soportes, resistencias y zonas relevantes.

#### Temporalidad 45M

Debe representar el retroceso y la lectura intermedia.

Debe incluir velas, EMAs, estructura y posibles zonas de entrada.

#### Temporalidad 5M

Debe representar confirmacion y microestructura.

Debe incluir velas, EMAs, confirmacion, microestructura y posible disparador.

### 5. Informacion Visual

Cada analisis debe incluir graficos generados automaticamente por CARVIPIX.

La imagen es informacion complementaria.

La informacion numerica sigue siendo la fuente oficial.

Debe existir una representacion visual por temporalidad:

- Grafico H1
- Grafico 45M
- Grafico 5M

Cada grafico debe ser claro, estable y util para apoyo visual.

#### Grafico H1

Debe contener:

- velas
- EMA20
- EMA50
- EMA200
- estructura
- soportes
- resistencias
- zonas relevantes

#### Grafico 45M

Debe contener:

- velas
- EMAs
- retroceso
- estructura
- posibles zonas de entrada

#### Grafico 5M

Debe contener:

- velas
- EMAs
- confirmacion
- microestructura
- posible disparador

### 6. Contexto Organizado

El expediente debe organizarse por bloques y no por narrativa libre.

Debe contener de manera clara:

- estructura
- liquidez
- ATR
- ADX
- EMAs
- maximos
- minimos
- zonas
- sesiones
- spread
- noticias
- volatilidad

### 7. Estrategias Autorizadas

El expediente debe listar unicamente las estrategias actualmente autorizadas.

CARVIPIX no impone una estrategia.

ChatGPT selecciona una estrategia dentro del catalogo oficial.

ChatGPT no puede inventar estrategias nuevas.

La seleccion debe ocurrir solo entre estrategias registradas y autorizadas por CARVIPIX.

## Responsabilidades de ChatGPT

ChatGPT recibira el expediente completo y podra decidir libremente dentro del catalogo autorizado:

- estrategia
- existencia del setup
- compra
- venta
- esperar
- no entrar
- entrada perdida
- entrada exacta
- stop loss
- take profit
- duracion estimada
- explicacion

El protocolo no limita el razonamiento.

El protocolo solo controla el formato y la calidad de lo que se entrega.

## Responsabilidades de CARVIPIX

CARVIPIX es responsable de preparar el expediente y de proteger el sistema.

CARVIPIX debe asegurar:

- integridad de identidad
- coherencia de datos
- separacion de temporalidades
- construccion de graficos
- versionado estable
- catalogo de estrategias autorizado
- limites de riesgo objetivos

CARVIPIX no calcula lotaje para ChatGPT.

CARVIPIX no delega balance.

CARVIPIX no deja que el analisis dependa de datos ambiguos.

## Responsabilidades de los Validadores

Los validadores solo verifican:

- integridad
- formato
- reglas objetivas
- limites de riesgo
- restricciones tecnicas

Nunca reinterpretan el mercado.

Nunca sustituyen la decision de ChatGPT.

Nunca inventan datos.

Nunca corrigen una estrategia.

## Lumen de Riesgo y Stop Loss / Take Profit

Esta fase no fija reglas rigidas de Stop Loss ni Take Profit.

El expediente debe entregar toda la informacion necesaria para que ChatGPT determine:

- el stop loss mas logico
- el take profit mas logico
- la invalidacion tecnica
- la relacion entre estructura y volatilidad

La decision final sobre estos niveles pertenece al analisis de ChatGPT.

## Formato Oficial del Expediente

El expediente oficial debe quedar estructurado como bloques estables:

1. Identity
2. Market Data
3. Indicators
4. Timeframes
5. Visual Context
6. Strategy Catalog
7. Risk and Technical Constraints
8. Validation Metadata

Cada bloque debe ser auditado de forma independiente.

## Estrategias Autorizadas Vigentes

El catalogo actual debe alinearse con el registro oficial del sistema.

Estrategias actualmente autorizadas:

- CARVIPIX_TREND_PULLBACK_SHORT_V1
- CARVIPIX_TREND_PULLBACK_MEDIUM_V1
- CARVIPIX_TREND_PULLBACK_LONG_V1
- CARVIPIX_TREND_PULLBACK_VERY_LONG_V1
- CARVIPIX_VOLATILITY_BREAKOUT_SHORT_V1
- CARVIPIX_VOLATILITY_BREAKOUT_MEDIUM_V1
- CARVIPIX_NO_TRADE_V1

## Resultado Esperado de Esta Fase

Al finalizar esta fase, CARVIPIX debe tener congelado el protocolo de comunicacion completo con ChatGPT.

La siguiente fase construira el Prompt Maestro usando este protocolo aprobado.
