const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');

const JWT_SECRET = '0aee186a291f6dea1596d2614bb84d49d25aa75765161952c95d5099ed4e3b00dd3f9c55b8a9b45a324325d65b42af41c3b7d98ab55e6c07e96b99224aeaef5c';

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJlMmE1ODM3ZC0zODhiLTRlNzItYTJlMy03ZmJjOGNkNWI0NzUiLCJ1c2VybmFtZSI6InJvb3RhZG1pbiIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzc0NDQ3OTkyLCJleHAiOjE3NzUwNTI3OTJ9.vAECUUP7pVefl6J_mAF-DcjK3pfo-RXIKAfu2bZEU9A';

try {
  const decoded = jwt.verify(token, JWT_SECRET);
  console.log('1. Token verified, decoded:', JSON.stringify(decoded));
  console.log('2. userId type:', typeof decoded.userId, ', value:', decoded.userId);
  console.log('3. userId is string:', typeof decoded.userId === 'string');

  // Test database query
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'rootadmin',
    password: 'gong134135',
    database: 'chaowuqiong_db'
  });

  const query = 'SELECT id, username, status FROM users WHERE id = ? AND status = "active"';
  console.log('4. Query:', query);
  console.log('5. Query param:', decoded.userId);

  pool.execute(query, [decoded.userId])
    .then(([rows]) => {
      console.log('6. Query result:', rows.length, 'rows');
      if (rows.length > 0) {
        console.log('7. User found:', rows[0].username);
      } else {
        console.log('7. NO USER FOUND');
        // Try without status filter
        pool.execute('SELECT id, username, status FROM users WHERE id = ?', [decoded.userId])
          .then(([rows2]) => {
            console.log('8. Without status filter:', rows2.length, 'rows');
            if (rows2.length > 0) {
              console.log('9. User:', rows2[0]);
            }
          });
      }
      pool.end();
    })
    .catch(err => console.error('DB Error:', err.message));

} catch (e) {
  console.error('Token verify error:', e.message);
}