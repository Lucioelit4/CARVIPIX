import { COMMERCIAL_PLAN_ENTITLEMENTS, COMMERCIAL_PRODUCTS } from "@/app/lib/commercial/business-model";

export type OfficialKnowledgeCategory =
  | "empresa"
  | "alertas"
  | "bot"
  | "membresias"
  | "pagos"
  | "facturacion"
  | "gestion-capital"
  | "fondeo"
  | "resultados"
  | "comunidad"
  | "soporte"
  | "problemas-tecnicos"
  | "cuenta"
  | "seguridad"
  | "legal"
  | "administracion";

export type UserSegment =
  | "visitante"
  | "miembro-basico"
  | "miembro-pro"
  | "usuario-bot"
  | "gestion-capital"
  | "administrador";

export type OfficialFaqItem = {
  id: string;
  question: string;
  answer: string;
  category: OfficialKnowledgeCategory;
  popularity: number;
  keywords: string[];
  metadata: KnowledgeDocumentMetadata;
};

export type KnowledgeDocumentStatus = "Activo" | "Borrador" | "Obsoleto";

export type KnowledgeQueryClassification =
  | "informacion-oficial"
  | "informacion-comercial"
  | "informacion-tecnica"
  | "informacion-legal"
  | "intervencion-humana";

export type KnowledgeDocumentMetadata = {
  version: string;
  updatedAt: string;
  author: string;
  status: KnowledgeDocumentStatus;
  relatedModules: OfficialKnowledgeCategory[];
};

export type SupportEscalation = {
  shouldEscalate: boolean;
  reason: string | null;
  category: string;
  priority: "low" | "medium" | "high";
};

export type ResolutionResult = {
  answer: string;
  confidence: "high" | "medium" | "low";
  intentId: string | null;
  category: OfficialKnowledgeCategory | null;
  queryClassification: KnowledgeQueryClassification;
  requiresHumanIntervention: boolean;
  knowledgeVersion: string;
  shouldEscalate: boolean;
  escalationReason?: string;
  escalationCategory?: string;
  escalationPriority?: "low" | "medium" | "high";
  officialSources: string[];
};

type ResolverInput = {
  question: string;
  segment: UserSegment;
  plan: "free" | "basic" | "advanced";
  hasMembership: boolean;
  services: {
    bot: boolean;
    capital: boolean;
  };
  history: Array<{ role: "user" | "assistant"; content: string }>;
  lastIntentId: string | null;
};

type KnowledgeIntent = {
  id: string;
  category: OfficialKnowledgeCategory;
  title: string;
  keywords: string[];
  responseBySegment?: Partial<Record<UserSegment, string>>;
  defaultResponse: string;
  metadata: KnowledgeDocumentMetadata;
};

const KNOWLEDGE_DEFAULT_VERSION = "2.0.0";
const KNOWLEDGE_DEFAULT_AUTHOR = "CARVIPIX Knowledge Ops";
const KNOWLEDGE_DEFAULT_UPDATED_AT = "2026-07-12T00:00:00.000Z";

const planProducts = COMMERCIAL_PRODUCTS.filter((product) => product.planCode && product.status === "active");

const planSummary = planProducts
  .map((product) => `${product.name}: ${product.priceUsd === null ? "N/D" : `$${product.priceUsd.toFixed(2)} ${product.currency}`}`)
  .join(". ");

const modules: Record<OfficialKnowledgeCategory, { title: string; scope: string }> = {
  empresa: {
    title: "Empresa",
    scope: "Informacion oficial de plataforma, alcance y servicios activos.",
  },
  alertas: {
    title: "Alertas",
    scope: "Reglas operativas, limites por plan y comportamiento esperado de alertas.",
  },
  bot: {
    title: "Bot",
    scope: "Licencia, descarga, instalacion guiada, activacion y soporte tecnico del bot.",
  },
  membresias: {
    title: "Membresias",
    scope: "Estados de membresia, vigencia, renovacion y acceso.",
  },
  pagos: {
    title: "Pagos",
    scope: "Cobros, rechazos, renovaciones y validaciones de pago.",
  },
  facturacion: {
    title: "Facturacion",
    scope: "Datos fiscales y estado de facturacion del usuario.",
  },
  "gestion-capital": {
    title: "Gestion de Capital",
    scope: "Flujo de solicitud, estado y seguimiento de gestion de capital.",
  },
  fondeo: {
    title: "Programa de Fondeo",
    scope: "Estado comercial del programa y disponibilidad oficial.",
  },
  resultados: {
    title: "Resultados",
    scope: "Reportes de operaciones, historial y limites de interpretacion.",
  },
  comunidad: {
    title: "Comunidad",
    scope: "Reglas de canales, moderacion y permisos de participacion.",
  },
  soporte: {
    title: "Soporte",
    scope: "Atencion, tickets, escalaciones y tiempos de respuesta esperados.",
  },
  "problemas-tecnicos": {
    title: "Problemas Tecnicos",
    scope: "Errores de acceso, conectividad, degradacion de servicios y pasos de soporte.",
  },
  cuenta: {
    title: "Cuenta",
    scope: "Sesion, verificacion, perfil y controles de acceso.",
  },
  seguridad: {
    title: "Seguridad",
    scope: "Buenas practicas, privacidad y no exposicion de informacion sensible.",
  },
  legal: {
    title: "Legal",
    scope: "Terminos y documentos oficiales publicados por CARVIPIX.",
  },
  administracion: {
    title: "Administracion",
    scope: "Casos de gestion por equipo interno y panel administrativo.",
  },
};

function buildMetadata(primaryModule: OfficialKnowledgeCategory, extraModules: OfficialKnowledgeCategory[] = []): KnowledgeDocumentMetadata {
  return {
    version: KNOWLEDGE_DEFAULT_VERSION,
    updatedAt: KNOWLEDGE_DEFAULT_UPDATED_AT,
    author: KNOWLEDGE_DEFAULT_AUTHOR,
    status: "Activo",
    relatedModules: Array.from(new Set([primaryModule, ...extraModules])),
  };
}

function compareVersions(left: string, right: string): number {
  const leftParts = left.split(".").map((part) => Number(part) || 0);
  const rightParts = right.split(".").map((part) => Number(part) || 0);
  const max = Math.max(leftParts.length, rightParts.length);

  for (let index = 0; index < max; index += 1) {
    const l = leftParts[index] ?? 0;
    const r = rightParts[index] ?? 0;
    if (l > r) return 1;
    if (l < r) return -1;
  }

  return 0;
}

function isPreferredDocumentVersion(current: KnowledgeDocumentMetadata, previous: KnowledgeDocumentMetadata): boolean {
  const versionComparison = compareVersions(current.version, previous.version);
  if (versionComparison !== 0) {
    return versionComparison > 0;
  }

  return new Date(current.updatedAt).getTime() >= new Date(previous.updatedAt).getTime();
}

function keepLatestActiveDocuments<T extends { id: string; metadata: KnowledgeDocumentMetadata }>(items: T[]): T[] {
  const latestById = new Map<string, T>();

  items.forEach((item) => {
    if (item.metadata.status !== "Activo") {
      return;
    }

    const previous = latestById.get(item.id);
    if (!previous || isPreferredDocumentVersion(item.metadata, previous.metadata)) {
      latestById.set(item.id, item);
    }
  });

  return Array.from(latestById.values());
}

const rawIntents: Array<Omit<KnowledgeIntent, "metadata">> = [
  {
    id: "empresa-overview",
    category: "empresa",
    title: "Como funciona CARVIPIX",
    keywords: ["carvipix", "como funciona", "plataforma", "servicio", "empresa"],
    defaultResponse:
      "CARVIPIX integra alertas, membresias, bot, resultados, comunidad y soporte sobre una plataforma unificada. El acceso y funcionalidades dependen del plan y estado de membresia.",
    responseBySegment: {
      visitante:
        "Como visitante puedes consultar informacion publica y planes. Las funciones operativas privadas se habilitan con cuenta y membresia activa.",
    },
  },
  {
    id: "membresias-planes",
    category: "membresias",
    title: "Planes y diferencias",
    keywords: ["plan", "planes", "diferencia", "precio", "basic", "pro", "membresia"],
    defaultResponse: `Planes oficiales activos: ${planSummary}.`,
    responseBySegment: {
      "miembro-basico":
        `Tu plan BASIC usa limites oficiales: alertas ${COMMERCIAL_PLAN_ENTITLEMENTS.basic.maxAlertsPerDay}/dia, pares ${COMMERCIAL_PLAN_ENTITLEMENTS.basic.maxPairs}, bots ${COMMERCIAL_PLAN_ENTITLEMENTS.basic.maxBots}.`,
      "miembro-pro":
        `Tu plan PRO usa limites oficiales: alertas ${COMMERCIAL_PLAN_ENTITLEMENTS.advanced.maxAlertsPerDay}/dia, pares ${COMMERCIAL_PLAN_ENTITLEMENTS.advanced.maxPairs}, bots ${COMMERCIAL_PLAN_ENTITLEMENTS.advanced.maxBots}.`,
    },
  },
  {
    id: "alertas-limites",
    category: "alertas",
    title: "Alertas y actividad diaria",
    keywords: ["alerta", "alertas", "senal", "senales", "hoy no hubo", "mercado", "pares"],
    defaultResponse:
      "Las alertas dependen de condiciones reales de mercado y del plan. Que un dia no haya alertas puede ser comportamiento normal si no hay setups validos segun el motor.",
  },
  {
    id: "pagos-renovacion",
    category: "pagos",
    title: "Pagos y renovaciones",
    keywords: ["pago", "renovacion", "paypal", "rechazo", "cobro", "metodo de pago"],
    defaultResponse:
      "Pagos y renovaciones se gestionan en el centro de facturacion. Si hay rechazo de pago, el estado puede pasar a suspendido hasta regularizar.",
  },
  {
    id: "facturacion-datos",
    category: "facturacion",
    title: "Facturacion",
    keywords: ["factura", "facturacion", "rfc", "fiscal", "correo fiscal"],
    defaultResponse:
      "Puedes actualizar datos fiscales desde tu centro de facturacion. La informacion fiscal se valida y guarda por usuario autenticado.",
  },
  {
    id: "bot-licencia",
    category: "bot",
    title: "Bot CARVIPIX",
    keywords: ["bot", "licencia", "mt4", "mt5", "conexion", "error bot"],
    defaultResponse:
      "Bot CARVIPIX se ofrece como producto descargable con licencia de pago unico. Tras el pago se prepara entrega de licencia, recursos de instalacion y soporte de activacion.",
    responseBySegment: {
      "usuario-bot": "Como usuario bot, verifica licencia activa, estado de entrega del paquete, instalacion MT4/MT5 y conexion broker. Si falla, se escala a soporte tecnico bot.",
    },
  },
  {
    id: "capital-gestion",
    category: "gestion-capital",
    title: "Gestion de capital",
    keywords: ["capital", "gestion", "cuenta gestionada", "solicitud", "capital request"],
    defaultResponse:
      "Gestion de Capital opera con flujo de solicitud, revision, aprobacion y seguimiento desde panel del cliente.",
    responseBySegment: {
      "gestion-capital": "Tienes flujo de gestion de capital activo; cualquier conflicto de estado o contrato debe escalarse por ticket de alta prioridad.",
    },
  },
  {
    id: "fondeo-status",
    category: "fondeo",
    title: "Programa de fondeo",
    keywords: ["fondeo", "cuenta fondeada", "funded", "programa"],
    defaultResponse:
      "El programa de fondeo existe como infraestructura preparada y su disponibilidad comercial depende del estado oficial publicado.",
  },
  {
    id: "resultados-riesgo",
    category: "resultados",
    title: "Resultados y riesgo",
    keywords: ["resultado", "win rate", "perdi", "perdi una operacion", "rendimiento", "drawdown", "riesgo"],
    defaultResponse:
      "Los resultados historicos no garantizan resultados futuros. CARVIPIX no promete rentabilidad y toda operacion conlleva riesgo.",
  },
  {
    id: "cuenta-acceso",
    category: "cuenta",
    title: "Cuenta y acceso",
    keywords: ["acceso", "login", "no puedo entrar", "correo", "contrasena", "verificacion", "sesion"],
    defaultResponse:
      "Para problemas de acceso valida credenciales y estado de sesion. Si persiste, se recomienda escalar por ticket tecnico.",
  },
  {
    id: "seguridad-privacidad",
    category: "seguridad",
    title: "Seguridad",
    keywords: ["seguridad", "token", "clave", "privado", "datos", "otro usuario"],
    defaultResponse:
      "Por seguridad, no se muestran tokens, claves ni informacion privada de otros usuarios. Solo se responde con datos permitidos y oficiales.",
  },
  {
    id: "legal-docs",
    category: "legal",
    title: "Legal",
    keywords: ["legal", "terminos", "privacidad", "riesgo", "cookies", "reembolso", "cancelacion"],
    defaultResponse:
      "Temas legales se responden exclusivamente con base en documentos oficiales publicados por CARVIPIX (Legal, Terminos, Privacidad, Riesgos, Cancelacion y Reembolsos).",
  },
  {
    id: "comunidad-reglas",
    category: "comunidad",
    title: "Comunidad",
    keywords: ["comunidad", "chat", "canal", "moderacion", "reportar", "spam"],
    defaultResponse:
      "La comunidad mantiene canales por membresia, moderacion activa y reportes de seguridad. Mensajes ofensivos, spam y enlaces peligrosos son bloqueados.",
  },
  {
    id: "soporte-tickets",
    category: "soporte",
    title: "Soporte y tickets",
    keywords: ["ticket", "soporte", "escalar", "ayuda", "administrador", "prioridad"],
    defaultResponse:
      "Cuando la respuesta no es segura o hay incidencia tecnica/comercial, se crea ticket para revision humana con prioridad y trazabilidad.",
    responseBySegment: {
      administrador:
        "Como administrador, puedes revisar y actualizar tickets desde panel comercial, incluyendo estado y respuesta administrativa.",
    },
  },
];

const intents: KnowledgeIntent[] = rawIntents.map((intent) => ({
  ...intent,
  metadata: buildMetadata(intent.category, ["soporte"]),
}));

const rawFaq: Array<Omit<OfficialFaqItem, "metadata">> = [
  {
    id: "faq-1",
    question: "Como funciona CARVIPIX?",
    answer: "CARVIPIX integra alertas, membresias, bot, resultados, comunidad y soporte con permisos segun plan y estado de membresia.",
    category: "empresa",
    popularity: 95,
    keywords: ["carvipix", "funciona", "plataforma"],
  },
  {
    id: "faq-2",
    question: "Como recibo una alerta?",
    answer: "Las alertas se publican segun condiciones reales de mercado y disponibilidad del servicio para tu plan.",
    category: "alertas",
    popularity: 91,
    keywords: ["recibo", "alerta", "senal"],
  },
  {
    id: "faq-3",
    question: "Por que hoy no hubo alertas?",
    answer: "Puede no haber alertas si no se cumplen setups validos del motor durante la sesion.",
    category: "alertas",
    popularity: 88,
    keywords: ["hoy", "no hubo", "alertas"],
  },
  {
    id: "faq-4",
    question: "Las alertas garantizan ganancias?",
    answer: "No. CARVIPIX no garantiza ganancias ni elimina el riesgo de mercado.",
    category: "legal",
    popularity: 93,
    keywords: ["garantizan", "ganancias", "riesgo"],
  },
  {
    id: "faq-5",
    question: "Cuanto riesgo tiene el trading?",
    answer: "El trading tiene riesgo significativo, incluida perdida de capital. Debes operar con gestion de riesgo.",
    category: "resultados",
    popularity: 84,
    keywords: ["riesgo", "trading", "perdida"],
  },
  {
    id: "faq-6",
    question: "Como cancelo mi membresia?",
    answer: "Puedes desactivar renovacion automatica desde facturacion y, si necesitas apoyo, abrir ticket de seguimiento.",
    category: "membresias",
    popularity: 79,
    keywords: ["cancelo", "membresia", "renovacion"],
  },
  {
    id: "faq-7",
    question: "Como actualizo mi metodo de pago?",
    answer: "Gestiona tu metodo desde facturacion/PayPal segun proveedor disponible de tu cuenta.",
    category: "pagos",
    popularity: 83,
    keywords: ["actualizo", "metodo", "pago", "paypal"],
  },
  {
    id: "faq-8",
    question: "Por que PayPal rechazo mi pago?",
    answer: "Un rechazo puede deberse a validaciones del proveedor. Debes revisar el intento y abrir ticket si persiste.",
    category: "pagos",
    popularity: 82,
    keywords: ["paypal", "rechazo", "pago"],
  },
  {
    id: "faq-9",
    question: "Que ocurre si vence mi membresia?",
    answer: "El estado puede pasar a expirado o suspendido y se limitan funciones premium hasta regularizar.",
    category: "membresias",
    popularity: 76,
    keywords: ["vence", "membresia", "expirado"],
  },
  {
    id: "faq-10",
    question: "Que pasa si pierdo una operacion?",
    answer: "Una perdida es posible en mercado real. CARVIPIX no garantiza resultados y recomienda gestion de riesgo.",
    category: "resultados",
    popularity: 71,
    keywords: ["pierdo", "operacion", "perdida"],
  },
  {
    id: "faq-11",
    question: "Cuantas alertas recibire?",
    answer:
      `Depende del plan. FREE: ${COMMERCIAL_PLAN_ENTITLEMENTS.free.maxAlertsPerDay}, BASIC: ${COMMERCIAL_PLAN_ENTITLEMENTS.basic.maxAlertsPerDay}, PRO: ${COMMERCIAL_PLAN_ENTITLEMENTS.advanced.maxAlertsPerDay}.`,
    category: "alertas",
    popularity: 89,
    keywords: ["cuantas", "alertas", "plan"],
  },
  {
    id: "faq-12",
    question: "Que diferencia existe entre los planes?",
    answer: planSummary,
    category: "membresias",
    popularity: 90,
    keywords: ["diferencia", "planes", "precio"],
  },
  {
    id: "faq-13",
    question: "Que incluye exactamente cada plan?",
    answer: "Cada plan define limites oficiales de alertas, pares, bots e historial. Consulta plan BASIC/PRO en catalogo oficial.",
    category: "membresias",
    popularity: 87,
    keywords: ["incluye", "plan", "exactamente"],
  },
  {
    id: "faq-14",
    question: "Como funciona el Bot?",
    answer: "El Bot se compra como producto descargable: recibes licencia, recursos de instalacion y soporte para dejarlo listo en MT4/MT5.",
    category: "bot",
    popularity: 80,
    keywords: ["bot", "funciona", "licencia"],
  },
  {
    id: "faq-15",
    question: "Que pasa si mi internet falla?",
    answer: "Una falla de conectividad puede afectar operativa y sincronizacion. Debes restablecer conexion y reportar si persiste.",
    category: "problemas-tecnicos",
    popularity: 68,
    keywords: ["internet", "falla", "conexion"],
  },
  {
    id: "faq-16",
    question: "Como contacto soporte?",
    answer: "Puedes usar el asistente y crear ticket con categoria/prioridad para seguimiento administrativo.",
    category: "soporte",
    popularity: 75,
    keywords: ["contacto", "soporte", "ticket"],
  },
  {
    id: "faq-17",
    question: "Como reporto un problema?",
    answer: "Desde soporte puedes abrir ticket. En comunidad puedes reportar mensajes para revision de moderacion.",
    category: "soporte",
    popularity: 74,
    keywords: ["reporto", "problema", "ticket", "comunidad"],
  },
  {
    id: "faq-18",
    question: "Que mercados opera CARVIPIX?",
    answer: "Los activos habilitados dependen de plan y de la configuracion operativa oficial disponible.",
    category: "empresa",
    popularity: 61,
    keywords: ["mercados", "opera", "activos"],
  },
  {
    id: "faq-19",
    question: "Que sucede durante noticias economicas?",
    answer: "Durante eventos de alta volatilidad puede cambiar la frecuencia de alertas por control de riesgo del motor.",
    category: "alertas",
    popularity: 64,
    keywords: ["noticias", "economicas", "volatilidad"],
  },
  {
    id: "faq-20",
    question: "Como protegen mi cuenta y mis datos?",
    answer: "CARVIPIX aplica controles de sesion y politicas de seguridad. No expone tokens, claves ni datos de otros usuarios.",
    category: "seguridad",
    popularity: 58,
    keywords: ["seguridad", "datos", "cuenta"],
  },
];

export const OFFICIAL_FAQ: OfficialFaqItem[] = rawFaq.map((faq) => ({
  ...faq,
  metadata: buildMetadata(faq.category, ["soporte"]),
}));

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function includesKeyword(text: string, keyword: string): boolean {
  const normalizedText = normalizeText(text);
  const normalizedKeyword = normalizeText(keyword);
  return normalizedText.includes(normalizedKeyword);
}

function scoreIntent(text: string, intent: KnowledgeIntent, lastIntentId: string | null): number {
  const baseScore = intent.keywords.reduce((acc, keyword) => (includesKeyword(text, keyword) ? acc + 1 : acc), 0);
  if (lastIntentId && lastIntentId === intent.id) {
    return baseScore + 0.5;
  }
  return baseScore;
}

function legalQuestionWithoutOfficialGrounding(question: string, bestIntent: KnowledgeIntent | null): boolean {
  const legalKeywords = ["demanda", "ilegal", "juicio", "responsabilidad legal", "contrato legal", "evasiones", "impuestos"];
  const hasLegal = legalKeywords.some((keyword) => includesKeyword(question, keyword));
  return hasLegal && bestIntent?.category !== "legal";
}

export function detectEscalation(question: string): SupportEscalation {
  const normalized = normalizeText(question);

  if (!normalized) {
    return { shouldEscalate: false, reason: null, category: "general", priority: "low" };
  }

  if (["error", "falla", "caido", "bug", "no funciona"].some((entry) => normalized.includes(entry))) {
    return { shouldEscalate: true, reason: "Posible error tecnico", category: "tecnico", priority: "high" };
  }

  if (["rechazo", "pago fallido", "cobro duplicado", "paypal"].some((entry) => normalized.includes(entry))) {
    return { shouldEscalate: true, reason: "Incidencia de pago", category: "pagos", priority: "high" };
  }

  if (["membresia", "suspendido", "expirado", "cancelado"].some((entry) => normalized.includes(entry))) {
    return { shouldEscalate: true, reason: "Conflicto de membresia", category: "membresias", priority: "medium" };
  }

  if (["bot", "mt4", "mt5", "licencia"].some((entry) => normalized.includes(entry)) && normalized.includes("error")) {
    return { shouldEscalate: true, reason: "Error de bot", category: "bot", priority: "high" };
  }

  if (["no puedo entrar", "no puedo acceder", "login", "acceso"].some((entry) => normalized.includes(entry))) {
    return { shouldEscalate: true, reason: "Problema de acceso", category: "acceso", priority: "high" };
  }

  return { shouldEscalate: false, reason: null, category: "general", priority: "low" };
}

function activeIntents(): KnowledgeIntent[] {
  return keepLatestActiveDocuments(intents);
}

function activeFaq(): OfficialFaqItem[] {
  return keepLatestActiveDocuments(OFFICIAL_FAQ);
}

export function getActiveKnowledgeVersion(): string {
  const activeDocs = [...activeIntents(), ...activeFaq()];
  const latest = activeDocs.reduce<KnowledgeDocumentMetadata | null>((acc, doc) => {
    if (!acc) return doc.metadata;
    return isPreferredDocumentVersion(doc.metadata, acc) ? doc.metadata : acc;
  }, null);

  return latest?.version ?? KNOWLEDGE_DEFAULT_VERSION;
}

function classifyKnowledgeQuery(input: {
  intent: KnowledgeIntent | null;
  requiresHumanIntervention: boolean;
}): KnowledgeQueryClassification {
  if (input.requiresHumanIntervention) {
    return "intervencion-humana";
  }

  const category = input.intent?.category;
  if (!category) {
    return "informacion-oficial";
  }

  if (category === "legal") {
    return "informacion-legal";
  }

  if (["membresias", "pagos", "facturacion", "gestion-capital", "fondeo"].includes(category)) {
    return "informacion-comercial";
  }

  if (["bot", "problemas-tecnicos", "cuenta"].includes(category)) {
    return "informacion-tecnica";
  }

  return "informacion-oficial";
}

export function searchOfficialFaq(input: {
  query?: string;
  category?: OfficialKnowledgeCategory | "all";
  limit?: number;
  popularOnly?: boolean;
}): OfficialFaqItem[] {
  const query = normalizeText(input.query ?? "");
  const category = input.category ?? "all";
  const limit = Math.max(1, Math.min(100, input.limit ?? 30));

  const activeFaqItems = activeFaq();
  const filteredByCategory = activeFaqItems.filter((item) => (category === "all" ? true : item.category === category));
  const base = input.popularOnly ? filteredByCategory.filter((item) => item.popularity >= 80) : filteredByCategory;

  const scored = base
    .map((item) => {
      if (!query) {
        return { item, score: item.popularity / 100 };
      }

      const qMatch = includesKeyword(item.question, query) ? 3 : 0;
      const aMatch = includesKeyword(item.answer, query) ? 1.5 : 0;
      const keywordScore = item.keywords.reduce((acc, keyword) => (query.includes(normalizeText(keyword)) ? acc + 1 : acc), 0);
      return {
        item,
        score: qMatch + aMatch + keywordScore + item.popularity / 200,
      };
    })
    .filter((entry) => (query ? entry.score > 0.2 : true))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.item);

  return scored;
}

export function relatedFaq(questionId: string, limit = 4): OfficialFaqItem[] {
  const activeFaqItems = activeFaq();
  const source = activeFaqItems.find((item) => item.id === questionId);
  if (!source) {
    return [];
  }

  const sourceKeywords = new Set(source.keywords.map((item) => normalizeText(item)));

  return activeFaqItems
    .filter((item) => item.id !== source.id)
    .map((item) => {
      const overlap = item.keywords.reduce((acc, keyword) => (sourceKeywords.has(normalizeText(keyword)) ? acc + 1 : acc), 0);
      const sameCategory = item.category === source.category ? 0.7 : 0;
      return { item, score: overlap + sameCategory };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.item);
}

function segmentPostfix(input: ResolverInput): string {
  if (input.segment === "visitante") {
    return "Como visitante solo se muestra informacion publica oficial; para soporte privado y tickets debes iniciar sesion.";
  }

  if (input.segment === "administrador") {
    return "Perfil detectado: administrador. Puedes escalar y gestionar trazabilidad desde el panel administrativo.";
  }

  if (input.segment === "usuario-bot") {
    return "Perfil detectado: usuario Bot. Respuesta ajustada a soporte de licencia y conectividad del bot.";
  }

  if (input.segment === "gestion-capital") {
    return "Perfil detectado: gestion de capital. Respuesta ajustada al flujo de solicitudes y estado de gestion.";
  }

  if (input.plan === "advanced") {
    return "Perfil detectado: miembro Pro con servicios premium habilitados segun estado de membresia.";
  }

  if (input.plan === "basic") {
    return "Perfil detectado: miembro Basic con limites oficiales de su plan.";
  }

  return "Perfil detectado: cuenta sin membresia premium activa.";
}

export function resolveOfficialAnswer(input: ResolverInput): ResolutionResult {
  const normalized = normalizeText(input.question);
  const knowledgeVersion = getActiveKnowledgeVersion();

  if (!normalized) {
    return {
      answer: "Describe tu duda para responder con informacion oficial de CARVIPIX.",
      confidence: "low",
      intentId: null,
      category: null,
      queryClassification: "informacion-oficial",
      requiresHumanIntervention: false,
      knowledgeVersion,
      shouldEscalate: false,
      officialSources: [],
    };
  }

  const best = activeIntents()
    .map((intent) => ({ intent, score: scoreIntent(normalized, intent, input.lastIntentId) }))
    .sort((a, b) => b.score - a.score)[0] ?? null;

  const escalationSignal = detectEscalation(input.question);

  if (!best || best.score <= 0) {
    const fallbackEscalation = escalationSignal.shouldEscalate ? escalationSignal : {
      shouldEscalate: true,
      reason: "Consulta fuera del conocimiento oficial",
      category: "ai-escalation",
      priority: "high" as const,
    };

    return {
      answer:
        "No tengo una respuesta oficial suficiente para esta consulta. Para evitar informacion incorrecta, debo escalar el caso a soporte humano.",
      confidence: "low",
      intentId: null,
      category: null,
      queryClassification: "intervencion-humana",
      requiresHumanIntervention: true,
      knowledgeVersion,
      shouldEscalate: true,
      escalationReason: fallbackEscalation.reason ?? "Consulta fuera del conocimiento oficial",
      escalationCategory: fallbackEscalation.category,
      escalationPriority: fallbackEscalation.priority,
      officialSources: [],
    };
  }

  if (legalQuestionWithoutOfficialGrounding(input.question, best.intent)) {
    return {
      answer:
        "Solo puedo responder temas legales usando documentos oficiales publicados por CARVIPIX. Esta consulta requiere revision humana para evitar interpretaciones no oficiales.",
      confidence: "low",
      intentId: best.intent.id,
      category: "legal",
      queryClassification: "intervencion-humana",
      requiresHumanIntervention: true,
      knowledgeVersion,
      shouldEscalate: true,
      escalationReason: "Tema legal fuera de documento oficial",
      escalationCategory: "legal",
      escalationPriority: "high",
      officialSources: [modules.legal.title],
    };
  }

  const responseBySegment = best.intent.responseBySegment?.[input.segment];
  const baseResponse = responseBySegment || best.intent.defaultResponse;
  const sources = [modules[best.intent.category].title];

  let confidence: "high" | "medium" | "low" = "high";
  if (best.score < 2) {
    confidence = "medium";
  }

  if (normalized.includes("garantia") || normalized.includes("ganancia asegurada")) {
    return {
      answer:
        "CARVIPIX no garantiza rentabilidad ni resultados. Cualquier decision operativa implica riesgo de mercado.",
      confidence: "high",
      intentId: "resultados-riesgo",
      category: "resultados",
      queryClassification: "informacion-legal",
      requiresHumanIntervention: false,
      knowledgeVersion,
      shouldEscalate: false,
      officialSources: [modules.resultados.title, modules.legal.title],
    };
  }

  const requiresHumanIntervention = escalationSignal.shouldEscalate;
  const queryClassification = classifyKnowledgeQuery({
    intent: best.intent,
    requiresHumanIntervention,
  });

  return {
    answer: `${baseResponse} ${segmentPostfix(input)}`.trim(),
    confidence,
    intentId: best.intent.id,
    category: best.intent.category,
    queryClassification,
    requiresHumanIntervention,
    knowledgeVersion,
    shouldEscalate: requiresHumanIntervention,
    escalationReason: requiresHumanIntervention ? escalationSignal.reason ?? "Revision recomendada" : undefined,
    escalationCategory: requiresHumanIntervention ? escalationSignal.category : undefined,
    escalationPriority: requiresHumanIntervention ? escalationSignal.priority : undefined,
    officialSources: sources,
  };
}
