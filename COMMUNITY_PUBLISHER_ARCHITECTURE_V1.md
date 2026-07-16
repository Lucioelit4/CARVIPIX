# COMMUNITY PUBLISHER V1 — ARQUITECTURA DEFINITIVA

**Documento Fundacional**  
**Versión**: 1.0 (Pre-Implementación)  
**Estado**: Diseño en revisión  
**Fecha**: 2026-07-14

---

## TABLA DE CONTENIDOS

1. [Visión General](#visión-general)
2. [Arquitectura General](#1-arquitectura-general)
3. [Tipos de Publicaciones](#2-tipos-de-publicaciones)
4. [Sistema de Filtros](#3-sistema-de-filtros)
5. [Community Scheduler](#4-community-scheduler)
6. [Plantillas Oficiales](#5-plantillas-oficiales)
7. [Moderación y UGC](#6-moderación-y-ugc)
8. [Panel Administrativo](#7-panel-administrativo)
9. [Integración Telegram](#8-integración-telegram)
10. [Seguridad](#9-seguridad)
11. [Escalabilidad](#10-escalabilidad)
12. [Restricciones de Diseño](#restricciones-de-diseño)
13. [Contrato de Interfaz](#contrato-de-interfaz)

---

## VISIÓN GENERAL

**Community Publisher es el sistema responsable de mantener viva la comunidad oficial de CARVIPIX de forma automática, profesional y sin parecer spam.**

**No es un bot de señales.**

**Es el escaparate principal de CARVIPIX.**

Cualquier persona que entre al canal debe sentir inmediatamente que existe un sistema profesional trabajando detrás.

### Principios Fundamentales

- ✅ **Autenticidad**: Todo lo publicado proviene de datos reales del Observador Maestro V3
- ✅ **Profesionalismo**: Cada mensaje está cuidadosamente diseñado
- ✅ **Valor**: Cada publicación aporta información o educación útil
- ✅ **Confianza**: Transparencia total sobre lo que es análisis real vs educación
- ✅ **Automatización**: Cero intervención manual en decisiones de publicación
- ✅ **Escalabilidad**: Soporta desde 100 hasta 100,000 miembros sin degradación

---

## 1. ARQUITECTURA GENERAL

### Flujo de Información

```
┌─────────────────────────────────────────────────────────────┐
│                  OBSERVADOR MAESTRO V3                      │
│         (Expediente Maestro + ChatGPT + Paper Trading)      │
└────────────────┬────────────────────────────────────────────┘
                 │
         ┌───────▼──────────┐
         │   DISPARADOR     │
         │  (9 módulos)     │
         └───────┬──────────┘
                 │
         ┌───────▼──────────────────────┐
         │ COMMUNITY PUBLISHER ENGINE    │
         │  ┌─────────────────────────┐  │
         │  │ Event Processor         │  │
         │  │ Filter Pipeline         │  │
         │  │ Content Generator       │  │
         │  │ Publishing Scheduler    │  │
         │  │ State Manager           │  │
         │  └─────────────────────────┘  │
         └───────┬──────────────────────┘
                 │
         ┌───────▼──────────┐
         │ TELEGRAM API     │
         │ Oficial          │
         └───────┬──────────┘
                 │
         ┌───────▼──────────┐
         │ CANAL OFICIAL    │
         │ COMUNIDAD        │
         └──────────────────┘
```

### Componentes Principales

#### A. **Processor de Eventos** (Event Listener)
- Escucha el Disparador
- Identifica tipo de evento (ANÁLISIS_COMPLETADO, PAPER_TRADE_CERRADO, etc)
- Enruta al módulo correspondiente

#### B. **Pipeline de Filtros** (Filter Pipeline)
- Aplica reglas objetivas a cada evento
- Decides if event is publishable
- Registra razones de rechazo
- Valida contra límites (2 alertas/día, máximo mensajes/hora, etc)

#### C. **Generador de Contenido** (Content Generator)
- Toma evento validado
- Selecciona plantilla correspondiente
- Rellena variables dinámicas
- Genera mensaje final con formato Telegram

#### D. **Community Scheduler** (Publishing Scheduler)
- Decide **cuándo** publicar
- Previene canal muerto
- Respeta límites de frecuencia
- Distribuye publicaciones educativas cuando no hay alertas
- Monitorea tiempo desde última publicación

#### E. **State Manager** (Persistence)
- Registra todas las publicaciones (historial inmutable)
- Persiste contadores diarios (alertas/día, etc)
- Almacena configuración de filtros
- Mantiene estadísticas de la comunidad

#### F. **Telegram Connector** (API Handler)
- Autenticación con Telegram Bot API
- Envío de mensajes
- Gestión de webhooks (usuarios nuevos, reacciones)
- Manejo de errores y reintentos
- Rate limiting

---

## 2. TIPOS DE PUBLICACIONES

### 2.1 ALERTA GRATUITA (FreeTier Alert)

**Propósito**: Demostrar valor a usuarios gratuitos  
**Frecuencia Máxima**: 2 por día  
**Origen**: Disparador (decisión ENTER_BUY/ENTER_SELL con alta probabilidad)  
**Modificable**: NO — proviene tal cual del Expediente Maestro

**Contenido Inmutable**:
```
Instrumento: [del análisis]
Entrada: [entry_price]
Stop Loss: [stop_loss]
Take Profit 1: [tp1]
Take Profit 2: [tp2]
Riesgo/Recompensa: [RR calculado]
Tiempo de Análisis: [timestamp]
```

**Criterios de Selección** (si hay más de 2 oportunidades en el día):
1. Mayor probabilidad estimada
2. Mayor RR (Riesgo/Recompensa)
3. Instrumento menos recientemente publicado
4. Mayor convicción del modelo

**Mensaje Telegram**:
```
🚨 ALERTA GRATUITA

🔷 XAU/USD

📍 ENTRADA: $2,345.50
🛑 STOP LOSS: $2,340.00
🎯 TP1: $2,355.00
🎯 TP2: $2,365.00

📊 Risk/Reward: 1:2.0
⏰ Análisis: 2026-07-14 14:32 UTC
💡 Probabilidad: 78%

⚠️ DEMO TRADING - Estos análisis se ejecutan en cuenta de prueba.
Miembros PRO reciben cobertura completa durante toda la sesión.

[Botón: Ver más en CARVIPIX]
```

---

### 2.2 ESTADO DEL MERCADO (Market Status)

**Propósito**: Informar sobre condiciones generales  
**Frecuencia**: 1-2 por día (cuando hay cambios)  
**Origen**: Bloque público de análisis + indicadores agregados

**Tipos de Estado**:
- ✅ Mercado Favorable → Condiciones apropiadas para trades
- ⚠️ Mercado Complicado → Movimientos erráticos, difícil lectura
- 🔄 Mercado sin Estructura → Consolidación, sin tendencia clara
- 👁️ Mercado bajo Vigilancia → Evento importante próximo (news, FOMC, etc)
- 📊 Mercado Bajista/Alcista → Tendencia clara en múltiples timeframes

**Mensaje Telegram**:
```
📊 ESTADO DEL MERCADO

Estado: Mercado Favorable ✅

📍 XAUUSD: Tendencia alcista, resistencia en $2,350
📍 EURUSD: Consolidación, esperando breakout
📍 GBPUSD: Soporte en 1.2650, riesgo al alza
📍 BTCUSD: Recuperación post-corrección

⏰ Próxima Revisión: 14:00 UTC (1h 23m)

✨ Los miembros Pro reciben actualizaciones cada hora.
```

---

### 2.3 OPORTUNIDAD EN DESARROLLO (Watchlist Update)

**Propósito**: Mantener viva la expectativa  
**Frecuencia**: Máximo 1 por instrumento por día  
**Origen**: Estados del scheduler ("AWAITING_ENTRY" o similares)

**Información**:
- Instrumento siendo monitoreado
- Nivel clave esperado
- Razón por la que se espera
- Tiempo aproximado de espera

**Mensaje Telegram**:
```
👁️ OPORTUNIDAD EN DESARROLLO

Estamos monitoreando XAU/USD.

Esperamos entrada válida cerca de $2,345.
Sistema continúa analizando automáticamente.

Cuando se cumplan las condiciones, enviaremos alerta.

Suscriptores Pro reciben notificaciones en tiempo real.
```

---

### 2.4 RESULTADO DE OPERACIÓN (Trade Result)

**Propósito**: Transparencia del desempeño  
**Frecuencia**: Máximo 1 por día (solo trades completados)  
**Origen**: Paper Trade Monitor (trade_closed event)

**Información Obligatoria**:
```
Instrumento
Dirección (BUY/SELL)
Entrada (precio)
Salida (precio)
Resultado (Win/Loss)
P&L %
Duración
RR Alcanzado
```

**Mensaje Telegram**:
```
✅ OPERACIÓN COMPLETADA

🔷 XAU/USD | COMPRA ✅

📊 Entrada: $2,345.50
📊 Salida: $2,355.00
💰 Ganancia: +$9.50 (+0.41%)
⏱️ Duración: 2h 15m
📈 RR Alcanzado: 1:1.9

🎯 Acierto #23 (Win Rate: 73%)

**IMPORTANTE**: Estos son resultados de DEMO TRADING.
El sistema opera en cuenta de prueba para validación.
```

---

### 2.5 EDUCACIÓN (Educational Content)

**Propósito**: Agregar valor cuando no hay alertas  
**Frecuencia**: Máximo 2 por día (solo sin alertas recientes)  
**Origen**: Biblioteca de temas educativos

**Temas Predefinidos**:
1. "¿Por qué hoy no hubo operaciones?" → Explicar decisión de no-trade
2. "La importancia del Capital Preservation" → Risk management
3. "¿Cómo seguir correctamente una alerta?" → Instrucciones operativas
4. "Errores comunes en trading" → Educación general
5. "¿Qué es el Risk/Reward?" → Conceptos básicos
6. "Análisis Técnico vs Análisis Fundamental" → Diferencias
7. "El ciclo de la emoción en trading" → Psicología
8. "Gestión de pérdidas: Stop Loss es tu amigo" → Protección

**Generación**: Automática basada en:
- Tiempo desde última publicación
- Día de la semana
- Temas aún no publicados esta semana

**Mensaje Telegram**:
```
📚 LECCIÓN DEL DÍA

¿Por qué hoy CARVIPIX no publicó alertas?

El sistema analiza mercado 24/7, pero solo publica cuando:

✅ Hay confluencia técnica clara
✅ Probabilidad > 70%
✅ Risk/Reward > 1:1.5
✅ Condiciones se alinean

**Hoy el mercado estuvo complicado.**

Preservar capital es mejor que operar por operar.

Próxima oportunidad: Estaremos alertas 👀

---

💡 Tip: La paciencia es el activo más valioso en trading.
```

---

### 2.6 ACTIVIDAD DEL SISTEMA (System Activity Report)

**Propósito**: Demostrar trabajo real en background  
**Frecuencia**: 1 vez por día (generalmente 17:00 UTC)  
**Origen**: Contadores del Observador V3

**Información**:
```
Escenarios analizados (total)
Oportunidades descartadas
Alertas Premium emitidas (miembros Pro)
Alertas gratuitas publicadas
Operaciones completadas
Win rate del día
Tiempo promedio de análisis
```

**Mensaje Telegram**:
```
🤖 ACTIVIDAD DEL SISTEMA — 2026-07-14

Hoy CARVIPIX procesó:

📊 147 escenarios analizados
❌ 143 descartados (sin confluencia)
✅ 4 alertas identificadas
🎯 2 alertas gratuitas publicadas aquí
📈 3 operaciones completadas en Demo
💰 Win Rate: 67%

⏱️ Tiempo promedio de análisis: 847ms

---

El sistema trabaja 24/7 para encontrar las mejores oportunidades.
Solo las publicamos cuando merecen tu atención.

Miembros Pro reciben todas las alertas y monitoreo en vivo.
```

---

### 2.7 PROMOCIÓN INTELIGENTE (Promotion)

**Propósito**: Convertir visitantes en clientes (sin agresividad)  
**Frecuencia**: Máximo 1 por 2 días  
**Criterio**: Solo después de contenido que agregó valor

**Tipos de Promoción**:

**A. Value-Based**:
```
🎯 ACCESO PRO

La alerta gratuita de hoy era excelente oportunidad.

Los miembros PRO reciben:
✅ TODAS las alertas en tiempo real
✅ Monitoreo durante la sesión completa
✅ Notificaciones de cambios en estado del mercado
✅ Resultados operacionales detallados
✅ Análisis privado completo (reasoning)
✅ Integración con tu plataforma de trading

Suscripción: [LINK]
```

**B. Scarcity-Based**:
```
⏰ OPORTUNIDAD LIMITADA

Hoy identificamos 4 oportunidades.
Publicamos 2 de forma gratuita.

Los miembros PRO vieron TODAS las 4.

3 de 4 resultaron en ganancias.

Únete a los traders que no dejan oportunidades en la mesa.
```

**C. Community-Based**:
```
👥 COMUNIDAD EXCLUSIVA

Hoy +5 traders se unieron a la comunidad PRO.

Comparten:
- Capturas de operaciones completadas
- Mejoras al análisis que hacemos
- Retos entre miembros (friendly competition)
- Sesiones de educación en vivo

¿Quieres unirte?
```

---

### 2.8 BIENVENIDA (Welcome Message)

**Propósito**: Establecer expectativas desde el primer mensaje  
**Triggered**: Al detectar nuevo miembro (via webhook)  
**Frequency**: Automática por nuevo miembro

**Mensaje Telegram**:
```
👋 ¡BIENVENIDO A CARVIPIX!

Eres parte de una comunidad que recibe análisis de trading automáticos.

📋 REGLAS DEL CANAL:

1. ✅ Los análisis son de DEMO TRADING (sin dinero real)
2. ✅ Las alertas se publican máximo 2 veces al día
3. ✅ Educación y actualizaciones se publican cuando aportan valor
4. ✅ No es spam — cada mensaje fue analizado por IA
5. ⚠️ Nunca daremos consejos de inversión personalizados

📊 CÓMO FUNCIONA:

• CARVIPIX analiza el mercado 24/7
• Cuando encuentra oportunidad clara → publica alerta
• Ejecuta en demo trading → publica resultado
• Cuando hay dudas → publica educación

🎯 3 NIVELES DE ACCESO:

📱 GRATUITO
- 2 alertas por día aquí
- Educación
- Actividad del sistema

💼 PRO
- TODAS las alertas en tiempo real
- Monitoreo de sesión
- Análisis privado (reasoning completo)

🏆 ENTERPRISE
- Todo lo anterior +
- API access
- Custom integrations

---

❓ PREGUNTAS FRECUENTES:

P: ¿Estas son señales reales?
R: Son análisis reales en demo. Sistema honesto, sin promesas falsas.

P: ¿Cuánto cuesta PRO?
R: [LINK a pricing]

P: ¿Puedo hacer preguntas?
R: En Discord/Telegram soporte. Aquí solo publicaciones.

---

🚀 Bienvenido. Estamos listos.
```

---

### 2.9 ANUNCIOS ESPECIALES (Special Announcements)

**Propósito**: Comunicar cambios importantes  
**Frequency**: Variables (solo cuando es necesario)  
**Autorización**: Admin manual

**Ejemplos**:
- Nueva versión del Observador V3 completada
- Mantenimiento programado (pausar por X horas)
- Cambio de horario de alertas
- Nuevas features disponibles
- Cambios en pricing

**Protocolo**: 
- Admin aprueba explícitamente antes de publicar
- Registro en auditoría
- Notificación a miembros Pro por email además de canal

---

## 3. SISTEMA DE FILTROS

### 3.1 Pipeline de Filtros

Cada evento pasa por este pipeline. Si cae en CUALQUIER filtro, es rechazado.

```
EVENTO DISPARADOR
    ↓
┌─────────────────────────┐
│ FILTRO 1: Type Check    │
│ ¿Es tipo publicable?    │
└────────┬────────────────┘
         ↓ (Pass: sí)
┌─────────────────────────┐
│ FILTRO 2: Time Check    │
│ ¿Intervalo mínimo?      │
│ ¿Dentro de horarios?    │
└────────┬────────────────┘
         ↓ (Pass: sí)
┌─────────────────────────┐
│ FILTRO 3: Daily Limit   │
│ ¿Alertas < 2 hoy?       │
│ ¿Educación < 2 hoy?     │
└────────┬────────────────┘
         ↓ (Pass: sí)
┌─────────────────────────┐
│ FILTRO 4: Quality Gate  │
│ ¿Expediente completo?   │
│ ¿Probabilidad > 60%?    │
│ ¿RR > 1:1.0?            │
└────────┬────────────────┘
         ↓ (Pass: sí)
┌─────────────────────────┐
│ FILTRO 5: Duplicate     │
│ ¿Instrumento duplicado? │
│ ¿Señal idéntica?        │
└────────┬────────────────┘
         ↓ (Pass: sí)
┌─────────────────────────┐
│ FILTRO 6: Fraud Check   │
│ ¿Contiene secretos?     │
│ ¿Seguro publicar?       │
└────────┬────────────────┘
         ↓ (Pass: sí)
    APROBADO
      ↓
  ENCOLAR
```

### 3.2 Especificación de Filtros

#### **FILTRO 1: Type Check**
```
Entrada: event.type
Valores permitidos: [
  "ANALYSIS_COMPLETED",
  "PAPER_TRADE_CLOSED",
  "MARKET_STATE_CHANGED",
  "SYSTEM_ACTIVITY",
  "EDUCATION_SCHEDULE",
  "NEW_MEMBER"
]
Rechazo si: type NO EN lista
Acción de rechazo: Log "Type not publishable"
```

#### **FILTRO 2: Time Check**
```
Reglas:
- Mínimo 3 minutos entre cualquier publicación
- Máximo 3 publicaciones en 1 hora
- No publicar entre 00:00 y 06:00 UTC (descanso nocturno)
- No publicar entre 16:30 y 17:30 UTC (fin de session importante)

Rechazo si: Viola alguna regla
Acción: Queue para más tarde, o rechazar si fuera de horario
```

#### **FILTRO 3: Daily Limit**
```
Contadores (reset a 00:00 UTC):
- max_free_alerts_per_day = 2
- max_education_per_day = 2
- max_status_per_day = 2
- max_promotions_per_day = 1
- max_any_publications_per_day = 12

Rechazo si: contador de tipo >= límite
```

#### **FILTRO 4: Quality Gate**
```
Validaciones:
- expediente.completeness >= 90%
- expediente.sections == 16
- decision != null AND decision != "N/A"
- probability >= 60% (para alertas)
- rr_ratio >= 1.0 (para alertas)
- paper_balance > 9500 (solvencia)

Rechazo si: Alguna condición falla
Acción: Log razón exacta
```

#### **FILTRO 5: Duplicate Check**
```
Comparación:
- ¿Mismo instrumento publicado en últimas 6 horas?
- ¿Misma dirección (BUY/SELL)?
- ¿Precio entrada similar (±1%)?

Rechazo si: Todas las 3 coinciden
Acción: "Duplicado del análisis anterior"
```

#### **FILTRO 6: Fraud Check (Security)**
```
Patrones prohibidos en contenido:
- "Prompt Engineer"
- "Internal reasoning"
- "API Key"
- "Bearer token"
- "analysis_private"
- "strategy_selected"
- "system_prompt"
- Cualquier path de archivo
- Variables privadas

Rechazo si: Encuentra algún patrón
Acción: Alert administrativo CRÍTICO
```

### 3.3 Selección de Mejor Alerta

Cuando hay > 2 alertas candidatas en el día:

```python
def select_best_alerts(candidates: List[Alert], limit: int = 2) -> List[Alert]:
    """Score y selecciona las mejores alertas del día"""
    
    scored = []
    for alert in candidates:
        score = 0
        
        # Factor 1: Probabilidad (peso 40%)
        score += alert.probability * 0.40
        
        # Factor 2: Risk/Reward (peso 30%)
        score += min(alert.rr_ratio / 3, 1.0) * 0.30
        
        # Factor 3: Convicción (peso 20%)
        score += alert.conviction / 100 * 0.20
        
        # Factor 4: Diversificación (peso 10%)
        # Penalizar si ya hay alerta en este instrumento hoy
        time_since_last = hours_since_last_alert(alert.instrument)
        score += max(0, (time_since_last / 24)) * 0.10
        
        scored.append((alert, score))
    
    # Sort by score descending
    scored.sort(key=lambda x: x[1], reverse=True)
    
    # Return top N
    return [s[0] for s in scored[:limit]]
```

---

## 4. COMMUNITY SCHEDULER

### 4.1 Responsabilidades

El Community Scheduler decide **cuándo** publicar, no **qué** publicar.

```
Entrada: Cola de publicaciones aprobadas
Tarea: Decidir mejor momento de envío
Restricción: Evitar inactividad > 4 horas
Restricción: Evitar > 3 publicaciones en 1 hora
Salida: Publicación programada con timestamp exacto
```

### 4.2 Lógica de Programación

```
BUCLE CADA 5 MINUTOS:

1. ¿Hay publicaciones en cola?
   No → ir a paso 5
   Sí → ir a paso 2

2. ¿Tiempo desde última publicación > límite máximo?
   No → esperar según intervalo mínimo
   Sí → PUBLICAR AHORA (urgente)

3. ¿Es hora de contenido educativo?
   (Mañana: 09:00 UTC, Tarde: 14:00 UTC, Noche: 19:00 UTC)
   Sí → PUBLICAR si hay educación en cola
   No → continuar

4. ¿Hay alerta en cola?
   Sí → PUBLICAR (prioridad máxima)
   No → Esperar por educación o estado

5. ¿Tiempo desde última publicación >= 4 horas?
   Sí → PUBLICAR algo (estado o educación disponible)
   No → ESPERAR

6. Dormir 5 minutos, volver a paso 1
```

### 4.3 Prevención de Canal Muerto

**Problema**: Si no hay análisis completados en el día, canal queda muerto.

**Solución - Sistema de Backup**:

```
Si:
  - Tiempo desde última publicación > 2 horas
  Y
  - Cola vacía
  Y
  - NO es hora de descanso nocturno (00:00-06:00)

Entonces:
  Generar automáticamente:
  - Estado del mercado (si cambió)
  - Educación del día (si no fue publicada)
  - Actividad del sistema (resumen parcial)

Regla: Siempre mantener viva la comunidad
```

### 4.4 Horarios y Fusos

**UTC Base** para todo el sistema.  
**Conversion en UI** al fuero local del usuario.

```
Hora de descanso nocturno: 00:00-06:00 UTC
Horas pico esperadas: 08:00-22:00 UTC

Distribución de publicaciones:
- 08:00-10:00 UTC: Resumen nocturno + educación
- 10:00-18:00 UTC: Alertas cuando llegan
- 18:00-19:00 UTC: Resumen de sesión europea
- 19:00-22:00 UTC: Estado mercado NY
- 22:00-00:00 UTC: Resumen diario + educación
```

### 4.5 Métricas Monitorear

```
- Tiempo promedio entre publicaciones
- Máximo tiempo sin publicación en 24h
- Publicaciones por hora (histograma)
- Tasa de rechazo por filtro
- Miembros nuevos por día (correlación con actividad)
```

---

## 5. PLANTILLAS OFICIALES

### Estructura de Plantilla

Cada plantilla tiene:

```typescript
interface PublicationTemplate {
  id: string;                    // "free_alert_v1"
  type: PublicationType;         // "FREE_ALERT"
  version: string;               // "1.0"
  variables: TemplateVariable[]; // [@{instrument}, @{entry}, ...]
  markdown: string;              // Contenido Markdown
  telegram_format: string;       // Formato específico Telegram
  min_length: number;            // 50 caracteres
  max_length: number;            // 4096 Telegram limit
  includes_button: boolean;      // ¿Tiene botón/link?
  approval_required: boolean;    // ¿Requiere review antes?
  examples: string[];            // Ejemplos de output
}
```

### 5.1 Plantilla: FREE ALERT

**ID**: `free_alert_v1`

```markdown
🚨 ALERTA GRATUITA

🔷 @{instrument}

📍 ENTRADA: @{entry_price_formatted}
🛑 STOP LOSS: @{stop_loss_formatted}
🎯 TP1: @{take_profit_1_formatted}
🎯 TP2: @{take_profit_2_formatted}

📊 Risk/Reward: 1:@{rr_ratio}
⏰ Análisis: @{timestamp_formatted}
💡 Probabilidad: @{probability_percent}%
📈 Convicción: @{conviction_score}/10

⚠️ DEMO TRADING - Estos análisis se ejecutan en cuenta de prueba.

[Ver más en CARVIPIX](#) | [Únete a Pro](#)
```

**Variables Requeridas**:
- @{instrument}: "XAU/USD"
- @{entry_price_formatted}: "$2,345.50"
- @{stop_loss_formatted}: "$2,340.00"
- @{take_profit_1_formatted}: "$2,355.00"
- @{take_profit_2_formatted}: "$2,365.00"
- @{rr_ratio}: "2.0"
- @{timestamp_formatted}: "2026-07-14 14:32 UTC"
- @{probability_percent}: "78"
- @{conviction_score}: "8"

---

### 5.2 Plantilla: MARKET STATUS

**ID**: `market_status_v1`

```markdown
📊 ESTADO DEL MERCADO

Estado: @{market_state_label} @{market_state_emoji}

@{instruments_status_list}

⏰ Próxima Revisión: @{next_review_time}

@{market_insights}

✨ Miembros Pro reciben actualizaciones cada hora.
```

**Variables**:
- @{market_state_label}: "Mercado Favorable"
- @{market_state_emoji}: "✅"
- @{instruments_status_list}: Lista formateada de instrumentos
- @{next_review_time}: "14:00 UTC (1h 23m)"
- @{market_insights}: Observaciones clave

---

### 5.3 Plantilla: TRADE RESULT

**ID**: `trade_result_v1`

```markdown
@{result_emoji} OPERACIÓN COMPLETADA

🔷 @{instrument} | @{direction_label} @{direction_emoji}

📊 Entrada: @{entry_price_formatted}
📊 Salida: @{exit_price_formatted}
💰 Ganancia: @{pnl_formatted} (@{pnl_percent}%)
⏱️ Duración: @{duration_formatted}
📈 RR Alcanzado: @{actual_rr}

🎯 Acierto #@{win_count} (Win Rate: @{win_rate_percent}%)

**IMPORTANTE**: Estos son resultados de DEMO TRADING.

[Historial de resultados](#)
```

---

### 5.4 Plantilla: EDUCATION

**ID**: `education_@{topic}_v1`

Estructura genérica:

```markdown
📚 @{topic_emoji} @{topic_title}

@{introduction_paragraph}

@{body_sections}

---

💡 @{key_takeaway}

---

Próxima lección: @{next_lesson_hint}
```

**Temas predefinidos** con contenido exacto:

```
- "why_no_trade_today"
- "capital_preservation"
- "how_to_follow_alert"
- "common_trading_mistakes"
- "risk_reward_basics"
- "technical_vs_fundamental"
- "emotion_cycle"
- "stop_loss_importance"
```

---

### 5.5 Plantilla: PROMOTION

**ID**: `promotion_@{type}_v1`

```
Types:
- promotion_value_v1
- promotion_scarcity_v1
- promotion_community_v1
```

Cada una con contenido exacto, sin variables.

---

### 5.6 Plantilla: WELCOME

**ID**: `welcome_v1`

Contenido exacto y completo (mostrado arriba en sección 2.8).

---

## 6. MODERACIÓN Y UGC

### 6.1 Tipos de UGC Esperado

**A. Capturas de operaciones** (Screenshots)
- Usuario ejecuta alerta en su plataforma
- Captura el resultado
- Envía al bot de moderación

**B. Preguntas en thread**
- Usuario pregunta sobre alerta
- Thread automático colgado de mensaje
- Moderadores humanos responden

**C. Reclamos**
- Usuario reporta problema
- Se registra automáticamente
- Admin review

### 6.2 Pipeline de Moderación de Capturas

```
USUARIO ENVÍA CAPTURA
    ↓
┌──────────────────────┐
│ VALIDACIÓN AUTO      │
│ ¿Es imagen válida?   │
│ ¿Contiene prompt?    │
│ ¿Contiene credentials?
└────────┬─────────────┘
         ↓
┌──────────────────────┐
│ OCR + Análisis       │
│ Extraer datos        │
│ Validar coherencia   │
└────────┬─────────────┘
         ↓
┌──────────────────────┐
│ COLA MODERACIÓN      │
│ Admin review         │
│ Aprobar/Rechazar     │
└────────┬─────────────┘
         ↓
    PUBLICAR O RECHAZAR
```

### 6.3 Reglas de Moderación

**AUTO-RECHAZAR si**:
- Contiene números de cuenta
- Contiene nombres de usuario reales
- Contiene datos personales
- Resultado fake (análisis inconsistente)
- Violencia, spam, contenido político

**AUTO-PERMITIR si**:
- Screenshot clara de plataforma real
- Resultado coherente con alerta publicada
- Solo datos públicos
- Dentro de 24h de alerta original

**REQUIERE ADMIN si**:
- Resultado es -50% o +500% (valores extremos)
- Usuario es nuevo (< 7 días)
- Contenido ambiguo

### 6.4 Panel de Moderación

```
[Admin Dashboard - Moderation]

Pendiente de aprobación: 3
├─ Screenshot #2841 (usuario: trader_23)
├─ Screenshot #2842 (usuario: anonymous)
└─ Screenshot #2843 (usuario: pro_member)

[Verificado ✅] [Rechazar ❌] [Requerir aclaración ?]

Historial hoy: 12 aprobadas, 1 rechazada
```

---

## 7. PANEL ADMINISTRATIVO

### 7.1 Ubicación y Acceso

**Ruta**: `/admin/community-publisher`  
**Autenticación**: Solo admins  
**URL**: http://localhost:3000/admin/community-publisher

### 7.2 Secciones del Panel

#### **A. DASHBOARD GENERAL**

```
MÉTRICAS HOY:
├─ Publicaciones enviadas: 6/12
├─ Miembros nuevos: +12
├─ Tasa de rechazo: 8%
├─ Tiempo promedio entre posts: 2.3h
├─ Mensaje con más reacciones: [preview]
└─ Errores de envío: 0

ALERTAS:
├─ ⚠️ Miembro reportó problema
├─ ℹ️ Configuración expira en 5 días
└─ 📊 Daily limit alcanzado 90%
```

#### **B. HISTÓRICO DE PUBLICACIONES**

```
Tabla con:
- Timestamp
- Tipo
- Contenido preview
- Estado (SENT/QUEUED/FAILED/APPROVED)
- Reacciones
- Clicks
- Admin actions

Filtros: por tipo, por fecha, por status
Search: búsqueda en contenido
Export: CSV de última semana
```

#### **C. CONFIGURACIÓN DE FILTROS**

```
Editable sin reiniciar:
├─ Max alertas/día: [2] ← input
├─ Max educación/día: [2] ← input
├─ Max publis/hora: [3] ← input
├─ Min intervalo entre posts: [3] min ← input
├─ Horario descanso: [00:00-06:00 UTC] ← picker
├─ Palabras prohibidas: [...] ← textarea
├─ Filtros activos: [✓] Type Check
                    [✓] Time Check
                    [✓] Daily Limit
                    [✓] Quality Gate
                    [✓] Duplicate Check
                    [✓] Fraud Check

[Guardar] [Revertir a default] [Historial cambios]
```

#### **D. COLA DE PUBLICACIONES**

```
Pendiente de envío:
├─ [1] FREE_ALERT - XAU/USD (READY, enviar a las 15:00)
├─ [2] EDUCATION - Risk Management (SCHEDULED 18:00)
└─ [3] MARKET_STATUS (AWAITING TRIGGER)

Para cada publicación:
├─ Vista previa completa
├─ Variables validadas
├─ Envío inmediato [BOTÓN]
├─ Programar [BOTÓN]
├─ Cancelar [BOTÓN]
└─ Duplicar como borrador [BOTÓN]
```

#### **E. MODERACIÓN DE UGC**

```
Screenshots pendientes: 3
├─ [IMG] usuario: trader_23 - [✓ Aprobar] [❌ Rechazar]
├─ [IMG] usuario: pro_member - [✓] [❌] [?]
└─ [IMG] usuario: anonymous - [✓] [❌] [?]

Estadísticas:
- Aprobadas hoy: 12
- Rechazadas hoy: 1
- Tasa aprobación: 92%
```

#### **F. INTEGRACIÓN TELEGRAM**

```
Estado: ✅ Conectado

Bot: @carvipix_bot
Canal: @carvipix_community
ID Canal: -1001234567890

Último ping: 3s atrás
Mensajes enviados hoy: 6
Errores: 0

[Reenviar Config] [Test Message] [Desconectar]
```

#### **G. ESTADÍSTICAS**

```
ÚLTIMOS 7 DÍAS:

Publicaciones por día:
- Lun: 8
- Mar: 6
- Mié: 7
- Jue: 6
- Vie: 9
- Sab: 5
- Dom: 4

Miembros:
- Nuevos: +47
- Total: 1,234
- Tasa activos: 68%

Engagement:
- Reacciones promedio: 12
- Clicks en links: 34
- Replies: 8

Distribución de tipos:
- Alertas: 40%
- Educación: 35%
- Estado mercado: 15%
- Promoción: 5%
- Otros: 5%
```

#### **H. LOGS Y AUDITORÍA**

```
Último evento: Publicación envida (2 min)
├─ tipo: FREE_ALERT
├─ instrumento: XAUUSD
├─ telegram_id: 1234567890
├─ status: SUCCESS
├─ usuario_admin: [ninguno - automático]

Filtro por: usuario, tipo, status, fecha
Export: JSON/CSV
```

### 7.3 Acciones Disponibles

```
[Publicar Ahora] - Enviar publicación inmediatamente
[Programar] - Escoger fecha/hora
[Duplicar] - Crear copia como borrador
[Editar] - Modificar contenido (antes de envío)
[Cancelar] - Remover de cola
[Exportar Historial] - CSV con datos
[Sincronizar Telegram] - Verificar conexión
[Test] - Enviar mensaje de prueba
[Pausar/Reanudar] - Detener temporalmente
```

---

## 8. INTEGRACIÓN TELEGRAM

### 8.1 Requisitos Previos

```
1. BOT API TELEGRAM
   ├─ Token del bot: ${TELEGRAM_BOT_TOKEN}
   ├─ Acceso a Bot Father confirmado
   └─ Permisos: send messages, read incoming, handle callbacks

2. CANAL OFICIAL
   ├─ Nombre: @carvipix_community
   ├─ Descripción: "Análisis automático de trading CARVIPIX"
   ├─ El bot debe ser admin del canal
   └─ Botón de unirse disponible

3. WEBHOOK (Opcional para incoming)
   ├─ URL: https://carvipix.com/api/telegram/webhook
   ├─ Puerto: 443 (HTTPS)
   └─ Certificado válido
```

### 8.2 Configuración de Variables de Entorno

```bash
# .env.local

# Telegram Integration
TELEGRAM_BOT_TOKEN=123456789:ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefgh
TELEGRAM_CHANNEL_ID=-1001234567890
TELEGRAM_WEBHOOK_URL=https://api.carvipix.com/telegram/webhook
TELEGRAM_WEBHOOK_SECRET=your_secret_key_here
TELEGRAM_MAX_RETRIES=3
TELEGRAM_TIMEOUT_MS=5000

# Feature Flags
TELEGRAM_ENABLED=true
TELEGRAM_TEST_MODE=false  # Si true, envía a chat privado de test
```

### 8.3 Formato de Mensajes para Telegram

**Características soportadas**:
- ✅ Markdown básico (bold, italic, code)
- ✅ Links inline: `[texto](url)`
- ✅ Emojis
- ✅ Buttons inline
- ❌ Custom HTML
- ❌ Media (por ahora)

**Ejemplo Mensaje**:

```markdown
🚨 **ALERTA GRATUITA**

🔷 *XAU/USD*

📍 ENTRADA: `$2,345.50`
🛑 STOP LOSS: `$2,340.00`
🎯 TP1: `$2,355.00`

📊 Risk/Reward: `1:2.0`
⏰ Análisis: 2026-07-14 14:32 UTC

⚠️ _DEMO TRADING_

[Ver más](https://carvipix.com) | [Pro](https://carvipix.com/pro)
```

**Traducido a API Telegram**:

```json
{
  "chat_id": "-1001234567890",
  "text": "🚨 **ALERTA GRATUITA**...",
  "parse_mode": "Markdown",
  "disable_web_page_preview": true,
  "reply_markup": {
    "inline_keyboard": [
      [
        {"text": "Ver más", "url": "https://carvipix.com"},
        {"text": "Pro", "url": "https://carvipix.com/pro"}
      ]
    ]
  }
}
```

### 8.4 Manejo de Webhooks (Incoming)

**Eventos a capturar**:

```typescript
enum WebhookEvent {
  NEW_MEMBER = "new_member",        // Nuevo usuario se une
  REACTION = "reaction",             // Usuario reacciona a msg
  REPLY = "reply",                   // Usuario responde en thread
  ERROR = "error",                   // Telegram error
}

interface TelegramWebhookPayload {
  event: WebhookEvent;
  user_id: number;
  username?: string;
  timestamp: number;
  message_id?: number;
  reaction?: string;  // emoji
  data: Record<string, any>;
}
```

**Handlers**:

```typescript
// Al detectar nuevo miembro
if (event === WebhookEvent.NEW_MEMBER) {
  await publishWelcomeMessage(userId);
  await recordNewMember(userId);
  analyticsService.logUserJoined();
}

// Al detectar reacción
if (event === WebhookEvent.REACTION) {
  await analyticsService.logReaction({
    message_id,
    emoji: reaction,
    user_id
  });
}
```

### 8.5 Manejo de Errores y Reintentos

```typescript
interface SendConfig {
  max_retries: number;        // Default: 3
  timeout_ms: number;         // Default: 5000
  backoff_ms: number;         // Default: 1000 (exponencial)
  fail_silently: boolean;     // Default: false
}

async function sendWithRetry(
  message: TelegramMessage,
  config: SendConfig
): Promise<Result> {
  
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < config.max_retries; attempt++) {
    try {
      const response = await telegramAPI.send(message);
      return { success: true, message_id: response.message_id };
      
    } catch (error) {
      lastError = error;
      
      if (attempt < config.max_retries - 1) {
        const delay = config.backoff_ms * Math.pow(2, attempt);
        await sleep(delay);
      }
    }
  }
  
  // Todos los reintentos fallaron
  if (!config.fail_silently) {
    throw lastError;
  }
  
  return { 
    success: false, 
    error: lastError?.message,
    message: "Failed after retries"
  };
}
```

### 8.6 Rate Limiting

```typescript
const TELEGRAM_RATE_LIMITS = {
  messages_per_second: 30,        // Telegram official limit
  messages_per_minute: 1000,
  max_burst: 5,
  window_ms: 1000
};

class TelegramRateLimiter {
  private queue: TelegramMessage[] = [];
  private lastSend: number = 0;
  
  async enqueue(message: TelegramMessage): Promise<void> {
    this.queue.push(message);
    await this.processQueue();
  }
  
  private async processQueue(): Promise<void> {
    while (this.queue.length > 0) {
      const now = Date.now();
      const timeSinceLastSend = now - this.lastSend;
      
      if (timeSinceLastSend >= 1000 / TELEGRAM_RATE_LIMITS.messages_per_second) {
        const message = this.queue.shift();
        await this.send(message);
        this.lastSend = Date.now();
      } else {
        const delay = (1000 / TELEGRAM_RATE_LIMITS.messages_per_second) - timeSinceLastSend;
        await sleep(delay);
      }
    }
  }
}
```

---

## 9. SEGURIDAD

### 9.1 NUNCA PUBLICAR

**Información prohibida de cualquier tipo**:

```
ABSOLUTO:
- ❌ Prompt del sistema de ChatGPT
- ❌ Prompt Maestro V3
- ❌ analysis_private (razonamiento interno)
- ❌ strategy_selected (estrategia secreta)
- ❌ reasoning (lógica de decisión)
- ❌ API Keys o tokens
- ❌ Bearer tokens
- ❌ Credentials de cualquier tipo
- ❌ Rutas de archivos del sistema
- ❌ IP addresses
- ❌ Variables de entorno

HIGIENE:
- ❌ Expediente completo (solo "bloque público")
- ❌ Identificadores internos de análisis
- ❌ Timestamps de procesamiento interno
- ❌ Datos de latencia interna
- ❌ Información de costo de OpenAI
```

### 9.2 Validación Antes de Publicar

```typescript
interface SecurityValidation {
  contains_prompt: boolean;
  contains_api_key: boolean;
  contains_private_data: boolean;
  contains_file_paths: boolean;
  risk_level: "safe" | "warning" | "danger";
}

function validateSecurity(content: string): SecurityValidation {
  const dangerousPatterns = [
    /system[_-]prompt/i,
    /api[_-]key/i,
    /bearer\s+token/i,
    /analysis[_-]private/i,
    /strategy[_-]selected/i,
    /\/[a-zA-Z0-9/_-]+\.(ts|js|py|md)/,  // file paths
    /\$\{[A-Z_]+\}/,  // env variables
    /https?:\/\/[^\s]+/,  // URLs (mostly safe but review)
  ];
  
  let riskLevel = "safe";
  
  for (const pattern of dangerousPatterns) {
    if (pattern.test(content)) {
      riskLevel = "danger";
      break;
    }
  }
  
  return {
    contains_prompt: /prompt/i.test(content),
    contains_api_key: /api[_-]key/i.test(content),
    contains_private_data: /analysis[_-]private|strategy[_-]selected/i.test(content),
    contains_file_paths: /\/[a-zA-Z0-9/_-]+\.(ts|js|py)/.test(content),
    risk_level: riskLevel as any
  };
}
```

### 9.3 Cifrado en Tránsito

```
- HTTPS/TLS 1.3 obligatorio para API webhook
- Telegram API ya usa TLS (verificado)
- Tokens en variables de entorno (nunca hardcodeado)
- Logs nunca contienen tokens completos (mostrar últimos 4 chars)
```

### 9.4 Acceso y Auditoría

```typescript
interface AdminAction {
  timestamp: number;
  admin_id: string;
  admin_email: string;
  action: "publish" | "schedule" | "edit" | "delete" | "config_change";
  target: string;  // qué se modificó
  before?: string;  // valor anterior (si aplica)
  after?: string;   // valor nuevo (si aplica)
  ip_address?: string;
  user_agent?: string;
}

// Todos los cambios en admin se registran
// Disponible para auditoría
// Filtrado por fecha/usuario
// Exportable
```

---

## 10. ESCALABILIDAD

### 10.1 Diseño Preparado para Escala

```
ARQUITECTURA AGNÓSTICA A VOLUMEN

Actualmente: 1,234 miembros
├─ ~500 mensajes/semana
├─ 1.5MB datos histórico

Proyectado 50,000 miembros:
├─ ~15,000 mensajes/semana
├─ ~50MB datos histórico
├─ Mismo código, mismo performance
```

### 10.2 Bottlenecks Identificados y Mitigados

#### **A. Base de Datos**

```
Problema: Historial de mensajes crece linealmente
Solución:
├─ Indexar por: fecha, tipo, status
├─ Particiones por mes (si/when DB es SQL)
├─ Archival de mensajes > 90 días
└─ Búsqueda rápida por índices

Query típica:
  SELECT * FROM publications
  WHERE created_at >= NOW() - INTERVAL 7 DAY
  AND status = 'SENT'
  ORDER BY created_at DESC
  LIMIT 100
  
  Con índices: ~50ms
  Sin índices: ~5000ms
```

#### **B. Telegram API**

```
Límite oficial: 30 msg/s por bot
Mitigación:
├─ Queue + rate limiter
├─ Distribuir alertas en tiempo (no todas a la vez)
├─ Batch de educación cada noche
└─ Si llega a límite: entrar en backoff exponencial

Capacidad actual: 2,592,000 msg/día = OK para 100k miembros
```

#### **C. Generación de Contenido**

```
Problema: Generar N templates toma tiempo
Solución:
├─ Cache de plantillas compiladas
├─ Generación es O(1) (solo llenar variables)
├─ No hay procesamiento de IA (input de Disparador)
└─ Performance: ~1ms por mensaje

Escalabilidad: Lineal, aceptable
```

#### **D. Persistencia**

```
Actual: JSON file (logs.json + publications.json)
├─ OK para 10k mensajes
├─ Performance degrada si > 100k

Futuro: Migrar a:
├─ PostgreSQL para historial
├─ Redis para caché de últimos 7 días
├─ S3 para archival
└─ Elasticsearch para búsqueda full-text

No requiere cambio en código de Community Publisher
(Abstracción de data layer)
```

### 10.3 Monitoreo de Salud

```typescript
interface HealthMetrics {
  queue_size: number;           // Mensajes pendientes
  telegram_api_latency_ms: number;
  db_query_latency_ms: number;
  error_rate_percent: number;   // % de fallos
  uptime_percent: number;       // 7 días
  last_successful_send: number; // timestamp
}

// Alertas si:
- queue_size > 100
- telegram_api_latency > 2000
- error_rate > 5%
- uptime < 99%
```

### 10.4 Plan de Crecimiento

```
FASE 1 (Actual): 1K-10K miembros
├─ Código actual OK
├─ JSON storage OK
└─ 1 servidor suficiente

FASE 2 (10K-50K miembros)
├─ Migrar a PostgreSQL
├─ Agregar Redis
├─ Monitor con Prometheus
└─ 2-3 servidores

FASE 3 (50K-100K+ miembros)
├─ Elasticsearch para búsqueda
├─ CDN para assets
├─ Load balancer
├─ 5+ servidores
├─ Read replicas DB
└─ Monitoring completo (APM, logs centralizados)
```

---

## RESTRICCIONES DE DISEÑO

### Restricciones de Arquitectura

```
✅ NO es un bot multi-propósito
✅ NO maneja pagos (integración externa)
✅ NO generador de contenido con IA (usa Disparador)
✅ NO moderación automática de UGC (humanos)
✅ NO traducciones (solo inglés + UTC)
✅ NO machine learning (decisiones rule-based)

✅ ES especializado en publicación de análisis
✅ ES inmune a modificaciones del Expediente V3
✅ ES independiente del Scheduler
✅ ES testeable sin Telegram
```

### Restricciones Operacionales

```
⏸️ No se debe modificar Community Publisher mientras Observador V3 corre
   (Razón: Ambos acceden a misma persistencia)

⏸️ Cambios de plantillas requieren versioning
   (Razón: Auditoría de cambios)

⏸️ Acceso admin requiere 2FA
   (Razón: Seguridad de canal oficial)

⏸️ No se puede pausar Community Publisher sin avisar a miembros
   (Razón: Transparencia)
```

---

## CONTRATO DE INTERFAZ

### Entrada: Del Disparador

```typescript
interface CommunityPublisherEvent {
  // Identificadores
  id: string;                      // UUID único
  signal_id: string;               // Del análisis
  analysis_id: string;             // Del análisis
  
  // Clasificación
  type: PublicationType;           // FREE_ALERT | TRADE_RESULT | ...
  priority: "high" | "normal" | "low";
  
  // Datos
  payload: Record<string, any>;    // Variables para template
  
  // Metadatos
  timestamp: number;               // ms desde epoch
  instrument: CanonicalSymbol;     // XAUUSD, EURUSD, ...
  source: "observer_v3" | "scheduler" | "manual";
  
  // Control
  require_approval: boolean;       // Necesita admin review?
  expires_at?: number;             // TTL si aplica
  
  // Auditoría
  created_by: string;              // Usuario que dispara
}
```

### Salida: A Telegram

```typescript
interface TelegramPublishment {
  // Resultado
  success: boolean;
  message_id: number;              // De Telegram
  
  // Auditoría
  timestamp_sent: number;
  retry_attempts: number;
  total_latency_ms: number;
  
  // Seguimiento
  reactions: number;               // emojis usados
  clicks: number;                  // links clickeados
  replies: number;                 // respuestas en thread
}
```

### Persistencia

```typescript
interface Publication {
  // Identificadores
  id: string;
  community_publisher_id: string;
  signal_id: string;
  
  // Contenido
  type: PublicationType;
  message_text: string;
  telegram_message_id: number;
  
  // Timestamps
  created_at: number;
  published_at: number;
  
  // Metadatos
  instrument: CanonicalSymbol;
  variables_used: Record<string, any>;
  
  // Seguimiento
  engagement: {
    reactions: number;
    replies: number;
    clicks: number;
  };
  
  // Estado
  status: "QUEUED" | "SENT" | "FAILED" | "APPROVED";
  error_message?: string;
  
  // Auditoría
  approved_by?: string;
  approved_at?: number;
}
```

---

## PRÓXIMOS PASOS

### Fase 1: Aprobación de Diseño
- ✅ Documento de arquitectura completado
- 🔄 **REVISIÓN USUARIO**
- ❌ Cambios solicitados
- ❌ Aprobación final

### Fase 2: Contrato Técnico
- Interfaces TypeScript finales
- Esquema de base de datos
- API endpoints specification

### Fase 3: Auditoría de Seguridad
- Review de validaciones
- Testing de filtros
- Verificación de no-publicación

### Fase 4: Implementación
- Desarrollo de componentes
- Integración Telegram
- Testing end-to-end

### Fase 5: Certificación
- 3 ciclos reales de publicación
- Validación de escalabilidad
- Captura de evidencia

### Fase 6: Congelamiento
- Marcar como FROZEN
- Documentar APIs estables
- Listo para producción

---

**FIN DEL DOCUMENTO DE ARQUITECTURA**

Esperando aprobación y cambios.
