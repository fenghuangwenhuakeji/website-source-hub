const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

// Load .env
dotenv.config({ path: '/var/www/chaowuqiong/apps/backend/.env' });

const JWT_SECRET = process.env.JWT_SECRET || 'default';
console.log('JWT_SECRET loaded:', JWT_SECRET.substring(0, 20) + '...');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJlMmE1ODM3ZC0zODhiLTRlNzItYTJlMy03ZmJjOGNkNWI0NzUiLCJ1c2VybmFtZSI6InJvb3RhZG1pbiIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzc0NDQ4MzA5LCJleHAiOjE3NzUwNTMxMDl9.SOt5U3ALhrGERx9cd-jVeDqSu253Z1fn6OhmdMpYDDI';

async function test() {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('1. Token verified, userId:', decoded.userId);

    const pool = mysql.createPool({
      host: 'localhost',
      user: 'rootadmin',
      password: 'gong134135',
      database: 'chaowuqiong_db'
    });

    console.log('2. Querying database for userId:', decoded.userId);
    const [rows] = await pool.execute(
      'SELECT id, username, status FROM users WHERE id = ? AND status = "active"',
      [decoded.userId]
    );

    console.log('3. Query result:', rows.length, 'rows');
    if (rows.length > 0) {
      console.log('4. User found:', rows[0].username, 'status:', rows[0].status);
    } else {
      console.log('4. NO USER FOUND - trying without status filter');
      const [rows2] = await pool.execute('SELECT id, username, status FROM users WHERE id = ?', [decoded.userId]);
      console.log('5. Without filter:', rows2.length, 'rows');
      if (rows2.length > 0) {
        console.log('6. User:', rows2[0]);
      }
    }

    await pool.end();
  } catch (e) {
    console.error('Error:', e.message);
  }
}

test();