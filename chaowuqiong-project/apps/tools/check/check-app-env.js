const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH连接成功');
  
  const commands = `
echo "=== 1. 检查 app.js 是否加载了 dotenv ==="
head -5 /root/backup_20260324/apps/license-backend/app.js

echo ""
echo "=== 2. 检查 .env 文件权限 ==="
ls -la /root/backup_20260324/apps/license-backend/.env

echo ""
echo "=== 3. 手动测试 dotenv 加载 ==="
cd /root/backup_20260324/apps/license-backend
node -e "require('dotenv').config(); console.log('DB_NAME:', process.env.DB_NAME); console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '已设置' : '未设置');"

echo ""
echo "=== 4. 检查 PM2 启动时的工作目录 ==="
pm2 describe license-backend | grep -E "cwd|exec cwd"
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
