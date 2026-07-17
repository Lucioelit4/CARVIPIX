// test-complete-email-flow.js
const fs = require('fs');
const path = require('path');

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
    env[key.trim()] = value;
  }
});

const { Resend } = require('resend');
const resend = new Resend(env.RESEND_API_KEY);

async function testEmailFlow() {
  const recipientEmail = 'carvipix.clientefinal2026@mailinator.com';
  const recipientName = 'Cliente Final';
  const verificationToken = 'test-token-12345-abcde';
  const appPublicUrl = 'https://carvipix.com';
  const supportEmail = 'support@carvipix.com';

  // Construir URL igual al endpoint
  const verificationUrl = `${appPublicUrl.replace(/\/$/, "")}/verificar-correo?token=${encodeURIComponent(verificationToken)}`;

  console.log('📤 Simulando flujo de email de bienvenida...\n');
  console.log('Recipient:', recipientEmail);
  console.log('Verification URL:', verificationUrl);
  console.log('');

  try {
    const result = await resend.emails.send({
      from: env.RESEND_FROM_EMAIL,
      to: recipientEmail,
      subject: 'Bienvenido a CARVIPIX: confirma tu correo',
      html: `
        <h1>Bienvenido a CARVIPIX</h1>
        <p>Hola ${recipientName},</p>
        <p>Tu cuenta fue creada correctamente. Para activar el acceso, confirma tu correo con el botón seguro.</p>
        <p><a href="${verificationUrl}" style="color: #D4AF37; font-weight: bold;">Confirmar correo</a></p>
        <p>Si el botón no abre, copia esta URL en tu navegador:<br/>
        <a href="${verificationUrl}" style="color:#D4AF37;">${verificationUrl}</a></p>
        <p>Si no reconoces este registro, escribe a ${supportEmail}.</p>
      `,
      text: `
Hola ${recipientName},
Tu cuenta fue creada correctamente. Confirma tu correo para activar el acceso.
URL: ${verificationUrl}
Si no reconoces este registro, escribe a ${supportEmail}.
      `
    });

    console.log('✅ Email enviado exitosamente!');
    console.log('Message ID:', result.data?.id || 'N/A');
    console.log('Error:', result.error || 'Ninguno');
    console.log('');
    console.log('📧 Revisa', recipientEmail, 'en Mailinator');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testEmailFlow();
