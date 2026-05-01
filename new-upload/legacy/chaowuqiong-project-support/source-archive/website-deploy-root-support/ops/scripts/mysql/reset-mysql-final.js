const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH连接成功');
  
  // MySQL 8.0 密码重置方法
  const commands = `
echo "=== 停止 MySQL 服务 ==="
systemctl stop mysqld
sleep 2

echo ""
echo "=== 以跳过权限方式启动 MySQL ==="
# 创建必要的目录
mkdir -p /var/run/mysqld
chown mysql:mysql /var/run/mysqld

# 使用 mysqld_safe 以跳过权限表方式启动
cd /var/lib/mysql
su - mysql -s /bin/bash -c "mysqld --skip-grant-tables --skip-networking &"
sleep 5

echo ""
echo "=== 重置 root 密码 ==="
# 连接到 MySQL 并重置密码
mysql -u root << 'MYSQL_EOF'
FLUSH PRIVILEGES;
ALTER USER 'root'@'localhost' IDENTIFIED BY 'gong134135';
FLUSH PRIVILEGES;
EXIT;
MYSQL_EOF

echo ""
echo "=== 停止跳过权限的 MySQL ==="
pkill -9 mysqld 2>/dev/null
sleep 2

echo ""
echo "=== 正常启动 MySQL 服务 ==="
systemctl start mysqld
sleep 3

echo ""
echo "=== 测试新密码 ==="
mysql -u root -p"gong134135" -e "SELECT '密码重置成功' as result, USER() as user;" 2>&1
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
