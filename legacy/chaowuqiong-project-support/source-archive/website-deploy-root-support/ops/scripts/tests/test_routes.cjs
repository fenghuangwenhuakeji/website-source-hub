const http = require('http');

async function test() {
  // Login first
  const loginData = JSON.stringify({ username: 'rootadmin', password: 'gong134135' });
  const loginOptions = {
    hostname: '127.0.0.1', port: 3000, path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(loginData) }
  };

  const loginResult = await new Promise((resolve) => {
    const req = http.request(loginOptions, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.write(loginData);
    req.end();
  });

  console.log('Login success:', loginResult.success);
  const token = loginResult.data?.token;
  console.log('Token:', token?.substring(0, 30) + '...');

  if (token) {
    // Test /api/user/profile
    const profileOptions = {
      hostname: '127.0.0.1', port: 3000, path: '/api/user/profile',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    };

    const profileResult = await new Promise((resolve) => {
      const req = http.request(profileOptions, (res) => {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => {
          try { resolve(JSON.parse(data)); }
          catch { resolve({ error: data }); }
        });
      });
      req.end();
    });
    console.log('\n/api/user/profile:', JSON.stringify(profileResult).substring(0, 200));

    // Test /api/orders/exchange (GET)
    const exchangeOptions = {
      hostname: '127.0.0.1', port: 3000, path: '/api/orders/points-exchange',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    };

    const exchangeResult = await new Promise((resolve) => {
      const req = http.request(exchangeOptions, (res) => {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => {
          try { resolve(JSON.parse(data)); }
          catch { resolve({ error: data }); }
        });
      });
      req.end();
    });
    console.log('\n/api/orders/points-exchange:', JSON.stringify(exchangeResult).substring(0, 200));
  }
}

test().catch(console.error);