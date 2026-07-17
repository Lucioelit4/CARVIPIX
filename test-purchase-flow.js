// test-purchase-flow.js
const https = require('https');

const userId = 'usr-1784252818406-h500fd46';
const founderCode = 'FOUNDER-014';

const payload = {
  user_id: userId,
  code: founderCode,
  product_id: 'bot-carvipix-license',
};

console.log('💳 Iniciando compra...\n');
console.log('User ID:', userId);
console.log('Código:', founderCode);
console.log('');

const options = {
  hostname: 'carvipix.com',
  port: 443,
  path: '/api/beta/apply-code',
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

      if (json.ok) {
        console.log('\n✅ COMPRA EXITOSA!');
        if (json.license_key) {
          console.log(`📜 Licencia: ${json.license_key}`);
        }
        if (json.order_id) {
          console.log(`📋 Orden: ${json.order_id}`);
        }
        if (json.email_sent) {
          console.log('📧 Email de licencia: Enviado');
        }
      } else {
        console.log('\n❌ Error en compra:', json.error);
      }
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
