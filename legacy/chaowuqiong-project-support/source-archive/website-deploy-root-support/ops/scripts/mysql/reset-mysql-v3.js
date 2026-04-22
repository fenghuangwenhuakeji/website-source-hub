const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH连接成功');
  
  // MySQL 8.0 官方推荐的密码重置方法
  const commands = `
echo "=== 停止 MySQL 服务 ==="
systemctl stop mysqld
sleep 2

echo ""
echo "=== 创建重置密码的 SQL 文件 ==="
cat > /tmp/reset_password.sql << 'EOF'
ALTER USER 'root'@'localhost' IDENTIFIED BY 'gong134135';
FLUSH PRIVILEGES;
EOF

echo ""
echo "=== 使用 mysql 用户启动 MySQL 并执行重置 ==="
# 创建数据目录（如果不存在）
mkdir -p /var/run/mysqld
chown mysql:mysql /var/run/mysqld

# 使用 mysql 用户启动，并执行初始化脚本
su - mysql -s /bin/bash -c "mysqld --init-file=/tmp/reset_password.sql --datadir=/var/lib/mysql &"
sleep 5

echo ""
echo "=== 检查 MySQL 进程 ==="
ps aux | grep mysqld | grep -v grep

echo ""
echo "=== 正常启动 MySQL 服务 ==="
systemctl start mysqld
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
