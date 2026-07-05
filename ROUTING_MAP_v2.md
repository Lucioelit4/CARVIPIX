# 🗺️ ROUTING CANÓNICO MVP v2

**Versión:** 2.0  
**Actualizado:** 3 Julio 2026  
**Autoridad:** MVP_ALCANCE_CONGELADO_v2.md

---

## 📋 PRINCIPIOS DE ROUTING

1. **Una ruta canónica por módulo** — No hay rutas duplicadas
2. **Rutas internas protegidas** — `/engine`, `/api` no son públicas
3. **Redirecciones permanentes** — Rutas antiguas redirigen, no 404
4. **Claridad de niveles** — Ruta refleja módulo y su nivel funcional

---

## ✅ NIVEL 1 — PÚBLICO 100% FUNCIONAL

| Ruta Canónica | Módulo | Estado | Redirecciones Antiguas |
|---|---|---|---|
| `/` | Home | ✅ Listo | N/A |
| `/alertas` | Alertas Dashboard | ✅ Listo | N/A |
| `/bot` | Bot Panel | ✅ Listo | `/bot-carvipix` → `/bot` |
| `/fondeo` | Programa Fondeo | ✅ Listo | `/programa-de-fondeo` → `/fondeo` |
| `/resultados` | Resultados/Equity | ✅ Listo | N/A |
| `/dashboard` | Dashboard Usuario | ✅ Listo | N/A |
| `/servicios/bot` | Landing Bot | ✅ Listo | N/A |
| `/servicios/capital` | Landing Capital | ✅ Listo | N/A |
| `/servicios/fondeo` | Landing Fondeo | ✅ Listo | N/A |
| `/checkout` | Checkout/Pagos | ✅ Listo | N/A |
| `/perfil` | Perfil Usuario | ✅ Listo | N/A |

---

## 🟡 NIVEL 2 — PÚBLICO + BETA (60-80% Funcional)

| Ruta Canónica | Módulo | Estado | Redirecciones Antiguas |
|---|---|---|---|
| `/gestion-capital` | Gestión Capital | 🟡 Beta | `/capital` → `/gestion-capital` |
| `/capital` | ⚠️ DEPRECADA | — | Redirige a `/gestion-capital` |

---

## 🔜 NIVEL 3 — PRÓXIMAMENTE (0-40% Funcional)

| Ruta Canónica | Módulo | Estado | Acceso |
|---|---|---|---|
| `/academia` | Academia | 🔜 Próximamente | Público (banner "Próximamente") |
| `/herramientas` | Herramientas | 🔜 Próximamente | Público (banner "Próximamente") |
| `/comunidad` | Comunidad | 🔜 Próximamente | Público (banner "Próximamente") |
| `/soporte` | Centro Ayuda | 🔜 Próximamente | Público (banner "Próximamente") |

---

## 🔐 NIVEL 4 — ADMIN ONLY (Restringido)

| Ruta Canónica | Módulo | Estado | Acceso | Protección |
|---|---|---|---|---|
| `/admin` | Admin Dashboard | 🔐 Admin | Admin only | Auth gate |
| `/dashboard` | User Dashboard | ✅ Listo | Auth usuarios | Auth gate |

---

## 🚫 RUTAS INTERNAS (NO PÚBLICAS)

| Ruta | Propósito | Estado | Acceso | Notas |
|---|---|---|---|---|
| `/engine` | Infraestructura trading | 🔐 Interno | Admin only | Redirige a `/admin` si no autorizado |
| `/engine/progreso` | Monitoreo motor | 🔐 Interno | Admin only | Redirige a `/admin` si no autorizado |
| `/api/**` | Endpoints REST | 🔐 Interno | Server-side only | No accesible directamente |
| `/backend/**` | Backend services | 🔐 Interno | Server-side only | No accesible directamente |
| `/workers/**` | Background jobs | 🔐 Interno | Server-side only | No accesible directamente |

---

## 📊 RUTAS ANALIZADAS — CONSOLIDACIÓN

### Rutas Actualmente Duplicadas ✅ RESUELTO

```
ANTES:
/bot ✅
/bot-carvipix → REDUNDANTE
DESPUÉS:
/bot ✅ (canónica)
/bot-carvipix → redirige a /bot
```

```
ANTES:
/fondeo ✅
/programa-de-fondeo → REDUNDANTE
DESPUÉS:
/fondeo ✅ (canónica)
/programa-de-fondeo → redirige a /fondeo
```

```
ANTES:
/gestion-capital ✅
/gestion-de-capital → REDUNDANTE
/capital → HUÉRFANA
DESPUÉS:
/gestion-capital ✅ (canónica)
/capital → redirige a /gestion-capital
/gestion-de-capital → redirige a /gestion-capital
```

```
ANTES:
/analisis ✅
/analisis-diario → REDUNDANTE
DESPUÉS:
/analisis ✅ (canónica)
/analisis-diario → redirige a /analisis
```

### Rutas Internas Protegidas ✅ RESUELTO

```
/engine → Redirige a /admin con mensaje
/engine/progreso → Redirige a /admin con mensaje
```

---

## 🔧 CONFIGURACIÓN NEXT.JS

**Archivo:** `next.config.ts`

```typescript
redirects: async () => [
  // NIVEL 1 → CONSOLIDAR DUPLICADOS
  { source: "/bot-carvipix", destination: "/bot", permanent: true },
  { source: "/programa-de-fondeo", destination: "/fondeo", permanent: true },
  { source: "/gestion-de-capital", destination: "/gestion-capital", permanent: true },
  { source: "/capital", destination: "/gestion-capital", permanent: true },
  { source: "/analisis-diario", destination: "/analisis", permanent: true },
  
  // INTERNAS → PROTEGER
  { source: "/engine", destination: "/admin", permanent: false },
  { source: "/engine/progreso", destination: "/admin", permanent: false },
];
```

---

## ✅ VALIDACIÓN POST-IMPLEMENTACIÓN

```bash
# Test 1: Build compila sin errores
npm run build
# Expected: ✅ success, 0 errors

# Test 2: 18 rutas públicas canónicas
npm run build 2>&1 | grep "Route"
# Expected: 18 static pages, no duplicates

# Test 3: Redirecciones funcionan
curl -L http://localhost:3000/bot-carvipix -I
# Expected: 301 to /bot, final 200 OK

# Test 4: Rutas internas redirigen
curl -L http://localhost:3000/engine -I
# Expected: 302 to /admin
```

---

## 📋 ESTADO POR ESPECIALISTA

| Especialista | Impacto | Acción |
|---|---|---|
| Especialista 2 (Frontend) | ✅ Sin cambios | No requiere cambios |
| Especialista 3 (Backend) | ✅ Sin cambios | No requiere cambios |
| Especialista 5 (Gates) | ✅ Sin cambios | No requiere cambios |
| Especialista 6 (Backtesting) | ✅ Sin cambios | No requiere cambios |
| Especialista 7 (Data Int) | ✅ Sin cambios | No requiere cambios |
| Especialista 8 (Deploy) | 🔧 Implementar | Actualizar next.config.ts + tests |

---

## 🎯 OBJETIVO FINAL

✅ Una ruta canónica por módulo  
✅ Rutas antiguas redirigen (no 404)  
✅ Rutas internas protegidas  
✅ Build pasa sin errores  
✅ 18 módulos v2 = 18 rutas públicas claras  

---

**Versión:** 2.0  
**Autoridad:** Guardián Arquitectónico + MVP v2  
**Próxima revisión:** EOD 3 Julio (post-implementación)
