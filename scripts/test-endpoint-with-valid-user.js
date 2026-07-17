const fs = require('fs');
const path = require('path');
const https = require('https');

// Test endpoint with valid user
const payload = JSON.stringify({
  code: 'FOUNDER-010',
  product_id: 'bot-carvipix-license',
  user_id: 'usr-founder-f010-1784247900811',
  user_email: 'founder-f010-1784247900811@test.local'
});

const options = {
  hostname: 'carvipix.com',
  port: 443,
  path: '/api/beta/apply-code',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log(`\nStatus: ${res.statusCode}\n`);
    try {
      const response = JSON.parse(data);
      console.log(JSON.stringify(response, null, 2));
    } catch (e) {
      console.log('Raw:', data);
    }
  });
});

req.on('error', (e) => {
  console.error('Error:', e);
});

console.log('Testing endpoint with:');
console.log('  Code: FOUNDER-010');
console.log('  User ID: usr-founder-f010-1784247900811');
console.log('');
console.log('Request...');

req.write(payload);
req.end();
