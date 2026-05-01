const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH连接成功');
  conn.exec('cat /root/.pm2/logs/license-backend-error.log | tail -30', (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      conn.end();
    }).on('data', (data) => {
      console.log('错误日志:');
      console.log('' + data);
    });
  });
}).connect({
  host: '115.190.158.182',
  port: 22,
  username: 'root',
  password: 'Brfj0114'
});
