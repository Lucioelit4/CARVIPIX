# CARVIPIX Preproduccion - Checklist Oficial

Objetivo: validar que la plataforma esta lista para un primer despliegue real, sin ejecutar publicacion automatica.

Regla estructural obligatoria:
- El procesamiento pesado se ejecuta en la estacion de trabajo local.
- Los servidores de staging/produccion atienden trafico de clientes y servicios online.

## 1. Calidad de build

- [ ] `npm run build` finaliza sin errores.
- [ ] `npx tsc --noEmit` finaliza sin errores de TypeScript.
- [ ] `npm run lint` finaliza sin errores bloqueantes.

## 2. Docker y compose

- [ ] `docker compose -f docker-compose.local.yml config -q` valida sintaxis local.
- [ ] `docker compose -f docker-compose.staging.yml config -q` valida sintaxis staging.
- [ ] `docker compose -f docker-compose.prod.yml config -q` valida sintaxis produccion.
- [ ] Las rutas de volumen y archivos montados existen en servidor destino.

## 3. Variables y secretos

- [ ] `.env.staging` existe en servidor staging y no contiene placeholders `change-me`.
- [ ] `.env.production` existe en servidor produccion y no contiene placeholders `change-me`.
- [ ] Secrets de GitHub Actions existen: `DEPLOY_HOST`, `DEPLOY_PORT`, `DEPLOY_USER`, `DEPLOY_SSH_KEY`, `DEPLOY_APP_DIR`.
- [ ] Las credenciales de Grafana/Postgres/Redis son robustas y no reutilizadas.

## 4. Backups y restore

- [ ] Backup manual staging probado: `npm run backup:staging`.
- [ ] Backup manual produccion probado: `npm run backup:prod`.
- [ ] Restore probado en entorno controlado: `npm run restore:staging -- -BackupFile <archivo>`.
- [ ] DR drill ejecutado en ventana controlada: `npm run dr:drill:staging`.

## 5. Healthcheck y servicio

- [ ] Endpoint `/api/health` responde `200` en local.
- [ ] Endpoint `/api/health` responde `200` en staging tras despliegue de prueba.
- [ ] El healthcheck del contenedor `app` se mantiene healthy por al menos 10 minutos.

## 6. Monitoreo, logs y observabilidad

- [ ] Prometheus scrapea targets esperados (prometheus, node-exporter, cadvisor, blackbox).
- [ ] Loki recibe logs de contenedores clave.
- [ ] Grafana carga dashboard `CARVIPIX Overview`.
- [ ] Alertas minimas validadas (health down, CPU alta, restart spike).

## 7. CI/CD y control de cambios

- [ ] CI (`.github/workflows/ci.yml`) ejecuta build/lint correctamente.
- [ ] CD (`.github/workflows/deploy.yml`) solo se ejecuta por `workflow_dispatch`.
- [ ] Entorno GitHub `production` tiene protecciones (reviewers obligatorios).
- [ ] No existe paso de publicacion automatica por push directo.

## 8. Rollback readiness

- [ ] Existe tag o imagen previa estable para rollback.
- [ ] Procedimiento de rollback documentado y ensayado en staging.
- [ ] Tiempo de rollback objetivo definido (RTO operativo).

## 9. Modelo operativo CARVIPIX

- [ ] Jobs de backtesting masivo y tareas heavy se ejecutan en estacion local.
- [ ] Produccion no ejecuta pipelines heavy persistentes.
- [ ] La capacidad de servidores se reserva para solicitudes de clientes, API y panel.

## Criterio de salida

Se considera apto para primer despliegue real solo si todos los puntos estan marcados y firmados por responsable tecnico + responsable operativo.