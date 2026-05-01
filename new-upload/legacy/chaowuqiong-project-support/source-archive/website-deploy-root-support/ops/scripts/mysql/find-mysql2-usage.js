const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH连接成功');
  conn.exec('grep -r "require.*mysql2" /root/backup_20260324/apps/license-backend/ --include="*.js" 2>/dev/null | grep -v node_modules', (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      conn.end();
    }).on('data', (data) => {
      console.log('使用 mysql2 的文件:');
      console.log('' + data);
    });
  });
}).connect({
  host: '115.190.158.182',
  port: 22,
  username: 'root',
  password: 'Brfj0114'
});
