const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH连接成功');
  
  const commands = `
echo "=== 1. 检查 backend 目录结构 ==="
ls -la /root/backup_20260324/apps/backend/dist/ 2>/dev/null | head -15

echo ""
echo "=== 2. 检查现有 PM2 服务 ==="
pm2 status

echo ""
echo "=== 3. 检查端口占用 ==="
netstat -tlnp | grep -E "3000|3001|3002"

echo ""
echo "=== 4. 检查 Nginx 配置 ==="
cat /etc/nginx/conf.d/chaowuqiong.conf | grep -A 3 "api"
`;
  
  conn.exec(commands, (err, stream) => {
    if (err) {
      console.error('执行命令失败:', err);
      conn.end();
      return;
    }
    
    stream.on('close', (code) => {
      console.log(`\n命令执行完成，退出码: ${code}`);
      conn.end();
    }).on('data', (data) => {
      console.log('' + data);
    }).stderr.on('data', (data) => {
      console.log('' + data);
    });
  });
}).connect({
  host: '115.190.158.182',
  port: 22,
  username: 'root',
  password: 'Brfj0114'
});
