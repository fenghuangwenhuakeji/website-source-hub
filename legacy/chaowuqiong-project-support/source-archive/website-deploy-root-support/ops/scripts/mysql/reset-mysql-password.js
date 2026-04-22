const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH连接成功');
  
  // 重置MySQL root密码为 gong134135
  const commands = `
echo "=== 停止 MySQL 服务 ==="
systemctl stop mysqld 2>/dev/null || service mysqld stop 2>/dev/null || killall mysqld 2>/dev/null
sleep 2

echo ""
echo "=== 以跳过权限方式启动 MySQL ==="
mysqld_safe --skip-grant-tables --skip-networking &
sleep 5

echo ""
echo "=== 重置 root 密码 ==="
mysql -u root << EOF
FLUSH PRIVILEGES;
ALTER USER 'root'@'localhost' IDENTIFIED BY 'gong134135';
FLUSH PRIVILEGES;
EXIT;
EOF

echo ""
echo "=== 停止跳过权限的 MySQL ==="
killall mysqld 2>/dev/null
sleep 2

echo ""
echo "=== 正常启动 MySQL ==="
systemctl start mysqld 2>/dev/null || service mysqld start 2>/dev/null
sleep 3

echo ""
echo "=== 测试新密码 ==="
mysql -u root -p"gong134135" -e "SELECT '密码重置成功' as result;" 2>&1
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
