// test-registration-direct2.js
const https = require('https');

const payload = {
  nombre: "ClientFinal",
  apellido: "Test",
  correo: "carvipix.clientefinal2026@mailinator.com",
  telefono: "+573001234567",
  pais: "Colombia",
  password: "ClientPass2026!",
  confirmPassword: "ClientPass2026!",
  inviteCode: "FOUNDER-001",
  aceptaTerminos: true
};

console.log('📤 Enviando solicitud de registro...\n');
console.log('Email:', payload.correo);
console.log('Código:', payload.inviteCode);
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
    console.log('\n📬 Response:');
    try {
      const json = JSON.parse(data);
      console.log(JSON.stringify(json, null, 2));
    } catch {
      console.log(data);
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Error:', e.message);
});

req.write(JSON.stringify(payload));
req.end();
