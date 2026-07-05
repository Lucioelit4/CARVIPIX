# CARVIPIX Manual de Incidentes

Objetivo: responder, contener y recuperar servicio con tiempos controlados.

## 1. Protocolo general de incidente

1. Declarar incidente y severidad.
2. Asignar responsable operativo.
3. Congelar cambios no criticos.
4. Ejecutar diagnostico inicial en menos de 15 minutos.
5. Activar procedimiento especifico segun tipo de fallo.

## 2. Caida de servidor

Deteccion:
- Healthcheck caido.
- Host inaccesible o servicios no disponibles.

Respuesta:
- [ ] Validar estado de host (red, disco, CPU, memoria).
- [ ] Validar contenedores (`docker compose ps`).
- [ ] Reiniciar servicios criticos de forma controlada.
- [ ] Revalidar `/api/health`.

Escalado:
- [ ] Si no recupera en 15 minutos, escalar a responsable de infraestructura.

## 3. Caida del broker

Deteccion:
- Fallo de conectividad de datos de broker.
- Timeouts o errores persistentes en fuente externa.

Respuesta:
- [ ] Confirmar si es incidente externo (broker/provider).
- [ ] Activar modo degradado operativo (sin cargas de riesgo nuevas).
- [ ] Mantener servidores atendiendo clientes y paneles.
- [ ] Reportar estado operativo a negocio.

Regla de arquitectura:
- [ ] No mover procesamiento heavy al servidor para compensar caida del broker.

## 4. Perdida de conexion

Deteccion:
- Cortes intermitentes en API o panel.

Respuesta:
- [ ] Verificar DNS, red y rutas internas.
- [ ] Verificar Nginx y conectividad entre servicios.
- [ ] Verificar salud de Redis/Postgres.
- [ ] Confirmar recuperacion estable por 15 minutos.

## 5. Fallo de API

Deteccion:
- Errores 5xx elevados.
- Latencia fuera de umbral.

Respuesta:
- [ ] Revisar logs de app en Loki.
- [ ] Revisar metricas en Grafana/Prometheus.
- [ ] Reiniciar servicio de app si aplica.
- [ ] Validar endpoint `/api/health` y flujo minimo funcional.

## 6. Fallo de base de datos

Deteccion:
- Errores de conexion o queries fallidas.

Respuesta:
- [ ] Validar estado de Postgres.
- [ ] Validar espacio en disco y locks.
- [ ] Intentar recuperacion de servicio DB.
- [ ] Si hay corrupcion o inconsistencia, ejecutar restore controlado.

Restore controlado:
- [ ] Seleccionar backup correcto.
- [ ] Restaurar en entorno controlado primero.
- [ ] Restaurar en objetivo y validar integridad.

## 7. Fallo de despliegue

Deteccion:
- Workflow manual falla o healthcheck post-deploy no pasa.

Respuesta:
- [ ] Revisar logs del workflow manual.
- [ ] Revisar salida de `docker compose pull/up`.
- [ ] Si no hay solucion inmediata, ejecutar rollback.

Rollback:
- [ ] Seleccionar imagen estable previa.
- [ ] Reaplicar `APP_IMAGE` estable.
- [ ] Validar healthcheck y flujo minimo.

## 8. Cierre y aprendizaje

- [ ] Registrar timeline del incidente.
- [ ] Registrar causa raiz preliminar.
- [ ] Definir acciones correctivas.
- [ ] Programar seguimiento y verificacion.

Referencias:
- `docs/checklists/RECOVERY_CHECKLIST.md`
- `docs/runbooks/RUNBOOK_INCIDENT_RESPONSE.md`
- `docs/runbooks/RUNBOOK_BACKUP_RESTORE.md`