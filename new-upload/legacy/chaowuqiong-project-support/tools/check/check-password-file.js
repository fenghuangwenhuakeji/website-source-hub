const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH连接成功');
  
  const commands = `
echo "=== 1. 查看 Brfj0114.txt 文件 ==="
cat /root/backup_20260324/Brfj0114.txt

echo ""
echo "=== 2. 查看 init-db.sql 文件内容 ==="
head -50 /root/backup_20260324/apps/license-backend/scripts/init-db.sql

echo ""
echo "=== 3. 查找其他可能的密码文件 ==="
find /root -maxdepth 3 -name "*.txt" -o -name "*password*" -o -name "*pwd*" 2>/dev/null | grep -v node_modules | head -10

echo ""
echo "=== 4. 检查 MySQL 是否运行 ==="
ps aux | grep mysql | grep -v grep

echo ""
echo "=== 5. 尝试无密码登录 MySQL (如果允许) ==="
mysql -u root -e "SELECT 1;" 2>&1 | head -3
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
