const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH连接成功');
  
  const commands = `
mysql -u root -p"gong134135" << 'MYSQL_EOF'
USE license_system;

-- 检查并添加 referred_by 字段
SET @exist := (SELECT COUNT(*) FROM information_schema.columns 
WHERE table_schema = 'license_system' AND table_name = 'users' AND column_name = 'referred_by');
SET @sql := IF(@exist = 0, 'ALTER TABLE users ADD COLUMN referred_by VARCHAR(255) DEFAULT NULL', 'SELECT "referred_by already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 检查并添加 referral_code 字段
SET @exist := (SELECT COUNT(*) FROM information_schema.columns 
WHERE table_schema = 'license_system' AND table_name = 'users' AND column_name = 'referral_code');
SET @sql := IF(@exist = 0, 'ALTER TABLE users ADD COLUMN referral_code VARCHAR(255) DEFAULT NULL', 'SELECT "referral_code already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 查看更新后的表结构
DESCRIBE users;
MYSQL_EOF

echo ""
echo "=== 验证字段添加成功 ==="
mysql -u root -p"gong134135" -e "SELECT column_name FROM information_schema.columns WHERE table_schema='license_system' AND table_name='users' AND column_name IN ('referred_by', 'referral_code');" 2>&1
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
