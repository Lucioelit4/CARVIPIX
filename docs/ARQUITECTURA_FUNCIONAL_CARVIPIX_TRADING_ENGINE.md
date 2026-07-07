# ARQUITECTURA FUNCIONAL CARVIPIX ORIENTADA AL TRADING ENGINE

## 1) Alcance y condiciones de esta etapa

- Pagos permanece congelado (checkout, webhooks, emails, memberships de pago): fuera de alcance de cambios funcionales.
- El Trading Engine no se implementa en esta etapa; se define su contrato y puntos de integracion.
- Este documento describe estado actual real del codigo y blueprint de integracion sin datos inventados.

## 2) Arquitectura funcional por capas

1. Trading Engine (dominio de decision)
   - Contrato: EngineGateway con lecturas de estado, alertas, decision log y metricas.
   - Adaptador existente: TradingEngineGatewayAdapter, con observabilidad y seeding demo opcional.

2. Backend de dominio (orquestacion y persistencia)
   - Servicios: alerts, results, capital, operations, bot, funding, dashboard, admin, ai, history, stats.
   - Persistencia principal: PostgreSQL via backendDatabase.
   - Eventos internos: InMemoryServiceEventBus.

3. Capa API cliente
   - Multiplexor: /api/client/data con acciones tipadas (POST).
   - Seguridad: requireClientSession.

4. Capa UI
   - Paginas de producto consumen client-data-helpers.
   - Donde no hay fuente operativa real, hoy existen placeholders o contenido local.

## 3) Modulos funcionales (10)

## 3.1 Alertas

- Entradas del Engine
  - Requeridas para conexion total: alertas en vivo, estado de alerta, rationale, confidence, niveles entry/sl/tp.
  - Estado actual: se consume operations.metadata filtrando modulo alerts/trading; no lectura directa de EngineGateway en API cliente.

- Salidas UI
  - Lista de senales con estado operativo (puedes entrar, espera, no entrar, finalizada), filtros y detalle tactico.

- Persistencia DB
  - Lectura principal: operations.
  - Reglas/historial: alert_rules, alert_history.

- APIs requeridas
  - Existentes: accion getAlerts y getAlertStats en /api/client/data.
  - Requeridas para acople directo al motor: acciones getEngineAlerts y/o stream de alertas.

- Eventos requeridos
  - Existentes: alerts.read, alerts.stats.read, alerts.rules.read, alerts.rule.created, alerts.action.logged.
  - Requeridos para motor: engine.alert.created, engine.alert.updated, engine.alert.closed.

- Dependencias
  - AlertsDomainService, client-data-helpers.getAlerts/getAlertStats, pagina alertas.

## 3.2 Resultados

- Entradas del Engine
  - Requeridas: cierres confirmados por motor (resultado real por operacion) y metrica agregada por periodo.
  - Estado actual: agregacion desde operations, bot_instances.stats, capital_accounts, monthly_reports, users.

- Salidas UI
  - KPIs mensuales, serie historica, tablas de ranking y ultimos cierres (hoy con placeholders en bloques).

- Persistencia DB
  - operations, bot_instances(stats), capital_accounts, monthly_reports, users.

- APIs requeridas
  - Existentes: getPlatformResults, getResultsHistory.
  - Requeridas para trazabilidad completa del motor: endpoint de resultados por signalId y decisionId.

- Eventos requeridos
  - Existentes: results.read, results.history.read.
  - Requeridos para motor: engine.trade.closed, engine.performance.updated.

- Dependencias
  - ResultsDomainService, client-data-helpers de resultados, dashboard/resultados.

## 3.3 Analisis

- Entradas del Engine
  - Requeridas: decision log, setup detectado, contexto multi-timeframe, resultado posterior.
  - Estado actual: contenido completamente local/estatico en pagina.

- Salidas UI
  - Biblioteca de analisis historico filtrable por activo, categoria y estado.

- Persistencia DB
  - Estado actual: no usa DB para su dataset principal.
  - Requerida: tabla/coleccion de analisis versionado enlazada a operations y/o decisionLog.

- APIs requeridas
  - Requeridas: getAnalysisLibrary, getAnalysisById con fuente real del motor.
  - Estado actual: sin accion dedicada en /api/client/data.

- Eventos requeridos
  - Requeridos: engine.analysis.generated, engine.analysis.validated.

- Dependencias
  - UI local; pendiente dependencia explicita de servicios de dominio.

## 3.4 Gestion de Capital

- Entradas del Engine
  - Requeridas: PnL realizado/no realizado por estrategia/cuenta para actualizar balance y reportes.
  - Estado actual: lecturas reales de cuenta, movimientos y reportes desde servicios de capital.

- Salidas UI
  - Capital asignado, balance, rendimiento, historial de movimientos y reportes mensuales.

- Persistencia DB
  - capital_accounts, capital_movements, monthly_reports, operations (bootstrap y trazabilidad).

- APIs requeridas
  - Existentes: getCapitalAccount, getCapitalMovements, getCapitalMonthlyReports, getBalance.
  - Requeridas para acople full motor: accion de sync pnl del motor por accountId.

- Eventos requeridos
  - Existentes: capital.account.read, capital.movements.read, capital.reports.read, capital.account.created, capital.stats.read.
  - Requeridos para motor: engine.pnl.realized, engine.risk.limit.hit.

- Dependencias
  - CapitalDomainService, OperationsDomainService, UI gestion-capital.

## 3.5 Fondeo

- Entradas del Engine
  - Requeridas: progreso operativo para evaluacion de cuentas y cumplimiento de reglas.
  - Estado actual: snapshot agregado desde capital_accounts (programas activos, cuentas aprobadas, capital total).

- Salidas UI
  - Estado de programas y narrativa de proceso de fondeo; formularios visuales sin pipeline completo de solicitud.

- Persistencia DB
  - Deriva de capital_accounts; no existe modelo especifico de workflow de fondeo en esta lectura.

- APIs requeridas
  - Existente: getFundingSnapshot.
  - Requeridas: createFundingRequest, getFundingRequestStatus, attachFundingEvidence.

- Eventos requeridos
  - Requeridos: funding.requested, funding.status.changed, engine.funding.milestone.

- Dependencias
  - FundingDomainService + UI fondeo.

## 3.6 Bot

- Entradas del Engine
  - Requeridas: estado de ejecucion, stats de performance, salud de instancia.
  - Estado actual: datos desde bot_licenses y bot_instances.stats; no controlado por EngineGateway aun.

- Salidas UI
  - Estado del bot, metricas de rendimiento y componentes educativos/comerciales.

- Persistencia DB
  - bot_licenses, bot_instances, bot_updates.

- APIs requeridas
  - Existentes: getBotLicense, getBotInstances.
  - Requeridas para operacion real: startBot, stopBot, getBotTelemetry, syncBotFromEngine.

- Eventos requeridos
  - Existentes: bot.license.read, bot.instances.read, bot.instance.created, bot.updates.read, bot.broker.connected.
  - Requeridos para motor: engine.bot.started, engine.bot.stopped, engine.bot.health.changed.

- Dependencias
  - BotDomainService, licencia/conexion broker, UI bot.

## 3.7 Herramientas

- Entradas del Engine
  - Requeridas: parametros reales de simbolo, volatilidad, valor por pip, riesgo dinamico recomendado.
  - Estado actual: calculadoras locales en cliente, sin datos del motor ni DB.

- Salidas UI
  - Calculadoras de riesgo, RR, pips y sesiones.

- Persistencia DB
  - Estado actual: sin persistencia.
  - Requerida: opcional para guardar presets por usuario.

- APIs requeridas
  - Requeridas: getRiskModelInputs, saveToolPreset, getToolPresets.

- Eventos requeridos
  - Requeridos: tools.calculation.saved, engine.risk.model.updated.

- Dependencias
  - UI pura cliente; hoy sin dependencia backend.

## 3.8 Comunidad

- Entradas del Engine
  - Requeridas: alertas publicables, resumen operativo moderado, hitos de rendimiento.
  - Estado actual: solo identidad de usuario via getCurrentUser; mensajes/canales son locales en memoria del componente.

- Salidas UI
  - Chat comunitario, reacciones, canales y presencia simulada.

- Persistencia DB
  - Estado actual: no persistencia de chat.
  - Requerida: modelo comunidad (canales, mensajes, reacciones, moderacion).

- APIs requeridas
  - Existente parcial: getCurrentUser.
  - Requeridas: getCommunityChannels, getCommunityMessages, sendCommunityMessage, reactCommunityMessage.

- Eventos requeridos
  - Requeridos: community.message.created, community.reaction.added, engine.alert.broadcasted.

- Dependencias
  - Auth de cliente + UI local de comunidad.

## 3.9 Perfil

- Entradas del Engine
  - Requeridas: metricas personales derivadas de operaciones reales (alertas seguidas, operaciones, rendimiento personal).
  - Estado actual: usa getCurrentUser, getCurrentMembership, getAlertStats y getPlatformResults para resumen.

- Salidas UI
  - Datos personales, estado de membresia, estadisticas basicas, preferencia local.

- Persistencia DB
  - users, memberships, operaciones agregadas via servicios.
  - Nota: cambios de formulario en pagina no muestran pipeline robusto de guardado server en esta lectura.

- APIs requeridas
  - Existentes: getCurrentUser, getCurrentMembership, getAlertStats, getPlatformResults.
  - Requeridas: updateProfile, updatePreferences, uploadAvatar.

- Eventos requeridos
  - Requeridos: profile.updated, profile.preferences.updated.

- Dependencias
  - Memberships/auth + stats agregadas + UI perfil.

## 3.10 Dashboard

- Entradas del Engine
  - Requeridas: estado de motor, alertas activas reales, performance consolidada near-real-time.
  - Estado actual: KPIs desde getAlertStats, getPlatformResults, getBotInstances, getResultsHistory.

- Salidas UI
  - Vista ejecutiva de modulos, KPIs clave, noticias/resumen historico.

- Persistencia DB
  - Indirecta via servicios de alertas/resultados/bot (operations, bot_instances, monthly_reports, etc.).

- APIs requeridas
  - Existentes: getAlertStats, getPlatformResults, getBotInstances, getResultsHistory.
  - Requeridas para salud real del motor: getEngineHealth, getEngineThroughput, getActiveSignals.

- Eventos requeridos
  - Requeridos: dashboard.kpi.refreshed, engine.health.changed.

- Dependencias
  - Auth de sesion, client-data-helpers, servicios agregados.

## 4) Flujo completo de datos CARVIPIX (end-to-end)

## 4.1 Flujo operativo principal (lectura)

1. Trading Engine genera estado/alertas/decisiones/metricas.
2. Adapter TradingEngineGatewayAdapter normaliza llamadas, mide observabilidad y errores.
3. Servicios de dominio consolidan informacion con persistencia PostgreSQL.
4. API /api/client/data expone acciones tipadas con sesion requerida.
5. client-data-helpers invoca acciones y entrega DTOs a las paginas.
6. UI renderiza estado premium de cada modulo.

## 4.2 Flujo de accion del usuario (escritura)

1. Usuario ejecuta accion en UI (ejemplo: crear regla de alerta, crear cuenta capital, conectar broker).
2. API valida sesion y delega en servicio de dominio.
3. Servicio persiste en DB (insert/update) con trazabilidad.
4. Servicio publica evento interno en event-bus.
5. Otros consumidores internos pueden reaccionar (actualmente bus en memoria de proceso).
6. UI refresca por nueva consulta API.

## 4.3 Flujo de consistencia para conexion total con engine

1. Engine emite evento canonico de ciclo de trade (created, updated, closed).
2. Capa backend transforma a registro canonico en operations + metadata estandar.
3. Modulos Alerts, Results, Dashboard y Perfil consumen ese canonico sin duplicar logica.
4. Capital/Fondeo/Bot derivan sus snapshots desde ese mismo evento + tablas especializadas.
5. Comunidad y Analisis publican solo informacion validada desde decision log/operations.

## 5) Brechas funcionales detectadas (auditoria)

- Integracion directa con EngineGateway aun no expuesta en /api/client/data para cliente final.
- Analisis, Herramientas y Comunidad operan con data local/no persistida en partes criticas.
- Secciones de Resultados y Dashboard tienen placeholders cuando no hay actividad, correcto para no inventar datos, pero requieren contratos finales para modo productivo completo.
- Event bus actual es in-memory: sirve para orquestacion local, no para integracion distribuida entre procesos.

## 6) Contratos recomendados para la siguiente fase (sin implementar motor)

- Contrato de evento de operacion canonica
  - Campos minimos: signalId, decisionId, userId, accountId, symbol, side, entry, sl, tp, status, pnl, confidence, timeframe, strategy, source, timestamps.

- Acciones API nuevas en /api/client/data
  - getEngineHealth
  - getEngineAlerts
  - getEngineDecisionLog
  - getEngineMetrics
  - getAnalysisLibrary
  - getCommunityFeed

- Regla de oro de datos
  - Ningun modulo visual debe sintetizar resultados operativos si no vienen de operations/engine contracts.

## 7) Mapa de dependencias criticas

- Contracts: backend/contracts/services.ts, backend/contracts/engine-gateway.ts.
- Adapter: backend/adapters/trading-engine-gateway-adapter.ts.
- Domain services: backend/services/*.ts.
- DB schema: backend/core/database.ts.
- API cliente: api/client/data/route.ts.
- Client helpers: lib/client-data-helpers.ts.
- Modulos UI: app/alertas, app/resultados, app/analisis, app/gestion-capital, app/fondeo, app/bot, app/herramientas, app/comunidad, app/perfil, app/dashboard.

## 8) Estado de readiness para nucleo Trading Engine

- Base lista para integracion: alerts, results, capital, bot, dashboard (con datos reales parciales desde DB).
- Base parcial: fondeo y perfil (dependen de agregados reales, pero faltan contratos especificos adicionales).
- Base no conectada al motor: analisis, herramientas, comunidad (predominio local/estatico).
- Resultado: CARVIPIX esta en estado de "readiness estructural" para conectar el nucleo funcional al Trading Engine por contrato, sin tocar pagos.
