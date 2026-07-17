// test-registration-final.js
const https = require('https');

const payload = {
  nombre: "Cliente",
  apellido: "Final",
  correo: "carvipix.clientefinal2026@mailinator.com",
  telefono: "+573001234567",
  pais: "Colombia",
  password: "ClientPass2026!",
  confirmPassword: "ClientPass2026!",
  inviteCode: "FOUNDER-009",
  aceptaTerminos: true
};

console.log('📤 Enviando solicitud de registro...\n');
console.log('👤 Nombre:', payload.nombre + ' ' + payload.apellido);
console.log('📧 Email:', payload.correo);
console.log('🔐 Código:', payload.inviteCode);
console.log('✅ Términos:', payload.aceptaTerminos);
console.log('');

const options = {
  hostname: 'carvipix.com',
  port: 443,
  path: '/api/auth/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  }
};

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    console.log('\n📬 Server Response:');
    try {
      const json = JSON.parse(data);
      console.log(JSON.stringify(json, null, 2));
    } catch {
      console.log(data);
    }

    if (res.statusCode === 200 || (res.statusCode === 201)) {
      console.log('\n✅ REGISTRO EXITOSO!');
      console.log('📧 Revisa', payload.correo, 'para el correo de verificación');
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Error:', e.message);
});

req.write(JSON.stringify(payload));
req.end();
