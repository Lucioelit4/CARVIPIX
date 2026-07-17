// test-resend-direct.js
const { Resend } = require('resend');

const apiKey = 're_RhaAgWXC_MKxfNqjHMJzyuoLiY2g7iqAr';
const resend = new Resend(apiKey);

async function testEmail() {
  try {
    console.log('📤 Testing Resend email sending...\n');
    console.log(`API Key: ${apiKey.substring(0, 10)}...`);
    console.log(`From: noreply@carvipix.com`);
    console.log(`To: carvipix.finaltest2026@mailinator.com\n`);

    const result = await resend.emails.send({
      from: 'noreply@carvipix.com',
      to: 'carvipix.finaltest2026@mailinator.com',
      subject: '🤖 TEST VERIFICACION CARVIPIX',
      html: '<h1>✅ Email de prueba enviado correctamente</h1><p>Si recibiste esto, Resend está funcionando.</p>'
    });

    console.log('✅ RESULT:', JSON.stringify(result, null, 2));

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error(error);
  }
}

testEmail();
