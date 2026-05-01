const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 测试完整的登录流程
const password = 'gong134135';
const storedHash = '$2a$10$O9Lox2kaydxZgH5i0skmBO5KaB88wlIaQsWoLlcQE80ASX8AhYqS.';

// 1. 验证密码
const passwordValid = bcrypt.compareSync(password, storedHash);
console.log('1. Password valid:', passwordValid);

// 2. 生成 token
const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';
const userId = 'e2a5837d-388b-4e72-a2e3-7fbc8cd5b475'; // rootadmin's id
const token = jwt.sign({ userId: userId, username: 'rootadmin', role: 'user' }, JWT_SECRET, { expiresIn: '7d' });
console.log('2. Token generated:', token.substring(0, 50) + '...');

// 3. 验证 token
try {
  const decoded = jwt.verify(token, JWT_SECRET);
  console.log('3. Token verified, userId:', decoded.userId, 'type:', typeof decoded.userId);
} catch (e) {
  console.log('3. Token verification failed:', e.message);
}

// 4. 检查 userId 类型是否匹配
console.log('4. userId is string:', typeof userId === 'string');
console.log('5. decoded.userId type:', typeof decoded?.userId);