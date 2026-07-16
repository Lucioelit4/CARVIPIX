# 🚀 CARVIPIX EA MT5 V1 - DEPLOYMENT GUIDE

## Comercialización Lista para Producción

> **Status:** ✅ **LISTO PARA VENDER**  
> **Versión:** 1.0.0  
> **Fecha:** 2026-01-15

---

## 📋 Tabla de Contenidos

1. [Componentes Completados](#componentes-completados)
2. [Arquitectura General](#arquitectura-general)
3. [Instalación en Producción](#instalación-en-producción)
4. [Configuración de Servicios](#configuración-de-servicios)
5. [Testing & QA](#testing--qa)
6. [Instrucciones Cliente](#instrucciones-cliente)
7. [Troubleshooting](#troubleshooting)

---

## ✅ Componentes Completados

### FASE 1: Expert Advisor (EA MT5)
- ✅ **CARVIPIX_EA_MT5_V1_COMMERCIAL.mq5** (2400+ líneas)
  - Compatibilidad universal con MT5
  - Validación de licencia via HTTPS
  - Multi-pair support (cualquier símbolo)
  - Auto lot calculation (FIXED_LOT o RISK_PERCENT)
  - Multi-account support
  - Deduplicación de señales
  - Heartbeat cada 30 segundos
  - Polling de señales cada 5 segundos
  - Resolución adaptativa de símbolos

### FASE 2: Backend Infrastructure
- ✅ **API EA Endpoints** (7 rutas)
  - `POST /api/bot/mt5/validate-license` - Validación de licencia
  - `POST /api/bot/mt5/handshake` - Conexión inicial
  - `POST /api/bot/mt5/heartbeat` - Latido periódico
  - `GET /api/bot/mt5/signal/next` - Fetch de siguiente señal
  - `POST /api/bot/mt5/execution` - Reportar ejecución
  - `POST /api/bot/mt5/signal/reject` - Rechazar señal
  - `POST /api/bot/mt5/disconnect` - Desconexión

- ✅ **Admin APIs** (6 rutas)
  - `GET /api/admin/bot/mt5/licenses` - Listar licencias
  - `GET /api/admin/bot/mt5/installations` - Listar instalaciones
  - `GET /api/admin/bot/mt5/signals` - Listar señales
  - `POST /api/admin/bot/mt5/licenses/create` - Crear licencia
  - `POST /api/admin/bot/mt5/suspend` - Suspender licencia
  - `POST /api/admin/bot/mt5/revoke` - Revocar licencia
  - `GET /api/admin/bot/mt5/stats` - Estadísticas

- ✅ **Client APIs** (5 rutas)
  - `GET /api/client/bot/mt5/license` - Licencia del usuario
  - `GET /api/client/bot/mt5/installations` - Sus instalaciones
  - `GET /api/client/bot/mt5/executions` - Sus operaciones
  - `GET /api/client/bot/mt5/download-ea` - Descargar EA
  - `GET /api/client/bot/mt5/stats` - Sus estadísticas

### FASE 3: Base de Datos
- ✅ **Schema PostgreSQL** (5 tablas + índices)
  - `bot_mt5_licenses` - Gestión de licencias
  - `bot_mt5_installations` - Registro de EAs conectados
  - `bot_mt5_signals` - Cola de señales
  - `bot_mt5_executions` - Audit log de operaciones
  - `bot_mt5_audit` - Event log

### FASE 4: UI & Dashboards
- ✅ **Admin Dashboard** (React component)
  - Stats en tiempo real (licencias, instalaciones, señales)
  - Gestión de licencias
  - Monitoreo de instalaciones
  - Historial de señales
  - Polling cada 10 segundos

- ✅ **Client Dashboard** (React component)
  - Estado de licencia
  - Mis instalaciones
  - Resultados de operaciones
  - Descarga del EA
  - Instrucciones de instalación

### FASE 5: Pagos & Automatización
- ✅ **Integración PayPal**
  - Crear órdenes de compra
  - Capturar pagos
  - Webhooks de verificación
  - Creación automática de licencias
  - Envío de correos

- ✅ **Email Automation**
  - Correo post-pago con licencia
  - Notificaciones de señales
  - Confirmación de operaciones
  - Resumen diario
  - HTML templates profesiónales

### FASE 6: Testing
- ✅ **E2E Test Suite**
  - Crear licencia
  - Validar licencia
  - Handshake
  - Crear señal
  - Fetch señal
  - Ejecutar señal
  - Reportar ejecución
  - Desconexión

---

## 🏗️ Arquitectura General

```
┌─────────────────────────────────────────────────────────┐
│                    USUARIO CLIENTE                      │
│  MetaTrader 5 + CARVIPIX_EA_MT5_V1.ex5                  │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP POST/GET
                     │ (License, Handshake, Heartbeat,
                     │  Fetch Signals, Report Exec)
                     ▼
┌─────────────────────────────────────────────────────────┐
│                  NEXT.JS API BACKEND                    │
│  ├─ /api/bot/mt5/* (EA endpoints)                       │
│  ├─ /api/admin/bot/mt5/* (Admin APIs)                   │
│  ├─ /api/client/bot/mt5/* (Client APIs)                 │
│  └─ /api/payments/paypal/* (Payment webhooks)           │
└────────────────────┬────────────────────────────────────┘
                     │ SQL Queries
                     ▼
┌─────────────────────────────────────────────────────────┐
│              PostgreSQL Database (Neon)                 │
│  ├─ bot_mt5_licenses                                    │
│  ├─ bot_mt5_installations                               │
│  ├─ bot_mt5_signals                                     │
│  ├─ bot_mt5_executions                                  │
│  └─ bot_mt5_audit                                       │
└─────────────────────────────────────────────────────────┘
```

---

## 📦 Instalación en Producción

### 1. Requisitos
```bash
- Node.js 18+
- PostgreSQL 13+
- Next.js 14+
- MetaTrader 5 (Cliente)
```

### 2. Variables de Entorno
```env
# Database
DATABASE_URL=postgresql://user:pass@neon.tech/carvipix

# PayPal
PAYPAL_CLIENT_ID=xxxxx
PAYPAL_CLIENT_SECRET=xxxxx
PAYPAL_ENV=production

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=noreply@carvipix.com
EMAIL_PASS=xxxxx
EMAIL_FROM=CARVIPIX <noreply@carvipix.com>

# App
APP_URL=https://carvipix.com
```

### 3. Deploy
```bash
# Instalar dependencias
npm install

# Build
npm run build

# Migrar BD
npm run migrate

# Deploy a Vercel
vercel deploy --prod
```

### 4. Verificar Deployment
```bash
# Test health
curl https://api.carvipix.com/api/health

# Test license creation
curl -X POST https://api.carvipix.com/api/admin/bot/mt5/licenses/create \
  -H "Content-Type: application/json" \
  -d '{"subscription_tier":"PRO","expires_in_days":365}'
```

---

## ⚙️ Configuración de Servicios

### PayPal Webhooks
1. Ir a https://developer.paypal.com
2. Apps & Credentials > Sandbox/Live
3. Crear app y obtener credenciales
4. Webhooks > Registrar webhook en: `https://api.carvipix.com/api/payments/paypal/webhook`
5. Eventos: CHECKOUT.ORDER.COMPLETED

### Email Service
1. Gmail: Habilitar "App Passwords"
2. O usar SendGrid: `npm install @sendgrid/mail`
3. Configurar en `.env`

### Database
```sql
-- Ejecutar en PostgreSQL:
\i scripts/init-ea-schema.sql
```

---

## 🧪 Testing & QA

### Ejecutar Test Suite
```bash
npx ts-node scripts/ea-test-suite.ts
```

### Pruebas Manuales
1. **En MT5 DEMO:**
   - Descargar EA
   - Copiar a Experts folder
   - Ingresar License Key
   - Habilitar AutoTrading
   - Verificar en logs

2. **Verificar Operaciones:**
   ```bash
   curl https://api.carvipix.com/api/admin/bot/mt5/signals
   ```

3. **Test PayPal:**
   - Usar sandbox account
   - Comprar licencia
   - Verificar email recibido
   - Verificar licencia creada en BD

---

## 📖 Instrucciones Cliente

### Instalación Rápida

**Paso 1: Comprar Licencia**
- Ir a https://carvipix.com
- Elegir plan (BASIC/PRO/ENTERPRISE)
- Pagar con PayPal
- Recibir email con License Key

**Paso 2: Descargar EA**
- Panel de usuario > Descargar EA
- Archivo: `CARVIPIX_EA_MT5_V1.ex5`

**Paso 3: Instalar en MT5**
```
C:\Users\[Usuario]\AppData\Roaming\MetaQuotes\Terminal\[ID]\MQL5\Experts\
```

**Paso 4: Configurar**
1. Abrir MetaTrader 5
2. Ir a Expert Advisors
3. Buscar CARVIPIX_EA_MT5_V1
4. Inputs > CARVIPIX_LICENSE_KEY = [Tu License Key]
5. CARVIPIX_API_URL = https://api.carvipix.com
6. Otros settings según preferencia

**Paso 5: Ejecutar**
- Habilitar AutoTrading en MT5
- El EA se conectará automáticamente
- Ver operaciones en tiempo real

### Soporta Múltiples Instalaciones
- Plan PRO: Hasta 5 EAs en simultaneo
- Plan ENTERPRISE: Unlimited

---

## 🔧 Troubleshooting

### EA no se conecta
```
1. Verificar Internet activo
2. Verificar License Key correcta
3. Verificar API URL correcta
4. Revisar MT5 Logs: Terminal\[ID]\MQL5\Logs\
5. Probar con DEMO account primero
```

### License inválida
```
1. Verificar que no haya expirado
2. Verificar status = ACTIVE
3. No compartir License Key
4. Una licencia = un EA instalado
```

### Operaciones no ejecutadas
```
1. Verificar que hay señales pendientes
2. Verificar posiciones abiertas < MAX_OPEN_POSITIONS
3. Verificar trades hoy < MAX_DAILY_TRADES
4. Revisar logs de validación de precio
```

### Email no recibido
```
1. Revisar carpeta SPAM
2. Verificar email correcto
3. Contactar support@carvipix.com
```

---

## 📞 Soporte Técnico

- **Email:** support@carvipix.com
- **WhatsApp:** +34 XXX XXX XXX
- **Documentación:** https://docs.carvipix.com
- **Panel Admin:** https://admin.carvipix.com

---

## 📜 Licencia y Términos

- ✅ **Comercializable:** Sí
- ✅ **Multi-Broker:** Sí
- ✅ **Multi-Instalación:** Sí (según plan)
- ❌ **Modificable por cliente:** No
- ❌ **Reventa:** No permitida

---

## 🎉 ¡LISTO PARA VENDER!

El EA MT5 CARVIPIX V1 está completamente funcional y listo para comercialización.

**Fecha de publicación:** 2026-01-15  
**Versión:** 1.0.0  
**Estado:** ✅ PRODUCCIÓN

---

*Documento de referencia para deployment y operación de CARVIPIX EA MT5 V1*
