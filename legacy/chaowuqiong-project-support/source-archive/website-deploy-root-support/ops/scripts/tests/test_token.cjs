const http = require('http');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJlMmE1ODM3ZC0zODhiLTRlNzItYTJlMy03ZmJjOGNkNWI0NzUiLCJ1c2VybmFtZSI6InJvb3RhZG1pbiIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzc0NDQ3OTkyLCJleHAiOjE3NzUwNTI3OTJ9.vAECUUP7pVefl6J_mAF-DcjK3pfo-RXIKAfu2bZEU9A';

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