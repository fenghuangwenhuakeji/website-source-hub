const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH连接成功');
  
  const commands = `
cd /root/backup_20260324/apps/license-backend

# 删除现有服务
pm2 delete license-backend 2>/dev/null

# 加载环境变量并启动
export $(cat .env | xargs)

# 启动服务
pm2 start app.js --name license-backend

sleep 3

# 检查状态
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
