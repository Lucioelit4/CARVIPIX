const fs = require('fs');
const path = require('path');
const https = require('https');

const envFile = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf-8');
const envVars = {};
envFile.split('\n').forEach(line => {
  if (line && !line.startsWith('#')) {
    const [key, ...valueParts] = line.split('=');
    if (key) {
      envVars[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
    }
  }
});

Object.assign(process.env, envVars);

// Test with a new user ID (simulate user session)
const userId = `usr-e2e-test-${Date.now()}`;
const userEmail = `e2etest-${Date.now()}@carvipix.test`;
const code = 'FOUNDER-008';

const payload = JSON.stringify({
  code: code,
  product_id: 'bot-carvipix-license',
  user_id: userId,
  user_email: userEmail
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
    console.log(`\n✅ PURCHASE ENDPOINT RESPONSE\n`);
    console.log(`Status: ${res.statusCode}\n`);
    try {
      const response = JSON.parse(data);
      console.log(JSON.stringify(response, null, 2));
      
      if (response.ok) {
        console.log(`\n📋 Test Details:`);
        console.log(`   Order ID: ${response.order_id}`);
        console.log(`   License Key: ${response.license_key}`);
        console.log(`   Expires: ${response.expires_at}`);
        console.log(`   Email Sent: ${response.email_sent}`);
      }
    } catch (e) {
      console.log('Raw:', data);
    }
  });
});

req.on('error', (e) => {
  console.error('Error:', e);
});

console.log(`🔄 Testing purchase flow with:`);
console.log(`   Code: ${code}`);
console.log(`   User ID: ${userId}`);
console.log(`   Email: ${userEmail}`);
console.log(`\nSending request...`);

req.write(payload);
req.end();
