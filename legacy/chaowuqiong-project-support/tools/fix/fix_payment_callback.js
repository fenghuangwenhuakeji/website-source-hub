const fs = require('fs');

const filePath = '/root/backup_20260324/apps/license-backend/src/routes/payment.js';
let content = fs.readFileSync(filePath, 'utf8');

// 修复微信支付回调 - 添加 membership_expire 更新
content = content.replace(
    "const orders = await db.query('SELECT user_id, points FROM recharge_orders WHERE order_no = ?', [out_trade_no]);",
    "const orders = await db.query('SELECT user_id, points, duration, duration_unit, amount FROM recharge_orders WHERE order_no = ?', [out_trade_no]);"
);

content = content.replace(
    `if (orders.length > 0) {
            await db.query('UPDATE users SET points = points + ?, total_recharge = total_recharge + ? WHERE id = ?',
                [orders[0].points, orders[0].amount, orders[0].user_id]);       
        }`,
    `if (orders.length > 0) {
            const order = orders[0];
            // 更新积分和总充值金额
            await db.query('UPDATE users SET points = points + ?, total_recharge = total_recharge + ? WHERE id = ?',
                [order.points, order.amount || 0, order.user_id]);
            
            // 更新会员时长
            const [users] = await db.query('SELECT membership_expire FROM users WHERE id = ?', [order.user_id]);
            const user = users?.[0] || users;
            const now = new Date();
            let newExpire;
            
            if (order.duration_unit === 'permanent') {
                newExpire = new Date('2099-12-31');
            } else if (order.duration_unit === 'hour') {
                newExpire = new Date(now.getTime() + order.duration * 60 * 60 * 1000);
            } else {
                newExpire = new Date(now.getTime() + order.duration * 24 * 60 * 60 * 1000);
            }
            
            // 如果已有会员时长，在原有基础上累加
            if (user && user.membership_expire && new Date(user.membership_expire) > now) {
                if (order.duration_unit === 'hour') {
                    newExpire = new Date(new Date(user.membership_expire).getTime() + order.duration * 60 * 60 * 1000);
                } else if (order.duration_unit !== 'permanent') {
                    newExpire = new Date(new Date(user.membership_expire).getTime() + order.duration * 24 * 60 * 60 * 1000);
                }
            }
            
            await db.query('UPDATE users SET membership_expire = ? WHERE id = ?', 
                [newExpire.toISOString().slice(0, 19).replace('T', ' '), order.user_id]);
        }`
);

// 修复支付宝支付回调 - 添加 membership_expire 更新
content = content.replace(
    `if (orders.length > 0) {
            await db.query('UPDATE users SET points = points + ? WHERE id = ?', 
                [orders[0].points, orders[0].user_id]);
        }`,
    `if (orders.length > 0) {
            const order = orders[0];
            // 更新积分
            await db.query('UPDATE users SET points = points + ? WHERE id = ?', 
                [order.points, order.user_id]);
            
            // 更新会员时长
            const [users] = await db.query('SELECT membership_expire FROM users WHERE id = ?', [order.user_id]);
            const user = users?.[0] || users;
            const now = new Date();
            let newExpire;
            
            if (order.duration_unit === 'permanent') {
                newExpire = new Date('2099-12-31');
            } else if (order.duration_unit === 'hour') {
                newExpire = new Date(now.getTime() + order.duration * 60 * 60 * 1000);
            } else {
                newExpire = new Date(now.getTime() + order.duration * 24 * 60 * 60 * 1000);
            }
            
            // 如果已有会员时长，在原有基础上累加
            if (user && user.membership_expire && new Date(user.membership_expire) > now) {
                if (order.duration_unit === 'hour') {
                    newExpire = new Date(new Date(user.membership_expire).getTime() + order.duration * 60 * 60 * 1000);
                } else if (order.duration_unit !== 'permanent') {
                    newExpire = new Date(new Date(user.membership_expire).getTime() + order.duration * 24 * 60 * 60 * 1000);
                }
            }
            
            await db.query('UPDATE users SET membership_expire = ? WHERE id = ?', 
                [newExpire.toISOString().slice(0, 19).replace('T', ' '), order.user_id]);
        }`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ payment.js 修复完成');
