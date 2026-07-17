const https = require('https');

const options = {
  hostname: 'carvipix.com',
  port: 443,
  path: '/api/beta/apply-code',
  method: 'HEAD'
};

const req = https.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log('Headers:', {
    'cache-control': res.headers['cache-control'],
    'etag': res.headers['etag'],
    'date': res.headers['date'],
    'server': res.headers['server']
  });
});

req.on('error', (e) => {
  console.error('Error:', e);
});

console.log('Checking endpoint headers...\n');
req.end();
