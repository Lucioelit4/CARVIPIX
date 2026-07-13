export type LegalDraftSection = {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
};

export type LegalDraftVersionHistory = {
  version: string;
  date: string;
  note: string;
};

export type LegalDraftDocument = {
  slug: string;
  title: string;
  route: string;
  version: string;
  updatedAt: string;
  author: string;
  status: "Borrador";
  relatedModules: string[];
  requiredBeforePayment: boolean;
  effectiveDate: string;
  summary: string;
  definitions: Array<{ term: string; definition: string }>;
  scopeBullets: string[];
  rightsBullets: string[];
  obligationsBullets: string[];
  proceduresBullets: string[];
  limitationsBullets: string[];
  responsibilitiesBullets: string[];
  law: string;
  contact: string;
  history: LegalDraftVersionHistory[];
  statusNote: string;
  specialNotes: string[];
};

const commonRights = [
  "Recibir informacion clara, suficiente y oportuna sobre cada servicio.",
  "Solicitar aclaraciones o soporte mediante los canales oficiales de CARVIPIX.",
  "Consultar el historial de versiones de cada documento antes de aceptar.",
];

const commonObligations = [
  "Leer el documento aplicable antes de usar el servicio correspondiente.",
  "Mantener actualizados los datos de cuenta y contacto.",
  "Usar la plataforma de forma licita, prudente y conforme a la finalidad del servicio.",
];

const commonProcedures = [
  "Revisar la version vigente en el sistema de compliance antes de aceptar.",
  "Guardar evidencia interna de aceptacion cuando el flujo lo requiera.",
  "Solicitar apoyo a Soporte si existe duda sobre alcance o vigencia.",
];

const commonLimitations = [
  "El documento puede ajustarse por cambios regulatorios, operativos o de producto.",
  "Los servicios marcados como Borrador o Proximamente no se consideran activos.",
];

const commonResponsibilities = [
  "CARVIPIX debe mantener coherencia entre sus servicios, su comunicacion y estos documentos.",
  "El usuario debe verificar que la version consultada coincida con el estado mostrado en plataforma.",
];

function draftDate(): string {
  return "2026-07-12T00:00:00.000Z";
}

function makeDraft(input: Omit<LegalDraftDocument, "status" | "updatedAt" | "author" | "effectiveDate" | "history" | "statusNote"> & {
  title: string;
  version: string;
  statusNote?: string;
  historyNote: string;
  specialNotes?: string[];
}): LegalDraftDocument {
  return {
    ...input,
    author: "CARVIPIX Legal",
    status: "Borrador",
    updatedAt: draftDate(),
    effectiveDate: draftDate(),
    history: [
      {
        version: input.version,
        date: draftDate(),
        note: input.historyNote,
      },
    ],
    statusNote: input.statusNote ?? "Documento en revision interna. No se encuentra activo para usuarios.",
    specialNotes: input.specialNotes ?? [],
  };
}

export const LEGAL_DRAFT_CONTENTS_V1: LegalDraftDocument[] = [
  makeDraft({
    slug: "politica-privacidad-integral",
    title: "Aviso de Privacidad Integral",
    route: "/legal-drafts-v1/aviso-privacidad-integral",
    version: "1.0.0",
    relatedModules: ["registro", "perfil", "compliance", "soporte"],
    requiredBeforePayment: true,
    summary:
      "Documento integral que explica el tratamiento de datos personales dentro de CARVIPIX, incluyendo cuenta, facturacion, comunicaciones, analitica, seguridad y atencion al usuario.",
    definitions: [
      { term: "Datos personales", definition: "Informacion que identifica o hace identificable a una persona dentro de CARVIPIX." },
      { term: "Finalidad", definition: "Uso concreto y legitimo que CARVIPIX da a los datos para operar la plataforma y atender al usuario." },
      { term: "ARCO", definition: "Derechos de acceso, rectificacion, cancelacion y oposicion reconocidos por la normativa mexicana." },
    ],
    scopeBullets: [
      "Aplica a usuarios, prospectos, visitantes, administradores y titulares de cuenta.",
      "Cubre datos de registro, acceso, soporte, pagos, preferencias, verificacion y uso de servicios.",
      "Integra el aviso especifico para procesos de verificacion de identidad y seguridad de cuenta.",
    ],
    rightsBullets: [...commonRights, "Conocer transferencias, retenciones y medidas de seguridad aplicables al servicio."],
    obligationsBullets: [...commonObligations, "Notificar cambios de contacto para atencion de derechos ARCO o comunicaciones importantes."],
    proceduresBullets: [...commonProcedures, "Presentar solicitudes ARCO por canales oficiales con verificacion de identidad cuando corresponda."],
    limitationsBullets: [...commonLimitations, "Puede coexistir con avisos simplificados o especificos mostrados en el flujo de registro."],
    responsibilitiesBullets: [...commonResponsibilities, "CARVIPIX debe documentar finalidades, base legal, transferencias y plazos de conservacion."],
    law: "Ley Federal de Proteccion de Datos Personales en Posesion de los Particulares, su reglamento y disposiciones aplicables en Mexico.",
    contact: "privacy@carvipix.com",
    historyNote: "Se crea el aviso integral base para el sistema juridico corporativo CARVIPIX v1.0.",
    specialNotes: ["Redaccion sobria orientada a confianza y claridad operativa."],
  }),
  makeDraft({
    slug: "aviso-privacidad-simplificado",
    title: "Aviso de Privacidad Simplificado",
    route: "/legal-drafts-v1/aviso-privacidad-simplificado",
    version: "1.0.0",
    relatedModules: ["registro", "checkout", "perfil"],
    requiredBeforePayment: true,
    summary:
      "Version breve y clara del tratamiento de datos para mostrar en formularios, altas de cuenta, compra de servicios y puntos de captura de informacion.",
    definitions: [
      { term: "Titular", definition: "Persona a la que corresponden los datos que procesa CARVIPIX." },
      { term: "Canal oficial", definition: "Sitio, panel o correo autorizado para tramites y soporte." },
      { term: "Datos necesarios", definition: "Informacion minima para crear cuenta, prestar el servicio y cumplir obligaciones." },
    ],
    scopeBullets: [
      "Resume quien trata los datos, para que se usan y como ejercer derechos.",
      "Se presenta en formularios de alta, pago y captura de consentimientos.",
      "Enlaza al aviso integral para consulta ampliada.",
    ],
    rightsBullets: [...commonRights, "Recibir una referencia directa al aviso integral cuando el usuario desee ampliar informacion."],
    obligationsBullets: [...commonObligations, "Confirmar que los datos proporcionados sean correctos antes de enviar el formulario."],
    proceduresBullets: [...commonProcedures, "Marcar la lectura del aviso simplificado antes de continuar con el alta o compra."],
    limitationsBullets: [...commonLimitations, "No sustituye el aviso integral, solo lo resume para un punto de contacto rapido."],
    responsibilitiesBullets: [...commonResponsibilities, "El texto resumido debe coincidir con el aviso integral y no contradecirlo."],
    law: "Ley Federal de Proteccion de Datos Personales en Posesion de los Particulares.",
    contact: "privacy@carvipix.com",
    historyNote: "Se agrega una version breve para formularios y pantallas de conversion.",
  }),
  makeDraft({
    slug: "politica-privacidad",
    title: "Politica de Privacidad",
    route: "/legal-drafts-v1/politica-privacidad",
    version: "1.0.0",
    relatedModules: ["registro", "perfil", "compliance", "support"],
    requiredBeforePayment: false,
    summary:
      "Politica operativa que describe como CARVIPIX protege, usa y organiza datos personales en todos sus servicios digitales, manteniendo un enfoque de minima friccion y alta confianza.",
    definitions: [
      { term: "Tratamiento", definition: "Recoleccion, uso, resguardo, transferencia o eliminacion de datos personales." },
      { term: "Medidas de seguridad", definition: "Controles tecnicos, administrativos y fisicos para proteger la informacion." },
      { term: "Retencion", definition: "Plazo durante el cual los datos permanecen disponibles segun necesidad legal y operativa." },
    ],
    scopeBullets: [
      "Aplica al acceso, navegacion, soporte, pagos, analitica y comunicaciones de la plataforma.",
      "Incluye el uso de proveedores tecnologicos y de pagos necesarios para operar el servicio.",
      "Considera datos de identidad, contacto, uso del servicio y soporte tecnico.",
    ],
    rightsBullets: [...commonRights, "Solicitar aclaraciones sobre perfiles, preferencias o integraciones que dependen de consentimiento."],
    obligationsBullets: [...commonObligations, "Reportar cualquier acceso no autorizado o sospecha de fraude al equipo de soporte."],
    proceduresBullets: [...commonProcedures, "Describir la base de consentimiento, ejecucion de contrato o interes legitimo cuando aplique."],
    limitationsBullets: [...commonLimitations, "No cubre politicas de proveedores externos salvo en la medida en que interactuan con CARVIPIX."],
    responsibilitiesBullets: [...commonResponsibilities, "La politica debe revisarse cuando cambien servicios, flujos de datos o integraciones."],
    law: "Ley Federal de Proteccion de Datos Personales en Posesion de los Particulares y mejores practicas ISO/IEC 27001 como referencia de seguridad.",
    contact: "privacy@carvipix.com",
    historyNote: "Se consolida la politica general de privacidad para el ecosistema CARVIPIX.",
  }),
  makeDraft({
    slug: "politica-cookies",
    title: "Politica de Cookies",
    route: "/legal-drafts-v1/politica-cookies",
    version: "1.0.0",
    relatedModules: ["home", "registro", "legal"],
    requiredBeforePayment: false,
    summary:
      "Documento que explica el uso de cookies, identificadores de sesion y tecnologias similares para mantener la experiencia rapida, estable y segura.",
    definitions: [
      { term: "Cookies", definition: "Archivos o identificadores que ayudan a recordar preferencias, mantener sesiones y medir uso." },
      { term: "Cookies tecnicas", definition: "Tecnologias necesarias para autenticacion, seguridad y navegacion basica." },
      { term: "Cookies de analitica", definition: "Tecnologias que ayudan a entender uso agregado para mejorar la plataforma." },
    ],
    scopeBullets: [
      "Describe cookies de sesion, seguridad, analitica y preferencias.",
      "Aclara que la configuracion puede limitar funciones, pero no bloquea el acceso basico del sitio.",
      "Se mantiene alineada con las funciones actuales de registro, login y dashboard.",
    ],
    rightsBullets: [...commonRights, "Administrar preferencias cuando la experiencia de usuario lo permita sin afectar funciones criticas."],
    obligationsBullets: [...commonObligations, "Revisar el banner o aviso de cookies cuando aparezca en el sitio."],
    proceduresBullets: [...commonProcedures, "Explicar como aceptar, rechazar o ajustar preferencias segun la jurisdiccion y el dispositivo."],
    limitationsBullets: [...commonLimitations, "Deshabilitar cookies tecnicas puede afectar inicio de sesion o seguridad del flujo."],
    responsibilitiesBullets: [...commonResponsibilities, "CARVIPIX debe limitar cookies al minimo necesario y documentar su finalidad."],
    law: "LFPDPPP, lineamientos de privacidad digital aplicables y buenas practicas internacionales de transparencia en cookies.",
    contact: "privacy@carvipix.com",
    historyNote: "Se crea el marco de cookies para navegacion segura y transparente.",
  }),
  makeDraft({
    slug: "politica-comunicaciones-electronicas",
    title: "Politica de Comunicaciones Electronicas",
    route: "/legal-drafts-v1/politica-comunicaciones-electronicas",
    version: "1.0.0",
    relatedModules: ["comunicaciones", "soporte", "perfil", "notifications"],
    requiredBeforePayment: true,
    summary:
      "Politica sobre correos, mensajes internos y notificaciones que permite comunicar cambios, soporte, confirmaciones y novedades con claridad y consentimiento donde aplique.",
    definitions: [
      { term: "Comunicacion electronica", definition: "Correo, mensaje in-app, notificacion o aviso enviado por medios digitales." },
      { term: "Transaccional", definition: "Mensaje necesario para operar la cuenta, el pago o la seguridad." },
      { term: "Comercial", definition: "Mensaje promocional o informativo sobre productos, mejoras o campañas." },
    ],
    scopeBullets: [
      "Cubre mensajes de cuenta, seguridad, soporte, versionado legal y comunicaciones comerciales.",
      "Define preferencia opt-in y opt-out cuando la normativa y la naturaleza del mensaje lo permitan.",
      "Mantiene tono profesional, util y no intrusivo para preservar la confianza del usuario.",
    ],
    rightsBullets: [...commonRights, "Diferenciar mensajes de servicio de comunicaciones promocionales."],
    obligationsBullets: [...commonObligations, "No usar canales de comunicacion para enviar informacion falsa o sensible de forma publica."],
    proceduresBullets: [...commonProcedures, "Explicar como administrar preferencias sin bloquear avisos criticos de seguridad o cuenta."],
    limitationsBullets: [...commonLimitations, "Algunos mensajes de servicio pueden enviarse aun cuando el usuario no reciba marketing."],
    responsibilitiesBullets: [...commonResponsibilities, "CARVIPIX debe documentar los motivos de cada clase de mensaje y su base de envio."],
    law: "LFPDPPP, reglas de comercio electronico aplicables en Mexico y buenas practicas anti-spam.",
    contact: "support@carvipix.com",
    historyNote: "Se formaliza el canal de mensajes electronicos con enfoque de confianza y utilidad.",
  }),
  makeDraft({
    slug: "politica-uso-aceptable",
    title: "Politica de Uso Aceptable",
    route: "/legal-drafts-v1/politica-uso-aceptable",
    version: "1.0.0",
    relatedModules: ["dashboard", "soporte", "community", "bot", "alerts"],
    requiredBeforePayment: true,
    summary:
      "Reglas de uso para mantener la plataforma segura, colaborativa y estable, evitando abusos, fraudes y comportamientos que afecten la experiencia comercial o tecnica.",
    definitions: [
      { term: "Uso aceptable", definition: "Uso permitido, proporcional y conforme a la finalidad del servicio." },
      { term: "Abuso", definition: "Accion que degrade seguridad, reputacion, estabilidad o derechos de otros usuarios." },
      { term: "Contenido prohibido", definition: "Material o conducta contraria a la ley, a esta politica o al bienestar de la comunidad." },
    ],
    scopeBullets: [
      "Aplica a cuentas, contenidos, automatizaciones, integraciones y comunicaciones.",
      "Protege el valor de la comunidad, la reputacion de la marca y la continuidad del servicio.",
      "Se alinea con alertas, bot, soporte y futuros productos financieros de la plataforma.",
    ],
    rightsBullets: [...commonRights, "Usar la plataforma en tanto el comportamiento respete la seguridad y a otros miembros."],
    obligationsBullets: [...commonObligations, "No intentar acceso no autorizado, fraude, scraping abusivo o manipulacion de resultados."],
    proceduresBullets: [...commonProcedures, "Indicar como se investigan reportes, suspensiones y restablecimiento de acceso cuando proceda."],
    limitationsBullets: [...commonLimitations, "CARVIPIX puede limitar funciones ante abuso razonable y documentado."],
    responsibilitiesBullets: [...commonResponsibilities, "El usuario es responsable de la actividad ejecutada desde su cuenta."],
    law: "Codigo Civil y Penal aplicables en Mexico, LFPC, LFPDPPP y demas normativa relacionada con uso de plataformas digitales.",
    contact: "support@carvipix.com",
    historyNote: "Se crea la politica de uso aceptable para preservar seguridad y calidad de servicio.",
  }),
  makeDraft({
    slug: "reglas-comunidad",
    title: "Reglas de la Comunidad",
    route: "/legal-drafts-v1/reglas-comunidad",
    version: "1.0.0",
    relatedModules: ["community", "moderacion", "soporte"],
    requiredBeforePayment: false,
    summary:
      "Reglas para conversaciones, colaboracion y moderacion dentro de la comunidad CARVIPIX, pensadas para mantener un ambiente profesional, util y respetuoso.",
    definitions: [
      { term: "Comunidad", definition: "Espacios internos o sociales donde los usuarios interactuan con otros miembros o con el equipo." },
      { term: "Moderacion", definition: "Acciones de orden, revision y proteccion de la convivencia." },
      { term: "Contenido sensible", definition: "Material que requiere trato prudente para evitar daño, abuso o desinformacion." },
    ],
    scopeBullets: [
      "Aplica a chat, foros, comentarios, reacciones y cualquier espacio participativo.",
      "Busca conversaciones claras, utiles y respetuosas, sin afectar la conversion comercial ni la experiencia premium.",
      "Incluye reglas para publicaciones promocionales internas y para referencias a riesgo o resultados.",
    ],
    rightsBullets: [...commonRights, "Participar de manera ordenada cuando la cuenta mantenga conducta compatible con la comunidad."],
    obligationsBullets: [...commonObligations, "Respetar a otros usuarios, moderadores y al equipo de soporte."],
    proceduresBullets: [...commonProcedures, "Explicar reportes, medidas correctivas y apelaciones con lenguaje claro y sin dramatizar."],
    limitationsBullets: [...commonLimitations, "La moderacion puede retirar contenido que afecte seguridad, reputacion o cumplimiento."],
    responsibilitiesBullets: [...commonResponsibilities, "CARVIPIX debe moderar con consistencia, proporcionalidad y trazabilidad."],
    law: "Reglas internas de convivencia, buenas practicas de moderacion digital y normativa aplicable de datos y comercio electronico en Mexico.",
    contact: "community@carvipix.com",
    historyNote: "Se formalizan las reglas de convivencia para la comunidad CARVIPIX.",
  }),
  makeDraft({
    slug: "politica-pagos",
    title: "Politica de Pagos",
    route: "/legal-drafts-v1/politica-pagos",
    version: "1.0.0",
    relatedModules: ["checkout", "billing", "payments", "admin-pagos"],
    requiredBeforePayment: true,
    summary:
      "Politica que describe cargos, ciclos de pago, cobros recurrentes, comprobacion y tratamiento general de pagos para mantener transparencia y continuidad de acceso.",
    definitions: [
      { term: "Cargo", definition: "Cobro asociado a suscripcion, producto, renovacion o servicio adicional." },
      { term: "Proveedor de pago", definition: "Intermediario autorizado que procesa la transaccion en nombre de CARVIPIX." },
      { term: "Saldo pendiente", definition: "Importe que aun no ha sido confirmado por el procesador o por la plataforma." },
    ],
    scopeBullets: [
      "Cubre precios, impuestos, autorizaciones, retenciones, reversos y conciliacion basica.",
      "Aplica a suscripciones, pagos unicos y servicios futuros que requieran cobro.",
      "Mantiene lenguaje claro para no afectar conversion ni confianza en el checkout.",
    ],
    rightsBullets: [...commonRights, "Recibir confirmacion de pago y ver el estado del cobro desde su cuenta cuando aplique."],
    obligationsBullets: [...commonObligations, "Proporcionar informacion de pago valida y mantener fondos suficientes para el cargo autorizado."],
    proceduresBullets: [...commonProcedures, "Indicar como se notifica un cobro fallido y como se puede corregir sin friccion excesiva."],
    limitationsBullets: [...commonLimitations, "Los cargos pueden depender de impuestos, conversion de divisas o politicas del procesador."],
    responsibilitiesBullets: [...commonResponsibilities, "CARVIPIX debe registrar el cobro y conservar evidencia de la transaccion."],
    law: "Codigo de Comercio, legislacion fiscal aplicable y buenas practicas internacionales de cobro electronico.",
    contact: "billing@carvipix.com",
    historyNote: "Se estandariza la politica de cobro para suscripciones y servicios digitales.",
  }),
  makeDraft({
    slug: "politica-renovacion-automatica",
    title: "Politica de Renovacion Automatica",
    route: "/legal-drafts-v1/politica-renovacion-automatica",
    version: "1.0.0",
    relatedModules: ["checkout", "billing", "memberships"],
    requiredBeforePayment: true,
    summary:
      "Documento que explica como operan las renovaciones automaticas, recordatorios, reintentos y cancelaciones para mantener continuidad del servicio sin sorpresas.",
    definitions: [
      { term: "Renovacion automatica", definition: "Cobro programado que extiende el servicio al concluir el periodo vigente." },
      { term: "Reintento", definition: "Nuevo intento de cobro ante un fallo temporal del procesador o del metodo de pago." },
      { term: "Aviso previo", definition: "Comunicacion que informa sobre un cobro inminente o cambios en el ciclo." },
    ],
    scopeBullets: [
      "Aplica a planes recurrentes y servicios con continuidad mensual o anual.",
      "Da al usuario visibilidad sobre fecha, monto y metodo de cobro.",
      "Se redacta para preservar confianza y reducir friccion en la renovacion.",
    ],
    rightsBullets: [...commonRights, "Recibir recordatorios y acceder a la gestion de metodo de pago cuando este disponible."],
    obligationsBullets: [...commonObligations, "Mantener informado el metodo de pago para evitar interrupciones no deseadas."],
    proceduresBullets: [...commonProcedures, "Explicar como desactivar la renovacion sin perder acceso ya devengado."],
    limitationsBullets: [...commonLimitations, "La cancelacion preventiva no elimina obligaciones ya generadas por periodos en curso."],
    responsibilitiesBullets: [...commonResponsibilities, "CARVIPIX debe notificar con antelacion razonable la renovacion y sus cambios relevantes."],
    law: "Codigo de Comercio, reglas de comercio electronico y mejores practicas de suscripcion digital.",
    contact: "billing@carvipix.com",
    historyNote: "Se crea el marco de renovaciones automaticas orientado a continuidad y claridad.",
  }),
  makeDraft({
    slug: "politica-cancelaciones",
    title: "Politica de Cancelaciones",
    route: "/legal-drafts-v1/politica-cancelaciones",
    version: "1.0.0",
    relatedModules: ["checkout", "billing", "memberships"],
    requiredBeforePayment: true,
    summary:
      "Politica que define como suspender, terminar o no renovar un servicio de forma ordenada, con procesos simples que protegen la experiencia del usuario y la operacion comercial.",
    definitions: [
      { term: "Cancelacion", definition: "Solicitud del usuario para dejar sin efecto una renovacion o cerrar un servicio futuro." },
      { term: "Efecto inmediato", definition: "Cese de una funcion desde el momento autorizado por la politica o por la ley." },
      { term: "Periodo en curso", definition: "Tiempo ya pagado o devengado antes de que la cancelacion surta efectos." },
    ],
    scopeBullets: [
      "Aplica a suscripciones, complementos y servicios de pago asociados a la cuenta.",
      "Aclara el efecto de cancelacion sobre facturacion, acceso y periodos pagados.",
      "Evita confusiones y mantiene una experiencia de salida transparente y profesional.",
    ],
    rightsBullets: [...commonRights, "Conocer la fecha efectiva y el alcance economico de la cancelacion."],
    obligationsBullets: [...commonObligations, "Usar los canales oficiales para solicitar la cancelacion y conservar su comprobante."],
    proceduresBullets: [...commonProcedures, "Indicar pasos para cancelar renovacion, plan o complemento sin afectar datos historicos."],
    limitationsBullets: [...commonLimitations, "La cancelacion no obliga a reembolsar importes ya consumidos salvo disposicion expresa."],
    responsibilitiesBullets: [...commonResponsibilities, "CARVIPIX debe hacer el proceso sencillo, trazable y sin fricciones innecesarias."],
    law: "Codigo Civil y de Comercio aplicables en Mexico, junto con principios de transparencia contractual.",
    contact: "billing@carvipix.com",
    historyNote: "Se ordena la salida del servicio con un proceso claro y amigable.",
  }),
  makeDraft({
    slug: "politica-reembolsos",
    title: "Politica de Reembolsos",
    route: "/legal-drafts-v1/politica-reembolsos",
    version: "1.0.0",
    relatedModules: ["checkout", "billing", "support"],
    requiredBeforePayment: true,
    summary:
      "Reglas para evaluar devoluciones de cargos de forma objetiva, consistente y alineada al servicio contratado, sin afectar la confianza del usuario ni el flujo de soporte.",
    definitions: [
      { term: "Reembolso", definition: "Devolucion total o parcial de un cargo cuando la politica lo permita." },
      { term: "Elegibilidad", definition: "Conjunto de condiciones para revisar una devolucion." },
      { term: "Ventana de revision", definition: "Periodo en el que CARVIPIX analiza la solicitud y su evidencia." },
    ],
    scopeBullets: [
      "Cubre devoluciones por fallas tecnicas, cobros duplicados o supuestos expresamente aceptados.",
      "Excluye promesas de resultado o percepciones subjetivas sobre el valor del servicio.",
      "Se redacta con tono de servicio y claridad para evitar frenar ventas innecesariamente.",
    ],
    rightsBullets: [...commonRights, "Conocer si la solicitud es elegible y en que plazo se resuelve."],
    obligationsBullets: [...commonObligations, "Aportar evidencia basica cuando se trate de un cargo cuestionado."],
    proceduresBullets: [...commonProcedures, "Describir como se evalua una devolucion y cuando procede por herramienta o error tecnico."],
    limitationsBullets: [...commonLimitations, "Algunas ventas, activaciones o consumos pueden no ser reembolsables segun su naturaleza."],
    responsibilitiesBullets: [...commonResponsibilities, "CARVIPIX debe resolver con coherencia, rapidez razonable y evidencia documental."],
    law: "Codigo de Comercio, reglas bancarias de contracargos y normativa de proteccion al consumidor aplicable en Mexico.",
    contact: "billing@carvipix.com",
    historyNote: "Se definen criterios de reembolso con enfoque de confianza y consistencia.",
  }),
  makeDraft({
    slug: "politica-facturacion",
    title: "Politica de Facturacion",
    route: "/legal-drafts-v1/politica-facturacion",
    version: "1.0.0",
    relatedModules: ["checkout", "billing", "admin-pagos"],
    requiredBeforePayment: true,
    summary:
      "Politica para emitir facturas, comprobantes y referencias de cobro de manera ordenada, con datos consistentes y listos para conciliacion fiscal o interna.",
    definitions: [
      { term: "Factura", definition: "Comprobante fiscal o administrativo que respalda un cobro, segun corresponda." },
      { term: "Datos fiscales", definition: "Informacion requerida para la emision correcta del comprobante." },
      { term: "Periodo de emision", definition: "Ventana dentro de la cual se puede solicitar o corregir una factura." },
    ],
    scopeBullets: [
      "Aplica a ventas recurrentes, pagos unicos, complementos y consumos facturables.",
      "Define requisitos de RFC, razon social, regimen y correo fiscal cuando aplique.",
      "Permite mantener una experiencia de compra limpia y comercialmente clara.",
    ],
    rightsBullets: [...commonRights, "Solicitar correccion de datos facturacion dentro del plazo correspondiente."],
    obligationsBullets: [...commonObligations, "Proporcionar datos fiscales exactos y actualizados para evitar retrasos."],
    proceduresBullets: [...commonProcedures, "Indicar plazos, formato y canal para solicitar o corregir facturas."],
    limitationsBullets: [...commonLimitations, "Una solicitud extemporanea puede depender de reglas fiscales y de cierre administrativo."],
    responsibilitiesBullets: [...commonResponsibilities, "CARVIPIX debe emitir comprobantes consistentes con el cargo y la informacion recibida."],
    law: "Codigo Fiscal de la Federacion, reglas miscelaneas aplicables y demas disposiciones fiscales mexicanas.",
    contact: "billing@carvipix.com",
    historyNote: "Se estandariza la facturacion para operaciones digitales y recurrentes.",
  }),
  makeDraft({
    slug: "politica-promociones",
    title: "Politica de Promociones",
    route: "/legal-drafts-v1/politica-promociones",
    version: "1.0.0",
    relatedModules: ["marketing", "checkout", "communications"],
    requiredBeforePayment: false,
    summary:
      "Reglas para descuentos, bonos, cupones y campañas, redactadas para comunicar valor sin exagerar resultados ni crear falsas expectativas.",
    definitions: [
      { term: "Promocion", definition: "Beneficio temporal o adicional que modifica precio, acceso o condiciones de un servicio." },
      { term: "Elegibilidad", definition: "Requisitos para recibir una promocion concreta." },
      { term: "Vigencia", definition: "Fecha de inicio y fin durante la cual la promocion esta disponible." },
    ],
    scopeBullets: [
      "Aplica a descuentos, upgrades, campañas de lanzamiento y beneficios para clientes leales.",
      "Evita mensajes alarmistas y prioriza claridad sobre condiciones, vigencia y disponibilidad.",
      "Protege el tono comercial de la marca y la credibilidad del equipo.",
    ],
    rightsBullets: [...commonRights, "Conocer condiciones exactas, limites y exclusiones de cada promocion."],
    obligationsBullets: [...commonObligations, "No manipular cupones, referidos o beneficios para los que no existe elegibilidad."],
    proceduresBullets: [...commonProcedures, "Definir como se anuncian promociones sin comprometer la verdad comercial."],
    limitationsBullets: [...commonLimitations, "Las promociones pueden agotarse, cambiar o suspenderse por motivos operativos razonables."],
    responsibilitiesBullets: [...commonResponsibilities, "CARVIPIX debe publicar promociones de forma veraz, medible y consistente con el checkout."],
    law: "Ley Federal de Proteccion al Consumidor y buenas practicas de publicidad digital aplicables en Mexico.",
    contact: "marketing@carvipix.com",
    historyNote: "Se crea el marco promocional para campañas limpias y confiables.",
  }),
  makeDraft({
    slug: "divulgacion-riesgos-general",
    title: "Divulgacion General de Riesgos",
    route: "/legal-drafts-v1/divulgacion-riesgos-general",
    version: "1.0.0",
    relatedModules: ["alerts", "results", "trading"],
    requiredBeforePayment: true,
    summary:
      "Documento general que explica riesgos de mercado, operativos y tecnologicos de usar alertas, automacion y herramientas de analisis dentro de la plataforma.",
    definitions: [
      { term: "Riesgo de mercado", definition: "Posibilidad de perdidas por movimiento de precios o condiciones externas." },
      { term: "Riesgo operativo", definition: "Posibilidad de afectacion por errores tecnicos, conectividad o ejecucion." },
      { term: "Riesgo tecnologico", definition: "Posible afectacion por fallas de sistemas, integraciones o disponibilidad." },
    ],
    scopeBullets: [
      "Aplica a todas las herramientas de analisis, alertas, automatizacion y seguimiento de resultados.",
      "Aclara que el uso responsable de la informacion mejora la experiencia, pero no elimina el riesgo.",
      "Se redacta con tono firme y calmado para sostener confianza sin ocultar la realidad del mercado.",
    ],
    rightsBullets: [...commonRights, "Recibir informacion clara sobre el caracter informativo y no garantizado de los resultados."],
    obligationsBullets: [...commonObligations, "Tomar decisiones con criterio propio y segun su perfil y jurisdiccion."],
    proceduresBullets: [...commonProcedures, "Explicar que los historiales y metricas no equivalen a garantia futura."],
    limitationsBullets: [...commonLimitations, "Las decisiones de trading siguen bajo responsabilidad del usuario o del operador autorizado."],
    responsibilitiesBullets: [...commonResponsibilities, "CARVIPIX debe comunicar riesgos de forma proporcionada, visible y comprensible."],
    law: "Ley del Mercado de Valores cuando aplique, normas mexicanas de consumo y mejores practicas internacionales de disclosure.",
    contact: "risk@carvipix.com",
    historyNote: "Se redacta la divulgacion general de riesgos para servicios de mercado y automatizacion.",
  }),
  makeDraft({
    slug: "condiciones-servicio-alertas",
    title: "Condiciones del Servicio de Alertas",
    route: "/legal-drafts-v1/condiciones-servicio-alertas",
    version: "1.0.0",
    relatedModules: ["alertas", "dashboard", "notifications"],
    requiredBeforePayment: true,
    summary:
      "Condiciones especificas del servicio de alertas para explicar alcance, frecuencia, fuentes de datos y limites operativos de una herramienta informativa y accionable.",
    definitions: [
      { term: "Alerta", definition: "Aviso generado por la plataforma a partir de reglas, eventos o criterios configurados." },
      { term: "Señal informativa", definition: "Referencia operativa que no sustituye analisis personal ni asesoramiento regulado." },
      { term: "Fuente de datos", definition: "Origen tecnico o de mercado usado para generar el evento de alerta." },
    ],
    scopeBullets: [
      "Aplica a alertas de mercado, sistema y producto que el usuario tenga habilitadas.",
      "Describe que las alertas son informativas y deben interpretarse con criterio profesional.",
      "Se mantiene alineado con el dashboard para no crear friccion ni sobrepromesas.",
    ],
    rightsBullets: [...commonRights, "Configurar preferencias y recibir alertas consistentes con el plan contratado."],
    obligationsBullets: [...commonObligations, "Verificar que el dispositivo, correo o canal seleccionado este activo para recibirlas."],
    proceduresBullets: [...commonProcedures, "Explicar como se ajustan reglas, silencios y prioridades de notificacion."],
    limitationsBullets: [...commonLimitations, "Latencia, conectividad o fuentes externas pueden alterar el momento de entrega."],
    responsibilitiesBullets: [...commonResponsibilities, "CARVIPIX debe monitorear la calidad tecnica de las alertas sin prometer precision absoluta."],
    law: "Buenas practicas de servicios digitales, LFPDPPP y normativa mexicana aplicable a comunicaciones electronicas.",
    contact: "support@carvipix.com",
    historyNote: "Se definen condiciones especificas del motor de alertas.",
  }),
  makeDraft({
    slug: "condiciones-bot-carvipix",
    title: "Condiciones del Bot CARVIPIX",
    route: "/legal-drafts-v1/condiciones-bot-carvipix",
    version: "1.0.0",
    relatedModules: ["bot", "dashboard", "automation"],
    requiredBeforePayment: true,
    summary:
      "Condiciones para el bot y la automatizacion de CARVIPIX, con enfoque en control del usuario, limites operativos, calidad de ejecucion y trazabilidad.",
    definitions: [
      { term: "Bot", definition: "Herramienta automatizada que ejecuta acciones o asistentes dentro de reglas definidas." },
      { term: "Orden automatica", definition: "Instruccion procesada por el sistema segun parametros previamente validados." },
      { term: "Parametro", definition: "Valor configurado por el usuario o por la plataforma para controlar el comportamiento del bot." },
    ],
    scopeBullets: [
      "Aplica a activacion, configuracion, monitoreo y suspension del bot.",
      "Aclara que la automatizacion es una herramienta de apoyo y no elimina el criterio del usuario.",
      "Se redacta para inspirar confianza en la tecnologia sin exagerar resultados.",
    ],
    rightsBullets: [...commonRights, "Activar, pausar o ajustar configuraciones segun el plan o permiso vigente."],
    obligationsBullets: [...commonObligations, "Mantener limites, reglas y permisos consistentes con su perfil y experiencia."],
    proceduresBullets: [...commonProcedures, "Describir revisiones, apagado seguro y restablecimiento de automatizaciones."],
    limitationsBullets: [...commonLimitations, "El bot puede verse afectado por mercado, latencia, liquidez o cambios de integracion."],
    responsibilitiesBullets: [...commonResponsibilities, "CARVIPIX debe proveer controles simples, seguros y trazables para el bot."],
    law: "Normativa mexicana aplicable a servicios digitales, comercio electronico y mejores practicas de automatizacion financiera.",
    contact: "support@carvipix.com",
    historyNote: "Se describen las condiciones iniciales del bot y su alcance operativo.",
  }),
  makeDraft({
    slug: "politica-resultados-estadisticas",
    title: "Politica de Resultados y Estadisticas",
    route: "/legal-drafts-v1/politica-resultados-estadisticas",
    version: "1.0.0",
    relatedModules: ["results", "dashboard", "analytics"],
    requiredBeforePayment: true,
    summary:
      "Politica para presentar metricas, historiales y estadisticas con responsabilidad, evitando interpretaciones de garantia y manteniendo la credibilidad del producto.",
    definitions: [
      { term: "Estadistica", definition: "Dato agregado o historico mostrado para entender comportamiento o rendimiento." },
      { term: "Rendimiento pasado", definition: "Comportamiento historico que no debe tratarse como promesa futura." },
      { term: "Muestra", definition: "Segmento de datos que puede no reflejar toda la realidad operativa." },
    ],
    scopeBullets: [
      "Cubre dashboards, reportes, tablas, graficas y resuenos de desempeno.",
      "Aclara que el usuario debe interpretar la informacion con contexto y disciplina.",
      "Ayuda a comercializar el producto sin caer en promesas exageradas.",
    ],
    rightsBullets: [...commonRights, "Ver metricas con metadatos suficientes para entender su alcance y fecha."],
    obligationsBullets: [...commonObligations, "No compartir estadisticas fuera de contexto como prueba de resultados futuros."],
    proceduresBullets: [...commonProcedures, "Explicar filtros, periodos y exclusiones que puedan afectar las cifras."],
    limitationsBullets: [...commonLimitations, "Los datos pueden cambiar por actualizaciones, correcciones o ajustes de metodologia."],
    responsibilitiesBullets: [...commonResponsibilities, "CARVIPIX debe mostrar cifras honestas, auditables y con contexto suficiente."],
    law: "Buenas practicas de disclosure, publicidad no engañosa y principios de transparencia digital aplicables en Mexico.",
    contact: "analytics@carvipix.com",
    historyNote: "Se establecen reglas para mostrar resultados y estadisticas con sentido comercial y tecnico.",
  }),
  makeDraft({
    slug: "limitacion-responsabilidad",
    title: "Limitacion de Responsabilidad",
    route: "/legal-drafts-v1/limitacion-responsabilidad",
    version: "1.0.0",
    relatedModules: ["legal", "risk", "support"],
    requiredBeforePayment: true,
    summary:
      "Clausulas que delimitan la responsabilidad de CARVIPIX frente al uso de servicios informativos, tecnicos y de soporte, manteniendo un equilibrio razonable con el usuario.",
    definitions: [
      { term: "Dano indirecto", definition: "Perjuicio que no deriva de forma inmediata de una accion de la plataforma." },
      { term: "Evento externo", definition: "Situacion fuera del control razonable de CARVIPIX." },
      { term: "Limite legal", definition: "Tope o exclusion permitido por la normativa aplicable." },
    ],
    scopeBullets: [
      "Aplica a uso de plataforma, informacion mostrada y herramientas de apoyo.",
      "Evita expectativas de resultado absoluto sin vaciar de contenido la responsabilidad comercial de la empresa.",
      "Mantiene un tono profesional, directo y sin alarmismo innecesario.",
    ],
    rightsBullets: [...commonRights, "Recibir una descripcion razonable de los limites antes de contratar o usar el servicio."],
    obligationsBullets: [...commonObligations, "Usar la plataforma con criterio propio y respaldar sus decisiones con informacion adicional cuando sea necesario."],
    proceduresBullets: [...commonProcedures, "Explicar como se gestionan incidencias tecnicas sin comprometer promesas comerciales."],
    limitationsBullets: [...commonLimitations, "La responsabilidad se limita conforme a la ley, el contrato y la naturaleza del servicio."],
    responsibilitiesBullets: [...commonResponsibilities, "CARVIPIX debe responder con puntualidad, evidencia y trazabilidad ante incidencias reales."],
    law: "Codigo Civil Federal, Codigo de Comercio y normativa mexicana aplicable a contratos de servicios digitales.",
    contact: "support@carvipix.com",
    historyNote: "Se fijan limites de responsabilidad coherentes con la naturaleza tecnologica del servicio.",
  }),
  makeDraft({
    slug: "politica-verificacion-identidad",
    title: "Politica de Verificacion de Identidad",
    route: "/legal-drafts-v1/politica-verificacion-identidad",
    version: "1.0.0",
    relatedModules: ["profile", "admin", "compliance", "identity-verification"],
    requiredBeforePayment: false,
    summary:
      "Politica que explica cuando y por que CARVIPIX solicita identificacion, como protege el proceso y como se administra la evidencia de forma discreta y confiable.",
    definitions: [
      { term: "Verificacion", definition: "Proceso de revision de documentos para confirmar identidad y reducir riesgo operativo." },
      { term: "Documento", definition: "Identificacion oficial o evidencia permitida para la revision." },
      { term: "Retencion", definition: "Plazo de conservacion de la evidencia con control de acceso y destruccion segura." },
    ],
    scopeBullets: [
      "Aplica a carga, revision, aprobacion, rechazo, solicitud de nuevo documento y conservacion segura.",
      "Se integra al modulo ya existente de perfil, compliance y administracion.",
      "Busca dar confianza y no crear friccion innecesaria en la conversion.",
    ],
    rightsBullets: [...commonRights, "Conocer el motivo de la solicitud y el estado de revision de sus documentos."],
    obligationsBullets: [...commonObligations, "Enviar documentos verdaderos, vigentes y legibles por ambos lados cuando se soliciten."],
    proceduresBullets: [...commonProcedures, "Explicar validaciones, revisiones manuales y medidas de conservacion o purga."],
    limitationsBullets: [...commonLimitations, "Los documentos pueden solicitarse solo para servicios o riesgos que lo justifiquen."],
    responsibilitiesBullets: [...commonResponsibilities, "CARVIPIX debe proteger el material, limitar su acceso y registrar cada consulta."],
    law: "LFPDPPP, su reglamento, lineamientos de seguridad de la informacion y buenas practicas KYC/AML cuando procedan.",
    contact: "privacy@carvipix.com",
    historyNote: "Se integra la politica de verificacion de identidad al sistema juridico corporativo.",
  }),
  makeDraft({
    slug: "politica-seguridad",
    title: "Politica de Seguridad",
    route: "/legal-drafts-v1/politica-seguridad",
    version: "1.0.0",
    relatedModules: ["security", "identity-verification", "admin", "audit"],
    requiredBeforePayment: true,
    summary:
      "Politica de seguridad informatica y operativa que documenta protecciones tecnicas, controles administrativos y cultura interna de resguardo de la plataforma.",
    definitions: [
      { term: "Incidente", definition: "Evento que compromete o puede comprometer seguridad, disponibilidad o confidencialidad." },
      { term: "Control", definition: "Medida preventiva, detectiva o correctiva aplicada por CARVIPIX." },
      { term: "Acceso privilegiado", definition: "Permisos ampliados sujetos a autorizacion, trazabilidad y supervision." },
    ],
    scopeBullets: [
      "Cubre proteccion de cuenta, infraestructura, documentos y auditoria.",
      "Describe autentificacion, resguardo, monitoreo y respuesta a incidentes.",
      "Se redacta para generar confianza sin exagerar riesgos ni blindajes absolutos.",
    ],
    rightsBullets: [...commonRights, "Saber que medidas razonables se usan para proteger su cuenta y su informacion."],
    obligationsBullets: [...commonObligations, "Usar contraseñas seguras, MFA cuando exista y no compartir credenciales."],
    proceduresBullets: [...commonProcedures, "Informar como reportar incidentes y como se documenta la respuesta."],
    limitationsBullets: [...commonLimitations, "Ningun sistema elimina por completo el riesgo, pero puede reducirlo de forma razonable."],
    responsibilitiesBullets: [...commonResponsibilities, "CARVIPIX debe prevenir, detectar, responder y aprender de incidentes con trazabilidad."],
    law: "Buenas practicas de ciberseguridad, LFPDPPP y marco mexicano aplicable a servicios digitales.",
    contact: "security@carvipix.com",
    historyNote: "Se consolida la politica de seguridad para cuentas, documentos y operaciones.",
  }),
  makeDraft({
    slug: "politica-conservacion-datos",
    title: "Politica de Conservacion de Datos",
    route: "/legal-drafts-v1/politica-conservacion-datos",
    version: "1.0.0",
    relatedModules: ["compliance", "identity-verification", "billing", "support"],
    requiredBeforePayment: false,
    summary:
      "Politica que establece como y por cuanto tiempo CARVIPIX conserva datos, documentos y evidencias, con criterios claros de borrado logico y purga cuando corresponda.",
    definitions: [
      { term: "Conservacion", definition: "Retencion de informacion durante el tiempo necesario para una finalidad legitima o legal." },
      { term: "Borrado logico", definition: "Marcado del dato como no activo antes de eliminarlo fisicamente." },
      { term: "Purga", definition: "Eliminacion fisica segura del dato o archivo una vez cumplido el plazo." },
    ],
    scopeBullets: [
      "Abarca cuentas, soporte, pagos, identidad, logs y documentos legales.",
      "Permite conservar lo necesario y borrar lo que ya no aporta valor ni obligacion legal.",
      "Integra el criterio ya aplicado por el modulo de identidad y compliance.",
    ],
    rightsBullets: [...commonRights, "Conocer por cuanto tiempo se conservan sus datos segun la finalidad y la ley."],
    obligationsBullets: [...commonObligations, "Entender que ciertos registros se conservan para seguridad, cumplimiento o soporte fiscal."],
    proceduresBullets: [...commonProcedures, "Explicar periodos por tipo de dato y como se ejecuta el borrado seguro."],
    limitationsBullets: [...commonLimitations, "La eliminacion inmediata puede no ser posible si existe obligacion legal o tecnica."],
    responsibilitiesBullets: [...commonResponsibilities, "CARVIPIX debe conservar solo lo razonable y documentar el ciclo de vida del dato."],
    law: "LFPDPPP, normativa fiscal, obligaciones de conservacion documental y mejores practicas de retencion de datos.",
    contact: "privacy@carvipix.com",
    historyNote: "Se define la politica de conservacion y purga para el ecosistema de datos.",
  }),
  makeDraft({
    slug: "politica-recuperacion-cuenta",
    title: "Politica de Recuperacion de Cuenta",
    route: "/legal-drafts-v1/politica-recuperacion-cuenta",
    version: "1.0.0",
    relatedModules: ["login", "profile", "support", "security"],
    requiredBeforePayment: false,
    summary:
      "Politica para recuperar acceso de manera segura, con pasos claros que protegen al usuario y mantienen el soporte eficiente y humano.",
    definitions: [
      { term: "Recuperacion", definition: "Proceso para restablecer acceso a una cuenta cuyo titular ha perdido credenciales o acceso a la sesion." },
      { term: "Verificacion reforzada", definition: "Paso adicional para evitar suplantacion en cuentas sensibles." },
      { term: "Canal autorizado", definition: "Medio oficial para tramitar restauracion de acceso." },
    ],
    scopeBullets: [
      "Aplica a contraseñas olvidadas, cuenta comprometida, correo inaccesible o sesiones perdidas.",
      "Usa el modulo de soporte y verificacion ya existente para evitar duplicar flujos.",
      "Mantiene una experiencia de recuperacion sencilla, clara y segura.",
    ],
    rightsBullets: [...commonRights, "Restablecer acceso si acredita su identidad por los medios definidos."],
    obligationsBullets: [...commonObligations, "Mantener actualizado el correo y telefono para agilizar la recuperacion."],
    proceduresBullets: [...commonProcedures, "Describir reestablecimiento por correo, soporte y validaciones adicionales."],
    limitationsBullets: [...commonLimitations, "La recuperacion puede requerir evidencias adicionales si existe riesgo de suplantacion."],
    responsibilitiesBullets: [...commonResponsibilities, "CARVIPIX debe proteger la cuenta sin hacer el proceso innecesariamente complejo."],
    law: "LFPDPPP, buenas practicas de gestion de identidad y normativa mexicana aplicable a soporte digital.",
    contact: "support@carvipix.com",
    historyNote: "Se formaliza el flujo de recuperacion de cuenta con enfoque de seguridad y servicio.",
  }),
  makeDraft({
    slug: "condiciones-gestion-capital",
    title: "Condiciones de Gestion de Capital",
    route: "/legal-drafts-v1/condiciones-gestion-capital",
    version: "0.1.0",
    relatedModules: ["capital-management", "compliance", "admin"],
    requiredBeforePayment: false,
    summary:
      "Documento de proximamente para futuros servicios de gestion de capital. Se conserva como borrador interno y no activa ningun derecho comercial en produccion.",
    definitions: [
      { term: "Próximamente", definition: "Estado interno que indica que el servicio aun no esta abierto al publico." },
      { term: "Gestion de capital", definition: "Servicio futuro orientado a administrar capital bajo parametros y limites definidos." },
      { term: "Aprobacion previa", definition: "Validacion interna necesaria antes de habilitar cualquier version comercial." },
    ],
    scopeBullets: ["Se mantiene como borrador estrategico para futura revision juridica y operativa.", "No activa el servicio ni crea oferta vigente."],
    rightsBullets: [...commonRights, "Conocer que el documento no esta activo y solo sirve para preparacion interna."],
    obligationsBullets: [...commonObligations, "No interpretar este borrador como oferta, garantia o promesa comercial."],
    proceduresBullets: [...commonProcedures, "Revisar el documento nuevamente antes de cualquier publicacion futura."],
    limitationsBullets: [...commonLimitations, "No genera acceso, costo, SLA ni obligacion de contratacion mientras permanezca en borrador."],
    responsibilitiesBullets: [...commonResponsibilities, "CARVIPIX debe mantener este borrador separado de la oferta vigente."],
    law: "Marco juridico futuro por definir conforme al producto que se libere y a la asesoria regulatoria aplicable.",
    contact: "legal@carvipix.com",
    historyNote: "Se reserva el borrador de gestion de capital para futura auditoria.",
    statusNote: "Documento proximamente. No activo, no comercializable y sujeto a revision final.",
  }),
  makeDraft({
    slug: "condiciones-programa-fondeo",
    title: "Condiciones del Programa de Fondeo",
    route: "/legal-drafts-v1/condiciones-programa-fondeo",
    version: "0.1.0",
    relatedModules: ["funding-program", "compliance", "admin"],
    requiredBeforePayment: false,
    summary:
      "Documento de proximamente para un programa de fondeo futuro. Se conserva como propuesta interna para revisar requisitos, elegibilidad y riesgos antes de cualquier lanzamiento.",
    definitions: [
      { term: "Fondeo", definition: "Apoyo financiero o programa futuro sujeto a reglas y revision previa." },
      { term: "Elegibilidad", definition: "Condiciones minimas para participar si el programa llega a publicarse." },
      { term: "Revision interna", definition: "Analisis juridico, tecnico y comercial antes de activar el servicio." },
    ],
    scopeBullets: ["Se mantiene como borrador y no autoriza acceso ni expectativas de financiacion.", "Su unica finalidad actual es auditoria y preparacion legal."],
    rightsBullets: [...commonRights, "Saber que el programa no esta activo ni disponible para contratacion."],
    obligationsBullets: [...commonObligations, "No promocionar ni vender este programa como si ya estuviera publicado."],
    proceduresBullets: [...commonProcedures, "Revisar reglas de elegibilidad, riesgo y control antes de cualquier lanzamiento futuro."],
    limitationsBullets: [...commonLimitations, "No crea derechos de fondeo, reembolso o participacion mientras siga en borrador."],
    responsibilitiesBullets: [...commonResponsibilities, "CARVIPIX debe mantener una linea clara entre preparacion interna y oferta publica."],
    law: "Marco juridico futuro por definir conforme al producto que se libere y a la asesoria regulatoria aplicable.",
    contact: "legal@carvipix.com",
    historyNote: "Se reserva el borrador del programa de fondeo para revision posterior.",
    statusNote: "Documento proximamente. No activo, no comercializable y sujeto a revision final.",
  }),
  makeDraft({
    slug: "acuerdo-licencia-software",
    title: "Acuerdo de Licencia del Software CARVIPIX",
    route: "/legal-drafts-v1/acuerdo-licencia-software",
    version: "1.0.0",
    relatedModules: ["home", "dashboard", "profile", "legal"],
    requiredBeforePayment: true,
    summary:
      "Acuerdo de licencia que autoriza el uso de la plataforma, sus interfaces, automatizaciones y material asociado bajo condiciones de uso claras y razonables.",
    definitions: [
      { term: "Software", definition: "Aplicacion, panel, servicios y componentes digitales de CARVIPIX." },
      { term: "Licencia", definition: "Permiso limitado, revocable y no exclusivo para usar el software." },
      { term: "Actualizacion", definition: "Cambio, mejora o correccion del software y sus componentes." },
    ],
    scopeBullets: [
      "Autoriza el uso de la plataforma conforme al plan contratado y a sus limites.",
      "Protege la propiedad intelectual y la continuidad del producto.",
      "Permite dar claridad comercial sin encarecer la experiencia del usuario.",
    ],
    rightsBullets: [...commonRights, "Usar el software mientras mantenga la licencia vigente y cumpla la politica de uso aceptable."],
    obligationsBullets: [...commonObligations, "No copiar, descompilar o redistribuir el software sin autorizacion expresa."],
    proceduresBullets: [...commonProcedures, "Indicar como se gestionan actualizaciones, cambios de version y fin de licencia."],
    limitationsBullets: [...commonLimitations, "La licencia no transfiere propiedad ni concede derechos sobre marca, codigo o contenido."],
    responsibilitiesBullets: [...commonResponsibilities, "CARVIPIX debe mantener el software util, seguro y coherente con la licencia publicada."],
    law: "Ley Federal del Derecho de Autor, legislacion mexicana de propiedad intelectual y contratos de licencia de software.",
    contact: "legal@carvipix.com",
    historyNote: "Se crea el acuerdo de licencia para el software CARVIPIX v1.0.",
  }),
];

export const LEGAL_DRAFT_DOCUMENTS_V1 = LEGAL_DRAFT_CONTENTS_V1.map((item) => item.document);

function formatList(items: string[]): string {
  return items.map((item) => `- ${item}`).join("\n");
}

function formatDefinitions(items: Array<{ term: string; definition: string }>): string {
  return items.map((item) => `- **${item.term}**: ${item.definition}`).join("\n");
}

function renderSection(heading: string, paragraphs: string[], bullets?: string[]): string {
  const body = [...paragraphs.map((item) => `${item}\n`), bullets ? `${formatList(bullets)}\n` : ""].join("\n");
  return `## ${heading}\n\n${body.trim()}\n`;
}

export function renderLegalDraftMarkdown(draft: LegalDraftDocument): string {
  return [
    `# ${draft.title}`,
    ``,
    `- Version: ${draft.version}`,
    `- Fecha de entrada en vigor: ${draft.effectiveDate}`,
    `- Ultima actualizacion: ${draft.updatedAt}`,
    `- Estado: ${draft.status}`,
    `- Autor: ${draft.author}`,
    `- Ruta de plataforma: ${draft.route}`,
    ``,
    `## Indice`,
    ``,
    formatList([
      "Definiciones",
      "Alcance",
      "Derechos",
      "Obligaciones",
      "Procedimientos",
      "Limitaciones",
      "Responsabilidades",
      "Ley aplicable",
      "Contacto",
      "Historial de versiones",
    ]),
    ``,
    `## Resumen`,
    ``,
    draft.summary,
    ``,
    `## Definiciones`,
    ``,
    formatDefinitions(draft.definitions),
    ``,
    renderSection("Alcance", ["Este documento aplica a los usos, flujos y relaciones descritos para CARVIPIX."], draft.scopeBullets),
    renderSection("Derechos", ["Las partes conservan los derechos expresamente reconocidos por la ley y por este documento."], draft.rightsBullets),
    renderSection("Obligaciones", ["El uso de CARVIPIX se mantiene sujeto a las obligaciones descritas en este documento."], draft.obligationsBullets),
    renderSection("Procedimientos", ["Los procedimientos buscan mantener continuidad, transparencia y una experiencia comercial limpia."], draft.proceduresBullets),
    renderSection("Limitaciones", ["Las limitaciones de este documento se interpretan de forma razonable y proporcional al servicio."], draft.limitationsBullets),
    renderSection("Responsabilidades", ["La responsabilidad de CARVIPIX y del usuario se interpreta segun la naturaleza del servicio y la ley aplicable."], draft.responsibilitiesBullets),
    `## Ley aplicable\n\n${draft.law}\n`,
    `## Contacto\n\n${draft.contact}\n`,
    `## Historial de versiones\n\n${draft.history.map((item) => `- ${item.version} | ${item.date} | ${item.note}`).join("\n")}\n`,
    `## Estado de publicacion\n\n${draft.statusNote}\n`,
    draft.specialNotes.length ? `## Notas internas\n\n${formatList(draft.specialNotes)}\n` : "",
  ].join("\n");
}