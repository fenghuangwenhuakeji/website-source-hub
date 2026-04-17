const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH连接成功');
  
  // 更新 .env 文件中的数据库名称
  const commands = `
cd /root/backup_20260324/apps/license-backend

# 备份原文件
cp .env .env.backup

# 更新数据库名称
sed -i 's/DB_NAME=license_db/DB_NAME=license_system/' .env

# 验证修改
echo "=== 更新后的配置 ==="
grep DB_NAME .env

echo ""
echo "=== 重启服务 ==="
pm2 restart license-backend
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
