const fs = require('fs');

const filePath = '/root/backup_20260324/apps/license-backend/src/routes/payment.js';
let content = fs.readFileSync(filePath, 'utf8');

// 检查是否有正确的订单查询逻辑
console.log('检查 payment.js 中的自动支付逻辑...');

if (content.includes('SELECT * FROM recharge_orders WHERE id = ?')) {
    console.log('✅ 订单查询逻辑存在');
} else {
    console.log('❌ 订单查询逻辑可能有问题');
}

if (content.includes('UPDATE users SET points = points + ?')) {
    console.log('✅ 积分更新逻辑存在');
} else {
    console.log('❌ 积分更新逻辑可能有问题');
}

if (content.includes('UPDATE users SET membership_expire = ?')) {
    console.log('✅ 会员时长更新逻辑存在');
} else {
    console.log('❌ 会员时长更新逻辑可能有问题');
}

// 检查 orders.js 中的兑换逻辑
const ordersPath = '/root/backup_20260324/apps/license-backend/src/routes/orders.js';
let ordersContent = fs.readFileSync(ordersPath, 'utf8');

console.log('\n检查 orders.js 中的兑换逻辑...');

if (ordersContent.includes('UPDATE users SET membership_expire = ?, points = points + ?')) {
    console.log('✅ 兑换后积分和时长更新逻辑存在');
} else {
    console.log('❌ 兑换后积分和时长更新逻辑可能有问题');
}

console.log('\n检查完成');
