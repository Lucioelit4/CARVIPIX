/**
 * Template Factory — 50 Variantes Oficiales CARVIPIX V1
 * Lenguaje profesional, premium, consistente
 */

import type { Template, TemplateVariant } from './template-types';

function variant(id: string, body: string, preview: string, tags?: string[]): TemplateVariant {
  return {
    variant_id: id,
    body,
    preview,
    created_at: new Date().toISOString(),
    used_count: 0,
    tags,
  };
}

// ─── PLANTILLA 1: FREE_ALERT ─────────────────────────────────────────────────

export const FREE_ALERT_TEMPLATE: Template = {
  template_id: 'free_alert',
  type: 'FREE_ALERT',
  status: 'FROZEN',
  description: 'Alerta de entrada verificada — disponible para miembros gratuitos',
  created_at: new Date().toISOString(),
  frozen_at: new Date().toISOString(),
  variants: [
    variant(
      'fa_v01',
      `🎯 ENTRADA {{instrument}}

Dirección: {{decision}}
Entrada: {{entry}}
Stop Loss: {{stop_loss}}
Take Profit: {{take_profit}}
Relación R/B: {{risk_reward}}

{{confidence_level}}

Origen: {{origin}}
Verificada automáticamente`,
      '🎯 Entrada verificada',
      ['core', 'professional']
    ),

    variant(
      'fa_v02',
      `📊 {{instrument}} — Señal identificada

Movimiento: {{decision}}
Entrada: {{entry}}
Stop Loss: {{stop_loss}}
Take Profit: {{take_profit}}
Relación R/B: {{risk_reward}}

{{confidence_level}}
Origen: {{origin}}

Tu gestión de riesgo es tu responsabilidad.`,
      '📊 Señal identificada',
      ['professional']
    ),

    variant(
      'fa_v03',
      `{{instrument}}

{{decision}}
Entrada: {{entry}}
SL: {{stop_loss}} | TP: {{take_profit}}
R/B: {{risk_reward}}

{{confidence_level}}
{{origin}} | CARVIPIX

Cada operación conlleva riesgo.`,
      'Análisis completado',
      ['minimal']
    ),

    variant(
      'fa_v04',
      `✅ {{instrument}} — {{decision}}

Entrada: {{entry}}
Stop Loss: {{stop_loss}}
Take Profit: {{take_profit}}
Relación R/B: {{risk_reward}}

Confianza: {{confidence_level}}
Origen: {{origin}}

Análisis completado por CARVIPIX.`,
      '✅ Análisis listo',
      ['core']
    ),

    variant(
      'fa_v05',
      `📈 {{instrument}}

Dirección: {{decision}}
Entrada: {{entry}}
Stop Loss: {{stop_loss}}
Take Profit: {{take_profit}}
Relación R/B: {{risk_reward}}

{{confidence_level}}

Señal desde: {{origin}}
Tu decisión de operar es personal.`,
      '📈 Señal en vivo',
      ['friendly']
    ),

    variant(
      'fa_v06',
      `{{instrument}} — {{decision}}

Entrada: {{entry}}
Stop Loss: {{stop_loss}}
Take Profit: {{take_profit}}
Relación R/B: {{risk_reward}}

Confianza: {{confidence_level}}
Origen del análisis: {{origin}}

Principio CARVIPIX: Riesgo primero.`,
      'Señal lista',
      ['professional']
    ),

    variant(
      'fa_v07',
      `🎯 {{instrument}} — Oportunidad identificada

→ {{decision}}
→ Entrada: {{entry}}
→ Stop Loss: {{stop_loss}}
→ Take Profit: {{take_profit}}
→ Relación R/B: {{risk_reward}}

{{confidence_level}}
Verificado: {{origin}}`,
      '🎯 Oportunidad',
      ['emoji', 'professional']
    ),

    variant(
      'fa_v08',
      `{{decision}} {{instrument}}

Entrada: {{entry}}
Protección: {{stop_loss}}
Objetivo: {{take_profit}}
Relación R/B: {{risk_reward}}

{{confidence_level}}
Origen: {{origin}}

CARVIPIX monitorea. Tú decides.`,
      'Análisis',
      ['minimal']
    ),

    variant(
      'fa_v09',
      `📊 {{instrument}} — Condiciones alineadas

Movimiento esperado: {{decision}}
Entrada: {{entry}}
Stop Loss: {{stop_loss}}
Take Profit: {{take_profit}}
Relación R/B: {{risk_reward}}

Confianza: {{confidence_level}}
Análisis: {{origin}}`,
      '📊 Condiciones',
      ['professional']
    ),

    variant(
      'fa_v10',
      `✅ {{instrument}} {{decision}}

Entrada: {{entry}}
Stop Loss: {{stop_loss}}
Take Profit: {{take_profit}}
Relación R/B: {{risk_reward}}

{{confidence_level}}
Origen: {{origin}}

Cada trader gestiona su propio riesgo.`,
      '✅ Entrada',
      ['core']
    ),
  ],
};

// ─── PLANTILLA 2: MARKET_STATUS ──────────────────────────────────────────────

export const MARKET_STATUS_TEMPLATE: Template = {
  template_id: 'market_status',
  type: 'MARKET_STATUS',
  status: 'FROZEN',
  description: 'Estado del mercado — Contexto sin urgencia',
  created_at: new Date().toISOString(),
  frozen_at: new Date().toISOString(),
  variants: [
    variant(
      'ms_v01',
      `📊 {{instrument}} — Estado del mercado

{{decision}}

Confianza: {{confidence_level}}

El mercado se mueve bajo estas condiciones.
CARVIPIX monitorea continuamente.`,
      '📊 Estado',
      ['professional']
    ),

    variant(
      'ms_v02',
      `🟢 {{instrument}} — Condiciones favorables

Contexto: {{decision}}

Se observan condiciones potenciales.
Estamos atentos.
Te notificaremos cuando haya entrada válida.`,
      '🟢 Favorable',
      ['emoji']
    ),

    variant(
      'ms_v03',
      `🟡 {{instrument}} — Mercado en transición

No hay entrada clara en este momento.

Confianza: {{confidence_level}}
Continuamos monitoreando.`,
      '🟡 Vigilancia',
      ['emoji']
    ),

    variant(
      'ms_v04',
      `🔴 {{instrument}} — Mercado complicado

Las condiciones no son favorables.
Esperamos mejor contexto.

CARVIPIX no fuerza operaciones.`,
      '🔴 Complicado',
      ['emoji']
    ),

    variant(
      'ms_v05',
      `⚫ {{instrument}} — Sin condiciones claras

Sin señales en este momento.

Paciencia es parte del trading.
Volveremos cuando {{instrument}} lo permita.`,
      '⚫ Esperando',
      ['emoji']
    ),

    variant(
      'ms_v06',
      `{{instrument}} — Actualización de mercado

Estado: {{decision}}
Confianza: {{confidence_level}}

Te avisaremos cuando haya movimiento relevante.`,
      'Actualización',
      ['minimal']
    ),

    variant(
      'ms_v07',
      `CARVIPIX monitorea {{instrument}}

Contexto: {{decision}}

✓ Análisis en tiempo real
✓ Monitoreo continuo
✓ Alerta cuando sea necesaria`,
      'Monitoreo',
      ['professional']
    ),

    variant(
      'ms_v08',
      `📈 {{instrument}} — Evaluación de mercado

{{decision}}

No hay entrada aún.
Seguimos observando.

El mercado decidirá.`,
      '📈 Situación',
      ['friendly']
    ),

    variant(
      'ms_v09',
      `{{instrument}}: {{confidence_level}}

Mercado: {{decision}}

CARVIPIX no descansa.
Cuando haya oportunidad, compartiremos.`,
      'En monitoreo',
      ['professional']
    ),

    variant(
      'ms_v10',
      `Estado {{instrument}}

Confianza: {{confidence_level}}
Contexto: {{decision}}

Nada que operar en este momento.
Pero todo puede cambiar.`,
      'Estado',
      ['minimal']
    ),
  ],
};

// ─── PLANTILLA 3: OPPORTUNITY_DEVELOPING ─────────────────────────────────────

export const OPPORTUNITY_DEVELOPING_TEMPLATE: Template = {
  template_id: 'opportunity_developing',
  type: 'OPPORTUNITY_DEVELOPING',
  status: 'FROZEN',
  description: 'Oportunidad en desarrollo — Genera expectativa sin presión',
  created_at: new Date().toISOString(),
  frozen_at: new Date().toISOString(),
  variants: [
    variant(
      'od_v01',
      `👀 {{instrument}} — Oportunidad observada

Detectamos movimientos posibles.

Aún NO hay entrada válida.

CARVIPIX monitorea automáticamente.
Te avisaremos cuando sea el momento.`,
      '👀 En observación',
      ['emoji', 'friendly']
    ),

    variant(
      'od_v02',
      `🔍 {{instrument}} — Patrón en formación

Se perfilan condiciones interesantes.

La entrada aún no está lista.

Las mejores operaciones requieren espera.`,
      '🔍 Formándose',
      ['emoji']
    ),

    variant(
      'od_v03',
      `⏳ {{instrument}} — Próximo movimiento

Detectamos que {{decision}}.

La confirmación está cerca.

Estamos listos.`,
      '⏳ Próximo',
      ['emoji']
    ),

    variant(
      'od_v04',
      `{{instrument}}: Algo se aproxima

Contexto: {{decision}}

Aún no es hora de operar.
Los indicadores señalan movimiento potencial.

Mantente alerta.`,
      'Anticipación',
      ['professional']
    ),

    variant(
      'od_v05',
      `📍 {{instrument}} — Punto de inflexión

El mercado está en {{decision}}.

La entrada puede venir pronto.

CARVIPIX monitorea cada tick.
Serás el primero en saberlo.`,
      '📍 Punto crítico',
      ['emoji']
    ),

    variant(
      'od_v06',
      `🎯 {{instrument}} — Preparándose

Las condiciones se alinean.

Una oportunidad {{decision}} está en desarrollo.

Aguarda confirmación.`,
      '🎯 Desarrollo',
      ['emoji']
    ),

    variant(
      'od_v07',
      `Observación {{instrument}}:

{{decision}} en progreso.

La oportunidad está en desarrollo.
Cuando esté lista, lo sabrás.

Continuamos atentos.`,
      'Observando',
      ['professional']
    ),

    variant(
      'od_v08',
      `⚡ {{instrument}} — Potencial detectado

Hay movimiento {{decision}} potencial.

Confirmación en espera.

CARVIPIX vigila continuamente.`,
      '⚡ Potencial',
      ['emoji']
    ),

    variant(
      'od_v09',
      `{{instrument}} — {{decision}}

Patrón identificado.

Entrada aún no válida.

Cuando los criterios se cumplan, actuaremos.
Serás notificado automáticamente.`,
      'Patrón',
      ['professional']
    ),

    variant(
      'od_v10',
      `👁️ {{instrument}} — En vigilancia

Algo interesante está sucediendo: {{decision}}.

Aún no hay operación válida.

Prepárate. Puede venir pronto.`,
      '👁️ Vigilancia',
      ['emoji']
    ),
  ],
};

// ─── PLANTILLA 4: TRADE_RESULT ───────────────────────────────────────────────

export const TRADE_RESULT_TEMPLATE: Template = {
  template_id: 'trade_result',
  type: 'TRADE_RESULT',
  status: 'FROZEN',
  description: 'Resultado de operación — Solo alertas publicadas',
  created_at: new Date().toISOString(),
  frozen_at: new Date().toISOString(),
  variants: [
    variant(
      'tr_v01',
      `📊 {{instrument}} — Resultado

{{result}}
{{pnl_pips}} pips | {{pnl_percent}}%

Origen: {{origin}}

Análisis completado.
Próximo ciclo en marcha.`,
      '📊 Resultado',
      ['professional']
    ),

    variant(
      'tr_v02',
      `✅ {{result}} — {{instrument}}

{{pnl_pips}} pips
Ganancia: {{pnl_percent}}%

Señal desde: {{origin}}

Continuamos buscando las siguientes.`,
      '✅ {{result}}',
      ['emoji', 'core']
    ),

    variant(
      'tr_v03',
      `{{result}} {{instrument}}

Resultado: {{pnl_pips}} pips ({{pnl_percent}}%)

Tipo: {{origin}}
Cierre completado.

Cada resultado nos enseña.`,
      'Cierre',
      ['professional']
    ),

    variant(
      'tr_v04',
      `🎯 {{instrument}} — {{result}}

{{pnl_pips}} pips
Retorno: {{pnl_percent}}%

Verificado: {{origin}}

Una operación documentada es aprendizaje.`,
      '🎯 {{result}}',
      ['emoji']
    ),

    variant(
      'tr_v05',
      `📈 Cierre

{{instrument}}: {{result}}
{{pnl_pips}} pips ({{pnl_percent}}%)

Ambiente: {{origin}}

El mercado habló. Aprendimos.
Próxima oportunidad en monitoreo.`,
      '📈 Cierre',
      ['friendly']
    ),

    variant(
      'tr_v06',
      `{{result}} — {{instrument}}

{{pnl_pips}} pips | {{pnl_percent}}%

{{origin}} | CARVIPIX

Cada cierre es un paso en el camino.`,
      '{{result}}',
      ['minimal']
    ),

    variant(
      'tr_v07',
      `✓ {{result}} {{instrument}}

Pips: {{pnl_pips}}
Retorno: {{pnl_percent}}%

Origen: {{origin}}

CARVIPIX aprende de cada resultado.
Transparencia en ganancias y pérdidas.`,
      '✓ {{result}}',
      ['professional']
    ),

    variant(
      'tr_v08',
      `🏁 {{instrument}} — {{result}}

{{pnl_pips}} pips
{{pnl_percent}}% en {{origin}}

Cada cierre nos enseña.

¿Próxima?`,
      '🏁 {{result}}',
      ['emoji']
    ),

    variant(
      'tr_v09',
      `Cierre: {{result}}

{{instrument}} | {{pnl_pips}} pips | {{pnl_percent}}%

Tipo: {{origin}}
Verificación: Automática

Datos listos para análisis.`,
      'Cierre documentado',
      ['minimal']
    ),

    variant(
      'tr_v10',
      `{{instrument}}: {{result}}

Capturados: {{pnl_pips}} pips
Retorno: {{pnl_percent}}%

Prueba {{origin}} completada.

Continuamos el monitoreo.`,
      'Resultado',
      ['professional']
    ),
  ],
};

// ─── PLANTILLA 5: EDUCATIONAL_OR_PROMOTIONAL ─────────────────────────────────

export const EDUCATIONAL_PROMOTIONAL_TEMPLATE: Template = {
  template_id: 'educational_or_promotional',
  type: 'EDUCATIONAL_OR_PROMOTIONAL',
  status: 'FROZEN',
  description: 'Educación y promoción discreta',
  created_at: new Date().toISOString(),
  frozen_at: new Date().toISOString(),
  variants: [
    // EDUCACIÓN (5 variantes)
    variant(
      'ep_v01_edu',
      `📚 CARVIPIX Educa

¿Por qué hoy no hubo alertas?

Porque no operar también es operar.

El mercado siempre estará ahí.
La paciencia es una herramienta profesional.`,
      '📚 No operar',
      ['education']
    ),

    variant(
      'ep_v02_edu',
      `🎓 Gestión de Riesgo

Razón de 99% de pérdidas de traders: mala gestión de riesgo.

Antes de cualquier operación:
✓ Define tu máximo de riesgo (%)
✓ Establece Stop Loss
✓ Define Take Profit

Sin esto no es trading. Es especulación.`,
      '🎓 Gestión',
      ['education', 'core']
    ),

    variant(
      'ep_v03_edu',
      `💡 Errores Comunes

❌ Operar sin plan
❌ Seguir rumores de redes
❌ Obsesionarse con un instrumento
❌ No aceptar pérdidas pequeñas
❌ Arriesgar más del 5% por operación

✅ Plan > emociones
✅ Sistema > suerte
✅ Disciplina > esperanza`,
      '💡 Errores',
      ['education']
    ),

    variant(
      'ep_v04_edu',
      `🎯 Principio CARVIPIX: Riesgo Primero

En cada operación:
1. Define Stop Loss
2. Define Take Profit
3. Recién entonces: Operas

Quien domina esto, prospera.`,
      '🎯 Riesgo Primero',
      ['education', 'core']
    ),

    variant(
      'ep_v05_edu',
      `📊 Por qué CARVIPIX a veces espera

Porque esperar es una acción.

Evitar una pérdida de 50 pips
= ganar 50 pips

La disciplina está en el NO.`,
      '📊 Esperar',
      ['education']
    ),

    // PROMOCIÓN (5 variantes)
    variant(
      'ep_v06_promo',
      `🎁 CARVIPIX Pro

La alerta gratuita que recibes
es parte de nuestro trabajo continuo.

Miembros Pro reciben:
✓ Cobertura completa de sesión
✓ Análisis profundo
✓ Comunidad activa

Una inversión en educación profesional.`,
      '🎁 Pro',
      ['promotion', 'subtle']
    ),

    variant(
      'ep_v07_promo',
      `🔓 Diferencia entre planes

Gratuito: Alertas selectas
Pro: Monitoreo completo + educación + comunidad

La diferencia es el trabajo detrás de cada alerta.`,
      '🔓 Planes',
      ['promotion']
    ),

    variant(
      'ep_v08_promo',
      `💼 CARVIPIX Pro es para

✓ Traders que quieren aprender
✓ Traders que quieren resultados
✓ Traders que quieren comunidad

Gratuito: Un buen inicio.
Pro: El camino completo.`,
      '💼 Pro',
      ['promotion']
    ),

    variant(
      'ep_v09_promo',
      `📢 CARVIPIX: Transparencia

Aquí no vendemos sueños.
Aquí enseñamos disciplina.

Pro accede a:
• Señales verificadas
• Comunidad activa
• Mentoría directa`,
      '📢 Transparencia',
      ['promotion']
    ),

    variant(
      'ep_v10_promo',
      `🌟 Alerta Gratuita = CARVIPIX Working

Cada alerta que recibes
= horas de análisis automático

Pro recibe esto TODA la sesión.

¿Listo para el siguiente nivel?`,
      '🌟 Nivel Pro',
      ['promotion', 'value']
    ),
  ],
};

/**
 * Inicializar biblioteca de plantillas
 */
export function createTemplateLibrary() {
  return {
    free_alert: FREE_ALERT_TEMPLATE,
    market_status: MARKET_STATUS_TEMPLATE,
    opportunity_developing: OPPORTUNITY_DEVELOPING_TEMPLATE,
    trade_result: TRADE_RESULT_TEMPLATE,
    educational_or_promotional: EDUCATIONAL_PROMOTIONAL_TEMPLATE,
  };
}
