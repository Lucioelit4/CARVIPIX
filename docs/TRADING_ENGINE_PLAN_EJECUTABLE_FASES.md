# CARVIPIX Trading Engine - Plan Ejecutable por Fases

## Objetivo del documento

Traducir el blueprint arquitectonico del Trading Engine a un plan de ejecucion por fases, con entregables verificables y criterios de cierre objetivos, sin implementar codigo en esta etapa.

## Alcance y restricciones

1. No se implementa codigo del motor en este plan.
2. No se definen estrategias concretas ni indicadores concretos.
3. Pagos permanece congelado y fuera de alcance.
4. Se respeta la frontera Engine-Backend definida en arquitectura actual.

## Fase 1 - Contratos tecnicos, interfaces y schemas

Objetivo:
Definir el lenguaje canonico del sistema para que todas las capas hablen el mismo contrato antes de construir logica.

Archivos que se tocarian:

1. app/backend/contracts/engine-gateway.ts
2. app/backend/contracts/domain.ts
3. app/backend/contracts/services.ts
4. app/engine/types/index.ts
5. app/engine/types/marketData.ts
6. app/engine/types/backtesting.ts
7. docs/TRADING_ENGINE_BLUEPRINT_DEFINITIVO.md
8. docs/TRADING_ENGINE_CONTRATOS_ESQUEMAS.md

Que se construye:

1. Schema canonico de eventos del engine.
2. Contratos de lectura del engine para CARVIPIX.
3. Contratos de control admin del engine.
4. Matriz de versionado y compatibilidad de contratos.
5. Catalogo de estados de ciclo de vida de signal/alert/decision.

Que pruebas se harian:

1. Validacion de completitud de campos por contrato.
2. Revision de compatibilidad entre tipos de engine y backend.
3. Prueba de consistencia semantica de estados y transiciones.
4. Auditoria de imports para asegurar frontera de arquitectura.

Criterio para cerrar la fase:

1. Todos los contratos documentados y aprobados.
2. Sin ambiguedad de naming ni tipos.
3. Matriz de eventos y estados firmada como baseline.

## Fase 2 - Data ingestion y normalizacion de mercado

Objetivo:
Disenar la canalizacion de entrada de mercado con reglas de calidad, idempotencia y fallback de proveedores.

Archivos que se tocarian:

1. app/engine/core/ingestion-gateway.ts
2. app/engine/core/market-state.ts
3. app/engine/core/data-quality.ts
4. app/engine/types/realDataProvider.ts
5. app/engine/types/brokerProvider.ts
6. app/backend/adapters/trading-engine-gateway-adapter.ts
7. docs/TRADING_ENGINE_INGESTION_NORMALIZACION.md

Que se construye:

1. Contrato de market event canonico.
2. Politicas de deduplicacion y ordering temporal.
3. Reglas de calidad de datos y manejo de gaps.
4. Politica de failover de proveedores.
5. Especificacion de snapshot de salud de ingestion.

Que pruebas se harian:

1. Pruebas de datos fuera de orden.
2. Pruebas de latencia y degradacion de feed.
3. Pruebas de duplicados e idempotencia.
4. Pruebas de conmutacion a proveedor secundario.

Criterio para cerrar la fase:

1. Pipeline de datos definido extremo a extremo.
2. Reglas de calidad y failover aprobadas.
3. Escenarios de error principales cubiertos en test plan.

## Fase 3 - Motor de estrategias

Objetivo:
Definir el runtime de estrategias como framework desacoplado y versionable, sin estrategias concretas.

Archivos que se tocarian:

1. app/engine/strategy/strategy-registry.ts
2. app/engine/strategy/strategy-runtime.ts
3. app/engine/strategy/strategy-contracts.ts
4. app/engine/core/decision-orchestrator.ts
5. app/engine/types/index.ts
6. docs/TRADING_ENGINE_ESTRATEGIAS_ARQUITECTURA.md

Que se construye:

1. Registry de estrategias con versionado.
2. Contrato de entrada/salida de estrategia.
3. Politica de activacion por contexto.
4. Modelo de score base de oportunidad.

Que pruebas se harian:

1. Pruebas de aislamiento entre estrategias.
2. Pruebas de determinismo con misma entrada.
3. Pruebas de compatibilidad de versiones.
4. Pruebas de performance del pipeline de evaluacion.

Criterio para cerrar la fase:

1. Runtime de estrategias definido y trazable.
2. Contratos listos para enchufar estrategias reales.
3. Sin acoplamiento a UI ni modulos de negocio externos.

## Fase 4 - Filtros y validacion

Objetivo:
Definir las compuertas de elegibilidad y validacion que separan candidate de decision aprobable.

Archivos que se tocarian:

1. app/engine/filters/filter-pipeline.ts
2. app/engine/filters/filter-contracts.ts
3. app/engine/validation/validation-pipeline.ts
4. app/engine/validation/validation-contracts.ts
5. app/engine/core/decision-orchestrator.ts
6. docs/TRADING_ENGINE_FILTROS_VALIDACION.md

Que se construye:

1. Pipeline de filtros hard/soft/warning.
2. Pipeline de validacion tecnica y de negocio.
3. Matriz de motivos de rechazo.
4. Formato estandar de audit trail por decision.

Que pruebas se harian:

1. Pruebas de transicion candidate a rejected/approved/pending.
2. Pruebas de bloqueo por hard fail.
3. Pruebas de degradacion por soft fail.
4. Pruebas de trazabilidad de razon de rechazo.

Criterio para cerrar la fase:

1. Toda decision tiene explicacion auditable.
2. Reglas de filtro y validacion congeladas para build inicial.
3. No existen caminos sin trazabilidad.

## Fase 5 - Gestion de riesgo y capital

Objetivo:
Definir el motor que limita exposicion y coordina politicas de capital antes de habilitar alertas.

Archivos que se tocarian:

1. app/engine/risk/risk-engine.ts
2. app/engine/risk/risk-policies.ts
3. app/engine/capital/capital-engine.ts
4. app/engine/capital/capital-ledger.ts
5. app/backend/services/capital-domain-service.ts
6. app/backend/services/system-domain-services.ts
7. docs/TRADING_ENGINE_RIESGO_CAPITAL.md

Que se construye:

1. Modelo de limite por trade/simbolo/cartera/ventana temporal.
2. Position sizing framework.
3. Kill switch y guardrails de drawdown.
4. Snapshot de capital y utilizacion de riesgo.
5. Contrato de eventos de riesgo y capital.

Que pruebas se harian:

1. Pruebas de bloqueo por exceder riesgo.
2. Pruebas de saturacion de exposicion.
3. Pruebas de activacion de kill switch.
4. Pruebas de consistencia de snapshots de capital.

Criterio para cerrar la fase:

1. Ninguna decision operativa pasa sin risk check.
2. Guardrails y kill switch definidos y probados en escenarios criticos.
3. Capital snapshot usable por Gestion de Capital y Fondeo.

## Fase 6 - Generacion de alertas

Objetivo:
Definir el subsistema que transforma decisiones aprobadas en alertas consumibles por plataforma.

Archivos que se tocarian:

1. app/engine/alerts/alert-engine.ts
2. app/engine/alerts/alert-lifecycle.ts
3. app/engine/core/engine.ts
4. app/backend/services/alerts-domain-service.ts
5. app/backend/contracts/domain.ts
6. docs/TRADING_ENGINE_ALERTAS.md

Que se construye:

1. Contrato canonico de alerta.
2. Maquina de estados de alerta.
3. Reglas de prioridad y expiracion.
4. Publicacion de eventos engine.alert.*.

Que pruebas se harian:

1. Pruebas de creacion y actualizacion de alertas.
2. Pruebas de expiracion y cierre de ciclo.
3. Pruebas de consistencia entre decision y alerta.
4. Pruebas de integridad de payload de eventos.

Criterio para cerrar la fase:

1. Ciclo de alerta completo definido y verificable.
2. Alertas listas para consumo por modulo Alertas.
3. Sin discrepancias entre decision registrada y alerta emitida.

## Fase 7 - Backtesting y simulacion

Objetivo:
Definir el entorno de validacion historica y simulacion realtime-safe del engine.

Archivos que se tocarian:

1. app/engine/backtesting/backtest-runner.ts
2. app/engine/backtesting/backtest-reporting.ts
3. app/engine/simulation/simulation-runner.ts
4. app/engine/simulation/shadow-mode.ts
5. app/engine/types/backtesting.ts
6. docs/TRADING_ENGINE_BACKTEST_SIMULACION.md

Que se construye:

1. Contrato de run de backtest.
2. Contrato de run de simulacion.
3. Reglas de reproducibilidad por version y seed.
4. Artefactos de reporte y comparativos.

Que pruebas se harian:

1. Pruebas de replay deterministico.
2. Pruebas de consistencia entre runs repetidos.
3. Pruebas de performance sobre datasets amplios.
4. Pruebas de aislamiento de simulacion respecto a entorno productivo.

Criterio para cerrar la fase:

1. Backtesting reproducible con reportes confiables.
2. Simulacion operativa sin riesgo de impacto productivo.
3. Outputs listos para validacion de negocio y analitica.

## Fase 8 - Integracion con Dashboard, Alertas, Resultados y Admin

Objetivo:
Conectar el engine con la capa backend y modulos de plataforma mediante contratos aprobados.

Archivos que se tocarian:

1. app/backend/adapters/trading-engine-gateway-adapter.ts
2. app/backend/runtime.ts
3. app/backend/services/alerts-domain-service.ts
4. app/backend/services/results-domain-service.ts
5. app/backend/services/system-domain-services.ts
6. app/api/client/data/route.ts
7. app/lib/client-data-helpers.ts
8. app/dashboard/page.tsx
9. app/alertas/page.tsx
10. app/resultados/page.tsx
11. app/admin/page.tsx
12. docs/TRADING_ENGINE_INTEGRACION_PLATAFORMA.md

Que se construye:

1. Endpoints de lectura de estado, alertas, decisiones y metricas.
2. Integracion de KPIs de engine en dashboard/resultados.
3. Integracion de alertas vivas en modulo Alertas.
4. Integracion de salud y control en Admin.

Que pruebas se harian:

1. Pruebas de contrato API backend-engine.
2. Pruebas E2E por modulo consumidor.
3. Pruebas de autorizacion por rol.
4. Pruebas de fallback cuando engine no disponible.

Criterio para cerrar la fase:

1. Modulos clave consumen datos reales del engine via backend.
2. Frontend no depende de placeholders para datos operativos core.
3. Integracion admin habilitada para monitoreo y control basico.

## Fase 9 - Observabilidad, logs y hardening

Objetivo:
Cerrar la ruta a produccion con telemetria, resiliencia y controles operativos.

Archivos que se tocarian:

1. app/backend/core/observability.ts
2. app/backend/core/logger.ts
3. app/backend/core/errors.ts
4. app/engine/core/engine-health.ts
5. app/engine/core/reliability-policies.ts
6. infra/ (dashboards, alerting rules, runbooks)
7. docs/TRADING_ENGINE_OBSERVABILIDAD_HARDENING.md
8. docs/runbooks/TRADING_ENGINE_PRODUCTION_RUNBOOK.md

Que se construye:

1. SLI/SLO operativos del engine.
2. Politicas de retry/backoff/circuit breaker.
3. Logging estructurado con correlation y trace IDs.
4. Alertas operativas y runbooks de incidentes.
5. Checklist de readiness productivo.

Que pruebas se harian:

1. Pruebas de caos controlado (degradacion de feeds, caida parcial).
2. Pruebas de carga y latencia p95/p99.
3. Pruebas de recuperacion y continuidad.
4. Pruebas de observabilidad end-to-end.

Criterio para cerrar la fase:

1. SLOs base cumplidos en ambiente preproductivo.
2. Incidentes simulados con runbook validado.
3. Hardening aprobado para despliegue gradual.

## Plan de validacion transversal entre fases

1. Gate de arquitectura: sin violar frontera engine-adapter-services.
2. Gate de contratos: sin breaking changes no versionados.
3. Gate de datos: trazabilidad completa por decision_id.
4. Gate de seguridad: authn/authz por rol y auditoria.
5. Gate de calidad: pruebas unitarias, integracion y e2e por fase.

## Hitos ejecutivos de aprobacion

1. Hito A: Fases 1-3 completas.
2. Hito B: Fases 4-6 completas.
3. Hito C: Fases 7-8 completas.
4. Hito D: Fase 9 completa y go-live readiness.

## Definicion de terminado global

1. El engine publica decisiones y alertas trazables de punta a punta.
2. Dashboard, Alertas, Resultados y Admin consumen datos reales del motor.
3. Backtesting y simulacion son reproducibles.
4. Observabilidad y hardening cumplen criterios operativos de produccion.
