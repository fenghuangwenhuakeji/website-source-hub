const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH连接成功');
  conn.exec('find / -name "app.js" -path "*license*" 2>/dev/null | head -5', (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      console.log('命令执行完成，退出码: ' + code);
      conn.end();
    }).on('data', (data) => {
      console.log('找到的路径: ' + data);
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
