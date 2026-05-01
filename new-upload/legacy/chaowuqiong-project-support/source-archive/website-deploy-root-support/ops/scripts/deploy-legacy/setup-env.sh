#!/bin/bash

# 设置数据库密码
export DB_PASSWORD="你的数据库密码"

# 设置支付宝配置
export ALIPAY_APP_ID="2021006140607225"
export ALIPAY_GATEWAY_URL="https://openapi.alipay.com/gateway.do"
export ALIPAY_NOTIFY_URL="http://115.190.158.182/api/payment/callback/alipay"
export ALIPAY_RETURN_URL="http://115.190.158.182/payment/return"

# 请替换为实际的私钥和公钥
export ALIPAY_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA...
-----END RSA PRIVATE KEY-----"

export ALIPAY_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...
-----END PUBLIC KEY-----"

# 重启服务
cd /root/backup_20260324/apps/license-backend
pm2 restart license-backend

echo "环境变量已设置，服务已重启"
