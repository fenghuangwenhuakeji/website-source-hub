const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH连接成功');
  
  const commands = `
echo "=== 1. 检查 users 表结构 ==="
mysql -u root -p"gong134135" -e "DESCRIBE license_system.users;" 2>&1

echo ""
echo "=== 2. 添加缺失的字段到 users 表 ==="
mysql -u root -p"gong134135" << 'MYSQL_EOF'
USE license_system;

-- 添加 referred_by 字段（如果存在则忽略错误）
ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by VARCHAR(255) DEFAULT NULL;

-- 添加 referral_code 字段（如果存在则忽略错误）
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code VARCHAR(255) DEFAULT NULL;

-- 添加 points 字段（如果存在则忽略错误）
ALTER TABLE users ADD COLUMN IF NOT EXISTS points INT DEFAULT 0;

-- 查看更新后的表结构
DESCRIBE users;
MYSQL_EOF

echo ""
echo "=== 3. 验证字段添加成功 ==="
mysql -u root -p"gong134135" -e "DESCRIBE license_system.users;" 2>&1
`;
  
  conn.exec(commands, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      console.log('\n命令执行完成，退出码: ' + code);
      conn.end();
    }).on('data', (data) => {
      console.log('' + data);
    }).stderr.on('data', (data) => {
      console.log('STDERR: ' + data);
    });
  });
}).connect({
  host: '115.190.158.182',
  port: 22,
  username: 'root',
  password: 'Brfj0114'
});
