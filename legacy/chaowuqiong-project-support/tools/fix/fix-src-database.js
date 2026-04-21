const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH连接成功');
  
  const commands = `
cd /root/backup_20260324/apps/license-backend

echo "=== 1. 检查 src/config/database.js 内容 ==="
head -20 src/config/database.js

echo ""
echo "=== 2. 复制已修复的 database.js 到 src/config/ ==="
cp config/database.js src/config/database.js

echo ""
echo "=== 3. 验证复制成功 ==="
head -20 src/config/database.js

echo ""
echo "=== 4. 重启服务 ==="
pm2 restart license-backend

sleep 3

echo ""
echo "=== 5. 检查状态 ==="
pm2 status | grep license-backend
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
