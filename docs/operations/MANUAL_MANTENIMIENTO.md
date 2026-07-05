# CARVIPIX Manual de Mantenimiento

Objetivo: mantener operacion estable mediante rutina diaria, semanal y mensual.

## 1. Tareas diarias

- [ ] Verificar estado de salud (`/api/health`).
- [ ] Verificar estado de contenedores y reinicios.
- [ ] Revisar alertas criticas de observabilidad.
- [ ] Revisar logs de errores repetidos.
- [ ] Confirmar backup diario ejecutado o programado.
- [ ] Registrar estado en bitacora.

## 2. Tareas semanales

- [ ] Ejecutar validacion de restore en entorno controlado.
- [ ] Revisar tendencia de CPU/memoria/latencia.
- [ ] Revisar crecimiento de volumen de logs.
- [ ] Revisar uso de disco en host y volumenes.
- [ ] Revisar higiene de imagenes docker (prune controlado).
- [ ] Revisar estado de secretos y proximidad de rotacion.

## 3. Tareas mensuales

- [ ] Ejecutar DR drill documentado con tiempos reales.
- [ ] Revisar politicas de retencion de backups.
- [ ] Revisar umbrales de alertas y ajustarlos si es necesario.
- [ ] Revisar capacidad para crecimiento de usuarios.
- [ ] Revisar cumplimiento de flujo manual de despliegue.
- [ ] Actualizar checklists y manuales si hubo cambios operativos.

## 4. Ventanas y gobernanza

- Las tareas de riesgo medio/alto deben ejecutarse en ventana aprobada.
- Cualquier cambio debe tener criterio de rollback definido.
- Todo mantenimiento debe quedar en bitacora operativa.

## 5. Regla supercomputadora CARVIPIX

- El mantenimiento de servidores no incluye ejecucion de tareas heavy.
- El mantenimiento de procesos heavy pertenece a la estacion local.

Referencias:
- `docs/operations/MANUAL_OPERATIVO_DIARIO.md`
- `docs/operations/MANUAL_INCIDENTES.md`
- `docs/checklists/SCALABILITY_CHECKLIST.md`