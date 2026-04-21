const fs = require('fs');
const path = require('path');

// 修复 orders.js 文件中的表名
const ordersFilePath = '/root/backup_20260324/apps/license-backend/src/routes/orders.js';

// 读取文件
let content = fs.readFileSync(ordersFilePath, 'utf8');

// 替换表名：points_logs -> points_records, orders -> recharge_orders
content = content.replace(/points_logs/g, 'points_records');
content = content.replace(/orders/g, 'recharge_orders');

// 但是需要恢复一些不应该替换的内容（比如变量名、函数名等）
content = content.replace(/recharge_ordersFilePath/g, 'ordersFilePath');
content = content.replace(/recharge_orders\./g, 'orders.');

// 写入文件
fs.writeFileSync(ordersFilePath, content, 'utf8');
console.log('✅ orders.js 表名修复完成');
