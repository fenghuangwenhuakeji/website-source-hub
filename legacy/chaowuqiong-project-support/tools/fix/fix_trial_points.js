const fs = require('fs');

const filePath = '/root/backup_20260324/apps/license-backend/src/routes/orders.js';
let content = fs.readFileSync(filePath, 'utf8');

// 修改积分兑换选项中的 trial_2h，将 points 从 0 改为 10（可用积分兑换）
content = content.replace(
    /{ id: 'trial_2h', name: '2小时体验卡', points: 0,/g,
    "{ id: 'trial_2h', name: '2小时体验卡', points: 10,"
);

// 修改描述，说明可以用积分兑换
content = content.replace(
    /description: '每个新用户仅限2次，一天一次共两天'/g,
    "description: '可用10积分兑换2小时体验时长'"
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ 2小时体验卡已修改为可用10积分兑换');
