# CARVIPIX TRADING ENGINE — GUÍA DE INFRAESTRUCTURA PERSISTENTE
# ============================================================
# Archivo: TRADING_ENGINE_INFRASTRUCTURE.md
# Propósito: Instrucciones para activar el Engine en servidor dedicado 24/7
# Estado: PREPARADO — pendiente activación por orden del director

## ARQUITECTURA PREPARADA

La plataforma tiene dos componentes independientes:

### 1. Frontend/Backend Web (ya activo en Vercel)
- URL: https://carvipix.com
- Función: Registro, login, checkout, landing, dashboard de usuario
- Continuidad: Serverless — se activa con cada request
- Estado: ✅ ACTIVO

### 2. Trading Engine (pendiente servidor dedicado)
- Función: Observer V3, Scheduler, análisis IA, señales, bot
- Requiere: Servidor Node.js persistente (no serverless)
- Estado: ⏸ PREPARADO — esperando infraestructura

---

## OPCIONES DE SERVIDOR RECOMENDADAS

### Opción A — Hetzner Cloud (recomendada)
- Costo: ~€5/mes (CX21: 2 CPU, 4GB RAM)
- Latencia: Baja desde Europa
- Setup: VPS Linux + Docker

### Opción B — Railway.app
- Costo: ~$5/mes
- Ventaja: Deploy directo desde GitHub, zero-config Docker
- URL: https://railway.app

### Opción C — Render.com
- Costo: $7/mes (plan starter con sleep evitado)
- Ventaja: Soporte nativo Docker, healthcheck automático

### Opción D — DigitalOcean Droplet
- Costo: $6/mes (basic droplet 1GB)
- Setup: Ubuntu 22.04 + Docker

---

## SETUP PARA SERVIDOR DEDICADO

### Paso 1: Variables de entorno necesarias

El servidor necesita estas variables (mismas que .env.local):

```
DATABASE_URL=...
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-4o (reemplazar gpt-5.3-codex si no existe)
FINNHUB_API_KEY=...
RESEND_API_KEY=...
BETA_PRIVATE_MODE=true
NODE_ENV=production
PORT=3000
NEXT_TELEMETRY_DISABLED=1
```

### Paso 2: Deploy con Docker

El Dockerfile ya está configurado correctamente:

```bash
# Build
docker build -t carvipix:latest .

# Run en servidor
docker run -d \
  --name carvipix \
  --restart always \
  -p 3000:3000 \
  --env-file .env.production \
  carvipix:latest
```

### Paso 3: Activar el Trading Engine

Una vez el servidor esté corriendo, llamar una sola vez:

```bash
curl -X POST https://tu-servidor.com/api/internal/maestro-v3-init
```

El Observer V3 se inicializa y el Scheduler toma el control. El proceso vive
mientras viva el servidor. Con `--restart always`, si el servidor se reinicia,
el contenedor vuelve a iniciar automáticamente.

### Paso 4: Monitoreo

El panel de monitoreo del Engine está en:
```
https://carvipix.com/admin/observer-v3
```

O directamente en el servidor dedicado si se desea separación total.

---

## SEPARACIÓN DE RESPONSABILIDADES (arquitectura final)

```
carvipix.com (Vercel)              Engine Server (VPS/Railway)
─────────────────────              ────────────────────────────
✅ Landing pública                 ✅ Observer V3 (24/7)
✅ Registro / Login                ✅ Adaptive Scheduler
✅ Dashboard de usuario            ✅ MarketData Pipeline
✅ Checkout / Licencias            ✅ Análisis IA (OpenAI)
✅ APIs de datos/auth              ✅ Paper Trade Monitor
✅ Emails automáticos              ✅ Signal Distribution
                                   ✅ Telegram Publisher
```

---

## ESTADO ACTUAL

| Componente | Estado | Dónde |
|---|---|---|
| Frontend (carvipix.com) | ✅ ACTIVO | Vercel |
| Base de datos | ✅ ACTIVO | Neon PostgreSQL |
| Emails | ✅ ACTIVO | Resend |
| Trading Engine Observer | ⏸ PREPARADO | Pendiente VPS |
| Adaptive Scheduler | ⏸ PREPARADO | Pendiente VPS |
| Signal Distribution | ⏸ PREPARADO | Pendiente VPS |

---

## PRÓXIMO PASO

Cuando el director confirme:
1. Elección del proveedor (Hetzner / Railway / Render / DO)
2. Se provisiona el servidor
3. Se hace deploy del Dockerfile
4. Se activa con `POST /api/internal/maestro-v3-init`
5. Se confirma que el scheduler está corriendo con status 200
6. Se entrega informe de activación real 24/7

**El Engine NO se activará hasta que el servidor persistente esté confirmado.**
