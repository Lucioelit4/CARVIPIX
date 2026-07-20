# AUDITORIA DE CUMPLIMIENTO NORMATIVO PARA ESCALAMIENTO (US/MX)

Fecha: 2026-07-18
Proyecto: CARVIPIX
Objetivo: Determinar, con base documental oficial, que requisitos regulatorios, de plataforma publicitaria y de pagos aplican al modelo actual, cuales no aplican y bajo que cambios del modelo empezarían a aplicar.

## 1) Alcance y criterio de este informe

- Jurisdicciones evaluadas: Estados Unidos y Mexico (segun foco operativo declarado).
- Fuentes primarias: Google, Meta, Stripe, PayPal, SEC, CFTC/NFA, FinCEN, CNBV, Camara de Diputados (compilacion legal), CONDUSEF.
- Este documento es tecnico-operativo para decision empresarial previa a gasto en ads.
- No sustituye asesoria legal formal; si se activa un disparador regulatorio, debe abrirse opinion legal especializada por jurisdiccion.

## 2) Modelo actual de CARVIPIX (base factual interna)

Evidencia en codigo y contenido legal del sitio:

- Producto principal: software/alertas/suscripciones/licencia de bot (no captacion de capital del cliente en el flujo base).
- Declaraciones publicas: no broker, no ejecucion por cuenta del cliente, no administracion de dinero del cliente, no asesoria financiera personalizada.
- Modulos actuales: planes de suscripcion, licencia de bot descargable, programa de socios estrategicos (evaluacion comercial).

Fuentes internas:
- app/lib/commercial/business-model.ts
- app/legal/page.tsx
- app/backend/services/bot-mt5-service.ts

Conclusión de clasificacion del modelo actual (as-is):
- Naturaleza principal: tecnologia/suscripcion/software de apoyo operativo.
- Naturaleza no observada en as-is: custodia, broker-dealer, pooling de fondos, money transmission, ejecucion discrecional de cuentas de terceros.

## 3) Matriz de aplicabilidad: Publicidad y pagos

## 3.1 Google Ads (Financial products and services)

Fuente oficial principal:
- https://support.google.com/adspolicy/answer/2464998?hl=en

Hallazgos normativos relevantes:
- Exige disclosures visibles para productos/servicios financieros (direccion fisica, fees, acreditaciones cuando se alegan).
- Restringe/inhabilita categorias de alto riesgo (ej. binary options) y limita contenido de senales de productos especulativos complejos.
- Puede exigir verificacion especifica por ubicacion para servicios financieros.

Aplicabilidad al modelo actual:
- SI APLICA (alto): reglas generales de financial services + anti-deception + disclosures.
- APLICA CONDICIONADO (medio-alto): si creativos/landing se interpretan como senales para trading especulativo complejo, Google puede requerir certificacion o rechazar anuncios.

No aplica hoy (as-is):
- Requisitos de categorias no ofertadas actualmente (prestamos, debt services, etc.).

Disparadores que harian escalar requisitos:
- Publicitar asesoria personalizada de inversion.
- Publicitar senales para instrumentos catalogados por Google como speculative complex con framing comercial directo.
- Introducir promesas de rentabilidad o claims no demostrables.

Decision operativa antes de invertir en ads:
- Gate obligatorio: auditoria de landing+copies para disclosures visibles y eliminacion total de claims implicitos de rendimiento garantizado.

## 3.2 Meta Ads (Advertising Standards)

Fuente oficial principal:
- https://transparency.meta.com/policies/ad-standards

Hallazgos normativos relevantes:
- Ads de financial products/services: pueden requerir verificacion de negocio/identidad y demostrar autorizacion regulatoria cuando aplique.
- Prohibe fraudes, practicas enganiosas y claims que induzcan error.
- Para ads de productos financieros en US/Canada/ciertas regiones, puede exigir Special Ad Category con restricciones de segmentacion.

Aplicabilidad al modelo actual:
- SI APLICA (alto): compliance de ad standards, anti-scam, congruencia anuncio-landing.
- APLICA CONDICIONADO (alto): si Meta clasifica las campanas como financial products/services, habra restricciones adicionales y potencial requerimiento de autorizacion/verificacion.

No aplica hoy (as-is):
- Reglas de categorias no ofertadas (gambling, crypto exchange, etc.), salvo que se introduzcan en producto/copy.

Disparadores que harian escalar requisitos:
- Ofertas de asesoria o manejo de capital.
- Segmentacion o copy que encaje en categoria financiera especial sin declaracion correcta.
- Captura de datos sensibles financieros en formatos no permitidos.

Decision operativa antes de invertir en ads:
- Gate obligatorio: clasificar preventivamente campanas como potencialmente financieras y preparar cuenta para restricciones de targeting y verificacion.

## 3.3 Stripe (Restricted and prohibited businesses)

Fuente oficial principal:
- https://stripe.com/legal/restricted-businesses

Hallazgos normativos relevantes:
- Servicios financieros/inversion/corretaje y money services aparecen como categorias restringidas (enhanced due diligence, posible rechazo).
- Stripe puede requerir informacion adicional, licencias o limitar/revocar aprobacion segun riesgo y reglas de red.
- En Mexico, existen prohibiciones especificas por jurisdiccion (incluye servicios de inversion en listados de negocio prohibido por jurisdiccion en esa pagina).

Aplicabilidad al modelo actual:
- SI APLICA (medio): como procesador de cobros de software/suscripcion, bajo onboarding y monitoreo normal de Stripe.
- APLICA CONDICIONADO (alto): si el negocio migra a servicios financieros regulados (inversion/corretaje, money movement, custodia), entra en categoria restringida/prohibida segun pais.

No aplica hoy (as-is):
- Obligaciones de licencia financiera, mientras CARVIPIX no preste servicios financieros regulados directos.

Disparadores que harian escalar requisitos:
- Cobrar por administracion de inversiones, corretaje o asesoria regulada.
- Operar como transmisor de dinero, wallet, custody, payouts a terceros estilo plataforma financiera.

Decision operativa antes de invertir en ads:
- Gate obligatorio: confirmar por escrito con Stripe que el descriptor y categoria de negocio declarada coincide con "software/suscripcion" y no "financial services" regulados.

## 3.4 PayPal (Acceptable Use Policy)

Fuente oficial principal:
- https://www.paypal.com/us/legalhub/acceptableuse-full

Hallazgos normativos relevantes:
- Actividades de inversiones (buy/sell/brokering securities, commodities, CFD/forex) estan bajo actividades que requieren aprobacion previa.
- Prohibiciones generales de actividad ilegal, fraude, esquemas enganiosos y operaciones no aprobadas.

Aplicabilidad al modelo actual:
- SI APLICA (medio): cumplimiento general AUP para cobro de servicios.
- APLICA CONDICIONADO (alto): si el modelo se mueve a intermediar directamente inversion/forex/CFD, podria requerir pre-approval o ser restringido.

No aplica hoy (as-is):
- Requisitos de pre-approval para verticales no activadas por CARVIPIX en el estado actual.

Disparadores que harian escalar requisitos:
- Cobrar por servicios que PayPal clasifique como inversiones/intermediacion financiera.
- Flujos de fondos de terceros, marketplaces financieros o productos de alto riesgo sin aprobacion.

Decision operativa antes de invertir en ads:
- Gate obligatorio: control estricto de descripcion de producto/cobro para no aparentar corretaje o intermediacion de inversiones.

## 4) Matriz de aplicabilidad: Reguladores EEUU

## 4.1 SEC (Investment Adviser framework)

Fuentes oficiales:
- https://www.investor.gov/introduction-investing/investing-basics/glossary/investment-adviser

Hallazgo clave:
- Investment adviser: persona/firma que, por compensacion, se dedica a asesorar sobre valores (securities) o emitir analisis/reportes sobre valores como negocio regular.

Aplicabilidad al modelo actual:
- NO APLICA DIRECTO (con reservas), si CARVIPIX permanece en software/herramienta general sin asesoria personalizada sobre securities.

Cuando empezaria a aplicar:
- Si CARVIPIX presta asesoramiento de inversion en securities por compensacion (personalizado o como servicio regular de analisis orientado a compra/venta de valores).
- Si el producto pasa de "software informativo" a "advisory service" de valores.

## 4.2 CFTC / NFA (derivatives: CTA/CPO/IB)

Fuentes oficiales:
- https://www.cftc.gov/IndustryOversight/Intermediaries/index.htm
- https://www.nfa.futures.org/registration-membership/who-has-to-register/index.html

Hallazgos clave:
- CTA: asesorar por compensacion sobre advisability/value de futures/options/forex off-exchange/swaps.
- CPO: operar pool y solicitar/recibir fondos para trading de commodity interests.
- IB/FCM/RFED/SD: categorias de intermediacion/ejecucion/contraparte sujetas a registro.

Aplicabilidad al modelo actual:
- NO APLICA DIRECTO (con reservas), siempre que CARVIPIX no asesore formalmente como CTA ni opere pool ni intermedie ordenes/contraparte.

Cuando empezaria a aplicar:
- Cobro por recomendacion de trading de derivados/forex que encaje como CTA.
- Captacion de fondos de multiples usuarios para operar (CPO).
- Solicitar/aceptar ordenes o actuar como contraparte/intermediario (IB/FCM/RFED/SD segun actividad).

## 4.3 FinCEN (MSB registration)

Fuente oficial:
- https://www.fincen.gov/money-services-business-msb-registration

Hallazgos clave:
- MSB incluye money transmitter; no hay umbral minimo para money transmission.
- Con pocas excepciones, MSB debe registrarse; hay obligaciones de registro, renovacion y retencion documental.

Aplicabilidad al modelo actual:
- NO APLICA DIRECTO (as-is), si CARVIPIX solo cobra por software y no transmite fondos por cuenta de terceros.

Cuando empezaria a aplicar:
- Si CARVIPIX mueve/transmite fondos entre usuarios/terceros como actividad de negocio.
- Si introduce wallet, payout hub o flujo de dinero de terceros fuera de simple cobro propio.

## 4.4 FTC (truth in advertising)

Fuente oficial:
- https://www.ftc.gov/business-guidance/advertising-marketing

Hallazgos clave:
- Claims publicitarios deben ser veraces, no enganiosos, y sustentados con evidencia.
- Reglas especificas para endorsements/testimonials y practicas de online advertising.

Aplicabilidad al modelo actual:
- SI APLICA (alto): toda comunicacion comercial, incluyendo claims de resultados y testimoniales de trading.

Cuando escala riesgo:
- Uso de cifras de rendimiento sin metodologia auditable.
- Testimoniales sin disclosure de contexto/material connection.
- Mensajes tipo "dinero facil" o inducir expectativas no sustentables.

## 5) Matriz de aplicabilidad: Mexico

## 5.1 CNBV / Ley Fintech (ITF)

Fuentes oficiales:
- https://www.gob.mx/cnbv/acciones-y-programas/instituciones-de-tecnologia-financiera
- https://www.diputados.gob.mx/LeyesBiblio/index.htm (incluye "Ley para Regular las Instituciones de Tecnologia Financiera", ultima reforma reportada 14/11/2025)

Hallazgos clave:
- ITF reguladas: Instituciones de Financiamiento Colectivo e Instituciones de Fondos de Pago Electronico autorizadas por CNBV.
- Para ITF aplican obligaciones robustas (incluye PLD/FT) y autorizacion formal.

Aplicabilidad al modelo actual:
- NO APLICA DIRECTO (as-is), mientras CARVIPIX no opere crowdfunding financiero ni emision/administracion/redencion/transmision de fondos de pago electronico como institucion.

Cuando empezaria a aplicar:
- Si CARVIPIX habilita fondeo colectivo regulado.
- Si CARVIPIX ofrece cuentas/saldos/fondos de pago electronico, wallet o transmisiones asimilables a IFPE.

## 5.2 Mercado de valores / asesoria en inversiones (MX)

Fuentes oficiales de marco:
- https://www.diputados.gob.mx/LeyesBiblio/index.htm (incluye "Ley del Mercado de Valores", ultima reforma reportada 14/11/2025)

Estado de evidencia automatizada:
- Las rutas publicas de CNBV de "Asesores en Inversiones" no devolvieron contenido extraible en esta corrida automatizada.

Aplicabilidad al modelo actual:
- NO APLICA DIRECTO (con reservas), si se mantiene el modelo de herramienta/software sin asesoria personalizada de inversion.

Cuando empezaria a aplicar:
- Si CARVIPIX ofrece asesoria de inversion formal al publico mexicano en terminos regulados por LMV/CNBV.

Accion obligatoria de cierre de brecha:
- Obtener dictamen legal local sobre encuadre exacto de "alertas" y "analisis" frente a figura de asesor en inversiones en Mexico antes de escalar pauta masiva.

## 5.3 CONDUSEF (proteccion usuario y registros)

Fuentes oficiales:
- https://www.condusef.gob.mx/

Hallazgo util para control:
- CONDUSEF publica herramientas para verificacion de instituciones autorizadas (SIPRES) y atencion a usuarios de servicios financieros.

Aplicabilidad al modelo actual:
- APLICA DE FORMA INDIRECTA (control reputacional/compliance), no como licencia directa si no eres institucion financiera regulada.

Cuando escala:
- Si el modelo migra a prestacion de servicios financieros regulados o figura supervisada.

## 6) Resumen ejecutivo de aplicabilidad (AS-IS)

Aplica ahora (obligatorio inmediato):
- Google Ads policies de financial services + disclosure y anti-misleading.
- Meta Advertising Standards (incluyendo financial/insurance restrictions y anti-scam).
- FTC truth-in-advertising (claims y testimoniales).
- Stripe/PayPal AUP/TOS para actividad declarada como software/suscripcion.

No aplica directo hoy (si se conserva modelo actual):
- Registro SEC como investment adviser.
- Registro CFTC/NFA como CTA/CPO/IB/FCM/RFED/SD.
- Registro FinCEN como MSB.
- Autorizacion MX como ITF (IFC/IFPE) bajo Ley Fintech.

Aplica condicionado por pivote de modelo:
- Cualquier forma de asesoria personalizada de inversion.
- Cualquier captacion/pooling/gestion de fondos de clientes.
- Cualquier money transmission/wallet/payout de terceros.
- Cualquier intermediacion de ordenes o contraparte.

## 7) Matriz de disparadores (trigger map)

Trigger A: "CARVIPIX empieza a recomendar compra/venta personalizada por perfil"
- Probable impacto: SEC (US) / posible figura de asesoria en inversion en MX.
- Accion previa obligatoria: opinion legal + rediseño contractual y operativo.

Trigger B: "CARVIPIX administra o mueve fondos de clientes"
- Probable impacto: FinCEN MSB (US), potenciales licencias estatales en US, Ley Fintech/otras figuras en MX.
- Accion previa obligatoria: proyecto regulatorio completo antes de lanzamiento.

Trigger C: "CARVIPIX opera pool/fondo colectivo"
- Probable impacto: CFTC CPO/CTA (segun instrumento) + riesgos SEC adicionales.
- Accion previa obligatoria: arquitectura regulada previa, no lanzar en modo experimental.

Trigger D: "Ads con claims de rendimiento (explicitos o implicitos)"
- Probable impacto: rechazos/suspensiones Google/Meta + riesgo FTC.
- Accion previa obligatoria: policy gate de marketing y evidencia documental de cada claim.

## 8) Go/No-Go previo a invertir 1 USD en publicidad

Go (minimo exigible):
- Checklist legal de creativos/landing aprobado (sin promesas, sin lenguaje de asesoria personalizada, disclosures visibles).
- Clasificacion de campanas como financieras cuando corresponda (Meta Special Ad Category si aplica).
- Evidencia de coherencia producto-cobro en Stripe/PayPal (descriptor y narrativa comercial).
- Repositorio de evidencia para claims (metodologia, periodos, muestras, limitaciones).

No-Go inmediato:
- Si existe copy de "rendimiento garantizado" o equivalentes.
- Si se inicia money movement de terceros sin plan regulatorio.
- Si se lanza asesoria personalizada sin opinion legal por jurisdiccion.

## 9) Brechas criticas detectadas

Brecha 1 (Alta): Encaje legal fino de "alertas" vs "asesoria regulada" en US/MX requiere validacion legal externa previa a escala masiva.
Brecha 2 (Alta): Necesidad de policy engine interno de marketing (aprobacion legal/compliance antes de publicar anuncios).
Brecha 3 (Media): Confirmacion documental con Stripe/PayPal sobre categoria final de negocio para evitar freezes por re-clasificacion.

## 10) Decisión recomendada para direccion (enfoque tecnico)

Estado de readiness para escalar ads en US:
- Condicional (no bloqueo absoluto), sujeto a cierre de brechas 1 y 2 antes de escalar presupuesto.

Secuencia operativa recomendada (previa a media buying):
1. Cerrar dictamen legal US/MX sobre frontera "software informativo" vs "investment advice".
2. Implementar control de claims publicitarios (aprobacion y evidencia).
3. Hacer pre-clearance de vertical con Meta/Google (finserv framing) y documentar outcome.
4. Confirmar con Stripe/PayPal que el modelo comercial declarado permanece en categoria permitida.

---

## ANEXO A: Fuentes oficiales utilizadas

Plataformas de publicidad y pago:
- Google Ads Financial products and services: https://support.google.com/adspolicy/answer/2464998?hl=en
- Meta Advertising Standards: https://transparency.meta.com/policies/ad-standards
- Stripe Restricted businesses: https://stripe.com/legal/restricted-businesses
- PayPal Acceptable Use Policy: https://www.paypal.com/us/legalhub/acceptableuse-full

Reguladores y marcos US:
- SEC Investor.gov (Investment Adviser): https://www.investor.gov/introduction-investing/investing-basics/glossary/investment-adviser
- CFTC Intermediaries: https://www.cftc.gov/IndustryOversight/Intermediaries/index.htm
- NFA Who Has to Register: https://www.nfa.futures.org/registration-membership/who-has-to-register/index.html
- FinCEN MSB Registration: https://www.fincen.gov/money-services-business-msb-registration
- FTC Advertising and Marketing: https://www.ftc.gov/business-guidance/advertising-marketing

Reguladores y marcos MX:
- CNBV ITF: https://www.gob.mx/cnbv/acciones-y-programas/instituciones-de-tecnologia-financiera
- Camara de Diputados (compilacion de leyes federales vigentes): https://www.diputados.gob.mx/LeyesBiblio/index.htm
- CONDUSEF portal institucional: https://www.condusef.gob.mx/

## ANEXO B: Evidencia interna usada para clasificacion del modelo actual

- app/lib/commercial/business-model.ts
- app/legal/page.tsx
- app/backend/services/bot-mt5-service.ts
