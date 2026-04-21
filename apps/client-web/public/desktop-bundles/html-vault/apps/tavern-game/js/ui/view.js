import { renderCharacter, renderInventory, renderSkills, renderAchievements, renderScriptGrid, renderStats, renderApiPool, renderSaves } from './render.js';

export function switchView(view) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    
    const viewEl = document.getElementById(`view-${view}`);
    if (viewEl) viewEl.classList.add('active');
    
    const titles = {
        game: '游戏大厅', character: '角色面板', inventory: '背包系统',
        skills: '技能树', achievements: '成就系统', quests: '任务系统',
        leaderboard: '排行榜', scripts: '剧本库', saves: '存档管理',
        workshop: '创意工坊', stats: '数据统计', api: 'API设置', settings: '系统设置'
    };
    
    document.getElementById('view-title').textContent = titles[view] || view;
    document.getElementById('breadcrumb').textContent = `首页 / ${titles[view] || view}`;
    
    if (view === 'character') renderCharacter();
    if (view === 'inventory') renderInventory();
    if (view === 'skills') renderSkills();
    if (view === 'achievements') renderAchievements();
    if (view === 'leaderboard') renderLeaderboard();
    if (view === 'scripts') renderScriptGrid();
    if (view === 'saves') renderSaves();
    if (view === 'stats') renderStats();
    if (view === 'api') renderApiPool();
}

function renderLeaderboard() {
    const board = document.getElementById('leaderboard');
    if (!board) return;
    const mockData = [
        { rank: 1, name: '传奇玩家', score: 99999 },
        { rank: 2, name: '冒险大师', score: 88888 },
        { rank: 3, name: '资深玩家', score: 77777 },
        { rank: 4, name: '活跃玩家', score: 66666 },
        { rank: 5, name: '新手玩家', score: 55555 }
    ];
    board.innerHTML = mockData.map(d => `
        <div class="leaderboard-item">
            <div class="leaderboard-rank">#${d.rank}</div>
            <div class="leaderboard-info">
                <div class="leaderboard-name">${d.name}</div>
                <div class="leaderboard-score">积分: ${d.score}</div>
            </div>
        </div>
    `).join('');
}
