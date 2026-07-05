# INFRAESTRUCTURA_V2_PLAN

## 1) Mandato y límites

**Rol:** Arquitecto de Infraestructura CARVIPIX.

**No incluido (fuera de alcance):**
- Diseño
- Motor
- Estrategias
- Backtesting

**Incluido (alcance de auditoría):**
- Login
- Roles
- Usuarios
- Panel Admin
- APIs
- Base de datos
- Stripe
- Seguridad
- Performance
- Integraciones
- Errores
- Botones
- Navegación
- Arquitectura

**Objetivo:** ejecutar una auditoría técnica integral de infraestructura, detectar cuellos de botella reales y potenciales, y proponer mejoras profesionales con priorización por impacto y esfuerzo, sin programar aún.

---

## 2) Criterios de calidad e infraestructura objetivo

La infraestructura V2 debe garantizar:
- **Disponibilidad:** objetivo >= 99.9%.
- **Seguridad:** cumplimiento OWASP ASVS L2 mínimo.
- **Escalabilidad:** crecimiento horizontal en API y jobs sin rediseño mayor.
- **Resiliencia:** degradación controlada y recuperación automática.
- **Observabilidad:** trazabilidad punta a punta (logs, métricas, traces, alertas).
- **Operabilidad:** despliegues seguros, rollback inmediato, runbooks claros.
- **Cumplimiento financiero:** trazabilidad de eventos Stripe, idempotencia, auditoría.

---

## 3) Metodología de auditoría (solo análisis)

### Fase A: Descubrimiento de arquitectura actual
- Mapa de componentes (frontend, backend, admin, DB, terceros).
- Inventario de servicios, dependencias, secretos, entornos y pipelines.
- Mapa de rutas críticas de negocio:
  - Login -> sesión -> autorización.
  - Usuario -> panel admin -> cambios de permisos.
  - API core -> DB -> respuesta.
  - Stripe checkout/webhook -> estado de suscripción.

### Fase B: Evaluación técnica por dominio
- Revisiones estáticas de configuración y código de infraestructura.
- Pruebas de carga dirigidas en endpoints críticos.
- Pruebas de seguridad (autenticación, autorización, abuso de API).
- Trazado de latencia por salto (app, DB, red, terceros).

### Fase C: Diagnóstico y priorización
- Matriz de hallazgos: severidad x probabilidad x impacto económico.
- Identificación de cuellos de botella primarios y secundarios.
- Plan de remediación por olas: Quick Wins / Core Hardening / Escalado.

### Fase D: Plan de implementación V2 (sin ejecutar aún)
- Roadmap técnico por sprint.
- Definición de KPIs/SLOs operativos.
- Plan de validación antes de pasar a ejecución.

---

## 4) Auditoría integral por áreas

## 4.1 Login

### Qué auditar
- Flujo de autenticación completo (registro, login, refresh, logout).
- Gestión de sesión/token (expiración, rotación, revocación).
- Almacenamiento de credenciales y secretos.
- Límites de intentos y protección anti-brute-force.
- Recuperación de contraseña y verificación de correo.

### Cuellos de botella típicos
- Validaciones costosas en login sin caché de verificación.
- Queries no indexadas por email/username.
- Dependencia sin fallback de proveedor de email/OTP.
- Refresh token sin control de reutilización.

### Mejoras propuestas
- Introducir política de sesión robusta: rotación de refresh token + revocación por dispositivo.
- Rate limiting adaptativo por IP + fingerprint + usuario.
- Índices únicos y normalización para lookup rápido de identidad.
- Instrumentación de métricas: p50/p95 login latency, failed login ratio.

---

## 4.2 Roles y autorización

### Qué auditar
- Modelo RBAC/ABAC actual y jerarquía de permisos.
- Verificación de permisos en backend (no solo UI).
- Controles por endpoint admin y acciones sensibles.
- Trazabilidad de cambios de rol.

### Cuellos de botella típicos
- Permisos evaluados en frontend únicamente.
- Regla de autorización duplicada entre servicios.
- Elevación de privilegios por endpoints no protegidos.

### Mejoras propuestas
- Motor centralizado de autorización en middleware/policy layer.
- Matriz de permisos versionada y auditable.
- “Deny by default” para rutas administrativas.
- Logging de auditoría inmutable para cambios de roles.

---

## 4.3 Usuarios

### Qué auditar
- Ciclo de vida de usuario (alta, edición, bloqueo, baja lógica/física).
- Integridad de perfil y consistencia de estado.
- Protección de datos sensibles (PII minimization).

### Cuellos de botella típicos
- Soft-delete sin filtros globales -> datos “fantasma”.
- Inconsistencias de estado entre servicios y cache.

### Mejoras propuestas
- Definir “source of truth” de identidad.
- Políticas de retención y anonimización.
- Eventos de dominio para sincronización consistente.

---

## 4.4 Panel Admin

### Qué auditar
- Seguridad de acceso al panel.
- Acciones críticas (cambios de rol, facturación, bloqueo de usuarios).
- Registro de auditoría de acciones administrativas.
- Protección CSRF/XSS y sesión admin endurecida.

### Cuellos de botella típicos
- Acciones masivas sin colas ni paginación.
- Falta de trazabilidad de “quién cambió qué y cuándo”.

### Mejoras propuestas
- MFA obligatorio para cuentas admin.
- Workflows de doble confirmación para operaciones irreversibles.
- Auditoría completa con correlación por request-id.

---

## 4.5 APIs

### Qué auditar
- Contratos, versionado y compatibilidad.
- Timeouts, retries, idempotencia en operaciones críticas.
- Rate limiting y protección de abuso.
- Manejo uniforme de errores.

### Cuellos de botella típicos
- Endpoints “chatty” con N+1 queries.
- Falta de paginación/filtrado eficiente.
- Retries sin backoff exponencial.

### Mejoras propuestas
- Estándar API con envelopes, códigos y trazabilidad.
- Idempotency keys para operaciones de cobro/alta.
- Caching selectivo por endpoint con invalidación explícita.
- Límite de payload y compresión controlada.

---

## 4.6 Base de datos

### Qué auditar
- Modelo relacional, cardinalidades y restricciones.
- Índices, planes de ejecución, queries calientes.
- Pool de conexiones y saturación.
- Estrategia de migraciones y rollback.
- Backups, restauración y RPO/RTO.

### Cuellos de botella típicos
- Índices faltantes en filtros de alta frecuencia.
- Lock contention en tablas de sesión/transacciones.
- Conexiones agotadas por pooling mal dimensionado.

### Mejoras propuestas
- Revisión de índices por top queries p95.
- Separación de lecturas pesadas y escrituras críticas.
- Política de archivado/particionado para tablas volumétricas.
- Prueba periódica de restore (no solo backup).

---

## 4.7 Stripe

### Qué auditar
- Flujo de pago end-to-end (checkout, confirmación, webhooks).
- Validación de firma webhook y protección replay.
- Idempotencia de eventos y reconciliación contable.
- Estados de suscripción y sincronización con usuario/roles.

### Cuellos de botella típicos
- Doble procesamiento de webhook por ausencia de idempotencia.
- Dependencia de respuesta síncrona a Stripe sin cola.
- Desacople incompleto entre estado local y estado Stripe.

### Mejoras propuestas
- Procesamiento webhook en cola + deduplicación por event_id.
- Ledger interno de eventos de facturación auditable.
- Job de reconciliación diaria Stripe vs DB.
- Alertas por drift de estado de suscripciones.

---

## 4.8 Seguridad

### Qué auditar
- Gestión de secretos y variables de entorno.
- Políticas CORS, CSP, HSTS, cookies seguras.
- Hardening de endpoints y headers.
- Dependencias vulnerables y cadena de suministro.
- Logs sensibles (evitar exposición de PII/tokens).

### Cuellos de botella típicos
- Secrets en runtime no rotados.
- Permisos excesivos en claves API.
- Ausencia de escaneo SAST/DAST en CI.

### Mejoras propuestas
- Secret manager centralizado + rotación periódica.
- Escaneo automático de vulnerabilidades en pipeline.
- Política de mínimos privilegios para integraciones.
- Pruebas periódicas de intrusión en superficie crítica.

---

## 4.9 Performance

### Qué auditar
- Latencia por endpoint (p50/p95/p99).
- Throughput sostenido y picos.
- Uso CPU/memoria y presión GC.
- Rendimiento en DB (slow query log).
- Impacto de terceros en tiempos de respuesta.

### Cuellos de botella típicos
- API bloqueada por operaciones I/O síncronas.
- Falta de cache en lecturas repetitivas.
- Métricas insuficientes para aislar cuello real.

### Mejoras propuestas
- Perfilado por endpoint crítico y trazas distribuidas.
- Asincronizar tareas no críticas con colas.
- Budget de performance por dominio (SLO técnico).

---

## 4.10 Integraciones

### Qué auditar
- Dependencias externas y SLA reales.
- Timeouts/retries/circuit breaker.
- Contratos de datos y transformación.

### Cuellos de botella típicos
- Cascadas de fallos por ausencia de circuit breaker.
- Timeouts muy altos que secuestran workers.

### Mejoras propuestas
- Patrón resiliente por integración: timeout corto + retry con jitter + fallback.
- Observabilidad por proveedor externo (errores, latencia, disponibilidad).

---

## 4.11 Errores

### Qué auditar
- Taxonomía de errores y códigos homogéneos.
- Manejo de excepciones global y por capa.
- Calidad de logs (contexto, correlación, severidad).

### Cuellos de botella típicos
- Errores silenciosos sin alertas.
- Logs ruidosos sin valor diagnóstico.

### Mejoras propuestas
- Estándar de errores versionado.
- Correlation-id obligatorio en toda request.
- Alertas orientadas a impacto de negocio.

---

## 4.12 Botones y navegación (infraestructura de interacción)

### Qué auditar
- Trazabilidad técnica de acciones UI -> API -> DB.
- Idempotencia de acciones por doble click/reintentos.
- Estados de carga, timeout y recuperación en navegación.

### Cuellos de botella típicos
- Doble envío por ausencia de control de concurrencia en acciones.
- Navegación que dispara llamadas redundantes.

### Mejoras propuestas
- Idempotency keys por acciones sensibles.
- Debounce/throttle alineado con backend.
- Telemetría de embudos (click -> éxito/error -> tiempo).

---

## 4.13 Arquitectura (macro)

### Qué auditar
- Acoplamiento entre módulos.
- Fronteras de dominio y responsabilidades.
- Dependencias cíclicas y puntos únicos de fallo.
- Preparación para escalado horizontal.

### Cuellos de botella típicos
- Monolito con rutas críticas sin aislamiento.
- Falta de capa anti-corrupción para terceros.

### Mejoras propuestas
- Evolución hacia arquitectura modular por dominios.
- Colas/eventos para desacoplar procesos costosos.
- Estrategia de “strangler” para refactor progresivo sin ruptura.

---

## 5) Cuellos de botella prioritarios (hipótesis inicial)

1. **Autorización dispersa** entre frontend/backend y endpoints administrativos.
2. **Carga sin control** en endpoints críticos (rate limiting insuficiente).
3. **DB bajo presión** por queries no optimizadas y pool de conexiones.
4. **Stripe webhook no robusto** ante duplicados/reintentos.
5. **Observabilidad parcial** sin trazas distribuídas end-to-end.
6. **Errores no estandarizados** que dificultan soporte y RCA.
7. **Procesos síncronos** que deberían desacoplarse con colas.

---

## 6) Plan de mejoras profesional (sin implementación)

## OLA 1 - Quick Wins (1-2 semanas)
- Definir estándar único de errores y correlation-id.
- Activar rate limiting en login y endpoints sensibles.
- Endurecer headers/cookies/políticas de seguridad.
- Agregar métricas mínimas obligatorias por endpoint crítico.
- Validar idempotencia en Stripe y acciones de doble click.

## OLA 2 - Core Hardening (2-4 semanas)
- Centralizar autorización RBAC/ABAC en backend.
- Optimizar top queries lentas e índices críticos.
- Implementar cola para eventos Stripe/webhooks.
- Completar auditoría de acciones admin y cambios de rol.
- Definir runbooks operativos para incidentes.

## OLA 3 - Escalado y resiliencia (4-8 semanas)
- Trazas distribuidas completas y alertado avanzado.
- Circuit breakers y fallback por integración externa.
- Particionado/archivado de tablas de alto crecimiento.
- Estrategia de despliegue progresivo y rollback automático.

---

## 7) KPIs y SLOs recomendados

### KPIs operativos
- Login success rate.
- Admin action error rate.
- API p95 por endpoint crítico.
- DB slow query count.
- Stripe webhook processing lag.
- Incident MTTD / MTTR.

### SLOs iniciales
- API crítica: p95 < 300 ms.
- Login: p95 < 400 ms.
- Error rate global: < 1%.
- Webhooks Stripe procesados < 60 s p95.
- Disponibilidad mensual: >= 99.9%.

---

## 8) Riesgos de no ejecutar este plan

- Escalada de incidencias por crecimiento de usuarios.
- Riesgo de exposición de seguridad en rutas administrativas.
- Inconsistencias de facturación y soporte reactivo costoso.
- Coste operativo alto por baja observabilidad.

---

## 9) Entregables de auditoría V2

- Informe técnico por dominio con hallazgos y evidencia.
- Matriz de criticidad (Sev1/Sev2/Sev3) con priorización.
- Roadmap por olas con esfuerzo estimado y dependencias.
- Definición de KPIs/SLOs y dashboard mínimo.
- Checklist de “Go/No-Go” para pasar de plan a ejecución.

---

## 10) Checklist Go/No-Go (previo a implementación)

- Inventario técnico y mapa de arquitectura actualizado.
- Priorización aprobada por impacto/riesgo.
- Definición de SLOs y alertas base aprobadas.
- Plan de rollback por cambios críticos definido.
- Propietarios técnicos asignados por dominio.

---

## 11) Resultado esperado

Con este plan, CARVIPIX pasa de una infraestructura reactiva a una infraestructura **medible, segura, auditable y escalable**, reduciendo riesgo operativo y habilitando crecimiento sostenible sin tocar diseño, motor, estrategias ni backtesting.