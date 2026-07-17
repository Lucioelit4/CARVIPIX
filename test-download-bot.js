// test-download-bot.js
const https = require('https');
const fs = require('fs');

const licenseKey = 'BOTKEY-008B3009-1784252915538';
const orderId = 'BETA-FOUNDER-014-1784252915519';

// Generate token: base64(license_key:order_id)
const tokenData = `${licenseKey}:${orderId}`;
const token = Buffer.from(tokenData).toString('base64');

const downloadUrl = `https://carvipix.com/api/bot/download?license=${licenseKey}&token=${token}`;

console.log('📥 Descargando bot EA...\n');
console.log('Licencia:', licenseKey);
console.log('Token:', token);
console.log('URL:', downloadUrl);
console.log('');

const url = new URL(downloadUrl);
const options = {
  hostname: url.hostname,
  port: 443,
  path: url.pathname + url.search,
  method: 'GET',
};

const req = https.request(options, (res) => {
  console.log('Status:', res.statusCode);
  console.log('Content-Type:', res.headers['content-type']);
  console.log('Content-Length:', res.headers['content-length']);
  console.log('');

  if (res.statusCode !== 200) {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('❌ Error Response:');
      try {
        console.log(JSON.parse(data));
      } catch {
        console.log(data);
      }
    });
    return;
  }

  // Download to file
  const fileName = `CARVIPIX_${licenseKey}.ex5`;
  const file = fs.createWriteStream(fileName);
  
  res.pipe(file);

  file.on('finish', () => {
    file.close();
    const stat = fs.statSync(fileName);
    console.log(`✅ Descarga completada!`);
    console.log(`📁 Archivo: ${fileName}`);
    console.log(`📊 Tamaño: ${stat.size.toLocaleString()} bytes`);
  });

  file.on('error', (e) => {
    fs.unlink(fileName, () => {});
    console.error('❌ Error descargando:', e.message);
  });
});

req.on('error', (e) => {
  console.error('❌ Error:', e.message);
});

req.end();
