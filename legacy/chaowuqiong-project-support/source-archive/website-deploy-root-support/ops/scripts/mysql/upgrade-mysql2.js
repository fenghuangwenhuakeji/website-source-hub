const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH连接成功');
  
  const commands = `
echo "=== 1. 检查当前 mysql2 版本 ==="
cd /root/backup_20260324/apps/license-backend
npm list mysql2

echo ""
echo "=== 2. 升级 mysql2 到最新版本 ==="
npm install mysql2@latest --save

echo ""
echo "=== 3. 验证升级 ==="
npm list mysql2

echo ""
echo "=== 4. 重启服务 ==="
pm2 restart license-backend

echo ""
echo "=== 5. 等待服务启动 ==="
sleep 3
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
