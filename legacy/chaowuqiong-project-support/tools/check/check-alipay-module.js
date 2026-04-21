const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH连接成功');
  conn.exec('cd /root/backup_20260324 && node -e "const m = require(\'alipay-sdk\'); console.log(\'Module type:\', typeof m); console.log(\'Keys:\', Object.keys(m)); console.log(\'Default:\', typeof m.default); console.log(\'AlipaySdk:\', typeof m.AlipaySdk);"', (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      console.log('命令执行完成，退出码: ' + code);
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
