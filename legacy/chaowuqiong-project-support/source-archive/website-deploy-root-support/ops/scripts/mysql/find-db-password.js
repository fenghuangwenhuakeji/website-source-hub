const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH连接成功');
  // 查找可能的数据库配置文件
  conn.exec('find /root/backup_20260324 -name "*.js" -exec grep -l "DB_PASSWORD\|dbPassword\|database.*password" {} \; 2>/dev/null | head -5', (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      console.log('命令执行完成，退出码: ' + code);
      conn.end();
    }).on('data', (data) => {
      console.log('找到的文件: ' + data);
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
