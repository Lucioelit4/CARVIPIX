# INTEGRACIÓN TELEGRAM — ESPECIFICACIÓN E2E

**Versión:** 1.0  
**Objeto:** Integrar alertas de Telegram en el ciclo completo  
**Módulo:** `app/lib/services/telegramClientService.ts`

---

## RESUMEN

El sistema debe enviar **alertas a Telegram** en estos puntos del ciclo:

1. **Creación de Señal** → Enviar mensaje inicial
2. **Ejecución en MT5** → Editar/actualizar con ticket
3. **Cierre de Operación** → Editar/actualizar con resultado

---

## ARQUITECTURA

```
Trading Engine (signal creada)
        ↓
Master Event Dispatcher (event_id)
        ↓
Alerts Module
        ↓
Telegram Service
        ├→ Validar membresía
        ├→ Respetar límite diario
        ├→ Formatear mensaje
        ├→ Enviar a Telegram
        ├→ Guardar message_id
        ├→ Registrar en BD
        └→ Retornar status

        ↓ (después de ejecución)
        
Backend (recibe EXECUTED de MT5)
        ↓
Telegram Service
        ├→ Recuperar message_id anterior
        ├→ Editar mensaje con ticket
        ├→ Registrar actualización
        └→ Retornar status

        ↓ (después de cierre)
        
Backend (recibe CLOSED de MT5)
        ↓
Telegram Service
        ├→ Recuperar message_id anterior
        ├→ Editar mensaje con resultado (PnL, pips)
        ├→ Registrar cierre
        └→ Retornar status
```

---

## BASE DE DATOS

Tabla para trackear mensajes de Telegram:

```sql
CREATE TABLE IF NOT EXISTS telegram_messages (
  id              SERIAL PRIMARY KEY,
  event_id        VARCHAR(50) NOT NULL UNIQUE REFERENCES master_events(event_id),
  signal_id       VARCHAR(50) NOT NULL,
  channel_id      VARCHAR(50) NOT NULL,
  message_id      INT,           -- ID retornado por Telegram
  
  stage           VARCHAR(30),   -- CREATED, EXECUTED, CLOSED
  status          VARCHAR(20),   -- SENT, UPDATED, FAILED, PENDING_RETRY
  
  message_text    TEXT,
  metadata        JSONB,
  
  sent_at         TIMESTAMP,
  updated_at      TIMESTAMP,
  last_error      TEXT,
  attempts        INT DEFAULT 1,
  
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_event_id ON telegram_messages(event_id),
  INDEX idx_channel_id ON telegram_messages(channel_id),
  INDEX idx_message_id ON telegram_messages(message_id),
  INDEX idx_status ON telegram_messages(status)
);
```

---

## FLUJO DETALLADO

### FASE 1: CREACIÓN DE SEÑAL

**Trigger:** Alerts Module recibe signal_id  
**Responsable:** TelegramAlertService

```
Input:
{
  event_id: "EVT-20260715-0001",
  signal_id: "SIG-XAUUSD-0001",
  symbol: "XAUUSD",
  direction: "BUY",
  entry: 2024.50,
  stop_loss: 2020.00,
  take_profit: 2035.00,
  quality: "A",
  confidence: 84,
  risk_reward: 1.55
}

Validaciones:
✓ Usuario con membresía activa
✓ Límite diario NO alcanzado
✓ Signal no está duplicada
✓ Información no es interna

Formateo del Mensaje:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 <b>ENTRADA CARVIPIX</b>

<b>Par:</b> XAUUSD
<b>Dirección:</b> 🟢 COMPRA
<b>Nivel:</b> A (84% confianza)

<b>Entrada:</b> 2024.50
<b>Stop Loss:</b> 2020.00
<b>Take Profit:</b> 2035.00

<b>Risk/Reward:</b> 1:1.55
<b>Riesgo:</b> 45 pips
<b>Potencial:</b> 69 pips

<b>Estado:</b> ⏳ Esperando ejecución

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#XAUUSD #BUY #Alert #CARVIPIX
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Envío:
→ POST /api/v1/telegram/send
{
  chat_id: "-1001234567890",  // @carvipix_alerts
  text: [message_text],
  parse_mode: "HTML"
}

Response:
{
  ok: true,
  result: {
    message_id: 12345,
    chat: { id: -1001234567890 },
    date: 1721088000
  }
}

Almacenamiento:
INSERT INTO telegram_messages (
  event_id, signal_id, channel_id, message_id,
  stage, status, message_text, sent_at
) VALUES (
  'EVT-20260715-0001',
  'SIG-XAUUSD-0001',
  '@carvipix_alerts',
  12345,
  'CREATED',
  'SENT',
  '[message_text]',
  now()
);

Output a Alerts Module:
{
  status: "SENT",
  message_id: 12345,
  channel: "@carvipix_alerts",
  sent_at: "2026-07-15T22:00:15Z"
}
```

### FASE 2: EJECUCIÓN EN MT5

**Trigger:** Backend recibe EXECUTED de MT5  
**Responsable:** Master Event Dispatcher → Telegram Service

```
Input:
{
  event_id: "EVT-20260715-0001",
  status: "EXECUTED",
  ticket: 123456789,
  entry_price: 2024.52,
  executed_at: "2026-07-15T22:00:20Z"
}

Acción:
→ Recuperar message_id anterior
  SELECT message_id FROM telegram_messages
  WHERE event_id = 'EVT-20260715-0001'
  Result: message_id = 12345

→ Construir nuevo texto

Nuevo Mensaje (EDITADO):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 <b>ENTRADA EJECUTADA</b>

<b>Par:</b> XAUUSD
<b>Dirección:</b> 🟢 COMPRA ✅
<b>Nivel:</b> A (84% confianza)

<b>Entrada (Solicitada):</b> 2024.50
<b>Entrada (Ejecutada):</b> 2024.52 (+2 pips)

<b>Stop Loss:</b> 2020.00
<b>Take Profit:</b> 2035.00

<b>Risk/Reward:</b> 1:1.55
<b>Ticket:</b> #123456789
<b>Posición:</b> 0.01 lotes

<b>Estado:</b> 🟢 EN OPERACIÓN
<b>Hora:</b> 22:00:20

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#XAUUSD #BUY #EXECUTED #123456789
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Envío (EDIT):
→ POST /api/v1/telegram/editMessageText
{
  chat_id: "-1001234567890",
  message_id: 12345,
  text: [new_message_text],
  parse_mode: "HTML"
}

Response:
{
  ok: true,
  result: { message_id: 12345, ... }
}

Almacenamiento:
UPDATE telegram_messages SET
  stage = 'EXECUTED',
  status = 'UPDATED',
  message_text = '[new_message_text]',
  metadata = '{"ticket": 123456789, "entry_executed": 2024.52}',
  updated_at = now()
WHERE event_id = 'EVT-20260715-0001';

Output:
{
  status: "UPDATED",
  message_id: 12345,
  stage: "EXECUTED",
  ticket: 123456789
}
```

### FASE 3: CIERRE DE OPERACIÓN

**Trigger:** Backend recibe CLOSED de MT5  
**Responsable:** Master Event Dispatcher → Telegram Service

```
Input:
{
  event_id: "EVT-20260715-0001",
  status: "CLOSED",
  close_type: "TAKE_PROFIT",
  close_price: 2035.00,
  pips: 10.48,
  profit_loss: 69.87,
  closed_at: "2026-07-15T22:45:30Z"
}

Acción:
→ Recuperar message_id anterior
  Result: message_id = 12345

→ Calcular resultado
  Win/Loss: +69.87 (2.78% account)
  Pips: +10.48
  Ratio ejecutado: 1.52 (vs 1.55 previsto)

Nuevo Mensaje (EDITADO):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 <b>OPERACIÓN CERRADA</b>

<b>Par:</b> XAUUSD
<b>Dirección:</b> 🟢 COMPRA
<b>Ticket:</b> #123456789

<b>Entrada:</b> 2024.52
<b>Cierre:</b> 2035.00
<b>Resultado:</b> ✅ GANANCIA

<b>Pips:</b> +10.48 ✅
<b>USD:</b> +$69.87 ✅
<b>% Account:</b> +2.78%

<b>Tipo Cierre:</b> Take Profit

<b>Risk/Reward:</b>
  Previsto: 1:1.55
  Ejecutado: 1:1.52 (Near perfect)

<b>Duración:</b> 45 minutos 30 segundos
<b>Hora Cierre:</b> 22:45:30

<b>Estado:</b> 🟢 CERRADA

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#XAUUSD #WIN #TP #+10pips #CLOSED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Envío (EDIT):
→ POST /api/v1/telegram/editMessageText
{
  chat_id: "-1001234567890",
  message_id: 12345,
  text: [final_message_text],
  parse_mode: "HTML"
}

Response:
{
  ok: true,
  result: { message_id: 12345, ... }
}

Almacenamiento:
UPDATE telegram_messages SET
  stage = 'CLOSED',
  status = 'UPDATED',
  message_text = '[final_message_text]',
  metadata = '{"ticket": 123456789, "close_type": "TAKE_PROFIT", "pips": 10.48, "profit_loss": 69.87}',
  updated_at = now()
WHERE event_id = 'EVT-20260715-0001';

Output:
{
  status: "UPDATED",
  message_id: 12345,
  stage: "CLOSED",
  pips: 10.48,
  profit_loss: 69.87
}
```

---

## CONTROL DE LÍMITES

### Límite Diario

```typescript
// Por usuario / membresía
async function getAlertsSentToday(userId: string): Promise<number> {
  const { rows } = await backendDatabase.query(
    `
    SELECT COUNT(*) as count
    FROM telegram_messages
    WHERE user_id = $1
      AND sent_at >= NOW() - INTERVAL '24 hours'
      AND status IN ('SENT', 'UPDATED')
    `,
    [userId]
  );
  return rows[0]?.count || 0;
}

// Límites por plan
const ALERT_LIMITS = {
  BASIC: 3,      // Max 3 alertas/día
  PRO: 15,       // Max 15 alertas/día
  PREMIUM: null  // Sin límite
};

async function canSendAlert(userId: string, plan: string): Promise<boolean> {
  const limit = ALERT_LIMITS[plan];
  if (!limit) return true;  // Sin límite
  
  const sent = await getAlertsSentToday(userId);
  return sent < limit;
}
```

### Control de Duplicados

```typescript
async function isDuplicate(eventId: string): Promise<boolean> {
  const { rows } = await backendDatabase.query(
    `
    SELECT COUNT(*) as count
    FROM telegram_messages
    WHERE event_id = $1
      AND status IN ('SENT', 'UPDATED')
    `,
    [eventId]
  );
  return rows[0]?.count > 0;
}
```

---

## MANEJO DE ERRORES & REINTENTOS

### Estados posibles

```
SENT            → Mensaje enviado exitosamente
UPDATED         → Mensaje editado exitosamente
FAILED          → Error temporal (reintentar)
PENDING_RETRY   → En cola de reintento
DEAD_LETTER     → Error permanente (max intentos)
```

### Lógica de reintento

```typescript
async function retryFailedMessages(): Promise<void> {
  const { rows } = await backendDatabase.query(
    `
    SELECT id, event_id, message_id, channel_id, attempts
    FROM telegram_messages
    WHERE status = 'FAILED'
      AND attempts < 3
      AND last_error IS NOT NULL
      AND updated_at < NOW() - INTERVAL '1 minute'
    ORDER BY updated_at ASC
    LIMIT 10
    `
  );
  
  for (const row of rows) {
    try {
      // Reintentar
      const result = await telegramService.editMessage(
        row.channel_id,
        row.message_id,
        newText
      );
      
      // Actualizar a UPDATED
      await backendDatabase.query(
        `
        UPDATE telegram_messages
        SET status = 'UPDATED', attempts = $1, updated_at = now()
        WHERE id = $2
        `,
        [row.attempts + 1, row.id]
      );
      
    } catch (error) {
      // Si falla nuevamente
      if (row.attempts >= 2) {
        // Marcar como DEAD_LETTER
        await backendDatabase.query(
          `
          UPDATE telegram_messages
          SET status = 'DEAD_LETTER', attempts = $1, last_error = $2
          WHERE id = $3
          `,
          [row.attempts + 1, error.message, row.id]
        );
      } else {
        // Marcar como PENDING_RETRY
        await backendDatabase.query(
          `
          UPDATE telegram_messages
          SET status = 'PENDING_RETRY', attempts = $1, last_error = $2
          WHERE id = $3
          `,
          [row.attempts + 1, error.message, row.id]
        );
      }
    }
  }
}
```

---

## VALIDACIONES DE SEGURIDAD

```typescript
// No exponer información interna
const INTERNAL_FIELDS = ['license_key', 'api_key', 'user_id', 'secret'];

function sanitizeForTelegram(data: any): any {
  const sanitized = { ...data };
  INTERNAL_FIELDS.forEach(field => {
    delete sanitized[field];
  });
  return sanitized;
}

// HTML escape para evitar inyecciones
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

// Validar membership antes de enviar
async function validateMembership(userId: string): Promise<boolean> {
  const { rows } = await backendDatabase.query(
    `
    SELECT active FROM user_memberships
    WHERE user_id = $1 AND active = true
    `,
    [userId]
  );
  return rows.length > 0;
}
```

---

## INTEGRACIÓN CON MASTER EVENT DISPATCHER

El dispatcher debe llamar a Telegram en estos puntos:

### 1. Después de distribute()

```typescript
// En master-event-dispatcher.ts
async distribute(event: MasterEvent): Promise<void> {
  // ... distribución a módulos ...
  
  // Notificar Telegram (si alerts está habilitado)
  if (event.modules_requested.includes('ALERTS')) {
    await telegramService.sendSignalAlert(event);
  }
}
```

### 2. Después de receiveExecution()

```typescript
async receiveExecution(event_id: string, execution: any): Promise<void> {
  // ... lógica de ejecución ...
  
  // Actualizar Telegram
  await telegramService.updateExecutionAlert(event_id, execution);
}
```

### 3. Después de receiveTradeClosure()

```typescript
async receiveTradeClosure(event_id: string, closure: any): Promise<void> {
  // ... lógica de cierre ...
  
  // Actualizar Telegram
  await telegramService.updateClosureAlert(event_id, closure);
}
```

---

## ENDPOINT API PARA TELEGRAM

(Ya existe pero añadir estas rutas)

```typescript
// POST /api/telegram/send
// Enviar nueva alerta
export async function POST_send(req: Request) {
  const body = await req.json();
  const result = await telegramService.send(body);
  return Response.json(result);
}

// PUT /api/telegram/edit
// Editar alerta existente
export async function PUT_edit(req: Request) {
  const body = await req.json();
  const result = await telegramService.edit(body);
  return Response.json(result);
}

// GET /api/telegram/status/:eventId
// Obtener status de una alerta
export async function GET_status(req: Request, { params }: any) {
  const status = await telegramService.getStatus(params.eventId);
  return Response.json(status);
}
```

---

## TESTING CHECKLIST

- [ ] Crear signal de test
- [ ] Telegram: mensaje enviado a @carvipix_alerts
- [ ] message_id guardado en BD
- [ ] Ejecutar en MT5
- [ ] Telegram: mensaje editado con ticket
- [ ] Cerrar operación
- [ ] Telegram: mensaje editado con resultado
- [ ] Simular fallo de Telegram
- [ ] Reintento exitoso
- [ ] Validación de límite diario
- [ ] Validación de duplicado
- [ ] Admin panel muestra status de Telegram

---

**Versión:** 1.0  
**Completado:** 15 Julio 2026 23:00  
**Próxima Revisión:** Después de implementación

