# CARVIPIX Escalabilidad - Checklist Oficial

Objetivo: preparar crecimiento empresarial sin romper arquitectura actual.

Principio rector CARVIPIX:
- La estacion de trabajo local ejecuta procesamiento pesado (backtesting masivo, laboratorio, entrenamiento local).
- Los servidores online se enfocan en atender clientes, API y paneles.

## 1. Multiples servidores

- [ ] Definir topologia objetivo (staging/prod) con al menos 2 nodos de aplicacion.
- [ ] Definir estrategia de despliegue por nodo (rolling o blue/green).
- [ ] Definir sincronizacion de configuracion entre nodos.

## 2. Balanceadores

- [ ] Definir capa de balanceo (L4/L7) delante de servicios web.
- [ ] Configurar healthchecks del balanceador usando `/api/health`.
- [ ] Definir politica de drenado de conexiones para deploy/rollback.

## 3. Workers

- [ ] Separar workers de tareas online de procesos web principales.
- [ ] Definir cola/eventos para tareas asincronas de servidor.
- [ ] Limitar workers en produccion a tareas de cliente y operacion online.

## 4. Procesamiento pesado local

- [ ] Mantener jobs heavy en estacion local (`npm run heavy:local` y laboratorio local).
- [ ] Garantizar que produccion no ejecute jobs heavy continuos.
- [ ] Definir procedimiento para mover resultados heavy desde local hacia servicios online.

## 5. Crecimiento de usuarios

- [ ] Definir umbrales de capacidad (usuarios concurrentes, latencia, error rate).
- [ ] Definir trigger de escalado horizontal por metricas observables.
- [ ] Definir pruebas periodicas de carga para validar capacidad real.

## 6. Datos y estado

- [ ] Definir camino de evolucion a Postgres/Redis gestionados cuando escale trafico.
- [ ] Definir politica de backup/restore multi-nodo.
- [ ] Validar consistencia de sesion/cache al escalar replicas.

## 7. Observabilidad de escalado

- [ ] Definir dashboards de capacidad (CPU, memoria, latencia, throughput, errores).
- [ ] Definir alertas de saturacion previas a degradacion de servicio.
- [ ] Definir reporte semanal de tendencia de capacidad.

## 8. Seguridad y gobernanza

- [ ] Mantener despliegue manual autorizado para produccion.
- [ ] Mantener secrets centralizados y rotacion planificada.
- [ ] Mantener politicas de acceso minimo para operacion multi-servidor.

## Criterio de salida

Escalabilidad aprobada cuando el sistema puede crecer por replicas y balanceo sin mover cargas heavy al servidor de clientes.