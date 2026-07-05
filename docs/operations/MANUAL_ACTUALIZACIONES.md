# CARVIPIX Manual de Actualizaciones

Objetivo: actualizar plataforma sin afectar clientes, con autorizacion y validacion controlada.

## 1. Politica de actualizacion

- Las actualizaciones no se ejecutan por push automatico.
- La publicacion se realiza con workflow manual y aprobaciones.
- Cada cambio debe tener posibilidad de rollback inmediata.

## 2. Flujo oficial

1. Preparar version candidata.
2. Ejecutar CI completo.
3. Ejecutar pre-gate con checklist de preproduccion.
4. Ejecutar despliegue manual en staging.
5. Validar servicio y observabilidad.
6. Aprobar despliegue manual a produccion.
7. Ejecutar validacion post-deploy y cierre.

## 3. Procedimiento detallado

### 3.1 Antes de actualizar

- [ ] Build, TypeScript y lint en verde.
- [ ] Variables y secrets vigentes.
- [ ] Backup reciente confirmado.
- [ ] Version estable previa identificada.

### 3.2 Actualizacion en staging

- [ ] Ejecutar workflow `Deploy` por `workflow_dispatch` con `staging`.
- [ ] Validar healthcheck y flujo funcional minimo.
- [ ] Validar dashboards y logs sin degradacion.

### 3.3 Actualizacion en produccion

- [ ] Confirmar aprobacion operativa.
- [ ] Ejecutar workflow `Deploy` por `workflow_dispatch` con `prod`.
- [ ] Validar `/api/health`.
- [ ] Validar estabilidad por al menos 15 minutos.

### 3.4 Cierre

- [ ] Registrar version desplegada.
- [ ] Registrar hora de inicio y cierre.
- [ ] Registrar si hubo incidencias o rollback.

## 4. Criterios de no impacto a clientes

- Despliegue en ventana con monitoreo activo.
- Validacion inmediata de API y paginas criticas.
- Rollback inmediato si aparece degradacion severa.

## 5. Regla supercomputadora CARVIPIX

- Las actualizaciones de produccion no habilitan tareas heavy en servidores.
- Backtesting/investigacion/IA se mantienen en estacion local.

Referencias:
- `docs/checklists/GO_LIVE_CHECKLIST.md`
- `docs/checklists/PREPRODUCTION_CHECKLIST.md`
- `docs/checklists/RECOVERY_CHECKLIST.md`