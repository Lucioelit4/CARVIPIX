# CARVIPIX - Ingenieria Inversa del Cerebro (Definitivo)

Fecha: 2026-07-19
Modo: Solo documentacion, sin cambios funcionales

## 1) Pregunta real a ChatGPT (exacta)

### 1.1 Prompt del sistema (exacto)
Origen: [app/ai/cadpV2/openAIAdapterV2.ts](app/ai/cadpV2/openAIAdapterV2.ts#L156)

Texto exacto:
Generate only the JSON response that satisfies the provided schema.

### 1.2 Prompt del usuario (exacto)
Origen de ensamblado: [app/ai/cadpV2/promptBuilderV3.ts](app/ai/cadpV2/promptBuilderV3.ts#L146)

El prompt de usuario es todo el campo prompt_text construido por MaestroV3PromptBuilder, compuesto por:
1. Encabezado del Expediente Maestro V3
2. 16 secciones del expediente
3. Esquema JSON oficial de respuesta
4. Pregunta Maestra

### 1.3 Pregunta Maestra completa (exacta)
Origen: [app/ai/cadpV2/promptBuilderV3.ts](app/ai/cadpV2/promptBuilderV3.ts#L89)

Eres el Analista Principal de CARVIPIX. Analiza exclusivamente el instrumento incluido en este expediente.

Cada afirmacion debe basarse en la informacion comprobada proporcionada. Nunca inventes datos, precios, noticias ni niveles que no esten en el expediente.

Usa conjuntamente:
- Contexto actual + delta desde analisis anterior
- Mercado general (H1) 
- Estructura intermedia (M30)
- Gatillo (M5)
- Coherencia multi-temporalidad
- Volatilidad, liquidez, sesion
- Noticias y riesgos
- Validez temporal del escenario
- Resumen ejecutivo

Integra todo esto como UN UNICO analisis coherente. No evalues cada elemento por separado.

Tu pregunta: Existe una entrada valida AHORA? El escenario se aproxima? Continua desarrollandose? Debe rechazarse?

Si existe entrada: Entrega una senal vigente, defendible y completa.
Si falta una condicion: Indica exactamente cual.
Si el escenario es invalido o datos insuficientes: Rechazalo claramente.

Explica brevemente que factores fueron decisivos, cual es el riesgo principal y que tendria que cambiar para modificar tu decision.

probability_estimated representa tu evaluacion analitica de que tan solida es la confluencia de factores observados. No es una garantia de resultado. Basa el numero en la evidencia del expediente, no en tu entrenamiento previo de otros mercados.

Responde UNICAMENTE en el formato JSON solicitado por CARVIPIX. No incluyas texto fuera del esquema.

### 1.4 Expediente completo enviado a ChatGPT (palabra por palabra)

Ejemplo real XAUUSD completo:
[prompt-xauusd-full.txt](docs/brain-reverse-engineering/prompt-xauusd-full.txt)

Ejemplo real BTCUSD completo:
[prompt-btcusd-full.txt](docs/brain-reverse-engineering/prompt-btcusd-full.txt)

Metadatos exactos de ambos prompts (hash, cache key, token estimate):
[prompt-metadata.json](docs/brain-reverse-engineering/prompt-metadata.json)

## 2) Estamos aprovechando razonamiento o solo llenando JSON?

Fuente de medicion reproducible:
[prompt-composition-metrics.json](docs/brain-reverse-engineering/prompt-composition-metrics.json)

Metodo usado (deterministico):
- data = todo el bloque antes de Esquema JSON oficial
- rules = bloque del schema JSON
- instructions = parte directiva de Pregunta Maestra
- reasoning_incentive = parte de Pregunta Maestra que exige integracion/juicio causal

### 2.1 Resultado cuantitativo

XAUUSD:
- Datos: 88.96%
- Reglas: 7.66%
- Instrucciones: 1.51%
- Incentivo explicito a razonar: 1.87%

BTCUSD:
- Datos: 88.72%
- Reglas: 7.82%
- Instrucciones: 1.54%
- Incentivo explicito a razonar: 1.91%

Conclusion tecnica:
- El sistema esta muy cargado a datos y estructura.
- Si hay riesgo de modo rellenar JSON cuando la evidencia no trae conflicto o tension analitica.
- Si existe estimulo de razonamiento (Pregunta Maestra), pero proporcionalmente es pequeno frente al peso de payload factual + schema.

### 2.2 Que sobra
- Repeticion alta de velas crudas en varias temporalidades puede saturar contexto sin aumentar señal informativa marginal.
- Algunos campos administrativos/metadatos en expediente agregan volumen y no siempre agregan capacidad inferencial.

### 2.3 Que falta
- Priorizacion explicita de evidencias criticas (top-k) antes de entrar al modelo.
- Marcadores de contradiccion estructural fuertes (ejemplo: H1 alcista vs M5 ruptura bajista reciente con peso formal).
- Retroalimentacion historica de rendimiento por patron directamente en el prompt analitico.

### 2.4 Que enriqueceria el analisis
- Ranking de evidencias por impacto esperado en decision.
- Historial de calibracion de probability_estimated por tipo de escenario.
- Firma de calidad por bloque con impacto estimado (alto/medio/bajo) para forzar enfoque selectivo.

### 2.5 Que hoy desperdicia capacidad de razonamiento
- Volumen de datos de bajo valor marginal sin compresion semantica previa.
- Ausencia de una capa explicita de conflictos priorizados que obligue arbitraje de hipotesis.

## 3) Como piensa el Scheduler (tabla completa A-J)

Motor scheduler:
[schedulerAdaptativo.ts](app/ai/cadpV2/schedulerAdaptativo.ts)
Integracion:
[shadowFlowV3.ts](app/ai/cadpV2/shadowFlowV3.ts#L296)
[observerRunner.ts](app/ai/cadpV2/observerRunner.ts#L178)

Regla base actual:
- La frecuencia la dicta adaptive_state.recheck_minutes (valores permitidos: 5, 10, 15, 30, 60)
- El ticker revisa cada 60s y dispara cuando next_review_at_ms esta vencido
- Se guardan wake_up_triggers, pero en la ruta activa actual solo se usa plenamente el scheduling temporal; el despertar por eventos externos esta parcial

Casos solicitados:

A) NO HAY MERCADO
- Que ocurre: snapshot puede marcar skip_before_ai segun calidad/frescura.
- Cuando vuelve: segun recheck existente o proximo ciclo due.
- Por que: scheduler no decide mercado, solo respeta next_review_at_ms.

B) ESPERAR
- Cuando vuelve: lo que devuelva ChatGPT en adaptive_state.recheck_minutes.
- Que lo despierta: en activo, principalmente vencimiento temporal; triggers declarados quedan registrados.

C) ENTRADA CERCANA
- Cada cuanto: tipicamente 10 o 5 min segun respuesta del modelo.
- Soporte: proximity_to_entry y recheck_minutes retornados por modelo.

D) OPERACION ACTIVA
- Frecuencia: el scheduler sigue por recheck_minutes; el monitoreo paper corre cada 30s en observerRunner.

E) ENTRADA PERDIDA
- Que hace: depende de respuesta adaptive_state (normalmente WAIT/FAR y recheck mayor).
- No hay rama hardcode exclusiva entrada perdida dentro de scheduler.

F) ERROR OPENAI
- Que hace: ShadowFlowV3 incrementa errores consecutivos y abre circuit breaker tras 5 errores; cooldown 5 min.
- Recuperacion: al vencer cooldown, permite reintento.

G) NOTICIA IMPORTANTE
- Cambio esperado: puede venir como trigger_reason NEW_HIGH_IMPACT_NEWS_DETECTED y/o wake_up_triggers desde AI.
- Estado actual activo: no hay un orquestador externo robusto completo que dispare wakeups de noticias en todos los caminos.

H) RUPTURA
- Cambio esperado: AI puede devolver PRICE_REACHES_LEVEL o ajuste de recheck.
- Estado actual: se registra watched level; checkPriceWakeup existe pero su uso operativo global en pipeline activo es parcial.

I) PRECIO CERCA DE ZONA
- Cambio esperado: menor recheck (5/10) y trigger de precio.
- Estado actual: soportado por modelo y estructura, activacion externa parcial.

J) SIN MOVIMIENTO DURANTE HORAS
- Que hace: converge a recheck mas largo (30/60) segun adaptive_state.
- El scheduler no introduce analisis adicional por inercia; solo agenda.

## 4) Mapa completo del Cerebro (flujo exacto con entradas/salidas/errores)

Ruta analitica principal activa (V3):

1. Mercado -> Pipeline
- Archivo: [observerRunner.ts](app/ai/cadpV2/observerRunner.ts)
- Metodo: startObserverRunner + initializePipelineWithRealData
- Entra: candles/ticks reales
- Sale: pipeline + indicadores listos
- Error: init incompleta
- Recuperacion: continua con datos disponibles

2. Pipeline -> Snapshot Expediente
- Archivo: [snapshotBuilderV3.ts](app/ai/cadpV2/snapshotBuilderV3.ts)
- Clase: MaestroV3SnapshotBuilder
- Metodo: build
- Entra: symbol + trigger_reason + pipeline/indicators
- Sale: expediente parcial (1-13) + idempotency_key
- Error: data quality/idempotency skip
- Recuperacion: SKIPPED_BEFORE_AI o REUSED

3. Snapshot -> Expediente completo
- Archivo: [shadowFlowV3.ts](app/ai/cadpV2/shadowFlowV3.ts)
- Clase: ShadowFlowV3
- Metodo: analyzeInstrument pasos 3-4
- Entra: partial expediente
- Sale: expediente 16 secciones + prompt_text
- Error: build/prompt issues
- Recuperacion: AI_ERROR record

4. Expediente -> Prompt
- Archivo: [promptBuilderV3.ts](app/ai/cadpV2/promptBuilderV3.ts)
- Clase: MaestroV3PromptBuilder
- Metodo: build
- Entra: expediente completo
- Sale: prompt_text + hash + cache key
- Error: no critico usual
- Recuperacion: falla analisis

5. Prompt -> ChatGPT
- Archivo: [openAIAdapterV2.ts](app/ai/cadpV2/openAIAdapterV2.ts)
- Metodo: analyze
- Entra: instructions + input_text + schema
- Sale: JSON de respuesta + usage
- Error: timeout/http/retryable
- Recuperacion: retries, luego error + circuit breaker en ShadowFlow

6. ChatGPT -> Parser/Verifier
- Archivo: [verifierV3.ts](app/ai/cadpV2/verifierV3.ts)
- Clase: MaestroV3Verifier
- Metodo: verify
- Entra: raw response
- Sale: valid/repaired
- Error: MISSING_BLOCK/INVALID_* 
- Recuperacion: estado AI_ERROR

7. Respuesta valida -> Master Signal y modulos
- Archivo: [shadowFlowV3.ts](app/ai/cadpV2/shadowFlowV3.ts)
- Paso: dispatch
- Archivo: [disparadorModulos.ts](app/ai/cadpV2/disparadorModulos.ts)
- Metodo: dispatch
- Entra: respuesta + expediente + paper account
- Sale: payloads bot/alerta/telegram/dashboard/observador + destinos
- Error: por destino aislado
- Recuperacion: fail de un destino no bloquea los demas

8. Dispatcher -> Destinos
- Alertas: [alerts-domain-service.ts](app/backend/services/alerts-domain-service.ts)
- Bot: [bot-domain-service.ts](app/backend/services/bot-domain-service.ts)
- Dashboard/Resultados/Historial: estado y stores de backend + observer + lifecycle
- Telegram: [telegramNotificationService.ts](app/ai/cadpV2/telegramNotificationService.ts)

9. Historial/Lifecycle real
- Archivo: [masterSignalStore.ts](app/ai/cadpV2/masterSignalStore.ts)
- Publicacion a: [real-signal-lifecycle-service.ts](app/backend/services/real-signal-lifecycle-service.ts)
- Entra: record de señal
- Sale: lifecycle persistente y consultas para alertas/resultados

Nota sobre ruta legacy/paralela:
- Existe ruta Dispatcher-Brain-MT5 extensa en [master-event-dispatcher.ts](app/backend/services/master-event-dispatcher.ts) y [carvipix-brain-controller.ts](app/backend/core/carvipix-brain-controller.ts).
- Convive con la ruta V3; no toda esa ruta esta conectada como camino unico obligatorio del flujo analitico actual.

## 5) Reparto por planes (Basic/Pro/Bot/Comunidad/Fondeo)

### 5.1 Quién decide
- Planes y limites: [business-model.ts](app/lib/commercial/business-model.ts)
- Resolucion de acceso por usuario: [plan-entitlements-store.ts](app/backend/commercial/plan-entitlements-store.ts)
- Guards de enforcement: [access-control.ts](app/backend/commercial/access-control.ts)

### 5.2 Algoritmo actual
- No hay algoritmo central de ranking de oportunidades A+ para repartir cupos entre Basic/Pro/Bot/Comunidad/Fondeo en tiempo real.
- El sistema actual aplica control por permisos y limites al momento de consumo/accion de modulo (feature gates, maxAlertsPerDay, maxBots, allowedPairs, ventanas horarias).

### 5.3 Caso 30 oportunidades excelentes
- No se encontro un selector global tipo top N cross-plan en la ruta activa V3.
- El comportamiento actual se apoya en limites comerciales por usuario/plan y en los servicios consumidores.
- Conclusión: hoy no hay un motor unificado de priorizacion inter-plan para ese escenario.

## 6) BOT - recorrido completo solicitado

### 6.1 Nace Señal Maestra
- Entrada posible: [api/signals/master/route.ts](app/api/signals/master/route.ts)
- Orquestacion legacy: masterEventDispatcher.receiveMasterSignal
- Ruta V3 paralela: disparadorModulos genera payload bot_engine NON_EXECUTABLE

### 6.2 Entrega al Bot
- API MT5 handshake: [api/bot/mt5/handshake/route.ts](app/api/bot/mt5/handshake/route.ts)
- Poll de señal: [api/bot/mt5/signals/route.ts](app/api/bot/mt5/signals/route.ts)
- ACK: [api/bot/mt5/ack/route.ts](app/api/bot/mt5/ack/route.ts)

### 6.3 Validacion y conversion
- Servicio: [bot-mt5-service.ts](app/backend/services/bot-mt5-service.ts)
- Conversion: createSignal, getPendingSignal, markSignalDelivered/Executed, recordExecution, recordHeartbeat

### 6.4 Confirmacion y retorno
- Ejecucion: [api/bot/mt5/execution/route.ts](app/api/bot/mt5/execution/route.ts)
- Ejecuciones detalladas: [api/bot/mt5/executions/route.ts](app/api/bot/mt5/executions/route.ts)
- Cierre: [api/bot/mt5/closure/route.ts](app/api/bot/mt5/closure/route.ts)

### 6.5 Actualizacion aguas arriba
- masterEventDispatcher.receiveExecutionFromMT5
- masterEventDispatcher.receiveClosureFromMT5
- Notificacion de modulos y update de Telegram en la ruta dispatcher

## 7) Retorno de informacion bidireccional (real vs parcial)

Cadena solicitada:
Cerebro -> Bot -> Broker -> Bot -> CARVIPIX -> Dashboard -> Historial -> Telegram -> Resultado -> Explicacion

Estado tecnico actual:
1. Cerebro -> Bot: SI, implementado por rutas MT5 y servicios.
2. Bot -> Broker: SI, del lado EA MT5 (scripts).
3. Broker -> Bot: SI, por ejecucion/cierre en EA.
4. Bot -> CARVIPIX: SI, endpoints execution/closure/heartbeat/ack.
5. CARVIPIX -> Dashboard: PARCIAL/DUAL, depende de ruta V3 vs dispatcher legacy y del modulo consultado.
6. CARVIPIX -> Historial: SI, via lifecycle/store y tablas de eventos.
7. CARVIPIX -> Telegram: SI, en V3 (public payload) y tambien en dispatcher legacy.
8. Resultado -> Explicacion: PARCIAL, existe trazabilidad y observador, pero no un unico hilo canonico consolidado en una sola ruta productiva cerrada.

## 8) Donde esta realmente la rentabilidad del Cerebro

### 8.1 Componente que mas ventaja genera
1. Construccion del Expediente Maestro V3 multi-timeframe con delta/contexto previo.
2. Pregunta Maestra orientada a decision bajo evidencia.
3. Verificacion estructural y salida contractual (schema) que evita respuestas no operables.

### 8.2 Parte que hoy limita rentabilidad analitica
1. Saturacion de contexto por volumen de datos sin priorizacion semantica top-k.
2. Convivencia de rutas paralelas (V3 y dispatcher/brain legacy) que reduce claridad operacional.
3. Scheduler con triggers declarados pero activacion externa parcial en la ruta activa.
4. Falta de motor global de priorizacion inter-plan cuando hay exceso de oportunidades de alta calidad.

### 8.3 Mejora recomendada sin reemplazar ChatGPT
1. Compresion previa de evidencia con ranking de impacto y conflictos obligatorios.
2. Calibracion continua de probability_estimated por escenario y feedback de resultados.
3. Unificacion de ruta canonica de ejecucion/retorno para eliminar ambiguedad de estados.
4. Motor de seleccion cross-plan con reglas auditable para escenarios de sobreoferta de oportunidades.

## 9) Evidencia complementaria de payload exacto

Archivos completos generados y preservados en workspace:
- [prompt-xauusd-full.txt](docs/brain-reverse-engineering/prompt-xauusd-full.txt)
- [prompt-btcusd-full.txt](docs/brain-reverse-engineering/prompt-btcusd-full.txt)
- [prompt-metadata.json](docs/brain-reverse-engineering/prompt-metadata.json)
- [prompt-composition-metrics.json](docs/brain-reverse-engineering/prompt-composition-metrics.json)

Este paquete permite a un ingeniero senior reconstruir exactamente que entra al modelo, como se agenda, como se verifica, como se distribuye y donde se cierra (o no) el ciclo bidireccional.
