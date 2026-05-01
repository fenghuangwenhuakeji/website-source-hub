const http = require('http');

const postData = JSON.stringify({
  username: 'test',
  password: 'test123'
});

const options = {
  hostname: '115.190.158.182',
  port: 80,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(options, (res) => {
  console.log(`状态码: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('响应:', data);
  });
});

req.on('error', (e) => {
  console.error(`请求出错: ${e.message}`);
});

req.write(postData);
req.end();
