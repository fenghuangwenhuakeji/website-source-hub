const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH连接成功');
  
  const commands = `
cd /root/backup_20260324/apps/backend

echo "=== 1. 恢复原始 tsconfig.json ==="
git checkout tsconfig.json 2>/dev/null || true

echo ""
echo "=== 2. 检查是否有已编译的 dist 目录 ==="
ls -la dist/index.js 2>/dev/null || echo "dist/index.js 不存在"

echo ""
echo "=== 3. 尝试直接运行 TypeScript (使用 ts-node) ==="
# 安装 ts-node
npm install ts-node typescript --save-dev 2>&1 | tail -3

echo ""
echo "=== 4. 使用 ts-node 启动服务 ==="
pm2 delete chaowuqiong-backend 2>/dev/null
pm2 start npx --name chaowuqiong-backend -- ts-node src/index.ts

sleep 5

echo ""
echo "=== 5. 检查服务状态 ==="
pm2 status | grep chaowuqiong-backend
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
