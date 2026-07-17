// test-registration-direct.js
const https = require('https');

const payload = {
  nombre: "TestUser",
  apellido: "Final",
  correo: "carvipix.testfinal2026@mailinator.com",
  telefono: "+573001234567",
  pais: "Colombia",
  password: "TestPass2026!",
  confirmPassword: "TestPass2026!",
  inviteCode: "FOUNDER-016",
  aceptaTerminos: true
};

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
    console.log('Status:', res.statusCode);
    console.log('Response:');
    try {
      console.log(JSON.stringify(JSON.parse(data), null, 2));
    } catch {
      console.log(data);
    }
  });
});

req.on('error', (e) => {
  console.error('Error:', e.message);
});

req.write(JSON.stringify(payload));
req.end();
