import { randomUUID } from "crypto";
import { buildOpenAIHeaders, getOpenAIRuntimeConfig } from "@/app/ai/openAIConfig";
import type {
  CommunityContent,
  CommunityContentGenerator,
  CommunityImage,
  CommunityImageGenerator,
  CommunityMarketDossier,
  CommunityPublication,
  CommunityTelegramPublisher,
} from "./types";
import { assertCommunityAutomationEnabled } from "./automation";

function extractResponseText(payload: unknown): string {
  const data = payload as { output_text?: string; output?: Array<{ content?: Array<{ text?: string }> }> };
  const nested = data.output?.flatMap((item) => item.content ?? []).find((item) => item.text)?.text;
  const text = data.output_text ?? nested;
  if (!text) throw new Error("COMMUNITY_CONTENT_EMPTY_RESPONSE");
  return text;
}

export class OpenAICommunityContentGenerator implements CommunityContentGenerator {
  async generate(dossier: CommunityMarketDossier): Promise<CommunityContent> {
    assertCommunityAutomationEnabled();
    const config = getOpenAIRuntimeConfig();
    const response = await fetch(`${config.baseUrl}/responses`, {
      method: "POST",
      headers: buildOpenAIHeaders(config),
      body: JSON.stringify({
        model: process.env.COMMUNITY_TEXT_MODEL?.trim() || config.model,
        instructions: [
          "Eres GPT COMMUNITY de CARVIPIX. Solo comunicas el expediente recibido.",
          "No analices nuevamente, no inventes datos y no emitas alertas ni recomendaciones operativas.",
          "Usa tono humano, claro y cercano; evita estilo corporativo, repetitivo o robotico.",
          "Escribe mensajes cortos de 2 a 5 lineas, con una sola idea principal por publicacion.",
          "Prefiere frases naturales y directas; no uses bloques largos ni lenguaje ceremonioso.",
          "Nunca indiques comprar, vender, entrar, cerrar, salir, mover niveles, reducir posicion, agregar lotaje o asegurar ganancias.",
          "Solo OFFICIAL_RESULT puede mencionar TP o SL cuando official_status lo confirme.",
          "ACTIVE_OPERATION solo puede usar: La operación continúa activa conforme a los niveles oficiales publicados.",
          "Devuelve JSON valido con title, body, type y disclaimer.",
          "type debe coincidir con editorial.category_hint cuando exista.",
          "El disclaimer debe ser exactamente: Contenido informativo. No representa una alerta oficial ni una recomendación operativa.",
        ].join("\n"),
        input: JSON.stringify(dossier),
        text: {
          format: {
            type: "json_schema",
            name: "community_content_v1",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              required: ["title", "body", "type", "disclaimer"],
              properties: {
                title: { type: "string", minLength: 5, maxLength: 120 },
                body: { type: "string", minLength: 40, maxLength: 1800 },
                type: {
                  type: "string",
                  enum: [
                    "SESSION_OPEN", "MARKET_STATUS", "NO_TRADE_WAIT", "MATERIAL_CHANGE", "GENERAL_ANALYSIS",
                    "OFFICIAL_ALERT_CONTEXT", "ACTIVE_OPERATION", "OFFICIAL_RESULT", "DAILY_CLOSE",
                  ],
                },
                disclaimer: { type: "string", minLength: 10, maxLength: 240 },
              },
            },
          },
        },
        store: false,
      }),
      signal: AbortSignal.timeout(config.timeoutMs),
    });

    if (!response.ok) throw new Error(`COMMUNITY_CONTENT_PROVIDER_HTTP_${response.status}`);
    return JSON.parse(extractResponseText(await response.json())) as CommunityContent;
  }
}

export class OpenAICommunityImageGenerator implements CommunityImageGenerator {
  async generate(dossier: CommunityMarketDossier, content: CommunityContent): Promise<CommunityImage> {
    assertCommunityAutomationEnabled();
    const config = getOpenAIRuntimeConfig();
    const prompt = [
      "Institutional editorial cover for CARVIPIX financial market update.",
      "Premium black and restrained metallic gold identity, sophisticated financial technology atmosphere.",
      `Asset label only: ${dossier.asset}. Editorial topic: ${content.title}.`,
      "No prices, no numbers, no candlestick chart, no fake chart, no arrows, no trade signal, no buy or sell wording, no entry, no stop loss, no take profit.",
      "Landscape composition suitable for Telegram and a professional analysis feed.",
    ].join(" ");
    const response = await fetch(`${config.baseUrl}/images/generations`, {
      method: "POST",
      headers: buildOpenAIHeaders(config),
      body: JSON.stringify({
        model: process.env.COMMUNITY_IMAGE_MODEL?.trim() || "gpt-image-1",
        prompt,
        size: "1536x1024",
        quality: "medium",
        output_format: "png",
      }),
      signal: AbortSignal.timeout(Math.max(config.timeoutMs, 60_000)),
    });

    if (!response.ok) throw new Error(`COMMUNITY_IMAGE_PROVIDER_HTTP_${response.status}`);
    const payload = (await response.json()) as { data?: Array<{ b64_json?: string }> };
    const bytes = payload.data?.[0]?.b64_json;
    if (!bytes) throw new Error("COMMUNITY_IMAGE_EMPTY_RESPONSE");
    return {
      image_id: `CMI-${randomUUID()}`,
      mime_type: "image/png",
      bytes_base64: bytes,
      prompt_version: "community-cover-v1",
      generated_at: new Date().toISOString(),
    };
  }
}

function telegramCaption(publication: CommunityPublication): string {
  const escape = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const testHeader = process.env.COMMUNITY_INTELLIGENCE_TEST_ONLY !== "false"
    ? "<b>PRUEBA TÉCNICA — CONTENIDO INFORMATIVO, NO ES UNA ALERTA.</b>\n\n"
    : "";
  const title = `<b>${escape(publication.content.title)}</b>`;
  const disclaimer = `<i>${escape(publication.content.disclaimer)}</i>`;
  const compactBody = publication.content.body
    .replace(/\n{3,}/g, "\n\n")
    .split("\n")
    .map(line => line.trim())
    .filter(Boolean)
    .slice(0, 5)
    .join("\n");
  const fixedLength = testHeader.length + title.length + disclaimer.length + 4;
  const body = escape(compactBody).slice(0, Math.max(0, 700 - fixedLength));
  return `${testHeader}${title}\n\n${body}\n\n${disclaimer}`;
}

export class DedicatedCommunityTelegramPublisher implements CommunityTelegramPublisher {
  async publish(publication: CommunityPublication): Promise<{ message_id: number; sent_at: string }> {
    assertCommunityAutomationEnabled();
    if (process.env.COMMUNITY_INTELLIGENCE_ENABLED !== "true") {
      throw new Error("COMMUNITY_INTELLIGENCE_DISABLED");
    }
    const testOnly = process.env.COMMUNITY_INTELLIGENCE_TEST_ONLY !== "false";
    if (!testOnly && process.env.COMMUNITY_INTELLIGENCE_OFFICIAL_ENABLED !== "true") {
      throw new Error("COMMUNITY_OFFICIAL_DELIVERY_NOT_APPROVED");
    }

    const token = process.env.COMMUNITY_TELEGRAM_BOT_TOKEN?.trim();
    const channel = (testOnly
      ? process.env.COMMUNITY_TELEGRAM_CHANNEL_TEST
      : process.env.COMMUNITY_TELEGRAM_CHANNEL_OFFICIAL
    )?.trim();
    if (!token || !channel) throw new Error("COMMUNITY_TELEGRAM_DEDICATED_CONFIG_MISSING");

    const caption = telegramCaption(publication);
    let response: Response;
    if (publication.image) {
      const form = new FormData();
      form.set("chat_id", channel);
      form.set("caption", caption);
      form.set("parse_mode", "HTML");
      form.set(
        "photo",
        new Blob([Buffer.from(publication.image.bytes_base64, "base64")], { type: publication.image.mime_type }),
        `${publication.image.image_id}.png`,
      );
      response = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
        method: "POST",
        body: form,
        signal: AbortSignal.timeout(30_000),
      });
    } else {
      response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: channel, text: caption, parse_mode: "HTML", disable_web_page_preview: true }),
        signal: AbortSignal.timeout(30_000),
      });
    }
    const payload = (await response.json()) as {
      ok?: boolean;
      description?: string;
      result?: { message_id?: number };
    };
    const messageId = payload.result?.message_id;
    if (!response.ok || !payload.ok || !messageId) {
      const detail = payload.description?.replace(/[^a-zA-Z0-9 _.,:-]/g, "").slice(0, 180);
      throw new Error(`COMMUNITY_TELEGRAM_HTTP_${response.status}${detail ? `:${detail}` : ""}`);
    }
    return { message_id: messageId, sent_at: new Date().toISOString() };
  }
}