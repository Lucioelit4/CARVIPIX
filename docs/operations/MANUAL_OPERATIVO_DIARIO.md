# CARVIPIX Manual Operativo Diario

Objetivo: ejecutar la operacion diaria de forma estandarizada y trazable.

Principio de arquitectura obligatorio:
- Supercomputadora local: backtesting, investigacion, optimizacion, IA, procesamiento pesado.
- Servidores online: atencion de clientes, API, paneles y servicios en tiempo real.

## 1. Inicio del sistema

### 1.1 Inicio local (operacion interna y observabilidad)

```powershell
npm run infra:up:local
```

### 1.2 Verificacion inicial de servicios locales

- App: http://localhost:3010
- Grafana: http://localhost:3001
- Prometheus: http://localhost:9090
- Blackbox: http://localhost:9115

Checklist de arranque:
- [ ] App responde en `/api/health`.
- [ ] Grafana abre dashboard base.
- [ ] Prometheus muestra targets en estado UP.
- [ ] Loki recibe logs recientes.

## 2. Verificacion de servicios en entorno remoto

En staging o produccion (sin desplegar):

- [ ] Verificar estado de contenedores con `docker compose ps`.
- [ ] Verificar endpoint de salud con `curl -fsS http://localhost/api/health`.
- [ ] Verificar que no hay reinicios anormales.

## 3. Revision de logs

Frecuencia recomendada: 3 veces al dia (inicio, mitad, cierre).

- [ ] Revisar errores de aplicacion en Loki.
- [ ] Revisar warnings repetidos por servicio.
- [ ] Correlacionar errores con eventos de infraestructura.
- [ ] Registrar incidencias relevantes en bitacora diaria.

## 4. Monitoreo operativo

Metricas minimas a revisar:

- [ ] Health probe estable.
- [ ] CPU host dentro de rango operativo.
- [ ] Memoria de contenedores sin crecimiento anormal.
- [ ] Reinicios de contenedores en cero o dentro de umbral.

Alertas criticas:

- [ ] Health endpoint down.
- [ ] CPU sostenida alta.
- [ ] Restart spike.

## 5. Backups diarios

Ejecucion manual recomendada al cierre operativo:

```powershell
npm run backup:staging
```

Para produccion segun ventana aprobada:

```powershell
npm run backup:prod
```

Validaciones:
- [ ] Archivo de backup creado y no vacio.
- [ ] Nombre y timestamp correctos.
- [ ] Registro en bitacora diaria.

## 6. Cierre diario

- [ ] Verificar estado final de salud del servicio.
- [ ] Confirmar backup diario ejecutado o programado.
- [ ] Confirmar que no hay incidentes abiertos sin owner.
- [ ] Actualizar bitacora diaria con estado general.
- [ ] Confirmar que no se ejecutaron cargas heavy en servidores online.

## 7. Reglas de no contradiccion operativa

- No ejecutar despliegues por push automatico.
- Cualquier despliegue se rige por workflow manual y checklists oficiales.
- Cualquier incidente se rige por el manual de incidentes.

Referencias:
- `docs/checklists/PREPRODUCTION_CHECKLIST.md`
- `docs/checklists/GO_LIVE_CHECKLIST.md`
- `docs/checklists/RECOVERY_CHECKLIST.md`