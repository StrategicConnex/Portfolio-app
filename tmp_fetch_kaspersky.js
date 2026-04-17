const https = require('https');
const url = 'https://cybermap.kaspersky.com/stats';
https.get(url, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    const matches = body.match(/https?:\/\/[\w\-\.:\/\?&=%#]+|\/[\w\-\.:\/\?&=%#]+/g) || [];
    const seen = new Set();
    matches.forEach((m) => {
      if (/api|stats|json|feed|attack|kaspersky/i.test(m)) {
        if (!seen.has(m)) {
          seen.add(m);
          console.log(m);
        }
      }
    });
  });
}).on('error', (err) => {
  console.error(err);
});