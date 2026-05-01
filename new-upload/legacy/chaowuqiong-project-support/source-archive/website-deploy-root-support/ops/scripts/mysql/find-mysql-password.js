const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH连接成功');
  
  const commands = `
echo "=== 1. 查看 MySQL 用户和认证方式 ==="
mysql -u root -e "SELECT user, host, plugin FROM mysql.user WHERE user='root';" 2>&1 || echo "无法登录MySQL"

echo ""
echo "=== 2. 检查是否有其他 .env 备份文件 ==="
find /root -name "*.env*" -type f 2>/dev/null | xargs grep -l "DB_PASSWORD\|password" 2>/dev/null | head -10

echo ""
echo "=== 3. 查看 backup_20260324 目录结构 ==="
ls -la /root/backup_20260324/ | head -20

echo ""
echo "=== 4. 查看是否有数据库初始化脚本 ==="
find /root/backup_20260324 -name "*.sql" -o -name "*init*" -o -name "*setup*" 2>/dev/null | grep -v node_modules | head -10

echo ""
echo "=== 5. 检查 PM2 日志中是否有密码信息 ==="
grep -i "password\|数据库连接成功" /root/.pm2/logs/license-backend-out.log 2>/dev/null | tail -5
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
