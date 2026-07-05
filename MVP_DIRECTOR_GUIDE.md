# 👨‍💼 DIRECTOR: CÓMO USAR ESTOS DOCUMENTOS

**PARA EL DIRECTOR ÚNICAMENTE**

Este archivo es tu guía de cómo administrar los 4 especialistas usando la documentación congelada.

---

## DOCUMENTOS CREADOS

He creado **5 documentos maestros** que definen el MVP oficial:

| Documento | Audiencia | Uso | Tamaño |
|-----------|-----------|-----|--------|
| **MVP_ALCANCE_CONGELADO.md** | Todos | Fuente de verdad. Leer cuando tengas dudas | 60 KB |
| **MVP_RESUMEN_RAPIDO.md** | Todos | Lectura 2 min. QUÉ entra, QUÉ NO entra | 5 KB |
| **MVP_QUICK_START.md** | Especialistas | Mi misión en 5 min + comandos rápidos | 10 KB |
| **MVP_MATRIZ_TRACKING.md** | Director | Estado real. Actualizar diario. Trucker de progreso | 15 KB |
| **MVP_DELIVERABLES_CHECKLIST.md** | Director | QUÉ debe entregar cada especialista. Criterios aceptación | 25 KB |

---

## FLUJO PARA TI (Director)

### DÍA 1 (HOY - 3 Julio)

**Acción 1:** Lee esta secuencia
1. MVP_RESUMEN_RAPIDO.md (5 min)
2. MVP_ALCANCE_CONGELADO.md secciones Cores + Prohibiciones (15 min)
3. Este documento

**Acción 2:** Distribuir a especialistas
1. Envía a cada uno: `MVP_QUICK_START.md` (su sección específica)
2. Envía a todos: `MVP_RESUMEN_RAPIDO.md`
3. Diles: "Estos son tus requisitos. NADA más entra."

**Acción 3:** Decisiones CRÍTICAS por tomar HOY
- [ ] ¿Qué broker usar? (MT4, MT5, o IB?)
- [ ] ¿Qué database? (PostgreSQL o MongoDB?)
- [ ] ¿Quién provee credenciales broker?

### DIARIO (Excepto weekends)

**Mañana (9 AM):**
1. Reunión 30 min con especialistas
2. Preguntar status de cada uno
3. Actualizar: `MVP_MATRIZ_TRACKING.md`
4. Cualquier bloqueador nuevo?

**EOD (6 PM):**
1. Revisar commits del día
2. Verificar: `npm run build` PASS en cada commit
3. Actualizar estado en MVP_MATRIZ_TRACKING.md

### SEMANALMENTE (Viernes)

1. Leer completamente: `MVP_MATRIZ_TRACKING.md`
2. ¿Qué se completó esta semana?
3. ¿Qué está bloqueado?
4. Comunicar a team: Status + blockers

---

## CÓMO RESPONDER PREGUNTAS

### Especialista pregunta: "¿Puedo agregar feature X?"

**Tu respuesta:**
1. Abre: `MVP_ALCANCE_CONGELADO.md`
2. Busca feature X
3. Si está: "Sí, está en la lista"
4. Si NO está: "No, esa feature NO entra en MVP"
5. Si duda: "Remítete a PROHIBICIONES section"

### Especialista pregunta: "¿Cuándo delivery entrega Y?"

**Tu respuesta:**
1. Abre: `MVP_DELIVERABLES_CHECKLIST.md`
2. Encuentra su especialidad
3. Lee: "TIER 1 - CRÍTICO"
4. Dale esa lista

### Especialista dice: "Estoy bloqueado por X"

**Tu respuesta:**
1. Abre: `MVP_MATRIZ_TRACKING.md` → DEPENDENCIAS BLOQUEANTES
2. Si X está listado: "Conocido. ETA: Y"
3. Si X NO está: "Escúchame, específicamente"
4. Actualiza tabla de bloqueadores

---

## CHECKLIST: ESTÁ TODO LISTO?

### ✅ Antes de decir "MVP está congelado"

- [ ] Todos los 4 especialistas tienen MVP_QUICK_START.md
- [ ] Todos los 4 saben sus módulos asignados
- [ ] Todos los 4 saben qué NO entra
- [ ] Decisiones broker + database tomadas
- [ ] Credenciales provisionales solicitadas
- [ ] Primer commit scheduled para lunes

### ✅ Si alguien propone agregar algo

1. Dile: "Está fuera de scope MVP"
2. Remítelo a: MVP_ALCANCE_CONGELADO.md → PROHIBICIONES
3. Abre issue para V1.1 roadmap (post-MVP)
4. "Ahora, enfócate en tu module asignado"

---

## TRACKING DIARIO — QUIN USAR PARA UPDATES

**MVP_MATRIZ_TRACKING.md** es tu herramienta principal.

```
Cada mañana:
1. Abre MVP_MATRIZ_TRACKING.md
2. Ve qué dice "🟡 EN PROGRESO"
3. Pregunta al especialista: ¿Qué lograste ayer?
4. Actualiza % completado
5. Si algo cambió de ❌ → 🟡 o 🟡 → ✅, marca y date cuenta

Cada EOD:
1. Especialistas hacen commit
2. Verifica: `npm run build` PASS
3. Actualiza la línea de ese módulo
```

### Estados Permitidos
- ✅ LISTO (implementado, testeado, compilado)
- 🟡 EN PROGRESO (alguien trabaja ahora)
- ❌ PENDIENTE (esperando requisitos o no comenzó)

**REGLA:** Si algo está 🟡 hace >5 días, pregunta: "¿Qué espera para terminar?"

---

## DECISIONES QUE SOLO TÚ PUEDES TOMAR

### CRÍTICAS (Debes decidir HOY)

| Decisión | Opciones | Impacto | Deadline |
|----------|----------|--------|----------|
| **Broker** | MT4, MT5, IB | Gates + Data Int todo depende | HOY |
| **Database** | PostgreSQL, MongoDB | Data Int todo depende | HOY |
| **Economic Calendar** | ForexFactory, TradingEcon | Gates depends | HOY |
| **Quién provee credenciales** | Usuarios, Director, Team | Sin esto, nadie puede empezar | HOY |

### IMPORTANTES (Esta semana)

| Decisión | Opciones | Impacto | Deadline |
|----------|----------|--------|----------|
| **Histórico de dónde** | HistData.com, otros | Backtesting puede esperar | Lunes |
| **Vercel domain personalizado** | carvipix.vercel.app o tuyo | Deployment | Viernes |
| **Production database** | Local dev o cloud | Data Int | Miércoles |

---

## MÉTRICAS DE ÉXITO (Track estos)

### Diaria
- `npm run build`: ✅ DEBE pasar siempre
- Console errors: 0
- TypeScript errors: 0

### Semanal
- Módulos completados: Track en MVP_MATRIZ_TRACKING.md
- Commits: 3-5 significativos/semana/especialista
- Blockers resueltos: Si X está bloqueado, ¿tienes fecha de resolución?

### Biweekly (14 días)
- Motor V2 validado en backtest (WIN RATE, Profit Factor)
- Broker API conectado
- Database with histórico
- Deployment successful

### Objetivo Final
**15 Julio 2026:** MVP LIVO en Vercel

---

## RIESGOS A MONITOREAR

### RIESGO 1: Scope Creep
**Síntoma:** Alguien dice "¿Puedo agregar...?"  
**Acción:** Remítelo a MVP_ALCANCE_CONGELADO.md  
**Prevención:** Refuerza "Alcance congelado" en día 1

### RIESGO 2: Build se Rompe
**Síntoma:** `npm run build` falla  
**Acción:** Detén trabajo inmediato. Arregla. NO commits hasta ✅  
**Prevención:** Requiere `npm run build` PASS antes de cada commit

### RIESGO 3: Especialista Bloqueado
**Síntoma:** "No puedo avanzar sin X"  
**Acción:** Busca X en MVP_MATRIZ_TRACKING.md → Tabla de dependencias  
**Prevención:** Identifica blockers día 1, elimina early

### RIESGO 4: Broker Credentials Falta
**Síntoma:** Data Int + Gates esperando credenciales  
**Acción:** CRASH si esperas. Usa mock data hasta conseguir reales  
**Prevención:** Solicita credenciales HOY

### RIESGO 5: Vercel Deploy Falla
**Síntoma:** `git push` pero Vercel deployment error  
**Acción:** Revisa Vercel logs. Rollback si necesario  
**Prevención:** Test en localhost:3000 ANTES de push

---

## REUNIÓN KICK-OFF (HOY, sugerida)

Aquí está qué decir a los 4 especialistas:

---

**GUIÓN KICK-OFF:**

"Equipo, aquí está el plan:

**El MVP es CONGELADO.** Nada más entra. Léan esto:
- MVP_RESUMEN_RAPIDO.md (2 minutos)
- Su sección en MVP_QUICK_START.md (5 minutos)

**Ustedes tienen módulos ESPECÍFICOS:**
- GATES: Broker API + ATR + Gates validation
- BACKTESTING: Validar Motor V2 vs V1 + Metrics
- DATA_INT: Database + Broker connector + Historical storage
- DEPLOY: Compilación, testing, Vercel

**Nada de scope creep.** Si no está en MVP_ALCANCE_CONGELADO.md, no lo hacen.

**Timeline:** 15 de Julio = LIVE. Trabajamos hacia atrás.

**Checklist de éxito:**
- ✅ npm run build: SIEMPRE PASS
- ✅ Commits: Significativos con buenos mensajes
- ✅ Documentación: Cada módulo tiene su README
- ✅ No rompen lo existente

Preguntas?"

---

## TEMPLATE: STATUS UPDATES (Mandar diario)

**Para:**  Gates, Backtesting, Data Int, Deploy  
**Asunto:** Daily MVP Status - [Date]

---
**GATES SPECIALIST:**
- [ ] Broker connection status?
- [ ] ATR calculator progress?
- [ ] Any blockers?
- [ ] Documento actualizado?

**BACKTESTING SPECIALIST:**
- [ ] Histórico descargado?
- [ ] Primer backtest ejecutado?
- [ ] V2 vs V1 comparado?
- [ ] Documento actualizado?

**DATA INTEGRATION:**
- [ ] Database schema finalizado?
- [ ] Primer broker conectado?
- [ ] Data validation OK?
- [ ] Documento actualizado?

**DEPLOYMENT:**
- [ ] npm run build: PASS?
- [ ] npm run dev: Funciona?
- [ ] Commits hoy: ¿Cuántos?
- [ ] Vercel: Status OK?

---

## FINAL CHECK — EOD 14 de Julio

**Antes de lanzar día 15, verifica:**

```
GATES:
  ✅ Broker API funciona
  ✅ ATR calculator funciona
  ✅ Gates validando con datos reales
  ✅ npm run build PASS
  
BACKTESTING:
  ✅ Backtest V2 ejecutado
  ✅ Métricas calculadas
  ✅ V2 mejor que V1 (≥15%)
  ✅ Documento completo
  
DATA INTEGRATION:
  ✅ Broker conectado
  ✅ Database funciona
  ✅ Data validation OK
  ✅ Error handling OK
  
DEPLOYMENT:
  ✅ Local testing PASS
  ✅ Build PASS
  ✅ Vercel PASS
  ✅ URL live funciona
  
MOTOR CORE:
  ✅ TypeScript: 0 errores
  ✅ Build: 3.8s
  ✅ Routes: 39/39 prerendered
  ✅ Console: 0 errors
```

Si TODOS están ✅:

```bash
git add .
git commit -m "MVP FINAL: Motor V2, Gates, Backtesting, Deployment"
git push origin main
# Vercel auto-deploys
# 🚀 LAUNCH
```

---

## RECURSOS RÁPIDOS

| Pregunta | Documento | Sección |
|----------|-----------|---------|
| ¿Qué entra en MVP? | MVP_ALCANCE_CONGELADO.md | Modules section |
| ¿Qué NO entra? | MVP_ALCANCE_CONGELADO.md | PROHIBICIONES |
| ¿Cuál es mi rol? | MVP_QUICK_START.md | Tu especialidad |
| ¿Qué debo entregar? | MVP_DELIVERABLES_CHECKLIST.md | Tu especialidad |
| ¿Dónde estamos? | MVP_MATRIZ_TRACKING.md | Estado actual |
| ¿Qué hago primero? | MVP_QUICK_START.md | Tareas en orden |

---

**Buenas suerte. El MVP está congelado. La entrega es 15 de Julio.** 🚀

**Cree en el equipo.**

---

Versión: 1.0  
Fecha: 3 de Julio 2026  
Autor: Sistema de Documentación MVP  
Próxima revisión: EOD 10 Julio
