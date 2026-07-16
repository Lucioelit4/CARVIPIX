# AUDITORÍA DE LENGUAJE — PLANTILLAS OFICIALES CARVIPIX

Documento para revisar cómo habla CARVIPIX a través de las 50 variantes.

Los placeholders {{...}} representan datos que se insertan dinámicamente:
- {{instrument}}: Ej. XAUUSD, EURUSD
- {{decision}}: Ej. BUY, SELL
- {{entry}}, {{stop_loss}}, {{take_profit}}, {{risk_reward}}: Niveles de precio
- {{confidence_level}}: HIGH, MEDIUM, etc.
- {{origin}}: PAPER, DEMO, LIVE_VERIFIED
- {{result}}: WIN, LOSS
- {{pnl_pips}}, {{pnl_percent}}: Resultados numéricos

---

## PLANTILLA 1: FREE_ALERT (10 variantes)

### Variante fa_v01
```
🎯 ENTRADA {{instrument}}

Dirección: {{decision}}
Entrada: {{entry}}
SL: {{stop_loss}}
TP: {{take_profit}}
RR: {{risk_reward}}

⚠️ Gestión de riesgo obligatoria.
Cada operación respeta el máximo de capital establecido.

{{origin}} | Verificada automáticamente
```

### Variante fa_v02
```
📊 {{instrument}} — Señal confirmada

Movimiento esperado: {{decision}}
📍 Entrada: {{entry}}
🛑 Stop Loss: {{stop_loss}}
🎁 Take Profit: {{take_profit}}
📈 Risk/Reward: {{risk_reward}}

💡 Esta es una oportunidad verificada.
El riesgo siempre precede a toda operación.

Resultado: {{origin}} trading
```

### Variante fa_v03
```
CARVIPIX — {{instrument}} {{decision}}

Entrada: {{entry}} | SL: {{stop_loss}} | TP: {{take_profit}} | RR: {{risk_reward}}

Análisis completado. Condiciones cumplidas para operación.

Gestión de riesgo: Obligatoria.
Origen: {{origin}}

Continuamos monitoreando.
```

### Variante fa_v04
```
✅ {{instrument}}

Señal: {{decision}}
Entrada: {{entry}}
Stop: {{stop_loss}}
Target: {{take_profit}}
R/R: {{risk_reward}}

Probabilidad estimada: Alta
Confianza: {{confidence_level}}

⚠️ Cada trader establece su máximo de riesgo.
Esta alerta es una guía verificada.

{{origin}} | Automático
```

### Variante fa_v05
```
📈 {{instrument}} — {{decision}}

Entrada: {{entry}}
Stop Loss: {{stop_loss}}
Take Profit: {{take_profit}}
Ratio: {{risk_reward}}

La entrada está validada.
Tu gestión de riesgo es responsabilidad tuya.

Continuamos atentos a {{instrument}}.
{{origin}} | Carvipix
```

### Variante fa_v06
```
🎯 {{instrument}} LISTO

→ {{decision}}
→ {{entry}}
→ SL: {{stop_loss}}
→ TP: {{take_profit}}
→ RR: {{risk_reward}}

Verificado por CARVIPIX.
{{origin}} environment.

Recuerda: Riesgo primero, ganancia después.
```

### Variante fa_v07
```
{{instrument}} — Análisis completado

Dirección: {{decision}}
Entrada: {{entry}} | SL: {{stop_loss}} | TP: {{take_profit}}
Risk/Reward: {{risk_reward}}

Confianza: {{confidence_level}}

Esta es una oportunidad registrada en {{origin}}.
Tu gestión de riesgo determina tu resultado.

Disponible para operación.
```

### Variante fa_v08
```
🔴 {{decision}} {{instrument}}

Entrada confirmada: {{entry}}
Protección: {{stop_loss}}
Objetivo: {{take_profit}}
Retorno/Riesgo: {{risk_reward}}

✓ Pre-operacional
✓ Riesgos mapeados
✓ Monitoreo activo ({{origin}})

Gestión de capital: Tu responsabilidad.
```

### Variante fa_v09
```
{{instrument}} — OPORTUNIDAD

{{decision}}
Entrada: {{entry}}
SL: {{stop_loss}} | TP: {{take_profit}}
RR: {{risk_reward}}

Nivel de confianza: {{confidence_level}}
Status: {{origin}} | Verificado

⚠️ Advertencia: Toda operación conlleva riesgo de pérdida.
```

### Variante fa_v10
```
✅ {{instrument}} {{decision}}

Entrada: {{entry}}
Stop Loss: {{stop_loss}}
Take Profit: {{take_profit}}
Ratio: {{risk_reward}}

CARVIPIX ha validado esta entrada.
{{origin}} | Análisis automático

Tu máximo de riesgo es tuya responsabilidad.
```

---

## PLANTILLA 2: MARKET_STATUS (10 variantes)

### Variante ms_v01
```
📊 ESTADO DE MERCADO

{{instrument}}: {{decision}}

Análisis:
{{confidence_level}} confianza

El mercado se mueve bajo estas condiciones.
Nada es permanente. Monitoremos juntos.
```

### Variante ms_v02
```
🟢 {{instrument}} — Condiciones favorables

Contexto: {{decision}}

Se observan oportunidades.
Estamos atentos.
Compartiremos alertas cuando se cumplan los criterios.
```

### Variante ms_v03
```
🟡 {{instrument}} — Bajo vigilancia

Mercado en transición.
No hay entrada clara en este momento.

Continuamos monitoreando cada minuto.
```

### Variante ms_v04
```
🔴 {{instrument}} — Complicado

Las condiciones no son favorables.
Esperamos una mejor oportunidad.

CARVIPIX no fuerza operaciones.
```

### Variante ms_v05
```
⚫ {{instrument}} — Sin condiciones

Sin señales claras en este momento.

Paciencia es parte de la operación.
Volvemos cuando {{instrument}} nos llame.
```

### Variante ms_v06
```
{{instrument}} — Actualización

Status: {{confidence_level}}

El mercado está en: {{decision}}

Compartiremos movimientos cuando sea relevante.
Tu atención es bienvenida aquí.
```

### Variante ms_v07
```
CARVIPIX observa {{instrument}}

Contexto actual: {{decision}}

✓ Análisis en tiempo real
✓ Monitoreo continuo
✓ Alertas cuando proceda

Volvemos cuando haya oportunidad.
```

### Variante ms_v08
```
📈 {{instrument}} — Análisis de situación

{{decision}}

No hay entrada aún.
Pero seguimos atentos.

El mercado nos dirá.
```

### Variante ms_v09
```
{{instrument}}: {{confidence_level}}

Mercado: {{decision}}

Continuamos en monitoreo automático.
CARVIPIX no descansa.

Cuando haya oportunidad, compartiremos.
```

### Variante ms_v10
```
Estado de {{instrument}}:

Confianza: {{confidence_level}}
Mercado: {{decision}}

Nada que operar en este momento.
Pero todo puede cambiar.

Estamos aquí.
```

---

## PLANTILLA 3: OPPORTUNITY_DEVELOPING (10 variantes)

### Variante od_v01
```
👀 {{instrument}} — Oportunidad observada

Estamos viendo posibles movimientos.

Aún NO hay entrada válida.

Continuamos monitoreando automáticamente.
Te avisaremos cuando sea el momento.
```

### Variante od_v02
```
🔍 {{instrument}} — En observación

Se perfilan condiciones interesantes.

La entrada aún no está lista.

Paciencia. Las mejores operaciones requieren espera.
```

### Variante od_v03
```
⏳ {{instrument}} — Formándose

Detectamos que {{decision}}.

Falta poco para la entrada confirmada.

Estamos listos. ¿Tú?
```

### Variante od_v04
```
{{instrument}}: Algo se aproxima

Contexto: {{decision}}

Aún no es hora de operar.
Pero los indicadores señalan movimiento.

Mantente alerta.
```

### Variante od_v05
```
📍 {{instrument}} — Punto de inflexión

El mercado está en {{decision}}.

La entrada puede venir pronto.

Automáticamente monitoreamos cada tick.
Serás el primero en saberlo.
```

### Variante od_v06
```
🎯 {{instrument}} — Preparándose

Las condiciones se alinean.

Una oportunidad {{decision}} está en formación.

Aguarda confirmación.
```

### Variante od_v07
```
Observación {{instrument}}:

{{decision}} en progreso.

La oportunidad aún está en desarrollo.
Cuando esté lista, lo sabrás.

Continuamos atentos.
```

### Variante od_v08
```
⚡ {{instrument}} — Potencial detectado

Hay movimiento {{decision}} potencial.

Confirmación en espera.

CARVIPIX vigila cada segundo.
```

### Variante od_v09
```
{{instrument}} — {{decision}}

Patrón en formación.

Entrada aún no válida.

Cuando los criterios se cumplan, actuaremos.
Tú serás notificado automáticamente.
```

### Variante od_v10
```
👁️ {{instrument}} — En vigilancia

Algo interesante está sucediendo: {{decision}}.

Aún no hay trade.

Pero prepárate. Puede venir pronto.
```

---

## PLANTILLA 4: TRADE_RESULT (10 variantes)

### Variante tr_v01
```
📊 RESULTADO — {{instrument}}

Alerta: {{decision}}
Resultado: {{result}}
{{pnl_pips}} pips | {{pnl_percent}}% ganancia

Ambiente: {{origin}}

Análisis: Completado
Próximo: Nuevo ciclo en marcha
```

### Variante tr_v02
```
✅ {{result}} — {{instrument}}

{{pnl_pips}} pips alcanzados.
Ganancia: {{pnl_percent}}%

Esta fue una entrada {{origin}} verificada.

Continuamos buscando las siguientes.
```

### Variante tr_v03
```
{{result}} en {{instrument}}

Resultado cuantificado:
{{pnl_pips}} pips | {{pnl_percent}}%

Tipo: {{origin}} trading
Status: Cierre completado

Lección: Cada resultado nos enseña.
```

### Variante tr_v04
```
🎯 {{instrument}} — {{result}}

{{pnl_pips}} pips capturados
{{pnl_percent}}% de retorno

{{origin}} verification complete.

Una operación verificada es aprendizaje puro.
```

### Variante tr_v05
```
📈 Cierre de operación

{{instrument}}: {{result}}
Ganancia: {{pnl_pips}} pips ({{pnl_percent}}%)

Ambiente: {{origin}}

El mercado habló. Nosotros escuchamos.
Próxima oportunidad en formación.
```

### Variante tr_v06
```
{{result}} — {{instrument}}

{{pnl_pips}} pips | Resultado: {{pnl_percent}}%

{{origin}} | Verificado por CARVIPIX

Cada cierre es un paso en el camino.
```

### Variante tr_v07
```
✓ {{result}} en {{instrument}}

Pips: {{pnl_pips}}
Retorno: {{pnl_percent}}%

Análisis: {{origin}} | Completado

CARVIPIX no solo alerta.
CARVIPIX aprende de cada resultado.
```

### Variante tr_v08
```
🏁 {{instrument}} — {{result}}

{{pnl_pips}} pips alcanzados
{{pnl_percent}}% de ganancia en {{origin}}

Cada operación cierra con una lección.

¿Próxima?
```

### Variante tr_v09
```
Cierre: {{result}}

{{instrument}} | {{pnl_pips}} pips | {{pnl_percent}}%

Tipo: {{origin}} trading
Verificación: Automática

Datos listos para análisis.
```

### Variante tr_v10
```
{{instrument}}: {{result}}

Capturados: {{pnl_pips}} pips
Ganancia: {{pnl_percent}}%

Prueba {{origin}} completada.

Continuamos monitoreando.
```

---

## PLANTILLA 5: EDUCATIONAL_OR_PROMOTIONAL (10 variantes)

### Variante ep_v01_edu (EDUCACIÓN)
```
📚 CARVIPIX EDUCA

¿Por qué hoy no hubo alertas?

Porque la mejor operación es no operar cuando no hay oportunidad.

El mercado siempre estará ahí.
La paciencia es una herramienta.
```

### Variante ep_v02_edu (EDUCACIÓN)
```
🎓 LECCIÓN: Gestión de riesgo

El 99% de traders falla por mala gestión de riesgo.
No por falta de señales.

Cada operación debe definir ANTES:
- Máximo de riesgo en % del capital
- Stop Loss (obligatorio)
- Take Profit (obligatorio)

Sin esto: No es trading. Es juego.
```

### Variante ep_v03_edu (EDUCACIÓN)
```
💡 CARVIPIX: Errores comunes

❌ Operar sin plan
❌ Seguir pistas de redes sociales
❌ Obsesionarse con un instrumento
❌ No aceptar pérdidas pequeñas
❌ Arriesgar más del 5% por operación

✅ Disciplina bate emociones
✅ Plan bate improvisación
✅ Sistema bate suerte
```

### Variante ep_v04_edu (EDUCACIÓN)
```
🎯 PRINCIPIO: Risk First

En CARVIPIX, el riesgo es PRIMERO.

Ganancia es SEGUNDO.

Esto significa:
1. Define tu Stop Loss
2. Define tu Take Profit
3. Recién entonces: Opera

Quien lo domina, prospera.
```

### Variante ep_v05_edu (EDUCACIÓN)
```
📊 ¿Por qué CARVIPIX a veces espera?

Porque esperar es operar.

Evitar una pérdida de 50 pips
es lo mismo que ganar 50 pips.

La disciplina está en el NO.
```

### Variante ep_v06_promo (PROMOCIÓN)
```
🎁 MEMBRESÍA PRO de CARVIPIX

La alerta gratuita que recibiste hoy
forma parte de nuestro trabajo continuo.

Miembros Pro reciben:
✓ Cobertura completa (sesión completa)
✓ Análisis en profundidad
✓ Soporte prioritario

Una inversión. Cero riesgo de principiante.
```

### Variante ep_v07_promo (PROMOCIÓN)
```
🔓 Acceso Pro: Diferencia

Gratuito: Alertas selectas
Pro: Monitoreo completo + educación + comunidad

La diferencia es el trabajo detrás.

¿Interesado? Contacta.
```

### Variante ep_v08_promo (PROMOCIÓN)
```
💼 CARVIPIX Pro existe para:

✓ Traders que quieren aprender
✓ Traders que quieren resultados
✓ Traders que quieren comunidad

Gratuito es un inicio.
Pro es el camino.

Ambos bienvenidos.
```

### Variante ep_v09_promo (PROMOCIÓN)
```
📢 ÚNETE A CARVIPIX

Aquí no vendemos sueños.
Aquí enseñamos disciplina.

Miembros Pro tienen acceso a:
- Señales verificadas
- Comunidad activa
- Mentoría

Gratuito: Respetado.
Pro: Acompañado.
```

### Variante ep_v10_promo (PROMOCIÓN)
```
🌟 Alerta gratuita = CARVIPIX working

Nada es "gratis" si no hay valor.

Cada alerta que recibiste hoy
es horas de análisis automático.

Pro recibe esto TODA LA SESIÓN.

¿Listo para el siguiente nivel?
```

---

# RESUMEN

**50 variantes totales:**
- FREE_ALERT: 10 variantes
- MARKET_STATUS: 10 variantes
- OPPORTUNITY_DEVELOPING: 10 variantes
- TRADE_RESULT: 10 variantes
- EDUCATIONAL_OR_PROMOTIONAL: 10 variantes (5 educación + 5 promoción)

**Criterios de auditoría:**
✓ Tono profesional vs. amigable
✓ Confianza vs. sobre-promesas
✓ Claridad vs. complejidad
✓ Legibilidad (emojis, estructura)
✓ Sensación premium
✓ Psicología (cómo mueve al usuario)
✓ No parece bot
✓ No revela estrategia
✓ Sin promesas falsas
✓ Identidad de marca consistente
