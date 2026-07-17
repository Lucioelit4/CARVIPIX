// verify-openai.js
// Verificación completa de la configuración OpenAI antes de activar el Trading Engine
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
const MODEL_CONFIGURED = env['OPENAI_MODEL'];
const BASE_URL = env['OPENAI_BASE_URL'] || 'https://api.openai.com/v1';

console.log('═══════════════════════════════════════════════════════');
console.log('  CARVIPIX — VERIFICACIÓN OpenAI PRE-PRODUCCIÓN');
console.log('═══════════════════════════════════════════════════════\n');

console.log('📋 CONFIGURACIÓN DETECTADA:');
console.log(`   API Key:   ${API_KEY ? API_KEY.slice(0, 20) + '...' + API_KEY.slice(-6) : '❌ NO ENCONTRADA'}`);
console.log(`   Modelo:    ${MODEL_CONFIGURED || '❌ NO CONFIGURADO'}`);
console.log(`   Base URL:  ${BASE_URL}`);
console.log('');

if (!API_KEY) {
  console.error('❌ BLOQUEADO: OPENAI_API_KEY no está configurada');
  process.exit(1);
}

if (!MODEL_CONFIGURED) {
  console.error('❌ BLOQUEADO: OPENAI_MODEL no está configurado');
  process.exit(1);
}

// ── PASO 1: Verificar que la API Key es válida (listar modelos disponibles) ──
function httpRequest(options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, headers: res.headers, body: data });
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function run() {
  // ── PASO 1: Verificar credenciales y listar modelos ──────────────────────
  console.log('🔍 PASO 1: Verificando API Key y modelos disponibles...');
  
  const listRes = await httpRequest({
    hostname: 'api.openai.com',
    port: 443,
    path: '/v1/models',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
    }
  });

  if (listRes.status !== 200) {
    let errBody;
    try { errBody = JSON.parse(listRes.body); } catch { errBody = listRes.body; }
    console.log(`   ❌ API Key inválida o sin acceso: HTTP ${listRes.status}`);
    console.log(`   Error: ${JSON.stringify(errBody?.error || errBody)}`);
    process.exit(1);
  }

  const models = JSON.parse(listRes.body);
  const modelIds = models.data.map(m => m.id).sort();
  
  console.log(`   ✅ API Key válida. ${modelIds.length} modelos disponibles en la cuenta.\n`);

  // ── PASO 2: Verificar si el modelo configurado existe ────────────────────
  console.log(`🔍 PASO 2: Verificando modelo configurado: "${MODEL_CONFIGURED}"`);
  
  const exactMatch = modelIds.find(id => id === MODEL_CONFIGURED);
  const partialMatches = modelIds.filter(id => 
    id.toLowerCase().includes('gpt') && 
    (id.includes('4') || id.includes('5') || id.includes('o'))
  ).slice(0, 15);

  if (exactMatch) {
    console.log(`   ✅ Modelo "${MODEL_CONFIGURED}" EXISTE en la cuenta.\n`);
  } else {
    console.log(`   ❌ Modelo "${MODEL_CONFIGURED}" NO EXISTE en la cuenta.\n`);
    console.log('   📋 Modelos GPT disponibles en tu cuenta:');
    partialMatches.forEach(m => console.log(`      - ${m}`));
    console.log('');
  }

  // ── PASO 3: Llamada de prueba real al modelo ─────────────────────────────
  const modelToTest = exactMatch || 'gpt-4o-mini'; // fallback para continuar prueba
  
  console.log(`🔍 PASO 3: Llamada de prueba real con modelo "${modelToTest}"...`);
  
  const testPayload = JSON.stringify({
    model: modelToTest,
    messages: [
      { role: 'system', content: 'Eres el sistema de análisis CARVIPIX. Responde solo con JSON válido.' },
      { role: 'user', content: 'Responde exactamente con este JSON: {"status":"ok","engine":"CARVIPIX","ready":true}' }
    ],
    max_tokens: 50,
    temperature: 0.1,
    response_format: { type: 'json_object' }
  });

  const t0 = Date.now();

  const chatRes = await httpRequest({
    hostname: 'api.openai.com',
    port: 443,
    path: '/v1/chat/completions',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(testPayload),
    }
  }, testPayload);

  const latencyMs = Date.now() - t0;

  if (chatRes.status !== 200) {
    let errBody;
    try { errBody = JSON.parse(chatRes.body); } catch { errBody = chatRes.body; }
    console.log(`   ❌ Llamada fallida: HTTP ${chatRes.status}`);
    console.log(`   Error: ${JSON.stringify(errBody?.error || errBody)}`);
  } else {
    const chatData = JSON.parse(chatRes.body);
    const content = chatData.choices?.[0]?.message?.content;
    const promptTokens = chatData.usage?.prompt_tokens;
    const completionTokens = chatData.usage?.completion_tokens;
    const totalTokens = chatData.usage?.total_tokens;

    let parsedContent;
    try { parsedContent = JSON.parse(content); } catch { parsedContent = content; }

    console.log(`   ✅ Respuesta recibida`);
    console.log(`   📊 Latencia:           ${latencyMs}ms`);
    console.log(`   📊 Tokens prompt:      ${promptTokens}`);
    console.log(`   📊 Tokens completion:  ${completionTokens}`);
    console.log(`   📊 Tokens total:       ${totalTokens}`);
    console.log(`   📊 Modelo usado:       ${chatData.model}`);
    console.log(`   📊 Respuesta JSON:     ${JSON.stringify(parsedContent)}`);
  }

  // ── RESUMEN FINAL ─────────────────────────────────────────────────────────
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  RESULTADO FINAL');
  console.log('═══════════════════════════════════════════════════════\n');

  const configuredModelWorks = exactMatch && chatRes.status === 200;

  console.log(`   Modelo configurado:     ${MODEL_CONFIGURED}`);
  console.log(`   Existe en la cuenta:    ${exactMatch ? '✅ SÍ' : '❌ NO'}`);
  console.log(`   Llamada de prueba:      ${chatRes.status === 200 ? '✅ EXITOSA' : '❌ FALLIDA'}`);
  console.log(`   Latencia observada:     ${latencyMs}ms`);
  console.log('');

  if (!configuredModelWorks) {
    console.log('⚠️  CONCLUSIÓN: El modelo configurado NO está disponible.');
    console.log('');
    console.log('   Modelos recomendados disponibles en tu cuenta:');
    const recommended = modelIds.filter(id => 
      id.startsWith('gpt-4o') || id.startsWith('gpt-4.') || id.startsWith('gpt-5')
    );
    recommended.forEach(m => console.log(`      - ${m}`));
    console.log('');
    console.log('   ➜ Acción requerida: cambiar OPENAI_MODEL antes de activar el Engine.');
    console.log('   ➜ La activación en Railway queda BLOQUEADA hasta confirmar el modelo.');
  } else {
    console.log('✅ CONCLUSIÓN: Configuración OpenAI verificada y operativa.');
    console.log('   El Trading Engine puede activarse con este modelo.');
  }
}

run().catch(err => {
  console.error('❌ Error inesperado en la verificación:', err.message);
  process.exit(1);
});
