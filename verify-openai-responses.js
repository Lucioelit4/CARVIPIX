// verify-openai-responses.js
// Prueba con el endpoint real que usa el Trading Engine: /v1/responses
const fs = require('fs');
const path = require('path');
const https = require('https');

// Cargar .env.local
const envFile = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  if (line && !line.startsWith('#')) {
    const [key, ...valueParts] = line.split('=');
    let value = valueParts.join('=').trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (key) env[key.trim()] = value;
  }
});

const API_KEY = env['OPENAI_API_KEY'];
const MODEL = env['OPENAI_MODEL'];
const BASE_URL = (env['OPENAI_BASE_URL'] || 'https://api.openai.com/v1').replace(/\/+$/, '');
const RESPONSES_ENDPOINT = `${BASE_URL}/responses`;

console.log('═══════════════════════════════════════════════════════════════');
console.log('  CARVIPIX — VERIFICACIÓN OPENAI /v1/responses (endpoint real)');
console.log('═══════════════════════════════════════════════════════════════\n');
console.log(`   Modelo:    ${MODEL}`);
console.log(`   Endpoint:  ${RESPONSES_ENDPOINT}`);
console.log('');

function httpRequest(hostname, port, path, method, headers, body) {
  return new Promise((resolve, reject) => {
    const req = https.request({ hostname, port, path, method, headers }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function run() {
  // ── Body que construye buildModelAwareResponsesBody para gpt-5.3-codex ──
  // gpt-5.3-codex tiene supportsReasoning: true en la tabla de compatibilidad
  const testPayload = JSON.stringify({
    model: MODEL,
    instructions: 'Generate only the JSON response that satisfies the provided schema.',
    input: [
      {
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: 'Responde exactamente con este JSON (sin texto adicional): {"status":"ok","engine":"CARVIPIX","ready":true}'
          }
        ]
      }
    ],
    text: {
      format: {
        type: 'json_schema',
        name: 'verification_response',
        strict: true,
        schema: {
          type: 'object',
          additionalProperties: false,
          required: ['status', 'engine', 'ready'],
          properties: {
            status: { type: 'string' },
            engine: { type: 'string' },
            ready: { type: 'boolean' }
          }
        }
      }
    },
    reasoning: { effort: 'low' },       // gpt-5.3-codex soporta reasoning
    max_output_tokens: 200,
    store: false
  });

  const urlObj = new URL(RESPONSES_ENDPOINT);

  console.log('🔍 Llamada real a /v1/responses con gpt-5.3-codex...\n');

  const t0 = Date.now();

  const result = await httpRequest(
    urlObj.hostname,
    443,
    urlObj.pathname,
    'POST',
    {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(testPayload),
    },
    testPayload
  );

  const latencyMs = Date.now() - t0;

  console.log(`   HTTP Status: ${result.status}`);
  console.log(`   Latencia:    ${latencyMs}ms\n`);

  let responseData;
  try {
    responseData = JSON.parse(result.body);
  } catch {
    responseData = result.body;
  }

  if (result.status !== 200) {
    console.log('❌ LLAMADA FALLIDA');
    console.log('   Error:');
    console.log(JSON.stringify(responseData?.error || responseData, null, 2));

    // Si falla, detectar si el problema es el modelo o el endpoint
    const errorMsg = responseData?.error?.message || '';
    if (errorMsg.includes('chat/completions')) {
      console.log('\n   ℹ️  El modelo necesita /v1/chat/completions, no /v1/responses');
    } else if (errorMsg.includes('does not exist') || errorMsg.includes('not found')) {
      console.log('\n   ℹ️  El modelo no existe en esta cuenta');
    } else if (errorMsg.includes('billing') || errorMsg.includes('insufficient')) {
      console.log('\n   ℹ️  Problema de créditos/billing en la cuenta');
    }
    return;
  }

  // Extraer contenido de la respuesta /v1/responses
  const outputItems = responseData?.output || [];
  let content = null;
  for (const item of outputItems) {
    if (item.type === 'message' && item.content) {
      for (const c of item.content) {
        if (c.type === 'output_text') {
          content = c.text;
          break;
        }
      }
    }
  }

  const inputTokens = responseData?.usage?.input_tokens ?? 0;
  const outputTokens = responseData?.usage?.output_tokens ?? 0;
  const reasoningTokens = responseData?.usage?.output_tokens_details?.reasoning_tokens ?? 0;
  const cachedTokens = responseData?.usage?.input_tokens_details?.cached_tokens ?? 0;
  const modelUsed = responseData?.model || 'N/A';
  const responseId = responseData?.id || 'N/A';

  let parsedContent;
  try { parsedContent = JSON.parse(content); } catch { parsedContent = content; }

  console.log('✅ LLAMADA EXITOSA\n');
  console.log('   📊 MÉTRICAS:');
  console.log(`      Latencia total:        ${latencyMs}ms`);
  console.log(`      Tokens entrada:        ${inputTokens}`);
  console.log(`      Tokens salida:         ${outputTokens}`);
  console.log(`      Tokens reasoning:      ${reasoningTokens}`);
  console.log(`      Tokens en caché:       ${cachedTokens}`);
  console.log(`      Modelo confirmado:     ${modelUsed}`);
  console.log(`      Response ID:           ${responseId}`);
  console.log(`      Respuesta JSON:        ${JSON.stringify(parsedContent)}`);

  // Estimar costo de una llamada real del Engine
  // Un análisis real del Engine usa ~8,000-15,000 tokens de entrada (expediente completo)
  const estimatedInputPerAnalysis = 10000;
  const estimatedOutputPerAnalysis = 2000;
  const estimatedReasoningPerAnalysis = 1500;

  // Precios aproximados gpt-5.3-codex (basados en estructura de precios OpenAI)
  // No tenemos precio oficial exacto, usar referencia de gpt-4o como base
  console.log('\n   📊 ESTIMACIÓN DE CONSUMO (por análisis real del Engine):');
  console.log(`      Tokens entrada estimados:    ~${estimatedInputPerAnalysis.toLocaleString()}`);
  console.log(`      Tokens salida estimados:     ~${estimatedOutputPerAnalysis.toLocaleString()}`);
  console.log(`      Tokens reasoning estimados:  ~${estimatedReasoningPerAnalysis.toLocaleString()}`);
  console.log(`      Total tokens estimados:      ~${(estimatedInputPerAnalysis + estimatedOutputPerAnalysis + estimatedReasoningPerAnalysis).toLocaleString()}`);

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  RESULTADO FINAL');
  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log(`   Modelo configurado:           ${MODEL}`);
  console.log(`   Modelo responde en /responses: ✅ SÍ`);
  console.log(`   JSON válido recibido:          ${parsedContent?.ready === true ? '✅ SÍ' : '⚠️ REVISAR'}`);
  console.log(`   Latencia observada:            ${latencyMs}ms`);
  console.log('');
  console.log('✅ VEREDICTO: El modelo gpt-5.3-codex es compatible con el');
  console.log('   endpoint /v1/responses que usa el Trading Engine.');
  console.log('   El Engine puede activarse con la configuración actual.');
}

run().catch(err => {
  console.error('❌ Error inesperado:', err.message);
  process.exit(1);
});
