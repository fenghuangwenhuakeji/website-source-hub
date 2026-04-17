const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH连接成功');
  
  // 先删除现有服务，然后用新的配置启动
  const commands = `
cd /root/backup_20260324/apps/license-backend
pm2 delete license-backend 2>/dev/null
export DB_PASSWORD="gong134135"
export ALIPAY_APP_ID="2021006140607225"
export ALIPAY_GATEWAY_URL="https://openapi.alipay.com/gateway.do"
export ALIPAY_NOTIFY_URL="http://115.190.158.182/api/payment/callback/alipay"
export ALIPAY_RETURN_URL="http://115.190.158.182/payment/return"
export ALIPAY_PRIVATE_KEY="MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCqZHn9MfLt/zhTOLWGbEwnU/v1vb9Zf6nRoD8Hrq9Al/9vd4cUoYMjULA9/TTyewN1Oa+mIRaK5nM7GDg5PrVm/B44/g1AkcrnV6rWb4VWzDyfzMR7DisbHi8CxnhZuSEc/B0yjL6RK1lYDVLDEq1PwG13s4b86Uq7apyzVrNpLuOnUD0ytdq2BgzyciUaPeSIljMESL+SMAfKMQH/w+UQ6Y2MOT0MHjbxC8qmq6iobg4PoorT47sfOrhsbqKt4m06wySMZ+xeUoYnCYE4vuRBUfGY7gwSiFodcYR+2RG59+z184nGnVqBMI6IFSW4IQRqXGIYp6VRLxoGShpkVYt3AgMBAAECggEARZ23mZMGxeY4hQfuYnVsx8SwdL6Jp29ZWqQ2HFVqlOGFI22aavtyMMOOvkTtlQRdbU+cTCvIogd1nPdQQVM1mlX3oyFpGLB4Tfyrd+EogUYAnulyfTRUuEekvWWJVl8lAEqhQz3tvjIP1sHaxoii9qqQDw/yXvKR7fCpBTyvIJG1D/xVHo/1lT1jSbbDuxRMoVo3FEwf6PXIv55bS3Ey0hhngR116wblQca0ktwHG5dhqrrpLQ+Cj2DZB1JgXSkkIgno1lUSbUNWnNDpHFoKVjquKhofnAZNPM3bNUzzAV5QBWUzN/sFIfGIXdKs/wnJGXiULHz2+TAXt2wl4V+4AQKBgQDUxtITdO5Q+OcV90V87u7MsmYhGtzaieYSJOOoEa1DBWSG5gTpsq/kc4EDQB4IDhP6oReBPsIxjpP1OmeQ07HSbkcXTJII/YCFrLsiBW5T/SUIlCM5Ok0OpsI5AhndiXa6LuCd/jtIcb2Pxt9zEWc/La3RXUaStABXNTRny8wbgQKBgQDNAYWIjontRjuQzcxijIXcMyE6O/8Dp6HTeyqs0vghq1hrSnMhUpPf1LLfob96SXGVXK2SasBAEn4k8YRbg10H6hqBDCaS9/qUP34ehOVEAby9OQedKz1Fd81uLpOG9r6uHWCMgfS4+5NTqSn37ntHnX9lUNKfNrMme7BhAjAC9wKBgAFGo/Hb7KXtqC0Yi4EhSatOkpA2QgbJdui68eaLHJffS2gHrxXbrXRYQPjNBKEVvIbvOl3bC30Sls6MqBxVOKbDZIe+PM3y/zdN/t1IXQ4B4Zv4j3GDaPzigR2oZpFOhri9GTm5UY+wputazPI6s3zMgFNWFNtCWxIqzoKk1TeBAoGBALsOk2B55yJovjsvfTnCzPWSddQkIFmeYIuOS+8sBRr7tI8ZfJnANou7EYf6l7OmRgyqZvo9i7Qq640cDtBNudpZ4tszUhMyUCNrF9ITIvr9ttDVs7vWU28KlJjfyN8SUASha5JplfogG1rv9Qp0QWqkLDUvHTAHgkov/E1X6KUbAoGBAL17tPALMJxdTxMZ5V8GD5WEZp6QrKE5DIJ03Vz78rg4JugXga6TvpWYBxT3UbUlBStxvazAGr7rcKnRv/rs4VTTp8GPUwtWh14nFqmQJHbZd6zhsRX3sFUl1XNtdBC9pWwbs0ki3qUN+a87NmmcgQonhrCwC40SmfVaLjUyOG/J"
export ALIPAY_PUBLIC_KEY="MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA7Wd/YYi2qNJjEyynBe5GA/sj8EJyu+z0O2//WIaep2hfumI0EgGbl05pDvkD8vY+CYOlx62RQd/FSm1O+IcqV6dCJjxe1NRwS6FEk/qRTkQp4CRmzcDY6ON9E6dcEq19n8XW2imSRLZJE2PnCCEehm+ZjkSM/uRErTKlDWWVpegCyMKw1V10x8sYQRckN7pvYolaYTOQfB43gs9oSzBZRvUp5otYpMPe2PaJFsyys+rkdx8gyM8f3XOt0IpMixoN69ZSxMbnfal8iFUB/puAZgX21OsDMr5grx72qwrIfqBib5/wnE+dWsnTHb8uSkGntQhhtvDqWOlvxxG2cx+4qwIDAQAB"
pm2 start app.js --name license-backend
`;
  
  conn.exec(commands, (err, stream) => {
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
