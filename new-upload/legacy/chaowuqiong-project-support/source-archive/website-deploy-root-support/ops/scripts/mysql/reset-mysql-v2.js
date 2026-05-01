const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH连接成功');
  
  // 使用另一种方法重置MySQL密码
  const commands = `
echo "=== 查找 MySQL 安装位置 ==="
which mysql
which mysqld
rpm -qa | grep mysql | head -3

echo ""
echo "=== 检查 MySQL 服务状态 ==="
systemctl status mysqld --no-pager 2>&1 | head -10

echo ""
echo "=== 尝试使用 mysqladmin 重置密码 ==="
# 先尝试停止MySQL
pkill -9 mysqld 2>/dev/null
sleep 2

# 使用 init-file 方法重置密码
cat > /tmp/reset_password.sql << 'EOF'
ALTER USER 'root'@'localhost' IDENTIFIED BY 'gong134135';
FLUSH PRIVILEGES;
EOF

# 启动MySQL并执行重置脚本
mysqld --init-file=/tmp/reset_password.sql --console &
sleep 5

# 检查MySQL是否启动
ps aux | grep mysqld | grep -v grep

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
