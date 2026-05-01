const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH连接成功');
  
  // 查找可能包含数据库密码的文件
  const commands = `
echo "=== 1. 查找 .env 文件 ==="
find /root/backup_20260324 -name ".env" -o -name ".env.*" 2>/dev/null | head -5

echo ""
echo "=== 2. 查找配置文件中的密码 ==="
grep -r "DB_PASSWORD\|dbPassword\|database.*password\|mysql.*password" /root/backup_20260324/apps/license-backend/ 2>/dev/null | grep -v node_modules | head -10

echo ""
echo "=== 3. 查看旧的 ecosystem.config.js ==="
cat /root/backup_20260324/apps/license-backend/ecosystem.config.js 2>/dev/null | grep -i password

echo ""
echo "=== 4. 查看 database.js 配置文件 ==="
cat /root/backup_20260324/apps/license-backend/config/database.js 2>/dev/null | head -30

echo ""
echo "=== 5. 查找其他可能的配置文件 ==="
ls -la /root/backup_20260324/apps/license-backend/config/ 2>/dev/null
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
