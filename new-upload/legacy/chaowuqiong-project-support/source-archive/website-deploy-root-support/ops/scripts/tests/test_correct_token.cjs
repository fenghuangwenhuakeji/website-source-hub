const http = require('http');
const jwt = require('jsonwebtoken');

const JWT_SECRET = '0aee186a291f6dea1596d2614bb84d49d25aa75765161952c95d5099ed4e3b00dd3f9c55b8a9b45a324325d65b42af41c3b7d98ab55e6c07e96b99224aeaef5c';

const userId = 'e2a5837d-388b-4e72-a2e3-7fbc8cd5b475';
const token = jwt.sign({ userId, username: 'rootadmin', role: 'user' }, JWT_SECRET, { expiresIn: '7d' });

console.log('Generated token:', token.substring(0, 50) + '...');

const options = {
  hostname: '127.0.0.1',
  port: 3000,
  path: '/api/auth/profile',
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', data);
  });
});

req.on('error', (e) => console.error('Error:', e.message));
req.end();