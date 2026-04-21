const fs = require('fs');

const filePath = '/root/backup_20260324/apps/license-backend/src/routes/payment.js';
let content = fs.readFileSync(filePath, 'utf8');

// 1. 修复 rootadmin 自动支付逻辑 - 添加积分和会员时长更新
const oldAutoPay = `        // rootadmin 账号直接通过，无需真实支付
        if (req.user.username === 'rootadmin' || req.user.role === 'admin') {
            return res.json({
                success: true,
                data: {
                    orderId: orderId || 'ROOT' + Date.now(),
                    orderNo: 'ADMIN' + Date.now(),
                    qrCode: null,
                    payUrl: null,
                    autoPaid: true
                }
            });
        }`;

const newAutoPay = `        // rootadmin 账号直接通过，无需真实支付
        if (req.user.username === 'rootadmin' || req.user.role === 'admin') {
            // 自动支付成功，更新订单状态和用户信息
            if (db && orderId) {
                (async () => {
                    try {
                        // 获取订单信息
                        const orders = await db.query(
                            'SELECT * FROM recharge_orders WHERE id = ? AND user_id = ? AND status = ?',
                            [orderId, req.user.userId, 'pending']
                        );
                        
                        if (orders.length > 0) {
                            const order = orders[0];
                            
                            // 更新订单状态为已支付
                            await db.query(
                                'UPDATE recharge_orders SET status = ?, paid_at = NOW() WHERE id = ?',
                                ['paid', orderId]
                            );
                            
                            // 更新用户积分
                            await db.query(
                                'UPDATE users SET points = points + ?, total_recharge = total_recharge + ? WHERE id = ?',
                                [order.points, order.amount || 0, req.user.userId]
                            );
                            
                            // 更新会员时长
                            const [users] = await db.query('SELECT membership_expire FROM users WHERE id = ?', [req.user.userId]);
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
                                [newExpire.toISOString().slice(0, 19).replace('T', ' '), req.user.userId]);
                            
                            console.log('自动支付成功：积分 +' + order.points + ', 时长更新');
                        }
                    } catch (err) {
                        console.error('自动支付处理失败:', err);
                    }
                })();
            }
            
            return res.json({
                success: true,
                data: {
                    orderId: orderId || 'ROOT' + Date.now(),
                    orderNo: 'ADMIN' + Date.now(),
                    qrCode: null,
                    payUrl: null,
                    autoPaid: true
                }
            });
        }`;

if (content.includes(oldAutoPay)) {
    content = content.replace(oldAutoPay, newAutoPay);
    console.log('✅ rootadmin 自动支付逻辑修复完成');
} else {
    console.log('⚠️ 未找到 rootadmin 自动支付逻辑，可能已被修改');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ payment.js 修复完成');
