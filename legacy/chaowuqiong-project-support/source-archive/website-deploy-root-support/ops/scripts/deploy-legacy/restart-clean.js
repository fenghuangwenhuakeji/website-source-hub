const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH连接成功');
  
  const commands = `
echo "=== 1. 删除并重新启动服务 ==="
cd /root/backup_20260324/apps/license-backend
pm2 delete license-backend 2>/dev/null
sleep 1

# 确保环境变量已加载
export $(cat .env | xargs)

# 使用 PM2 启动，并传递环境变量
pm2 start app.js --name license-backend --update-env

sleep 3

echo ""
echo "=== 2. 检查服务状态 ==="
pm2 status | grep license-backend

echo ""
echo "=== 3. 查看最新日志 ==="
pm2 logs license-backend --lines 10 2>&1 | tail -15
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
