const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH连接成功');
  
  const commands = `
echo "=== 1. 检查 .env 文件中的数据库配置 ==="
cat /root/backup_20260324/apps/license-backend/.env | grep DB

echo ""
echo "=== 2. 测试 MySQL 连接（使用环境变量） ==="
cd /root/backup_20260324/apps/license-backend
export $(cat .env | xargs)
mysql -u $DB_USER -p"$DB_PASSWORD" -e "SELECT '连接成功' as result;" 2>&1

echo ""
echo "=== 3. 检查数据库是否存在 ==="
mysql -u root -p"gong134135" -e "SHOW DATABASES LIKE 'license%';" 2>&1

echo ""
echo "=== 4. 检查 database.js 配置 ==="
cat /root/backup_20260324/apps/license-backend/config/database.js | grep -A 10 "DB_CONFIG"
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
