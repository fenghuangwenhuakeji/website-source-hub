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
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { resolve({ error: data }); }
      });
    });
    req.write(loginData);
    req.end();
  });

  console.log('Login success:', loginResult.success);
  const token = loginResult.data?.token;
  console.log('Token:', token?.substring(0, 30) + '...');

  if (token) {
    // Test /api/auth/profile (what frontend actually calls)
    const authProfileOptions = {
      hostname: '127.0.0.1', port: 3000, path: '/api/auth/profile',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    };

    const authProfileResult = await new Promise((resolve) => {
      const req = http.request(authProfileOptions, (res) => {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => {
          try { resolve(JSON.parse(data)); }
          catch { resolve({ error: data }); }
        });
      });
      req.end();
    });
    console.log('\n/api/auth/profile:', JSON.stringify(authProfileResult).substring(0, 300));
  }
}

test().catch(console.error);