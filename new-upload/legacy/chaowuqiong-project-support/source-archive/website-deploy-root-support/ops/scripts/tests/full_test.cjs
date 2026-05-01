const http = require('http');

function post(path, data, token) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    const options = {
      hostname: '127.0.0.1',
      port: 3000,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({ status: res.statusCode, body: JSON.parse(data) });
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function get(path, token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port: 3000,
      path: path,
      method: 'GET',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function test() {
  console.log('1. Testing login...');
  const loginResult = await post('/api/auth/login', {
    username: 'rootadmin',
    password: 'gong134135'
  });
  console.log('   Login status:', loginResult.status);
  console.log('   Login success:', loginResult.body.success);

  if (loginResult.body.success) {
    const token = loginResult.body.data.token;
    console.log('   Token:', token.substring(0, 50) + '...');

    console.log('\n2. Testing profile with new token...');
    const profileResult = await get('/api/auth/profile', token);
    console.log('   Profile status:', profileResult.status);
    console.log('   Profile success:', profileResult.body.success);
    if (profileResult.body.success) {
      console.log('   User:', profileResult.body.data.username);
    } else {
      console.log('   Error:', profileResult.body.message);
    }
  }
}

test().catch(console.error);