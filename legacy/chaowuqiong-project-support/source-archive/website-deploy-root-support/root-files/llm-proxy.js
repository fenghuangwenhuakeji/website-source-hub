const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');

// LLM 代理路由 - 转发到实际的 AI 服务
router.post('/', authMiddleware, async (req, res, next) => {
    try {
        const { messages, model, temperature = 0.7, max_tokens = 2000 } = req.body;
        
        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({
                success: false,
                message: 'messages 参数不能为空'
            });
        }

        // 检查用户是否有足够的会员时长
        const db = req.app.locals.db;
        if (db) {
            const [users] = await db.query(
                'SELECT membership_expire, points FROM users WHERE id = ?',
                [req.user.userId]
            );
            
            if (!users || users.length === 0) {
                return res.status(403).json({
                    success: false,
                    message: '用户不存在'
                });
            }
            
            const user = users[0];
            const now = new Date();
            const expireDate = user.membership_expire ? new Date(user.membership_expire) : null;
            
            // 检查会员是否过期
            if (!expireDate || expireDate <= now) {
                // 检查是否有足够的积分兑换对话次数
                if (user.points < 1) {
                    return res.status(403).json({
                        success: false,
                        message: '会员时长已过期且积分不足，请先充值或兑换时长',
                        code: 'MEMBERSHIP_EXPIRED'
                    });
                }
                
                // 扣除1积分作为对话费用
                await db.query(
                    'UPDATE users SET points = points - 1 WHERE id = ?',
                    [req.user.userId]
                );
            }
        }

        // 这里应该调用实际的 AI 服务
        // 暂时返回模拟响应
        const lastMessage = messages[messages.length - 1];
        
        res.json({
            success: true,
            data: {
                id: 'chatcmpl-' + Date.now(),
                object: 'chat.completion',
                created: Math.floor(Date.now() / 1000),
                model: model || 'gpt-3.5-turbo',
                choices: [{
                    index: 0,
                    message: {
                        role: 'assistant',
                        content: '这是一个模拟的 AI 响应。实际部署时需要接入真实的 LLM API（如 OpenAI、Claude、文心一言等）。\n\n用户消息：' + (lastMessage?.content || '')
                    },
                    finish_reason: 'stop'
                }],
                usage: {
                    prompt_tokens: JSON.stringify(messages).length,
                    completion_tokens: 100,
                    total_tokens: JSON.stringify(messages).length + 100
                }
            }
        });
        
    } catch (error) {
        next(error);
    }
});

// 流式响应版本
router.post('/stream', authMiddleware, async (req, res, next) => {
    try {
        const { messages, model } = req.body;
        
        // 设置 SSE 头
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        
        // 模拟流式响应
        const responseText = '这是一个模拟的流式 AI 响应。实际部署时需要接入真实的 LLM API。';
        const words = responseText.split('');
        
        for (let i = 0; i < words.length; i++) {
            const chunk = {
                id: 'chatcmpl-' + Date.now(),
                object: 'chat.completion.chunk',
                created: Math.floor(Date.now() / 1000),
                model: model || 'gpt-3.5-turbo',
                choices: [{
                    index: 0,
                    delta: {
                        content: words[i]
                    },
                    finish_reason: null
                }]
            };
            
            res.write(`data: ${JSON.stringify(chunk)}\n\n`);
            await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        // 发送结束标记
        res.write('data: [DONE]\n\n');
        res.end();
        
    } catch (error) {
        next(error);
    }
});

module.exports = router;
