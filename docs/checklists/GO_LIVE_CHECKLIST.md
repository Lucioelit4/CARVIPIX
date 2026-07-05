# CARVIPIX Go Live - Checklist Oficial

Objetivo: publicar una nueva version con autorizacion explicita, trazabilidad y opcion de rollback inmediato.

## 1. Pre-gate obligatorio

- [ ] Preproduccion completada (`docs/checklists/PREPRODUCTION_CHECKLIST.md`).
- [ ] Ventana de cambio aprobada por responsables.
- [ ] Imagen/version objetivo identificada y documentada.

## 2. Preparacion de release

- [ ] Ejecutar CI final sobre commit/tag objetivo.
- [ ] Confirmar que no hay migraciones pendientes no validadas.
- [ ] Confirmar que secretos y variables del entorno objetivo estan vigentes.
- [ ] Confirmar canal de comunicacion de incidente activo.

## 3. Publicacion controlada (sin automatismo por push)

- [ ] Lanzar workflow manual `Deploy` por `workflow_dispatch`.
- [ ] Seleccionar entorno (`staging` o `prod`) en el input del workflow.
- [ ] Esperar aprobaciones de entorno (GitHub environment protection).
- [ ] Verificar salida del job SSH y estado de `docker compose`.

## 4. Validacion post-deploy inmediata

- [ ] `curl -fsS http://localhost/api/health` exitoso en host objetivo.
- [ ] Aplicacion accesible desde endpoint publico esperado.
- [ ] Grafana/Prometheus/Loki reportan telemetria estable.
- [ ] No hay picos anormales de errores ni reinicios.

## 5. Validacion funcional minima

- [ ] Home carga correctamente.
- [ ] Flujo de alertas principal responde.
- [ ] Logs de app no muestran errores criticos repetidos.

## 6. Cierre de release

- [ ] Registrar hora de inicio/fin de publicacion.
- [ ] Registrar version desplegada e imagen efectiva.
- [ ] Registrar resultado final (success o rollback).
- [ ] Notificar cierre a stakeholders.

## 7. Regla supercomputadora CARVIPIX

- [ ] Confirmar que no se activo procesamiento heavy en produccion.
- [ ] Confirmar que cargas pesadas quedan asignadas a estacion local.

## Condicion de rollback inmediato

Si falla healthcheck, aparece degradacion severa o error funcional critico en validacion minima, ejecutar rollback sin esperar nuevas ventanas.