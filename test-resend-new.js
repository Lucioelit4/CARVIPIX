// test-resend-new.js
const fs = require('fs');
const path = require('path');

// Leer API key desde .env.local
const envFile = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf8');
const apiKeyMatch = envFile.match(/RESEND_API_KEY="([^"]+)"/);
const apiKey = apiKeyMatch ? apiKeyMatch[1] : null;

if (!apiKey) {
  console.error('❌ No API key found in .env.local');
  process.exit(1);
}

const { Resend } = require('resend');
const resend = new Resend(apiKey);

async function testEmail() {
  try {
    console.log('📤 Testing Resend with NEW API KEY...\n');
    console.log(`API Key: ${apiKey.substring(0, 15)}...`);
    console.log(`From: noreply@carvipix.com`);
    console.log(`To: carvipix.finaltest2026@mailinator.com\n`);

    const result = await resend.emails.send({
      from: 'noreply@carvipix.com',
      to: 'carvipix.finaltest2026@mailinator.com',
      subject: '🎉 TEST VERIFICACION CARVIPIX - API KEY VÁLIDA',
      html: `
        <h1>✅ Email de prueba enviado correctamente</h1>
        <p>Si recibiste esto, Resend está funcionando con la API key correcta.</p>
        <p>API Key usada: <code>${apiKey.substring(0, 20)}...</code></p>
      `
    });

    console.log('✅ RESULT:', JSON.stringify(result, null, 2));

    if (result.data?.id) {
      console.log('\n🎉 ¡EMAIL ENVIADO EXITOSAMENTE!');
      console.log(`Message ID: ${result.data.id}`);
    }

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error(error);
  }
}

testEmail();
