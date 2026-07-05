# CARVIPIX Recuperacion - Checklist Oficial

Objetivo: recuperar servicio de forma controlada ante incidentes operativos.

## Escenarios cubiertos

- Caida total/parcial de servidor.
- Fallo de despliegue.
- Rollback de version.
- Restauracion de datos.
- Recuperacion integral del servicio.

## 1. Activacion de incidente

- [ ] Declarar incidente y asignar responsable operativo.
- [ ] Congelar cambios no esenciales.
- [ ] Abrir canal de comunicacion y timeline.

## 2. Caida del servidor

- [ ] Verificar estado del host (red, disco, CPU, memoria).
- [ ] Verificar estado de contenedores (`docker compose ps`).
- [ ] Intentar recuperacion de servicios criticos (app, postgres, redis, nginx).
- [ ] Ejecutar healthcheck local del host (`/api/health`).

## 3. Fallo de despliegue

- [ ] Revisar log del workflow de deploy.
- [ ] Revisar salida de `docker compose pull/up` en host.
- [ ] Identificar punto exacto de fallo (imagen, red, variables, permisos).
- [ ] Si no hay solucion rapida, iniciar rollback.

## 4. Rollback

- [ ] Seleccionar ultima imagen estable validada.
- [ ] Actualizar `APP_IMAGE` a version estable.
- [ ] Ejecutar `docker compose up -d --remove-orphans` con version estable.
- [ ] Validar healthcheck y funcionalidad minima.

## 5. Restauracion de datos

- [ ] Identificar backup correcto por fecha/hora.
- [ ] Ejecutar restore en entorno controlado primero.
- [ ] Ejecutar restore en entorno objetivo con ventana aprobada.
- [ ] Verificar consistencia con consultas de validacion.

## 6. Recuperacion del servicio

- [ ] Confirmar app estable por al menos 15 minutos.
- [ ] Confirmar monitoreo y logs normales.
- [ ] Confirmar que usuarios pueden operar flujo principal.
- [ ] Cerrar incidente con causa raiz preliminar.

## 7. Post-incidente

- [ ] Completar informe de incidente (impacto, tiempo, causa).
- [ ] Definir acciones correctivas y preventivas.
- [ ] Programar DR drill adicional si hubo restauracion real.

## 8. Regla supercomputadora CARVIPIX

- [ ] Recuperacion prioriza restaurar servicio cliente en servidores.
- [ ] Procesamiento pesado permanece en estacion local durante y despues del incidente.