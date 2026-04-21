const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH连接成功');
  
  // 修复 MySQL 8.0 认证插件问题
  const commands = `
echo "=== 1. 检查当前 root 用户的认证插件 ==="
mysql -u root -p"gong134135" -e "SELECT user, host, plugin FROM mysql.user WHERE user='root';" 2>&1

echo ""
echo "=== 2. 修改 root 用户使用 mysql_native_password 认证 ==="
mysql -u root -p"gong134135" << 'MYSQL_EOF'
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'gong134135';
FLUSH PRIVILEGES;
MYSQL_EOF

echo ""
echo "=== 3. 验证修改 ==="
mysql -u root -p"gong134135" -e "SELECT user, host, plugin FROM mysql.user WHERE user='root';" 2>&1

echo ""
echo "=== 4. 重启后端服务 ==="
cd /root/backup_20260324/apps/license-backend
pm2 restart license-backend
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
