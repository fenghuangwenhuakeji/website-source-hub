const fs = require('fs');

const filePath = '/root/backup_20260324/apps/license-backend/src/routes/payment.js';
let content = fs.readFileSync(filePath, 'utf8');

// 添加 /status/:orderId 路由（如果不存在）
if (!content.includes("router.get('/status/")) {
    // 在 /qrcode/:orderId 路由之前添加 /status/:orderId 路由
    const newRoute = `
// 查询订单状态
router.get('/status/:orderId', authMiddleware, async (req, res, next) => {
    try {
        if (!db) {
            return res.json({
                success: true,
                data: { status: 'paid', message: '演示模式' }
            });
        }

        const orders = await db.query(
            'SELECT id, order_no, status, paid_at, amount, points, package_name, duration, duration_unit FROM recharge_orders WHERE order_no = ? AND user_id = ?',
            [req.params.orderId, req.user.userId]
        );

        if (orders.length === 0) {
            throw new AppError('订单不存在', 404);
        }

        const order = orders[0];
        
        // 如果订单已支付，同时返回用户信息（积分和会员时长）
        let userInfo = null;
        if (order.status === 'paid') {
            const [users] = await db.query(
                'SELECT points, membership_expire FROM users WHERE id = ?',
                [req.user.userId]
            );
            if (users && users.length > 0) {
                userInfo = users[0];
            }
        }

        res.json({
            success: true,
            data: {
                orderId: order.id,
                orderNo: order.order_no,
                status: order.status,
                paidAt: order.paid_at,
                amount: order.amount,
                points: order.points,
                packageName: order.package_name,
                duration: order.duration,
                durationUnit: order.duration_unit,
                userInfo: userInfo
            }
        });
    } catch (error) {
        next(error);
    }
});
`;

    // 在 /qrcode/:orderId 路由之前插入新路由
    content = content.replace(
        "router.get('/qrcode/:orderId'",
        newRoute + "router.get('/qrcode/:orderId'"
    );

    fs.writeFileSync(filePath, content, 'utf8');
    console.log('✅ /status/:orderId 路由添加完成');
} else {
    console.log('⚠️ /status/:orderId 路由已存在');
}
