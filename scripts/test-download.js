const https = require('https');
const fs = require('fs');

const licenseKey = 'BOTKEY-1944AA42-1784249700089';
const orderId = 'BETA-FOUNDER-008-1784249700070';
const token = Buffer.from(`${licenseKey}:${orderId}`).toString('base64');

const downloadUrl = `https://carvipix.com/api/bot/download?license=${encodeURIComponent(licenseKey)}&token=${encodeURIComponent(token)}`;

console.log(`📥 Testing download endpoint...\n`);
console.log(`URL: ${downloadUrl}\n`);

const url = new URL(downloadUrl);
const options = {
  hostname: url.hostname,
  port: 443,
  path: url.pathname + url.search,
  method: 'GET'
};

const req = https.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers:`);
  console.log(`  Content-Type: ${res.headers['content-type']}`);
  console.log(`  Content-Length: ${res.headers['content-length']} bytes`);
  console.log(`  Content-Disposition: ${res.headers['content-disposition']}`);
  console.log(`  X-License-Key: ${res.headers['x-license-key']}`);
  
  let dataSize = 0;
  res.on('data', (chunk) => {
    dataSize += chunk.length;
  });
  
  res.on('end', () => {
    console.log(`\n✅ File downloaded: ${dataSize} bytes`);
    if (dataSize > 0) {
      console.log(`\n🎉 DESCARGA EXITOSA`);
      console.log(`   License Key: ${licenseKey}`);
      console.log(`   Order ID: ${orderId}`);
      console.log(`   File Size: ${(dataSize / 1024 / 1024).toFixed(2)} MB`);
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Error:', e.message);
});

req.end();
