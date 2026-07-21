// Quick Node.js test to call the ask-ai API and read the stream
const http = require('http');

const body = JSON.stringify({
  messages: [
    {
      id: 'msg-test-1',
      role: 'user',
      parts: [{ type: 'text', text: 'Hola, dime brevemente quien es Juan Palacios' }]
    }
  ],
  language: 'es'
});

console.log('Sending request to /api/ask-ai...');
console.log('Body:', body);
console.log('---');

const req = http.request('http://localhost:3000/api/ask-ai', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body)
  },
  timeout: 30000
}, (res) => {
  console.log('STATUS:', res.statusCode);
  console.log('HEADERS:', JSON.stringify(res.headers, null, 2));
  console.log('---');
  
  let fullBody = '';
  res.on('data', (chunk) => {
    const text = chunk.toString();
    fullBody += text;
    process.stdout.write(text);
  });
  
  res.on('end', () => {
    console.log('\n--- STREAM ENDED ---');
    console.log('Total response length:', fullBody.length);
    
    // Now test /api/chat
    testChat();
  });
});

req.on('error', (e) => {
  console.error('ERROR:', e.message);
});

req.on('timeout', () => {
  console.error('TIMEOUT');
  req.destroy();
});

req.write(body);
req.end();

function testChat() {
  console.log('\n===== Testing /api/chat =====');
  const chatBody = JSON.stringify({
    messages: [{ role: 'user', content: 'Hola' }],
    language: 'es'
  });
  
  const chatReq = http.request('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(chatBody)
    },
    timeout: 30000
  }, (res) => {
    console.log('CHAT STATUS:', res.statusCode);
    let data = '';
    res.on('data', (chunk) => {
      data += chunk.toString();
    });
    res.on('end', () => {
      console.log('CHAT RESPONSE (first 500):', data.substring(0, 500));
      
      // Test contact
      testContact();
    });
  });
  
  chatReq.on('error', (e) => console.error('CHAT ERROR:', e.message));
  chatReq.write(chatBody);
  chatReq.end();
}

function testContact() {
  console.log('\n===== Testing /api/contact =====');
  const contactBody = JSON.stringify({
    name: 'Test User',
    email: 'test@example.com',
    message: 'Test message'
  });
  
  const contactReq = http.request('http://localhost:3000/api/contact', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(contactBody)
    },
    timeout: 10000
  }, (res) => {
    console.log('CONTACT STATUS:', res.statusCode);
    let data = '';
    res.on('data', (chunk) => { data += chunk.toString(); });
    res.on('end', () => {
      console.log('CONTACT RESPONSE:', data);
      console.log('\n===== ALL TESTS COMPLETE =====');
    });
  });
  
  contactReq.on('error', (e) => console.error('CONTACT ERROR:', e.message));
  contactReq.write(contactBody);
  contactReq.end();
}
