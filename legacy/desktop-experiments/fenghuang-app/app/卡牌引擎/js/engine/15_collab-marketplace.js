/*
 * 文件路径: /js/engine/15_collab-marketplace.js
 * 版本: V114.0 - 博士构造版 (众神殿)
 * 描述: 【云协作与市场】核心逻辑。模拟一个动态的、多用户协作的创作环境。
 */

const CollabMarketplace = (() => {
    // --- 模块私有变量 ---
    let _activityLog, _userList;
    let _simulationInterval = null;

    // --- 模拟数据 ---
    const MOCK_USERS = [
        { name: '博士', role: '架构师', icon: 'fa-user-tie' },
        { name: '织梦者', role: '世界构筑师', icon: 'fa-user-astronaut' },
        { name: '吟游诗人', role: '剧情策划', icon: 'fa-user-ninja' },
        { name: '代码幽灵', role: '维护者', icon: 'fa-user-secret' },
    ];
    const MOCK_ACTIONS = [
        "创建了新的角色卡", "更新了地点", "添加了情节", "删除了一个旧的线索", "调整了派系关系"
    ];

    function init() {
        console.log("引擎模块 [云协作与市场] 开始唤醒...");
    }

    function render() {
        _activityLog = document.getElementById('collab-activity-log');
        _userList = document.getElementById('collab-user-list');

        if (!_activityLog) return;
        
        // 停止旧的模拟器
        if (_simulationInterval) {
            clearInterval(_simulationInterval);
        }
        
        _populateUsers();
        _startSimulation();
    }

    function _populateUsers() {
        _userList.innerHTML = '';
        MOCK_USERS.forEach(user => {
            const userEl = document.createElement('li');
            userEl.innerHTML = `
                <div class="avatar"><i class="fa-solid ${user.icon}"></i></div>
                <div class="user-info">
                    <span class="name">${user.name}</span>
                    <span class="role">${user.role}</span>
                </div>
            `;
            _userList.appendChild(userEl);
        });
    }

    function _startSimulation() {
        _logActivity("系统", "已连接到云端协作服务器。", "系统消息");

        _simulationInterval = setInterval(() => {
            const randomUser = MOCK_USERS[Math.floor(Math.random() * MOCK_USERS.length)];
            const randomAction = MOCK_ACTIONS[Math.floor(Math.random() * MOCK_ACTIONS.length)];
            const allCards = CardManager.getAllCards();
            let cardName = "";
            if (allCards.length > 0) {
                const randomCard = allCards[Math.floor(Math.random() * allCards.length)];
                cardName = `[<span class="log-card">${randomCard.data.name || randomCard.data.title || (randomCard.data.timeline && randomCard.data.timeline[0].name)}]`;
            }

            _logActivity(randomUser.name, randomAction, cardName);

        }, 4000); // 每4秒模拟一次活动
    }

    function _logActivity(userName, action, details) {
        if (!_activityLog) return;
        const logEntry = document.createElement('p');
        const time = new Date().toLocaleTimeString();
        logEntry.innerHTML = `<span class="log-time">[${time}]</span> <span class="log-user">${userName}</span>: ${action} ${details}`;
        _activityLog.prepend(logEntry);
        
        // 保持日志最多只有50条
        if (_activityLog.children.length > 50) {
            _activityLog.lastChild.remove();
        }
    }

    return {
        init,
        render
    };
})();