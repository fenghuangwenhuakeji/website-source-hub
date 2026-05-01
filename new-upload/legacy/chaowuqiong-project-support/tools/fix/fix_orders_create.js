const fs = require('fs');

const filePath = '/root/backup_20260324/apps/license-backend/src/routes/orders.js';
let content = fs.readFileSync(filePath, 'utf8');

// 修复免费试用代码中的 now 未定义问题
const oldCode = `                // 更新用户会员到期时间
                const [users] = await db.query('SELECT membership_expire FROM users WHERE id = ?', [req.user.userId]);
                const user = users?.[0] || users;
                let newExpire;
                if (pkg.durationUnit === 'hour') {
                    newExpire = new Date(now.getTime() + pkg.duration * 60 * 60 
* 1000);
                } else {
                    newExpire = new Date(now.getTime() + pkg.duration * 24 * 60 
* 60 * 1000);
                }

                if (user && user.membership_expire && new Date(user.membership_expire) > now) {
                    newExpire = new Date(new Date(user.membership_expire).getTime() + (pkg.durationUnit === 'hour' ? pkg.duration * 60 * 60 * 1000 : pkg.duration * 24 * 60 * 60 * 1000));
                }

                await db.query('UPDATE users SET membership_expire = ?, points = points + ? WHERE id = ?', [newExpire.toISOString().slice(0, 19).replace('T', ' 
'), pkg.points, req.user.userId]);`;

const newCode = `                // 更新用户会员到期时间
                const [users] = await db.query('SELECT membership_expire FROM users WHERE id = ?', [req.user.userId]);
                const user = users?.[0] || users;
                const now = new Date();
                let newExpire;
                
                if (pkg.durationUnit === 'permanent') {
                    newExpire = new Date('2099-12-31');
                } else if (pkg.durationUnit === 'hour') {
                    newExpire = new Date(now.getTime() + pkg.duration * 60 * 60 * 1000);
                } else {
                    newExpire = new Date(now.getTime() + pkg.duration * 24 * 60 * 60 * 1000);
                }

                // 如果已有会员时长，在原有基础上累加
                if (user && user.membership_expire && new Date(user.membership_expire) > now) {
                    if (pkg.durationUnit === 'hour') {
                        newExpire = new Date(new Date(user.membership_expire).getTime() + pkg.duration * 60 * 60 * 1000);
                    } else if (pkg.durationUnit !== 'permanent') {
                        newExpire = new Date(new Date(user.membership_expire).getTime() + pkg.duration * 24 * 60 * 60 * 1000);
                    }
                }

                await db.query('UPDATE users SET membership_expire = ?, points = points + ? WHERE id = ?', [newExpire.toISOString().slice(0, 19).replace('T', ' '), pkg.points, req.user.userId]);`;

content = content.replace(oldCode, newCode);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ orders.js 修复完成');
