// 视图切换
function switchView(view) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const viewEl = document.getElementById(`view-${view}`);
    if (viewEl) viewEl.classList.add('active');

    const titles = {
        game: '游戏大厅', character: '角色面板', inventory: '背包系统', skills: '技能树',
        achievements: '成就系统', quests: '任务系统', leaderboard: '排行榜', scripts: '剧本库',
        saves: '存档管理', workshop: '创意工坊', stats: '数据统计', api: 'API设置', settings: '系统设置'
    };
    document.getElementById('view-title').textContent = titles[view] || view;
    document.getElementById('breadcrumb').textContent = `首页 / ${titles[view] || view}`;

    if (view === 'character') TavernRender.renderCharacter();
    if (view === 'inventory') TavernRender.renderInventory();
    if (view === 'skills') TavernRender.renderSkills();
    if (view === 'achievements') TavernRender.renderAchievements();
    if (view === 'leaderboard') TavernRender.renderLeaderboard();
    if (view === 'scripts') TavernRender.renderScriptGrid();
    if (view === 'saves') TavernRender.renderSaves();
    if (view === 'stats') TavernRender.renderStats();
    if (view === 'api') TavernRender.renderApiPool();
}

// 辅助功能
function showHelp() {
    alert(`🍺 AI酒馆 - 行业TOP1旗舰版 使用指南\n\n📜 剧本系统 - 30+内置剧本，支持自定义创建\n🎮 游戏功能 - AI对话互动、角色属性、背包、技能树、成就\n🔧 API管理 - 多API流量池、一键切换、连接测试\n💾 存档系统 - 自动存档、多存档管理\n📊 数据统计 - 全方位数据分析\n\n快捷键：Enter发送 / Shift+Enter换行`);
}

function showProfile() { alert('👤 用户中心\n\n功能开发中，敬请期待！'); }

function toggleVoice() {
    GameState.voiceEnabled = !GameState.voiceEnabled;
    TavernUI.showNotification(GameState.voiceEnabled ? '🔊 语音已开启' : '🔇 语音已关闭', 'success');
}

function toggleAutoPlay() {
    GameState.autoPlayEnabled = !GameState.autoPlayEnabled;
    TavernUI.showNotification(GameState.autoPlayEnabled ? '▶️ 自动播放已开启' : '⏸️ 自动播放已关闭', 'success');
}

// 游戏计时器
function startGameTimer() {
    setInterval(() => {
        if (GameState.gameStartTime) {
            const elapsed = Math.floor((Date.now() - GameState.gameStartTime) / 1000);
            const h = Math.floor(elapsed / 3600).toString().padStart(2, '0');
            const m = Math.floor((elapsed % 3600) / 60).toString().padStart(2, '0');
            const s = (elapsed % 60).toString().padStart(2, '0');
            const el = document.getElementById('game-time');
            if (el) el.textContent = `${h}:${m}:${s}`;
        }
    }, 1000);
}

// 初始化
async function initApp() {
    await TavernDB.init();

    // 加载剧本
    const savedScripts = await TavernDB.getAll('scripts');
    if (savedScripts.length === 0) {
        for (const s of DEFAULT_SCRIPTS) await TavernDB.put('scripts', s);
    }

    // 加载成就
    const savedAch = await TavernDB.getAll('achievements');
    if (savedAch.length === 0) {
        for (const a of DEFAULT_ACHIEVEMENTS) await TavernDB.put('achievements', a);
    }
    GameState.achievements = await TavernDB.getAll('achievements');

    // 加载技能
    const savedSkills = await TavernDB.getAll('skills');
    if (savedSkills.length === 0) {
        for (const s of DEFAULT_SKILLS) await TavernDB.put('skills', s);
    }
    GameState.skills = await TavernDB.getAll('skills');

    // 加载背包和统计
    GameState.inventory = await TavernDB.getAll('inventory');
    const savedStats = await TavernDB.getAll('stats');
    if (savedStats.length > 0) GameState.gameStats = savedStats[0];

    // 渲染
    TavernRender.renderScriptGrid();
    TavernRender.updateBadges();
    startGameTimer();

    // 键盘事件
    const input = document.getElementById('user-input');
    if (input) {
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); TavernGame.sendAction(); }
        });
    }
}

document.addEventListener('DOMContentLoaded', initApp);
