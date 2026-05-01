const bcrypt = require('bcryptjs');

// 验证数据库中的hash是否能匹配密码
const storedHash = '$2a$10$O9Lox2kaydxZgH5i0skmBO5KaB88wlIaQsWoLlcQE80ASX8AhYqS.';
const password = 'gong134135';

const isMatch = bcrypt.compareSync(password, storedHash);
console.log('Password check result:', isMatch);

if (!isMatch) {
  // 生成新的正确hash
  const newHash = bcrypt.hashSync(password, 10);
  console.log('New hash:', newHash);
  console.log('New hash works:', bcrypt.compareSync(password, newHash));
}