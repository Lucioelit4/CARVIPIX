import "server-only";

export type CommunicationEmailType =
  | "account-welcome"
  | "account-verification"
  | "account-activated"
  | "account-password-reset"
  | "account-password-changed"
  | "account-email-changed"
  | "account-suspended"
  | "membership-purchase-success"
  | "membership-renewal-success"
  | "membership-payment-failed"
  | "membership-upcoming-charge"
  | "membership-expiring"
  | "membership-expired"
  | "membership-cancelled"
  | "membership-reactivated"
  | "trading-important-alert"
  | "trading-important-change"
  | "trading-maintenance"
  | "trading-market-closed"
  | "support-ticket-created"
  | "support-ticket-replied"
  | "support-ticket-closed"
  | "marketing-promotion"
  | "marketing-new-plans"
  | "marketing-new-features"
  | "marketing-newsletter"
  | "admin-policy-changed"
  | "admin-terms-changed"
  | "admin-legal-changed"
  | "admin-incident";

export type CommunicationEmailCopy = {
  type: CommunicationEmailType;
  category: "account" | "membership" | "trading" | "support" | "marketing" | "admin";
  subject: string;
  preheader: string;
  headline: string;
  body: string;
  ctaLabel?: string;
  legalNote: string;
};

export const COMMUNICATION_EMAIL_COPY_CATALOG: CommunicationEmailCopy[] = [
  {
    type: "account-welcome",
    category: "account",
    subject: "Bienvenido a CARVIPIX",
    preheader: "Tu cuenta fue creada correctamente.",
    headline: "Bienvenido a CARVIPIX",
    body: "Tu cuenta fue creada y ya puedes iniciar tu experiencia en la plataforma.",
    ctaLabel: "Ir a mi panel",
    legalNote: "Este mensaje es informativo de cuenta.",
  },
  {
    type: "account-verification",
    category: "account",
    subject: "Confirma tu correo en CARVIPIX",
    preheader: "Activa tu cuenta con un solo clic.",
    headline: "Verifica tu correo",
    body: "Para activar tu acceso, confirma tu direccion de correo con el enlace seguro.",
    ctaLabel: "Confirmar correo",
    legalNote: "Si no solicitaste esta cuenta, ignora este mensaje.",
  },
  {
    type: "account-activated",
    category: "account",
    subject: "Tu cuenta CARVIPIX ya esta activa",
    preheader: "Activacion completada con exito.",
    headline: "Cuenta activada",
    body: "La verificacion finalizo correctamente y tu acceso ya esta habilitado.",
    ctaLabel: "Entrar ahora",
    legalNote: "Notificacion automatica de seguridad y acceso.",
  },
  {
    type: "account-password-reset",
    category: "account",
    subject: "Restablece tu contrasena en CARVIPIX",
    preheader: "Se recibio una solicitud de recuperacion.",
    headline: "Recuperacion de contrasena",
    body: "Usa el enlace temporal para definir una nueva contrasena de forma segura.",
    ctaLabel: "Restablecer contrasena",
    legalNote: "Si no hiciste esta solicitud, ignora el correo.",
  },
  {
    type: "account-password-changed",
    category: "account",
    subject: "Tu contrasena fue actualizada",
    preheader: "Cambio de seguridad confirmado.",
    headline: "Contrasena actualizada",
    body: "Tu contrasena se modifico correctamente. Si no reconoces este cambio, contacta soporte inmediato.",
    legalNote: "Mensaje de seguridad obligatorio.",
  },
  {
    type: "account-email-changed",
    category: "account",
    subject: "Tu correo de acceso fue actualizado",
    preheader: "Cambio de correo confirmado.",
    headline: "Correo actualizado",
    body: "El correo principal de tu cuenta fue modificado. Revisa tu perfil para validar la informacion.",
    legalNote: "Notificacion de seguridad de cuenta.",
  },
  {
    type: "account-suspended",
    category: "account",
    subject: "Tu cuenta CARVIPIX fue suspendida",
    preheader: "Acceso temporalmente restringido.",
    headline: "Cuenta suspendida",
    body: "Detectamos una condicion que requiere revision manual. Tu acceso se encuentra temporalmente limitado.",
    ctaLabel: "Contactar soporte",
    legalNote: "Informacion sujeta a revision de politicas internas.",
  },
  {
    type: "membership-purchase-success",
    category: "membership",
    subject: "Compra confirmada y membresia activada",
    preheader: "Tu pago se proceso correctamente.",
    headline: "Membresia activada",
    body: "Recibimos tu pago y activamos tu plan. Ya puedes usar las funciones incluidas en tu membresia.",
    ctaLabel: "Ver membresia",
    legalNote: "Detalle fiscal y terminos en tu centro de facturacion.",
  },
  {
    type: "membership-renewal-success",
    category: "membership",
    subject: "Renovacion de membresia confirmada",
    preheader: "Tu acceso continua activo.",
    headline: "Renovacion exitosa",
    body: "La renovacion se proceso correctamente y tu plan continua activo sin interrupciones.",
    legalNote: "La siguiente fecha de cobro figura en tu panel.",
  },
  {
    type: "membership-payment-failed",
    category: "membership",
    subject: "No pudimos procesar tu pago de renovacion",
    preheader: "Requiere actualizacion de pago.",
    headline: "Pago fallido",
    body: "No fue posible completar el cobro de tu membresia. Actualiza tu metodo para evitar suspension.",
    ctaLabel: "Actualizar pago",
    legalNote: "No compartir datos sensibles por correo.",
  },
  {
    type: "membership-upcoming-charge",
    category: "membership",
    subject: "Recordatorio de proximo cobro",
    preheader: "Tu renovacion automatica se ejecutara pronto.",
    headline: "Proximo cobro",
    body: "Te recordamos la fecha de renovacion para que puedas validar tu metodo de pago.",
    legalNote: "Puedes administrar renovacion desde facturacion.",
  },
  {
    type: "membership-expiring",
    category: "membership",
    subject: "Tu membresia esta por vencer",
    preheader: "Evita interrupciones en tu acceso.",
    headline: "Membresia proxima a vencer",
    body: "Tu periodo actual esta por finalizar. Renueva a tiempo para mantener tus beneficios activos.",
    ctaLabel: "Renovar plan",
    legalNote: "Condiciones de renovacion sujetas a politicas vigentes.",
  },
  {
    type: "membership-expired",
    category: "membership",
    subject: "Tu membresia vencio",
    preheader: "Algunas funciones se limitaron.",
    headline: "Membresia vencida",
    body: "Tu plan vencio y algunas funciones premium quedaron restringidas hasta reactivacion.",
    ctaLabel: "Reactivar membresia",
    legalNote: "Los datos historicos se conservan segun politicas activas.",
  },
  {
    type: "membership-cancelled",
    category: "membership",
    subject: "Cancelacion de renovacion confirmada",
    preheader: "Tu suscripcion no se renovara automaticamente.",
    headline: "Cancelacion confirmada",
    body: "Desactivamos tu renovacion automatica. Tu acceso se mantiene hasta el fin del periodo pagado.",
    legalNote: "Puedes reactivar cuando quieras desde tu panel.",
  },
  {
    type: "membership-reactivated",
    category: "membership",
    subject: "Tu membresia fue reactivada",
    preheader: "Acceso premium restaurado.",
    headline: "Membresia reactivada",
    body: "Tu plan vuelve a estar activo y ya tienes acceso completo a las funciones habilitadas.",
    ctaLabel: "Entrar al dashboard",
    legalNote: "Aplican terminos y politicas vigentes.",
  },
  {
    type: "trading-important-alert",
    category: "trading",
    subject: "Alerta importante de operativa",
    preheader: "Revisa este aviso en tu panel.",
    headline: "Alerta importante",
    body: "Se genero una alerta relevante para tu seguimiento operativo en CARVIPIX.",
    ctaLabel: "Ver alerta",
    legalNote: "No constituye recomendacion garantizada de resultado.",
  },
  {
    type: "trading-important-change",
    category: "trading",
    subject: "Cambio importante en operativa",
    preheader: "Actualizacion relevante para usuarios.",
    headline: "Cambio importante",
    body: "Aplicamos una actualizacion clave en la operativa o reglas de plataforma.",
    legalNote: "Consulta la nota completa en tu panel.",
  },
  {
    type: "trading-maintenance",
    category: "trading",
    subject: "Mantenimiento programado",
    preheader: "Ventana temporal de servicio.",
    headline: "Mantenimiento de plataforma",
    body: "Tendremos una ventana de mantenimiento que podria afectar funciones temporalmente.",
    legalNote: "Trabajamos para reducir impacto en servicio.",
  },
  {
    type: "trading-market-closed",
    category: "trading",
    subject: "Mercado cerrado - aviso",
    preheader: "Actualizacion de disponibilidad operativa.",
    headline: "Mercado cerrado",
    body: "Durante cierre de mercado, la generacion de alertas puede pausar o reducirse.",
    legalNote: "Las condiciones dependen del calendario del mercado.",
  },
  {
    type: "support-ticket-created",
    category: "support",
    subject: "Recibimos tu ticket de soporte",
    preheader: "Tu caso fue registrado correctamente.",
    headline: "Ticket creado",
    body: "Tu solicitud fue registrada y nuestro equipo la revisara segun prioridad.",
    ctaLabel: "Ver ticket",
    legalNote: "No compartas credenciales en respuestas por correo.",
  },
  {
    type: "support-ticket-replied",
    category: "support",
    subject: "Tu ticket tiene una respuesta",
    preheader: "Hay una actualizacion de soporte.",
    headline: "Respuesta de soporte",
    body: "Nuestro equipo agrego una respuesta en tu ticket. Revisa los detalles en plataforma.",
    ctaLabel: "Abrir ticket",
    legalNote: "Este correo solo informa estado del caso.",
  },
  {
    type: "support-ticket-closed",
    category: "support",
    subject: "Tu ticket fue cerrado",
    preheader: "Caso finalizado por soporte.",
    headline: "Ticket cerrado",
    body: "Marcamos tu caso como resuelto. Si necesitas mas ayuda, puedes crear uno nuevo.",
    legalNote: "Gracias por contactarnos.",
  },
  {
    type: "marketing-promotion",
    category: "marketing",
    subject: "Nueva promocion CARVIPIX",
    preheader: "Oferta disponible por tiempo limitado.",
    headline: "Promocion activa",
    body: "Tenemos una promocion especial para ti con condiciones y vigencia definidas.",
    ctaLabel: "Ver promocion",
    legalNote: "Puedes cancelar suscripcion comercial cuando quieras.",
  },
  {
    type: "marketing-new-plans",
    category: "marketing",
    subject: "Conoce los nuevos planes CARVIPIX",
    preheader: "Actualizacion comercial disponible.",
    headline: "Nuevos planes",
    body: "Lanzamos nuevas opciones de plan para ajustarse a distintos perfiles de usuario.",
    ctaLabel: "Comparar planes",
    legalNote: "Precios y beneficios pueden variar por vigencia comercial.",
  },
  {
    type: "marketing-new-features",
    category: "marketing",
    subject: "Nuevas funciones disponibles",
    preheader: "Mejoras importantes en plataforma.",
    headline: "Nuevas funciones",
    body: "Liberamos mejoras y nuevas funciones para elevar tu experiencia en CARVIPIX.",
    ctaLabel: "Explorar novedades",
    legalNote: "Disponibilidad de funciones segun plan y estado de membresia.",
  },
  {
    type: "marketing-newsletter",
    category: "marketing",
    subject: "Boletin CARVIPIX",
    preheader: "Resumen de novedades y actualizaciones.",
    headline: "Newsletter semanal",
    body: "Compartimos noticias, mejoras y contenido relevante sobre la plataforma.",
    ctaLabel: "Leer boletin",
    legalNote: "Comunicacion comercial sujeta a preferencias del usuario.",
  },
  {
    type: "admin-policy-changed",
    category: "admin",
    subject: "Actualizacion de politicas CARVIPIX",
    preheader: "Cambios aplicables a usuarios activos.",
    headline: "Politicas actualizadas",
    body: "Actualizamos politicas operativas y de servicio. Revisa los cambios publicados.",
    ctaLabel: "Ver politicas",
    legalNote: "La continuidad de uso implica aceptacion de politicas vigentes.",
  },
  {
    type: "admin-terms-changed",
    category: "admin",
    subject: "Actualizacion de terminos y condiciones",
    preheader: "Version legal publicada.",
    headline: "Terminos actualizados",
    body: "Se publico una nueva version de terminos y condiciones con fecha de vigencia.",
    ctaLabel: "Leer terminos",
    legalNote: "Consulta siempre la ultima version publicada.",
  },
  {
    type: "admin-legal-changed",
    category: "admin",
    subject: "Cambio legal relevante",
    preheader: "Documentacion legal actualizada.",
    headline: "Cambio legal",
    body: "Actualizamos documentos legales asociados al uso de la plataforma.",
    ctaLabel: "Revisar cambios",
    legalNote: "Versionado legal disponible en el centro legal.",
  },
  {
    type: "admin-incident",
    category: "admin",
    subject: "Aviso de incidente operativo",
    preheader: "Informacion importante del servicio.",
    headline: "Incidente informado",
    body: "Estamos gestionando un incidente y compartimos estado para total transparencia.",
    ctaLabel: "Ver estado",
    legalNote: "Seguimiento oficial desde canales de soporte y estado.",
  },
];
