#!/bin/bash

# 创建环境变量配置文件
cat > /root/backup_20260324/apps/license-backend/.env << 'EOF'
# 支付宝配置
ALIPAY_APP_ID=2021006140607225
ALIPAY_GATEWAY_URL=https://openapi.alipay.com/gateway.do
ALIPAY_NOTIFY_URL=https://fhwhkj.top/api/payment/callback/alipay
ALIPAY_RETURN_URL=http://115.190.158.182/payment/success

# 密钥将在启动时从安全位置加载
EOF

echo "环境变量配置已创建"

# 创建密钥文件（权限设置为600）
cat > /root/backup_20260324/apps/license-backend/alipay_private_key.pem << 'EOF'
-----BEGIN RSA PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCqZHn9MfLt/zhT
OLWGbEwnU/v1vb9Zf6nRoD8Hrq9Al/9vd4cUoYMjULA9/TTyewN1Oa+mIRaK5nM7
GDg5PrVm/B44/g1AkcrnV6rWb4VWzDyfzMR7DisbHi8CxnhZuSEc/B0yjL6RK1lY
DVLDEq1PwG13s4b86Uq7apyzVrNpLuOnUD0ytdq2BgzyciUaPeSIljMESL+SMAfK
MQH/w+UQ6Y2MOT0MHjbxC8qmq6iobg4PoorT47sfOrhsbqKt4m06wySMZ+xeUoYn
CYE4vuRBUfGY7gwSiFodcYR+2RG59+z184nGnVqBMI6IFSW4IQRqXGIYp6VRLxoG
ShpkVYt3AgMBAAECggEARZ23mZMGxeY4hQfuYnVsx8SwdL6Jp29ZWqQ2HFVqlOGF
I22aavtyMMOOvkTtlQRdbU+cTCvIogd1nPdQQVM1mlX3oyFpGLB4Tfyrd+EogUYA
nulyfTRUuEekvWWJVl8lAEqhQz3tvjIP1sHaxoii9qqQDw/yXvKR7fCpBTyvIJG1
D/xVHo/1lT1jSbbDuxRMoVo3FEwf6PXIv55bS3Ey0hhngR116wblQca0ktwHG5dh
qrrpLQ+Cj2DZB1JgXSkkIgno1lUSbUNWnNDpHFoKVjquKhofnAZNPM3bNUzzAV5Q
BWUzN/sFIfGIXdKs/wnJGXiULHz2+TAXt2wl4V+4AQKBgQDUxtITdO5Q+OcV90V87
u7MsmYhGtzaieYSJOOoEa1DBWSG5gTpsq/kc4EDQB4IDhP6oReBPsIxjpP1OmeQ07
HSbkcXTJII/YCFrLsiBW5T/SUIlCM5Ok0OpsI5AhndiXa6LuCd/jtIcb2Pxt9zEW
c/La3RXUaStABXNTRny8wbgQKBgQDNAYWIjontRjuQzcxijIXcMyE6O/8Dp6HTey
qs0vghq1hrSnMhUpPf1LLfob96SXGVXK2SasBAEn4k8YRbg10H6hqBDCaS9/qUP3
4ehOVEAby9OQedKz1Fd81uLpOG9r6uHWCMgfS4+5NTqSn37ntHnX9lUNKfNrMme7
BhAjAC9wKBgAFGo/Hb7KXtqC0Yi4EhSatOkpA2QgbJdui68eaLHJffS2gHrxXbrX
RYQPjNBKEVvIbvOl3bC30Sls6MqBxVOKbDZIe+PM3y/zdN/t1IXQ4B4Zv4j3GDaP
zigR2oZpFOhri9GTm5UY+wputazPI6s3zMgFNWFNtCWxIqzoKk1TeBAoGBALsOk2
B55yJovjsvfTnCzPWSddQkIFmeYIuOS+8sBRr7tI8ZfJnANou7EYf6l7OmRgyqZv
o9i7Qq640cDtBNudpZ4tszUhMyUCNrF9ITIvr9ttDVs7vWU28KlJjfyN8SUASha
5JplfogG1rv9Qp0QWqkLDUvHTAHgkov/E1X6KUbAoGBAL17tPALMJxdTxMZ5V8GD
5WEZp6QrKE5DIJ03Vz78rg4JugXga6TvpWYBxT3UbUlBStxvazAGr7rcKnRv/rs4
VTTp8GPUwtWh14nFqmQJHbZd6zhsRX3sFUl1XNtdBC9pWwbs0ki3qUN+a87Nmmcg
QonhrCwC40SmfVaLjUyOG/J
-----END RSA PRIVATE KEY-----
EOF

cat > /root/backup_20260324/apps/license-backend/alipay_public_key.pem << 'EOF'
-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA7Wd/YYi2qNJjEyynBe5G
A/sj8EJyu+z0O2//WIaep2hfumI0EgGbl05pDvkD8vY+CYOlx62RQd/FSm1O+Icq
V6dCJjxe1NRwS6FEk/qRTkQp4CRmzcDY6ON9E6dcEq19n8XW2imSRLZJE2PnCCEe
hm+ZjkSM/uRErTKlDWWVpegCyMKw1V10x8sYQRckN7pvYolaYTOQfB43gs9oSzBZ
RvUp5otYpMPe2PaJFsyys+rkdx8gyM8f3XOt0IpMixoN69ZSxMbnfal8iFUB/puA
ZgX21OsDMr5grx72qwrIfqBib5/wnE+dWsnTHb8uSkGntQhhtvDqWOlvxxG2cx+4
qwIDAQAB
-----END PUBLIC KEY-----
EOF

# 设置权限
chmod 600 /root/backup_20260324/apps/license-backend/alipay_private_key.pem
chmod 600 /root/backup_20260324/apps/license-backend/alipay_public_key.pem
chmod 600 /root/backup_20260324/apps/license-backend/.env

echo "密钥文件已创建"
