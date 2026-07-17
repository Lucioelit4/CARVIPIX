const fs = require('fs');
const path = require('path');
const https = require('https');

// Test endpoint via HTTPS
function testEndpoint() {
  const payload = JSON.stringify({
    code: 'FOUNDER-010',
    product_id: 'bot-carvipix-license',
    user_id: 'usr-test-' + Date.now(),
    user_email: 'test-' + Date.now() + '@test.local'
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

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        try {
          const response = JSON.parse(data);
          console.log('Response:', JSON.stringify(response, null, 2));
          resolve(response);
        } catch (e) {
          console.log('Raw response:', data);
          resolve({ error: 'Parse failed', raw: data });
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

testEndpoint().catch(console.error);
