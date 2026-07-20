# AUDITORIA LEGAL, REGULATORIA Y COMERCIAL FINAL - CARVIPIX

Fecha: 2026-07-18
Estado: En curso con correcciones criticas ya aplicadas en superficies publicas principales
Objetivo: alinear el discurso comercial, legal, publicitario y documental de CARVIPIX con un modelo de plataforma tecnologica para traders, minimizando riesgo regulatorio, publicitario y de pasarelas de pago.

## 1. Resumen ejecutivo

Se confirmaron tres problemas estructurales principales:

1. El sitio mezclaba el modelo actual con lenguaje de mayor riesgo regulatorio, especialmente en fondeo, resultados y Socios Estrategicos.
2. Los documentos legales publicos tenian codificacion defectuosa y frases que podian abrir interpretaciones de asesoramiento financiero, administracion de dinero o promesa de resultado.
3. El discurso comercial no estaba completamente unificado: algunas paginas presentaban a CARVIPIX como plataforma tecnologica y otras como esquema mas cercano a evaluacion institucional, fondeo o estructura financiera.

Se aplicaron correcciones inmediatas en el nucleo publico mas sensible:

- Home y metadatos principales.
- Aviso Legal.
- Terminos y Condiciones.
- Divulgacion de Riesgos.
- Socios Estrategicos y su formulario.
- Disclaimers reutilizados.
- Footer.
- Descripciones comerciales base.
- Correos automaticos del flujo de Socios Estrategicos.
- Mensajes de fondeo publico.

## 2. Modelo de negocio unificado recomendado

Definicion central:
CARVIPIX debe presentarse como una plataforma tecnologica para traders que ofrece software, herramientas operativas, alertas, resultados descriptivos, contenidos y procesos comerciales privados.

Lo que si es:
- Plataforma tecnologica.
- Software descargable y herramientas operativas.
- Alertas y paneles informativos.
- Contenido educativo y soporte de uso.
- Proceso privado de evaluacion comercial para Socios Estrategicos.

Lo que no debe presentarse como:
- Asesoria financiera personalizada.
- Gestor de inversiones.
- Administrador de dinero.
- Fondo privado o vehiculo de inversion.
- Captacion de inversion.
- Oferta de rentabilidad o de rendimiento futuro.
- Programa de fondeo activo mientras no exista lanzamiento formal.

## 3. Correcciones aplicadas

### 3.1 Superficies publicas principales corregidas

Archivos corregidos:
- app/risk-disclosure/page.tsx
- app/legal/page.tsx
- app/terms/page.tsx
- app/page.tsx
- app/layout.tsx
- app/socios-estrategicos/page.tsx
- app/socios-estrategicos/solicitud/page.tsx
- app/components/Footer.tsx
- app/components/DisclaimerNote.tsx
- app/components/WorkspaceHero.tsx
- app/fondeo/page.tsx
- app/lib/commercial/business-model.ts
- app/api/public/strategic-partners/route.ts
- app/api/admin/strategic-partners/route.ts
- app/servicios/alertas/page.tsx

### 3.2 Resultado del barrido posterior a cambios

Barrido publico residual sobre estas superficies:
- Sin referencias residuales a "Gestion de Capital" o equivalentes en las superficies publicas principales auditadas.
- Sin caracteres mojibake residuales en ese conjunto principal tras las correcciones aplicadas.
- Sin frases publicas residuales de alto riesgo como "capital institucional", "capital real", "division de utilidades" o "sin riesgo de capital propio" dentro de ese mismo conjunto principal.

## 4. Hallazgos por nivel de riesgo

### Riesgo alto

1. Google Ads y paginas de senales
Estado: No cumple para una campana directa agresiva hacia alertas/senales de trading.
Motivo:
- Google Ads restringe servicios financieros y productos especulativos complejos.
- La politica de Google indica que destinos que proporcionan señales para productos especulativos complejos pueden provocar rechazo.
Impacto:
- Alto riesgo de rechazo si se anuncian directamente alertas, resultados o claims de trading especulativo.
Correccion recomendada:
- Usar landings de marca, tecnologia, software y comunidad como puerta de entrada.
- Evitar anuncios centrados en senales, resultados, rendimiento o forex como promesa comercial primaria.

2. Riesgo regulatorio en Estados Unidos por contenido de alertas/analisis por compensacion
Estado: Riesgo alto. Requiere revision legal especializada antes de escalar en EE. UU.
Motivo confirmado por fuentes oficiales:
- SEC / Investor.gov define investment adviser como quien, por compensacion, se dedica a asesorar sobre el valor de valores o sobre invertir en valores, o emite analisis o reportes sobre valores como parte regular de su negocio.
- CFTC define Commodity Trading Advisor como quien, por compensacion o beneficio, asesora a otros directa o indirectamente, incluso mediante publicaciones o medios electronicos, sobre la conveniencia de operar ciertos contratos de commodities, futuros, swaps o emite analisis o reportes sobre ellos.
Implicacion:
- Aunque CARVIPIX se presente como plataforma tecnologica, la venta recurrente de alertas, analisis o senales puede requerir asesoramiento legal sobre si cae en exclusiones o si podria ser interpretado como actividad regulada segun el instrumento y la jurisdiccion.
Correccion recomendada:
- Mantener lenguaje no personalizado, no promesario, no fiduciario.
- Incorporar revision legal especializada en EE. UU. antes de campanas de pago enfocadas en forex, alerts o bot.

3. Programa de Fondeo
Estado: Riesgo alto si se publicita como servicio activo antes de tener estructura legal, operativa y contractual definitiva.
Correccion aplicada:
- Se elimino lenguaje de acceso, capital real, division de utilidades y ausencia de riesgo propio.
- Se reforzo que no hay venta activa ni oferta abierta.
Pendiente:
- Cuando se lance, necesitara marco legal especifico, terminos propios y politica comercial separada.

### Riesgo medio

4. Socios Estrategicos
Estado: Mejorado, pero debe seguir vigilado.
Riesgo previo:
- Lenguaje tipo "institucional", "alianzas premium" o descripciones ambiguas podian sugerir una relacion financiera, fondo o estructura de captacion.
Correccion aplicada:
- El programa ahora se describe como proceso privado de evaluacion comercial.
- Se aclara que no es inversion, administracion de dinero ni contrato automatico.
Pendiente:
- Redactar condiciones especificas publicables del programa cuando se cierre el modelo comercial final.

5. Resultados y uso comercial de metricas
Estado: Riesgo medio.
Motivo:
- Los modulos de resultados y rendimiento son especialmente sensibles ante Ads, Meta y evaluacion regulatoria.
Correccion aplicada:
- Se mantuvo enfoque descriptivo e historico en varias superficies.
Pendiente:
- Toda pieza promocional externa debe evitar usar resultados como ancla de persuasion principal.

6. Soporte y modulos privados con codificacion defectuosa
Estado: Riesgo medio.
Hallazgos residuales:
- app/soporte/page.tsx contiene multiples caracteres dañados.
- app/admin/components/AdminProyecto.tsx contiene mojibake y lenguaje antiguo.
- app/engine/components/ProgressDashboard.tsx contiene mojibake y referencias internas antiguas.
Impacto:
- Afecta consistencia profesional y calidad de cumplimiento en rutas internas o de soporte.
Correccion recomendada:
- Ejecutar una pasada separada de saneamiento UTF-8 para modulos internos y privados.

### Riesgo bajo

7. Ruta legacy de capital
Archivo:
- app/servicios/capital/page.tsx
Estado:
- Redirige a /socios-estrategicos.
Riesgo:
- Bajo, pero confirma que existio el modelo anterior.
Recomendacion:
- Mantener el redirect mientras existan enlaces historicos, pero revisar si conviene retirar la ruta a nivel definitivo cuando SEO y caches ya esten limpios.

## 5. Matriz de lenguaje sensible

### Debe eliminarse
- Gestion de Capital
- Capital Management
- Managed Account
- Cuenta Administrada
- Investment Management
- Gestor de inversiones
- Capital real
- Division de utilidades
- Sin riesgo de capital propio

### Riesgo alto
- inversion
- inversionista
- retornos
- rentabilidad
- rendimiento garantizado
- ganancias garantizadas
- asesoria financiera
- fondo

### Riesgo medio
- institucional
- premium institucional
- capital asignado
- asesoramiento operativo
- wealth
- asset management

### Seguro o mas seguro con contexto
- plataforma tecnologica para traders
- herramientas operativas
- software descargable
- alertas informativas
- resultados historicos
- proceso privado de evaluacion comercial
- colaboracion comercial
- comunidad de traders
- soporte de uso

### Sustituciones recomendadas
- "rentabilidad" -> "resultado historico" o "desempeno historico"
- "inversion" -> "operacion" o "actividad de trading" cuando aplique
- "institucional" -> "interno", "privado" o "comercial" si no hay base regulatoria concreta
- "asesoramiento operativo" -> "soporte de uso" o "acompanamiento operativo no personalizado"
- "capital real" -> eliminar en paginas de pre-lanzamiento
- "division de utilidades" -> eliminar de paginas publicas mientras no exista contrato y marco legal final

## 6. Auditoria para Google Ads

Estado general: Riesgo alto / cumplimiento parcial.

### Cumple
- Landing principal corregida hacia plataforma tecnologica.
- Documentos legales y riesgo ahora mas claros y visibles.
- Paginas de pago y politicas comerciales publicadas.

### Riesgo
- Home sigue hablando de trading, alertas, bot y resultados, aunque de forma mas controlada.
- Resultados y alertas pueden ser interpretados como promocion de productos financieros complejos si se usan como landing directa.
- Bot y alertas pueden recibir escrutinio como soporte para trading especulativo.

### No cumple para ads directos si se usa como ganchos primarios
- Anuncios centrados en senales de forex o resultados de trading.
- Creativos o landings que pongan primero rendimiento, win rate o promesas de mejora economica.

### Correccion recomendada
- En Ads, usar primero landings de plataforma, software, comunidad y soporte operativo.
- Excluir claims de desempeno en creativos principales.
- Evitar campañas con promesas, implícitas o explicitas, de beneficio economico.

## 7. Auditoria para Meta

Estado general: Riesgo medio-alto.

### Hallazgos
- Meta exige cumplimiento legal general, prohíbe practicas engañosas y puede requerir verificacion adicional para servicios financieros.
- En EE. UU., Canada y ciertas regiones de Europa, los anuncios de financial products and services deben marcarse como Special Ad Category cuando corresponda.
- Los anuncios y la landing deben representar claramente la empresa, producto o servicio ofrecido.

### Evaluacion CARVIPIX
- Cumple mejor tras la correccion del modelo de negocio y los disclaimers.
- Sigue en riesgo si se anuncian resultados, senales o beneficios economicos como eje principal.

### Correccion recomendada
- Para Meta, usar ads de plataforma, software y comunidad.
- Evitar antes/despues, rendimiento, dinero facil, libertad financiera o frases de urgencia especulativa.
- Si se apunta a EE. UU. y Meta lo clasifica como financial services, revisar configuracion de Special Ad Category.

## 8. Auditoria para Stripe y PayPal

Estado general: Cumplimiento razonable con mejoras aplicadas.

### Puntos a favor
- Existe checkout oficial con sesion y gating legal.
- Existen paginas publicas para cancelacion, reembolsos y pagos recurrentes.
- Las politicas ya explican cancelacion, renovacion y reembolso de forma funcional.

### Riesgos
- Si el marketing externo promete demasiado y el checkout/politicas dicen otra cosa, puede haber disputas o revisiones de cuenta.
- Productos de trading, bots y suscripciones son categorias que requieren especial claridad para evitar chargebacks.

### Recomendaciones
- Mantener visible antes del pago: precio, moneda, periodicidad, alcance del producto, politica de cancelacion y reembolso.
- No vender el bot o las alertas como promesa de beneficio.
- Mantener evidencia de aceptacion legal y de entrega del servicio.

## 9. Auditoria SEO e indexacion

### Corregido
- Metadatos base y home ya alineados con el modelo de plataforma tecnologica.
- Robots y sitemap no exponen checkout, dashboard ni admin.
- La ruta legacy /servicios/capital no aparece como pagina comercial activa, sino como redirect.

### Pendiente
- Revisar Search Console, caches y snippets antiguos fuera del repo para depurar indexacion historica.
- Evaluar si conviene solicitar retirada o actualizacion de resultados antiguos si Google sigue mostrando textos obsoletos.

## 10. Regulacion - Estados Unidos

### Confirmado por fuente oficial
SEC / Investor.gov:
- Un investment adviser es una firma o persona que, por compensacion, se dedica a asesorar a otros sobre el valor de valores o sobre invertir en valores, o emite analisis o reportes sobre valores como parte regular de su negocio.

CFTC:
- Un Commodity Trading Advisor incluye a quien, por compensacion o beneficio, asesora a otros, incluso mediante publicaciones, escritos o medios electronicos, sobre la conveniencia de operar ciertos instrumentos de commodities, futuros o swaps, o emite analisis o reportes sobre ellos como parte de un negocio regular.

### Interpretacion para CARVIPIX
- No se puede afirmar que CARVIPIX este fuera de todo marco regulatorio de EE. UU. solo por llamarse plataforma tecnologica.
- El riesgo regulatorio depende del producto concreto, del tipo de instrumento, de si existe compensacion por alertas/analisis, de la jurisdiccion del cliente y de posibles exclusiones aplicables.

### Requisito confirmado
- Necesidad de revision legal especializada antes de escalar marketing pagado en EE. UU. sobre alertas, bot, resultados o fondeo.

### Buena practica
- Mantener un lenguaje no personalizado, no fiduciario y no promesario.

## 11. Regulacion - Mexico

### Confirmado por fuente oficial consultada
CONDUSEF:
- La autoridad mexicana pone enfasis en informacion, orientacion, asistencia y consulta sobre instituciones financieras autorizadas, asi como en transparencia hacia el usuario.

### Interpretacion prudente para CARVIPIX
- Si CARVIPIX no es institucion financiera autorizada, no debe sugerir que lo es.
- Debe ser claro que es plataforma tecnologica, no captadora de dinero ni entidad financiera regulada.

### Requisito confirmado
- No se confirmo, con la evidencia recabada en esta pasada, una obligacion especifica directa de registro financiero para el modelo exactamente descrito hoy.

### Recomendacion
- Mantener claridad de identidad comercial y evitar lenguaje que parezca servicio financiero regulado.
- Preparar una consulta legal local antes de escalar alianzas o productos de mayor friccion regulatoria.

## 12. Pendientes residuales priorizados

### Prioridad alta
- Revisar rutas privadas e internas con mojibake o lenguaje antiguo:
  - app/soporte/page.tsx
  - app/admin/components/AdminProyecto.tsx
  - app/engine/components/ProgressDashboard.tsx
- Revisar modulos privados donde aun aparece "institucional" en contextos visibles.

### Prioridad media
- Revisar app/bot/page.tsx y componentes asociados para bajar dependencia comercial de palabras como rendimiento, aunque ya existen disclaimers.
- Revisar textos de comunidad y resultados si se usaran para publicidad.
- Revisar archivos de drafts legales y contenido auxiliar no publico para coherencia documental interna.

### Prioridad estrategica
- Definir ruta publicitaria de acquisition distinta por canal:
  - Google: marca, software, comunidad y educacion.
  - Meta: plataforma, software, comunidad y soporte operativo.
  - Evitar ads directos a senales o performance claims.

## 13. Conclusiones

1. El nucleo publico principal ya fue corregido hacia un modelo coherente de plataforma tecnologica para traders.
2. El riesgo comercial y publicitario bajo Google y, en menor medida, Meta sigue siendo alto si se insiste en vender alertas, resultados o promesas de desempeno como eje del anuncio.
3. El mayor riesgo regulatorio para EE. UU. no esta resuelto solo con copy; requiere revision legal especializada si CARVIPIX cobrara por analisis, alertas o senales sobre instrumentos potencialmente regulados.
4. La plataforma ahora comunica mejor el modelo de negocio en home, legal, terminos, Socios y fondeo, sin saturar la portada principal con texto legal excesivo.
5. Aun existe deuda residual de codificacion UTF-8 y coherencia en modulos privados e internos.

## 14. Siguiente fase recomendada

1. Saneamiento UTF-8 de soporte, admin y modulos internos visibles.
2. Segunda pasada de copy en bot, resultados, comunidad y dashboard privado.
3. Version final de condiciones especificas de Socios Estrategicos.
4. Revision legal externa para EE. UU. antes de paid acquisition centrada en trading.
5. Estrategia de anuncios por canal para vender sin claims de alto riesgo.
