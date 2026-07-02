# Arquitectura Modular CARVIPIX

Este documento describe la estructura modular preparada para conectar APIs reales en el futuro.

## Estructura

```
app/lib/modules/
├── memberships/          # Gestión de usuario y permisos
├── payments/            # Pagos y compras
├── alerts/              # Alertas de trading
├── bot/                 # Bot CARVIPIX
├── capital/             # Capital de inversores
├── results/             # Resultados agregados
├── ai-support/          # Soporte y análisis IA
└── index.ts             # Exporta todos los servicios
```

## Módulos

### 1. Memberships (`memberships/`)
**Responsabilidad:** Gestionar usuario, planes y permisos

**Archivos:**
- `types.ts` - Tipos (UserProfile, Membership, PlanPermissions)
- `demo-data.ts` - Datos demo (usuario demo, planes)
- `service.ts` - MembershipsService (métodos para usuario, permisos)

**Preparado para:** Conectar a servicio de autenticación real, base de datos de usuarios

### 2. Payments (`payments/`)
**Responsabilidad:** Gestionar compras de productos (bot, capital, fondeo, planes)

**Archivos:**
- `types.ts` - Tipos (Product, Payment, Order)
- `demo-data.ts` - Productos disponibles (bot 999, capital 10K, fondeo 5K)
- `service.ts` - PaymentsService (crear órdenes, procesar pagos)

**Preparado para:** Stripe, MercadoPago, criptomonedas, wallets

### 3. Alerts (`alerts/`)
**Responsabilidad:** Gestionar alertas de trading (mantiene datos demo actuales)

**Archivos:**
- `types.ts` - Tipos (Alert, AlertRule, AlertHistory)
- `demo-data.ts` - Alertas y reglas de demo
- `service.ts` - AlertsService (obtener alertas, reglas, estadísticas)

**Preparado para:** Conectar bot real de alertas, stream de precios

### 4. Bot (`bot/`)
**Responsabilidad:** Gestionar licencia y ejecución del Bot CARVIPIX

**Archivos:**
- `types.ts` - Tipos (BotLicense, BotInstance, BotStats)
- `demo-data.ts` - Licencia demo, instancia demo, actualizaciones
- `service.ts` - BotService (licencia, instancias, broker connection)

**Preparado para:** MT4/MT5 API, servidor de licencias, conexión de broker

### 5. Capital (`capital/`)
**Responsabilidad:** Gestionar cuentas y reportes de inversores (sin exponer lógica interna)

**Archivos:**
- `types.ts` - Tipos (CapitalAccount, Movement, Report)
- `demo-data.ts` - Cuenta demo con movimientos y reportes
- `service.ts` - CapitalService (obtener cuenta, movimientos, reportes)

**Preparado para:** Base de datos de inversores, broker, cálculo de retornos

**IMPORTANTE:** La lógica real de trading y cálculo de utilidades NO se expone aquí. Permanece privada en servidor.

### 6. Results (`results/`)
**Responsabilidad:** Agregar métricas de todos los módulos (alertas, bot, capital, fondeo)

**Archivos:**
- `types.ts` - Tipos (PlatformResults, ResultsBySource)
- `demo-data.ts` - Resultados demo, histórico
- `service.ts` - ResultsService (obtener resultados, generar reportes)

**Preparado para:** Agregador de métricas de todos los servicios

### 7. AI Support (`ai-support/`)
**Responsabilidad:** Asistente IA para análisis, educación y trading

**Archivos:**
- `types.ts` - Tipos (AIConversation, AIBriefing, AISuggestion)
- `demo-data.ts` - Conversación demo, briefing demo
- `service.ts` - AISupportService (conversaciones, briefings, sugerencias)

**Preparado para:** Modelos IA (OpenAI, Anthropic, etc.)

## Uso

### En modo demo (actual):
```typescript
import { membershipsService, alertsService, botService } from '@/app/lib/modules';

// Todo retorna datos demo por defecto
const user = await membershipsService.getCurrentUserProfile();
const alerts = await alertsService.getAlerts(user.id);
const license = await botService.getLicense(user.id);
```

### Cambiar a producción (cuando estén listas las APIs):
```typescript
import { initializeProduction } from '@/app/lib/modules';

initializeProduction();
// Ahora todos los servicios conectan a APIs reales
```

## Patrones de Integración

Cada módulo sigue este patrón:

1. **Archivos separados:**
   - Tipos en `types.ts` (contratos)
   - Datos demo en `demo-data.ts` (aislados)
   - Lógica en `service.ts` (puede cambiar fácilmente)

2. **Modo dual:**
   - `isDemoMode = true` → usa datos demo
   - `isDemoMode = false` → conecta a APIs reales

3. **Comentarios FUTURE:**
   - Indican dónde conectar APIs reales
   - Facilitan implementación futura

## Próximos pasos

1. Conectar autenticación real (memberships)
2. Integrar pasarelas de pago (payments)
3. Conectar bot real de alertas (alerts)
4. Conectar Bot CARVIPIX ejecutable (bot)
5. Integrar con broker para capital (capital)
6. Agregar modelos IA (ai-support)
7. Implementar base de datos para persistencia

## Notas Importantes

- ✅ Datos demo separados de lógica
- ✅ Sin API keys reales en el código
- ✅ Lógica interna del bot NO expuesta
- ✅ Preparado para múltiples APIs simultáneamente
- ✅ Fácil de testear en aislamiento
- ✅ Compilación exitosa con Next.js
