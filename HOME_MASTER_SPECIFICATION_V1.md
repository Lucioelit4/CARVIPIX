# HOME MASTER SPECIFICATION V1 - CARVIPIX

## 0. Alcance y objetivo

Este documento define la especificacion completa de diseno del HOME de CARVIPIX a nivel de direccion industrial.
No contiene codigo, no contiene implementacion, y no depende de decisiones tecnicas de motor, API, base de datos o admin.

Meta: permitir que cualquier equipo senior de producto disene una HOME premium, consistente y lista para produccion visual sin necesidad de aclaraciones adicionales.

Principio rector:

- Alta claridad cognitiva + alta sofisticacion material + alta confianza operacional.

---

## 1. GRID (sistema espacial absoluto)

## 1.1 Contenedor maestro

- Max width desktop amplio: 1440 px de contenido util.
- Margen lateral desktop grande: minimo 72 px por lado.
- Margen lateral laptop: 48 px por lado.
- Margen lateral tablet: 32 px por lado.
- Margen lateral mobile: 20 px por lado.
- Safe area de lectura: nunca colocar texto critico pegado al borde; mantener minimo 24 px internos en bloques.

## 1.2 Sistema de columnas

- Desktop: 12 columnas.
- Tablet horizontal: 8 columnas.
- Tablet vertical: 6 columnas.
- Mobile: 4 columnas.

Especificaciones:

- Gutter desktop: 24 px.
- Gutter tablet: 20 px.
- Gutter mobile: 16 px.
- Los elementos hero pueden ocupar 7/5 o 8/4 columnas, segun peso narrativo.
- Cards de metricas: distribucion 3 o 4 por fila en desktop; 2 por fila en tablet; 1 por fila en mobile.

## 1.3 Alturas y modulos base

- Unidad base vertical: 8 px.
- Escala de espaciado oficial: 8, 12, 16, 24, 32, 40, 48, 64, 80, 96, 120.
- Altura minima de seccion hero desktop: 84vh.
- Altura minima de secciones de contenido: 520 px desktop.
- Altura minima de CTA final: 420 px desktop.
- Altura minima de footer: 220 px desktop.

## 1.4 Ritmo vertical

- Ritmo interseccion principal (entre bloques mayores): 96 px desktop, 72 px tablet, 56 px mobile.
- Ritmo intraseccion (entre titulo, subtitulo, contenido): 24-32 px.
- Ritmo micro (label, numero, nota): 8-12 px.
- Regla de respiracion premium: ningun bloque primario puede terminar con menos de 64 px de aire superior e inferior.

## 1.5 Separaciones y alineaciones

- Separadores horizontales: linea de baja opacidad, nunca divisores duros.
- Alineacion tipografica principal: baseline consistente por bloque.
- Alineacion de numeros: siempre tabular y a una misma linea optica.
- Alineacion de CTAs: misma linea base cuando conviven primario y secundario.

## 1.6 Breakpoints oficiales

- XL: >= 1600 px
- L: 1280-1599 px
- M: 1024-1279 px
- S: 768-1023 px
- XS: 480-767 px
- XXS: <= 479 px

Reglas por breakpoint:

- XL/L: composicion cinematica con doble foco (texto + visual).
- M/S: priorizar lectura secuencial, reducir densidad simultanea.
- XS/XXS: jerarquia extrema, una decision por pantalla.

---

## 2. JERARQUIA VISUAL CRONOMETRADA

## 2.1 Primer segundo (0-1s)

El usuario debe ver:

- Marca CARVIPIX.
- Headline principal de dominio operativo.
- CTA primario visible.
- Un indicio visual de entorno profesional (preview o visual de mercado).

Por que:

- El cerebro decide relevancia y estatus casi instantaneamente.
- Si no hay autoridad visual inmediata, se pierde confianza.

## 2.2 Segundo 5

El usuario debe entender:

- Que hace CARVIPIX.
- Que beneficio directo obtiene (claridad, velocidad de decision, control).
- Que existe una base metodologica, no humo.

Por que:

- El usuario entra en evaluacion racional temprana.
- Necesita una promesa concreta sin esfuerzo cognitivo.

## 2.3 Segundo 15

El usuario debe validar:

- Credibilidad por metricas o evidencia de sistema.
- Estructura de funcionamiento en 3 pasos.

Por que:

- A los 15 segundos aparece la pregunta "es real o marketing".
- Se requiere prueba de rigor.

## 2.4 Segundo 30

El usuario debe percibir:

- Diferencial frente a alternativas genericas.
- Vista previa del panel para reducir incertidumbre de adopcion.

Por que:

- En este punto compara opciones mentalmente.
- Necesita visualizar la experiencia concreta antes de comprometerse.

## 2.5 Minuto 1

El usuario debe concluir:

- "Entiendo el valor"
- "Confio en el enfoque"
- "Se como empezar"

Por que:

- Minuto 1 es frontera de conversion.
- El diseno debe cerrar dudas de riesgo, complejidad y seriedad.

---

## 3. ESPECIFICACION DE CADA BLOQUE

## 3.1 Bloque Hero

Mision comunicacional:

- Posicionar a CARVIPIX como entorno de decision elite.
- Traducir complejidad de mercado en control.

Contenido obligatorio:

- Headline principal (propuesta de control y precision).
- Subheadline tecnico-comercial (metodo + velocidad cognitiva + disciplina).
- CTA primario de inicio.
- CTA secundario de exploracion.
- Visual premium de apoyo (no decorativo).

Comportamiento visual:

- Foco 1: titular.
- Foco 2: CTA primario.
- Foco 3: visual contextual.

Sensacion buscada:

- Autoridad inmediata.
- Sobriedad premium.

## 3.2 Bloque Motor

Mision comunicacional:

- Explicar el corazon de inteligencia sin entrar en detalles tecnicos internos.

Contenido obligatorio:

- 3 capas de lectura del "motor": senal, interpretacion, accion recomendada.
- Mensaje de disciplina y proceso.
- Prueba de consistencia metodologica.

Comportamiento visual:

- Estructura secuencial limpia.
- Iconografia funcional.
- Microcopys cortos de operacion.

Sensacion buscada:

- "No adivina, procesa".
- "Hay criterio sistematico".

## 3.3 Bloque Panel

Mision comunicacional:

- Mostrar la superficie de trabajo real para eliminar friccion mental de adopcion.

Contenido obligatorio:

- Preview del Dashboard en estado realista.
- Identificacion de zonas: vision general, alertas, rendimiento, decisiones.
- Leyendas breves de lectura.

Comportamiento visual:

- Mockup principal centrado y dominante.
- Llamadas discretas, nunca invasivas.
- Profundidad por capas para materialidad.

Sensacion buscada:

- "Parece una herramienta seria".
- "Podria operarla sin perderme".

## 3.4 Bloque Alertas

Mision comunicacional:

- Demostrar vigilancia activa y comunicacion accionable.

Contenido obligatorio:

- Tipos de alerta (oportunidad, riesgo, cambio de contexto).
- Nivel de prioridad visual (alta/media/baja).
- Muestra de mensaje claro y no alarmista.

Comportamiento visual:

- Codificacion por color sobria.
- Jerarquia por severidad.
- Espaciado que evita sensacion de caos.

Sensacion buscada:

- "Me avisa lo importante".
- "No me sobrecarga".

## 3.5 Bloque Resultados

Mision comunicacional:

- Sustentar confianza con evidencia de performance enmarcada con responsabilidad.

Contenido obligatorio:

- Indicadores clave legibles (sin triunfalismo).
- Contexto temporal de medicion.
- Nota de responsabilidad y variabilidad de mercado.

Comportamiento visual:

- Numeros como protagonistas.
- Graficas limpias, sin ruido.
- Comparativas con lectura inmediata.

Sensacion buscada:

- "Hay resultados medibles".
- "Comunican con honestidad".

## 3.6 Bloque CTA

Mision comunicacional:

- Convertir decision en accion con friccion minima.

Contenido obligatorio:

- Mensaje final de dominio y claridad.
- CTA primario contundente.
- CTA secundario para usuarios en etapa exploratoria.
- Refuerzo de seguridad percibida.

Comportamiento visual:

- Contraste superior respecto al resto de la pagina.
- Espacio negativo amplio para concentrar atencion.

Sensacion buscada:

- "Es el momento de entrar".
- "Tengo alternativa si aun no estoy listo".

## 3.7 Bloque Footer

Mision comunicacional:

- Cerrar con institucionalidad y orden.

Contenido obligatorio:

- Navegacion secundaria estructurada.
- Mensajes legales y de responsabilidad.
- Elementos de marca sobrios.

Comportamiento visual:

- Menor intensidad visual.
- Alta legibilidad.
- Estructura modular clara.

Sensacion buscada:

- "Empresa seria, no landing improvisada".

---

## 4. COMPONENTES (biblioteca visual total)

## 4.1 Cards

- Radio: medio, elegante (sin burbuja).
- Superficie: oscura satinada.
- Borde: fino de baja opacidad.
- Sombra: profunda suave, sin dureza.
- Padding interno: generoso.
- Jerarquia interna: label > valor > nota.
- Variantes: metrica, insight, comparativa, estado.

## 4.2 Botones

- Primario: alto contraste, presencia fuerte, area de click amplia.
- Secundario: contorno o tono bajo con alta legibilidad.
- Terciario: textual, solo para acciones auxiliares.
- Estados: default, hover, active, disabled, loading.
- Feedback: respuesta inmediata con micro elevacion o luz.

## 4.3 Inputs

- Campo con fondo diferenciado del panel.
- Label externo claro, nunca placeholder como unica guia.
- Ayuda contextual breve.
- Estado error con mensaje preciso, no agresivo.
- Estado exito discreto.

## 4.4 Tabs

- Tabs como control de contexto, no decoracion.
- Indicador activo claro por contraste + subrayado o barra.
- Cambio de tab sin salto brusco.
- Nunca mas de 5 tabs visibles en una misma linea en desktop.

## 4.5 Badges

- Uso exclusivo para estados, categorias o prioridad.
- Tamaño pequeno y semantico.
- Colores sobrios.
- Nunca usar badges para decorar titulos.

## 4.6 Tablas

- Header con contraste medio-alto.
- Filas con zebra muy sutil opcional.
- Alineacion numerica tabular a la derecha.
- Densidad controlada: maximo 7 columnas visibles sin desplazamiento.
- Hover de fila suave para exploracion.

## 4.7 Paneles

- Estructura: header, cuerpo, footer opcional.
- Header con titulo claro y acciones minimas.
- Cuerpo con padding consistente.
- Variantes: panel informativo, panel analitico, panel de control.

## 4.8 Graficas

- Priorizar claridad sobre espectacularidad.
- Ejes discretos, lineas guia de baja intensidad.
- Paleta de series limitada.
- Interacciones: tooltip limpio, crosshair discreto.
- No usar 3D ni efectos dramaticos.

## 4.9 Timeline

- Eje claro vertical u horizontal segun contexto.
- Hitos con prioridad visual por relevancia.
- Estados temporales: pasado, actual, proximo.
- Lectura secuencial sin friccion.

## 4.10 Alertas

- Tipos: info, warning, critical, success.
- Estructura: icono, titulo, detalle, accion opcional.
- Color por semantica con saturacion baja.
- Criticas: destacadas pero sin estetica de panico.

## 4.11 Tooltips

- Activacion por hover/focus.
- Texto breve: una idea por tooltip.
- Nunca bloquear informacion principal.
- Salida suave, sin parpadeo.

## 4.12 Estados globales de componente

- Hover: confirma interactividad.
- Focus: visible y accesible, nunca invisible.
- Active: respuesta tactica corta.
- Disabled: reducidor de contraste, pero legible.
- Loading: indicar progreso real, no spinner eterno.
- Empty: explicar por que esta vacio y que hacer.
- Error: mensaje accionable con siguiente paso.

Regla universal:

- Cada estado debe comunicar "que paso" y "que hacer ahora".

---

## 5. MICROANIMACIONES (sistema de movimiento)

## 5.1 Que se mueve

- Aparicion de bloques al entrar en viewport (stagger leve).
- Elevacion de cards y botones en hover.
- Cambio de tabs y paneles por transicion corta.
- Actualizacion de metricas con transicion numerica controlada.
- Tooltips y overlays con entrada/salida suave.

## 5.2 Que nunca debe moverse

- Titulares principales durante lectura.
- Datos criticos en estado de consulta.
- Estructura base del layout (sin saltos inesperados).
- Fondo con movimiento excesivo.

## 5.3 Duraciones

- Microfeedback (hover/focus): 120-180 ms.
- Transicion de estado (tabs/cards): 180-260 ms.
- Entrada de bloque en scroll: 280-420 ms.
- Cambios de contexto mayores: 320-500 ms.

## 5.4 Curvas de aceleracion

- Entrada: ease-out suave para sensacion de control.
- Salida: ease-in corto para limpieza.
- No usar rebotes ni elasticos.

## 5.5 Semantica de animacion

- Elevacion: "esto es interactivo".
- Fade + desplazamiento corto: "esto aparece con orden".
- Resalte de valor: "esto importa ahora".
- Atenuacion: "esto queda en segundo plano".

---

## 6. COPY (personalidad verbal)

## 6.1 Voz de CARVIPIX

- Precisa.
- Seria.
- Tecnica legible.
- Elegante sin grandilocuencia.
- Orientada a decisiones.

## 6.2 Como habla

- Frases directas, densidad alta de significado.
- Verbos de accion operativa: analizar, detectar, priorizar, ejecutar, proteger.
- Sustantivos de control: criterio, contexto, senal, disciplina, consistencia.

## 6.3 Palabras que siempre usa

- Claridad
- Contexto
- Precision
- Disciplina
- Riesgo
- Consistencia
- Decision
- Lectura

## 6.4 Palabras que jamas usa

- Magico
- Infalible
- Garantizado
- Asegurado
- Automatico perfecto
- Dinero facil
- Sin riesgo

## 6.5 Reglas de redaccion

- Nunca prometer resultados absolutos.
- Siempre enmarcar rendimiento con responsabilidad.
- Evitar jergas innecesarias y tecnicismos vacios.
- Cada bloque debe terminar con una accion clara o conclusion concreta.

---

## 7. EXPERIENCIA EMOCIONAL TEMPORIZADA

## 7.1 En 0 segundos

Debe sentir:

- "Estoy en una plataforma premium".
- "Esto no es una pagina generica".

Driver visual:

- Materialidad, composicion y tipografia de alto nivel.

## 7.2 En 10 segundos

Debe sentir:

- "Entiendo lo que hacen".
- "Parece util para operar mejor".

Driver UX:

- Propuesta de valor y estructura limpia.

## 7.3 En 30 segundos

Debe sentir:

- "Hay metodo, no marketing vacio".
- "Puedo confiar en el enfoque".

Driver UX:

- Bloques Motor + Alertas + evidencia inicial.

## 7.4 En 3 minutos

Debe sentir:

- "Veo como encaja en mi rutina de trading".
- "El panel me resulta accionable".

Driver UX:

- Preview del Panel + Resultados + narrativa operacional.

## 7.5 En 10 minutos

Debe sentir:

- "Quiero integrarlo en mi proceso".
- "La marca me transmite seriedad y continuidad".

Driver UX:

- Coherencia total de tono, detalle, interaccion y cierre.

---

## 8. REGLAS MAESTRAS (prohibiciones y buenas practicas)

## 8.1 Prohibiciones absolutas

- No usar estetica "trading casino" (neon agresivo, saturacion extrema).
- No usar copy triunfalista o promesas absolutas.
- No usar dashboards sobrecargados en HOME.
- No usar animaciones decorativas sin funcion.
- No romper consistencia de espaciados por urgencia visual.
- No mezclar demasiados estilos tipograficos o iconograficos.

## 8.2 Errores criticos frecuentes

- Jerarquia plana donde todo compite.
- Contraste insuficiente en textos secundarios.
- Exceso de cards sin narrativa.
- Graficas bonitas pero ilegibles.
- Alerts rojas sobreactuadas que generan rechazo.

## 8.3 Buenas practicas obligatorias

- Un objetivo de lectura por bloque.
- Un foco principal por viewport.
- Copy corto con accion clara.
- Datos con contexto temporal.
- Espaciado consistente en toda la pagina.
- Motion minimo, funcional y semantico.

## 8.4 Cosas que jamas deben hacerse

- Convertir el HOME en mini-dashboard completo.
- Duplicar mensajes por miedo a que no se entiendan.
- Cambiar el tono de marca entre bloques.
- Usar recursos visuales de moda sin aportacion funcional.

---

## 9. Criterios de aceptacion de diseno

El HOME se considera aprobado solo si cumple simultaneamente:

- Claridad de propuesta en menos de 5 segundos.
- Percepcion premium sostenida de inicio a cierre.
- Continuidad narrativa entre Hero, Motor, Panel, Alertas, Resultados y CTA.
- Lectura y navegacion fluidas en todos los breakpoints.
- Estados de componentes coherentes y completos.
- Copy responsable, preciso y alineado a disciplina de trading.
- Ausencia total de recursos visuales que degraden estatus de marca.

---

## 10. Entregables esperados del equipo de diseno

Para ejecutar esta especificacion, el equipo debe producir:

- Sistema de layout final por breakpoint.
- Biblioteca de componentes y estados.
- Guia de motion y tiempos.
- Guia de tono editorial.
- Maqueta de HOME final con todas las capas visuales y estados clave.

Este documento es la fuente maestra para construir el HOME de CARVIPIX en su version premium definitiva.
