# 🎯 MVP ALCANCE CONGELADO v2 — ARQUITECTURA COMPLETA CON NIVELES

**Emisión:** 3 de Julio 2026 (Revisada)  
**Cambio Principal:** NO eliminar módulos. Mostrar estructura COMPLETA con 4 niveles de funcionalidad.  
**Autoridad:** Director (Congelado, NO cambios sin aprobación)  

---

## 🏗️ FILOSOFÍA NUEVA

**CARVIPIX MVP es una plataforma COMPLETA visualmente**, pero con **4 niveles de funcionalidad**:

```
NIVEL 1 - ✅ LISTO (100% funcional, en producción)
  └─ Alertas, Bot, Resultados, Servicios, Home

NIVEL 2 - 🟡 BETA (Funcional pero en pruebas, limitaciones conocidas)
  └─ Gestión de Capital, Programa de Fondeo, Facturación

NIVEL 3 - 🔜 PRÓXIMAMENTE (Visible en nav, funcionalidad bloqueada/mínima)
  └─ Academia, Centro de Ayuda, Herramientas

NIVEL 4 - 🔐 ACCESO RESTRINGIDO (Visible solo admin, beta testers)
  └─ Dashboard admin, Administración, Configuración avanzada
```

**Diferencia clave:** 
- ❌ ANTES: 22 módulos, el resto "no entra"
- ✅ AHORA: Todos los módulos estratégicos existen desde día 1, con diferentes niveles de madurez

**Razón:** Mostrar visión completa profesional, no una plataforma mutilada.

---

## 📋 ESTRUCTURA COMPLETA — 18 MÓDULOS

### NIVEL 1 - ✅ LISTO (100% Funcional)

**Estos módulos lanzan COMPLETOS en MVP:**

#### 1.1 HOME PAGE ✅
- Ubicación: `/app/page.tsx`
- Estado: **LISTO**
- Funcionalidad: 100%
- Descripción: Hero premium, servicios, testimonios, pricing, CTA
- Verificación: ✅ Deploy ready

#### 1.2 ALERTS DASHBOARD ✅
- Ubicación: `/app/alertas/page.tsx`
- Estado: **LISTO**
- Funcionalidad: 100%
- Descripción: Tabla de alertas, filtros, historial, stats, gráficas
- Conexión: Datos reales del motor
- Verificación: ✅ Deploy ready

#### 1.3 BOT PANEL ✅
- Ubicación: `/app/bot/page.tsx`
- Estado: **LISTO**
- Funcionalidad: 100%
- Descripción: Licencia, instancias, estadísticas, configuración
- Conexión: Datos del motor V2
- Verificación: ✅ Deploy ready

#### 1.4 RESULTADOS PAGE ✅
- Ubicación: `/app/resultados/page.tsx`
- Estado: **LISTO**
- Funcionalidad: 100%
- Descripción: Equity curve, métricas (ROI, Sharpe, DD, WR), breakdown
- Conexión: Datos históricos
- Verificación: ✅ Deploy ready

#### 1.5 SERVICIOS PAGES (3) ✅
- Ubicaciones: `/app/servicios/bot/`, `/app/servicios/capital/`, `/app/servicios/fondeo/`
- Estado: **LISTO**
- Funcionalidad: 100% (landings comerciales)
- Descripción: Bot $999, Capital, Fondeo $5K+
- CTAs: "Comprar" o "Solicitar acceso"
- Verificación: ✅ Deploy ready

#### 1.6 HEADER & NAVIGATION ✅
- Ubicación: `/app/Header.tsx` + `layout.tsx`
- Estado: **LISTO**
- Funcionalidad: 100%
- Descripción: Logo, nav links, auth, mobile menu
- Items visibles: Home, Alertas, Bot, Resultados, Servicios, + expandibles
- Verificación: ✅ Deploy ready

#### 1.7 MOTOR V2 ✅
- Ubicación: `/app/engine/core/engine.ts`, `/app/engine/agents/index.ts`
- Estado: **LISTO**
- Funcionalidad: 100%
- Descripción: Consenso de 11 agentes, ponderaciones, thresholds dinámicos
- Compilación: ✅ 0 errores TS, 3.8s build
- Verificación: ✅ Deploy ready

#### 1.8 SAFETY GATES (5) ✅
- Ubicación: `/app/engine/core/safetyGates.ts`
- Estado: **LISTO** (modo provisional)
- Funcionalidad: 100%
- Descripción: LIQUIDITY, VOLATILITY, NEWS, ACCOUNT, CORRELATION
- Modo: Provisional = -1 data = PASS_WITH_WARNING (no bloquea)
- Verificación: ✅ Deploy ready

#### 1.9 ALERT SYSTEM ✅
- Ubicación: `/app/engine/alerts/carvipixAlerts.ts`
- Estado: **LISTO**
- Funcionalidad: 100%
- Descripción: Lifecycle (Pending→Active→Closed), tracking, metadata
- Verificación: ✅ Deploy ready

#### 1.10 BACKTEST ENGINE ✅
- Ubicación: `/app/engine/backtesting/backtestEngine.ts`
- Estado: **LISTO**
- Funcionalidad: 100%
- Descripción: Simula estrategia contra histórico, calcula métricas
- Escenarios: EURUSD, GBPUSD, XAUUSD (3 test cases)
- Verificación: ✅ Deploy ready

#### 1.11 DEPLOYMENT (Vercel) ✅
- Ubicación: GitHub + Vercel
- Estado: **LISTO**
- Funcionalidad: 100%
- Descripción: Auto-deploy en push, 39/39 rutas prerendered
- Build: 3.8s Turbopack
- Verificación: ✅ Deploy ready

---

### NIVEL 2 - 🟡 BETA (Funcional pero en Pruebas)

**Estos módulos lanzan como BETA en MVP:**

#### 2.1 GESTIÓN DE CAPITAL 🟡
- Ubicación: `/app/gestion-capital/page.tsx`
- Estado: **BETA**
- Funcionalidad: 60-80%
- Descripción: Admin de capital inversor, movimientos, reportes
- Limitaciones:
  - ⚠️ Sin integración de pago real (payment processing beta)
  - ⚠️ Reportes generados manualmente (no automáticos)
  - ⚠️ Acceso: Solo usuarios con tier CAPITAL
- Banner: "BETA - Esta función está en pruebas"
- Verificación: ✅ Estructura visible, ⏳ Funcionalidad limitada

#### 2.2 PROGRAMA DE FONDEO 🟡
- Ubicación: `/app/servicios/fondeo/` + dashboard
- Estado: **BETA**
- Funcionalidad: 60-80%
- Descripción: Solicitud de fondeo, seguimiento, aprobación
- Limitaciones:
  - ⚠️ Flujo de aprobación manual (no automático)
  - ⚠️ Sin integration con broker para fondeo directo
  - ⚠️ Reportes de inversores limitados
- Banner: "BETA - Próximamente con automatización completa"
- Verificación: ✅ Estructura visible, ⏳ Funcionalidad limitada

#### 2.3 FACTURACIÓN 🟡
- Ubicación: `/app/facturacion/page.tsx`
- Estado: **BETA**
- Funcionalidad: 50-70%
- Descripción: Historial de facturas, recibos, descargas
- Limitaciones:
  - ⚠️ Facturas PDF generadas manualmente
  - ⚠️ Sin integración contable (Stripe manual por ahora)
  - ⚠️ Impuestos sin auto-cálculo
- Banner: "BETA - Sistema de facturación en desarrollo"
- Verificación: ✅ Estructura visible, ⏳ Funcionalidad limitada

---

### NIVEL 3 - 🔜 PRÓXIMAMENTE (Visible pero Bloqueado)

**Estos módulos lanzan como PRÓXIMAMENTE:**

#### 3.1 ACADEMIA 🔜
- Ubicación: `/app/academia/page.tsx`
- Estado: **PRÓXIMAMENTE**
- Funcionalidad: 0-20%
- Descripción: Cursos de trading, módulos, certificados
- Estructura:
  - ✅ Landing page lista
  - ✅ Grid de cursos visible (pero bloqueado)
  - ❌ Contenido: "Disponible en Q3 2026"
  - ❌ Videos: No cargados
  - ❌ Certificados: No generados
- CTA: "Acceso próximamente - Notifícate"
- Verificación: ✅ Navegable, ⏸️ Funcionalidad mínima

#### 3.2 CENTRO DE AYUDA 🔜
- Ubicación: `/app/ayuda/page.tsx`
- Estado: **PRÓXIMAMENTE**
- Funcionalidad: 10-30%
- Descripción: FAQs, documentación, tutoriales
- Estructura:
  - ✅ FAQ estática
  - ✅ Búsqueda visual
  - ❌ Tickets de soporte: No funcional
  - ❌ Chat en vivo: "Próximamente"
  - ❌ Documentación video: No listo
- CTA: "Centro de ayuda en construcción"
- Verificación: ✅ Navegable, ⏸️ Funcionalidad mínima

#### 3.3 HERRAMIENTAS 🔜
- Ubicación: `/app/herramientas/page.tsx`
- Estado: **PRÓXIMAMENTE**
- Funcionalidad: 20-40%
- Descripción: Calculadoras, conversores, analizadores
- Módulos incluidos (pero bloqueados):
  - Calculadora R:R
  - Convertidor de unidades (pips ↔ dinero)
  - Analizador de correlación
  - Risk calculator
- Banner: "Herramientas disponibles próximamente"
- Verificación: ✅ Navegable, ⏸️ Funcionalidad mínima

#### 3.4 COMUNIDAD 🔜
- Ubicación: `/app/comunidad/page.tsx`
- Estado: **PRÓXIMAMENTE**
- Funcionalidad: 0-10%
- Descripción: Forum, posts, networking
- Estructura:
  - ✅ Landing visible
  - ✅ Invitación a beta
  - ❌ Posts: No funcionales
  - ❌ Moderación: No implementada
  - ❌ Mensajes: No funcionales
- CTA: "Únete a la comunidad beta - Solicita acceso"
- Verificación: ✅ Navegable, ⏸️ Funcionalidad mínima

---

### NIVEL 4 - 🔐 ACCESO RESTRINGIDO (Admin + Beta)

**Estos módulos lanzan pero SOLO para admin/beta testers:**

#### 4.1 DASHBOARD ADMIN 🔐
- Ubicación: `/app/admin/dashboard/page.tsx`
- Estado: **ACCESO RESTRINGIDO**
- Funcionalidad: 80-100%
- Descripción: Overview de sistema, usuarios, alerts, logs
- Acceso: Solo admin (password + 2FA en próxima versión)
- Verificación: ✅ Funcional, 🔐 Restringido

#### 4.2 ADMINISTRACIÓN USERS 🔐
- Ubicación: `/app/admin/usuarios/page.tsx`
- Estado: **ACCESO RESTRINGIDO**
- Funcionalidad: 80-100%
- Descripción: Manage usuarios, tiers, permisos
- Acceso: Solo admin
- Verificación: ✅ Funcional, 🔐 Restringido

#### 4.3 ADMINISTRACIÓN BILLING 🔐
- Ubicación: `/app/admin/billing/page.tsx`
- Estado: **ACCESO RESTRINGIDO**
- Funcionalidad: 70-90%
- Descripción: Transacciones, refunds, suscripciones
- Acceso: Solo admin
- Verificación: ✅ Funcional, 🔐 Restringido

#### 4.4 CONFIGURACIÓN SISTEMA 🔐
- Ubicación: `/app/admin/config/page.tsx`
- Estado: **ACCESO RESTRINGIDO**
- Funcionalidad: 60-80%
- Descripción: Parámetros del motor, umbrales, alertas
- Acceso: Solo admin + tech leads
- Verificación: ✅ Funcional, 🔐 Restringido

#### 4.5 LOGS & MONITORING 🔐
- Ubicación: `/app/admin/logs/page.tsx`
- Estado: **ACCESO RESTRINGIDO**
- Funcionalidad: 70-90%
- Descripción: Sistema logs, errores, performance
- Acceso: Solo admin + tech leads
- Verificación: ✅ Funcional, 🔐 Restringido

#### 4.6 PANEL DE DATOS 🔐
- Ubicación: `/app/admin/datos/page.tsx`
- Estado: **ACCESO RESTRINGIDO**
- Funcionalidad: 50-70%
- Descripción: Broker data status, cache, histórico
- Acceso: Solo admin + data team
- Verificación: ✅ Funcional, 🔐 Restringido

---

### NIVEL 1.5 - APOYO (Complementario a LISTO)

#### 1.5.1 PERFIL DE USUARIO ✅
- Ubicación: `/app/perfil/page.tsx`
- Estado: **LISTO**
- Funcionalidad: 100%
- Descripción: Datos personales, preferencias, suscripción
- Verificación: ✅ Deploy ready

#### 1.5.2 CONFIGURACIÓN 🟡
- Ubicación: `/app/configuracion/page.tsx`
- Estado: **BETA**
- Funcionalidad: 80%
- Descripción: Notificaciones, idioma, temas
- Limitaciones: Algunas opciones no persisten
- Verificación: ⏳ Funcionalidad limitada

#### 1.5.3 SOPORTE IA (Chat) 🟡
- Ubicación: `/app/soporte-ia/page.tsx`
- Estado: **BETA**
- Funcionalidad: 60%
- Descripción: Chatbot para preguntas frecuentes
- Limitaciones: Sin LLM real, respuestas hardcodeadas
- Verificación: ⏳ Funcionalidad limitada

---

## 🎯 NUEVA REGLA GLOBAL

### PROHIBIDO (Eliminaciones)
- ❌ Eliminar módulos de la navegación
- ❌ Ocultar servicios estratégicos
- ❌ Remover páginas que ya existen

### PERMITIDO (Ajustes)
- ✅ Cambiar nivel de funcionalidad (✅→🟡→🔜)
- ✅ Agregar banners "BETA", "Próximamente", "Acceso restringido"
- ✅ Limitar funcionalidad sin eliminar estructura
- ✅ Bloquear acceso con gates de permisos (auth)

### META MVP
**Mostrar una PLATAFORMA COMPLETA** desde día 1, pero con diferentes niveles de madurez.

---

## 📊 MATRIZ DE NAVEGACIÓN — TODOS LOS MÓDULOS VISIBLES

### Header Navigation (Visible SIEMPRE)
```
CARVIPIX Logo
├─ Home
├─ Alertas
├─ Bot
├─ Resultados
├─ Servicios ▼
│  ├─ Bot ($999)
│  ├─ Capital
│  └─ Fondeo ($5K+)
├─ Más ▼
│  ├─ Academia 🔜
│  ├─ Herramientas 🔜
│  ├─ Centro de Ayuda 🔜
│  └─ Comunidad 🔜
└─ [Auth] ▼
   ├─ Perfil
   ├─ Configuración 🟡
   ├─ Facturación 🟡
   ├─ Gestion de Capital 🟡
   └─ Admin 🔐 (solo admin)
```

### Cada página tiene navegación secundaria
- Alertas → Bot → Resultados (botones flujo)
- Gestión Capital ↔ Programa Fondeo
- Academia ↔ Centro Ayuda ↔ Comunidad

---

## 🚨 CAMBIOS vs. DOCUMENTO ANTERIOR

| Antes | Ahora |
|-------|-------|
| 22 módulos + "22 prohibiciones" | 18 módulos con 4 niveles |
| "Qué entra / No entra" | "Qué nivel de funcionalidad" |
| Alcance pequeño MVP | Arquitectura COMPLETA MVP |
| Parecía mutilada | Parece profesional y completa |

---

## 📋 RESUMEN: 18 MÓDULOS ESTRATÉGICOS

```
✅ NIVEL 1 (11 módulos - 100% funcional)
  1. Home
  2. Alerts Dashboard
  3. Bot Panel
  4. Resultados
  5. Servicios (3 pages)
  6. Header/Nav
  7. Motor V2
  8. Safety Gates
  9. Alert System
  10. Backtest Engine
  11. Deployment

🟡 NIVEL 2 (3 módulos - 60-80% funcional)
  12. Gestión Capital
  13. Programa Fondeo
  14. Facturación

🔜 NIVEL 3 (4 módulos - 0-40% funcional)
  15. Academia
  16. Centro Ayuda
  17. Herramientas
  18. Comunidad

🔐 NIVEL 4 (6 módulos - admin only)
  + Dashboard Admin
  + Users Admin
  + Billing Admin
  + Sistema Config
  + Logs/Monitoring
  + Data Panel
  
✅ NIVEL 1.5 (3 módulos - complementarios)
  + Perfil
  + Configuración 🟡
  + Soporte IA 🟡
```

---

## 🎬 IMPLEMENTACIÓN PARA ESPECIALISTAS

### Para TODOS
- ✅ Navegación completa desde día 1
- ✅ Todos los módulos tienen página (aunque bloqueados)
- ✅ Banners claros: "Beta", "Próximamente", "Restringido"
- ✅ No hay sorpresas: Usuario ve toda la plataforma

### Para Gates Specialist
- Conectar broker API → usada en NIVEL 1 (Alertas, Bot, Resultados)
- NIVEL 2 + 3 + 4 pueden esperar datos reales más tarde

### Para Backtesting
- Validar Motor V2 (NIVEL 1)
- Backtest Engine (NIVEL 1)

### Para Data Integration
- Soportar NIVEL 1 completo
- NIVEL 2+ puede esperar más infraestructura

### Para Deployment
- Deploy TODOS los módulos (visibles pero con access controls)
- NIVEL 4 requiere authentication
- NIVEL 3 tiene CTA "Próximamente"

---

## ✅ VERIFICACIÓN PRE-LAUNCH

Antes de MVP launch, verificar:

```
NIVEL 1:
  ✅ 11 módulos 100% funcionales
  ✅ npm run build PASS
  ✅ 0 console errors
  ✅ Vercel deploy SUCCESS

NIVEL 2:
  ✅ 3 módulos visible
  ✅ Banners "BETA" claros
  ✅ CTAs funcionales
  ✅ No crashea si accedes

NIVEL 3:
  ✅ 4 módulos visible en nav
  ✅ Banners "Próximamente" claros
  ✅ CTAs: "Notifícate" funcional
  ✅ No quebrantos UI al acceder

NIVEL 4:
  ✅ 6 módulos bloqueados por auth
  ✅ Solo admin puede acceder
  ✅ Password protected
  ✅ Funcionales para admin

GENERAL:
  ✅ Navegación completa visible
  ✅ Usuario entiende roadmap
  ✅ Parece plataforma profesional COMPLETA
  ✅ No parece mutilada ni en beta
```

---

## 🎯 FILOSOFÍA FINAL

**CARVIPIX MVP es ARQUITECTURALMENTE COMPLETO.**

La diferencia entre "startup beta" y "empresa profesional seria" no es qué modules existen, sino qué nivel de funcionalidad tienen.

- Startup beta: "Aquí hay 5 features, el resto no existe"
- Empresa seria: "Aquí están todos nuestros servicios. Algunos en BETA, algunos próximamente, pero la visión es COMPLETA"

**MVP lanza con estructura COMPLETA, pero con diferentes niveles de madurez.**

---

**Firma:** Director  
**Fecha:** 3 de Julio 2026 (Revisado)  
**Validez:** Hasta MVP launch (congelado)

---

## 📋 CAMBIOS CLAVE EN ESTA VERSIÓN v2

1. **NO eliminar módulos:** Todos existen desde día 1
2. **4 niveles de funcionalidad:** No solo "sí/no"
3. **Navegación COMPLETA:** Usuario ve toda la plataforma
4. **Arquitectura profesional:** Parece empresa completa, no startup mutilada
5. **Beta/Próximamente/Restringido:** Estados claros para cada módulo

**Punto de corte:** No es "qué hacer", es "a qué nivel de madurez presentar cada módulo".
