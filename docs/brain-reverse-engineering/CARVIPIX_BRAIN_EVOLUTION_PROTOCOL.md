# CARVIPIX Brain Evolution Protocol (Aditivo, Evidencia-First)

Fecha de inicio: 2026-07-19
Estado: Activo
Alcance: Evolucion de inteligencia sin ruptura de arquitectura aprobada

## 0. Mandato Arquitectonico (Inmutable)

1. Se conserva arquitectura aprobada:
- un solo Cerebro
- una sola Senal Maestra
- ChatGPT como Analista Principal
- validadores solo para reglas objetivas
- un solo flujo para Alertas, Bot, Dashboard, Resultados y servicios

2. Restriccion estructural:
- toda mejora es aditiva
- no se elimina logica estable
- no se reemplazan modulos funcionales sin evidencia comparativa superior

3. Criterio de bloqueo:
- ninguna mejora entra en produccion por intuicion
- toda mejora requiere evidencia comparativa y no-regresion

## 1. Modelo de Gobierno de Cambios

Cada propuesta se registra como Brain Evolution Proposal (BEP) con este formato obligatorio:

- Problema que resuelve
- Valor agregado esperado
- Riesgo que elimina
- Riesgo que introduce
- Impacto en latencia
- Impacto en costo OpenAI
- Impacto en complejidad
- Impacto en mantenimiento
- Impacto esperado en calidad analitica
- Plan de evidencia (A/B, shadow, comparativa historica)

Estado BEP:
- DRAFT
- EXPERIMENT_READY
- SHADOW_RUNNING
- EVIDENCE_REVIEW
- APPROVED_FOR_INTEGRATION
- REJECTED

## 2. Framework de Evidencia (obligatorio para todas las fases)

### 2.1 KPIs primarios

- Precision direccional condicionada por clase de setup
- Calidad de decision (win rate ajustado a riesgo)
- Expectancy por senal
- Error de invalidacion (cuando debio decir NO_TRADE o WAIT)
- Estabilidad de decision bajo inputs equivalentes

### 2.2 KPIs operativos

- Latencia p50/p95 por analisis
- Costo OpenAI por analisis
- Tasa de respuestas verificadas sin reparacion
- Tasa de fallas de parser/verificador

### 2.3 Criterio de aceptacion minima

Una mejora solo se aprueba si simultaneamente:
- mejora KPI primario definido en BEP
- no degrada latencia p95 fuera del umbral acordado
- no degrada costo por analisis fuera del umbral acordado
- no rompe compatibilidad de salida/contratos existentes

## 3. Fases de Evolucion

## Fase 1 - Enriquecimiento de Expediente (aditivo)

Objetivo:
Aumentar densidad de evidencia util sin reducir la informacion actual.

Capas candidatas:
- jerarquia de evidencia (alta/media/baja)
- contradicciones criticas entre temporalidades
- regimen de mercado
- contexto causal
- contexto historico comparable
- calidad esperada de ejecucion
- calidad de spread y microestructura
- confianza por evidencia

Regla de implementacion:
- se agregan campos nuevos sin eliminar campos actuales
- se mantiene compatibilidad total con prompt y parser actuales

Evidencia requerida:
- comparativa de decisiones antes/despues en conjunto de escenarios congelado
- analisis de ganancia de consistencia y reduccion de decisiones ambiguas

## Fase 2 - Profundizacion de Pregunta Maestra

Objetivo:
Incrementar razonamiento util, no verbosity.

Capas candidatas:
- escenarios alternativos
- escenario contrario explicito
- evidencia dominante
- condiciones de invalidacion
- incertidumbre explicita
- conflicto temporalidad H1/M30/M5
- comparacion de hipotesis

Regla de implementacion:
- conservar filosofia central
- no reducir estructura
- no desplazar decisiones clave a reglas hardcode

Evidencia requerida:
- mayor calidad de argumentacion verificable
- menor contradiccion interna en respuestas
- mejora de calibracion decision/probabilidad

## Fase 3 - Scheduler Cognitivo (segunda capa)

Objetivo:
Agregar inteligencia de oportunidad sin reemplazar Scheduler Adaptativo vigente.

Capa nueva candidate:
- score de valor esperado de nueva informacion
- score de incertidumbre
- score de sensibilidad a evento (noticia, ruptura, volatilidad)

Regla de implementacion:
- scheduler actual permanece como baseline operativo
- capa cognitiva solo modifica prioridad de re-analisis bajo reglas de seguridad

Evidencia requerida:
- mejora medible en oportunidad de re-analisis
- sin aumento significativo de costo/latencia por analisis util

## Fase 4 - Memoria Semantica Complementaria

Objetivo:
Recordar escenarios analogos y su desenlace, sin reemplazar memoria operativa.

Regla de implementacion:
- memoria operativa existente permanece intacta
- memoria semantica solo agrega contexto comparativo

Evidencia requerida:
- mayor coherencia inter-escenario
- reduccion de decisiones inconsistentes en setups parecidos

## Fase 5 - Aprendizaje Posterior (post-mortem inteligente)

Objetivo:
Comparar analisis original vs resultado final para extraer conocimiento reusable.

Regla de implementacion:
- no hay auto-modificacion del Cerebro en caliente
- salida en reportes de conocimiento y recomendaciones

Evidencia requerida:
- deteccion util de ruido vs evidencia de alto valor
- trazabilidad de causa de acierto/error

## Fase 6 - Priorizacion de Oportunidades

Objetivo:
Mejor seleccion cuando hay sobreoferta de setups.

Criterios candidatos:
- calidad de ejecucion
- riesgo
- expectativa
- contexto y regimen
- incertidumbre

Regla de implementacion:
- no cambia estrategia
- no reemplaza clasificacion existente, la complementa

Evidencia requerida:
- mejora de expectativa ajustada a riesgo en ventanas de sobreoferta

## Fase 7 - Auditor del Cerebro

Objetivo:
Observador interno no invasivo para calidad de expediente, razonamiento y resultado.

Regla de implementacion:
- no interviene decisiones
- no altera salida
- solo monitorea, califica y reporta

Evidencia requerida:
- reportes de calidad accionables
- deteccion temprana de degradacion del razonamiento

## 4. Politica de No-Regresion

Cada BEP debe pasar:
- compatibilidad de contratos de salida
- pruebas funcionales existentes
- pruebas de estabilidad del flujo principal
- validacion de trazabilidad completa

Si una mejora degrada comportamiento validado:
- rollback de la capa nueva
- mantenimiento de capa base intacta

## 5. Estrategia de Despliegue Seguro

Secuencia obligatoria:
1. Shadow mode comparativo
2. Revision de evidencia
3. Integracion controlada por feature flag
4. Monitoreo reforzado
5. Aprobacion final

## 6. Priorizacion Inicial Recomendada

Orden de ejecucion por relacion impacto/riesgo:
1. Fase 1 (Expediente enriquecido)
2. Fase 2 (Pregunta maestra profunda)
3. Fase 5 (Aprendizaje posterior)
4. Fase 7 (Auditor del Cerebro)
5. Fase 3 (Scheduler cognitivo)
6. Fase 4 (Memoria semantica)
7. Fase 6 (Priorizacion de oportunidades)

Justificacion:
- primero subir calidad cognitiva del input a GPT
- luego cerrar loop de aprendizaje
- despues optimizar timing y priorizacion

## 7. Definicion de Exito del Programa

El programa se considera exitoso cuando:
- aumenta calidad analitica sin romper arquitectura
- mantiene estabilidad operativa del flujo actual
- mejora rentabilidad ajustada a riesgo atribuible a inteligencia
- conserva trazabilidad completa de decision

## 8. Regla de Oro Operativa

Toda mejora es aditiva.

Si una mejora requiere eliminar una parte estable del Cerebro, queda bloqueada hasta demostrar superioridad objetiva mediante evidencia comparativa reproducible.
