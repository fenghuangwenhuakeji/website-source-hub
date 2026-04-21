const TavernRender = {
    async renderScriptGrid() {
        const scripts = await TavernDB.getAll('scripts');
        const grid = document.getElementById('script-grid');
        const allGrid = document.getElementById('all-scripts-grid');

        const html = scripts.map(s => `
            <div class="script-card ${GameState.currentScript?.id === s.id ? 'active' : ''}" onclick="TavernGame.selectScript('${s.id}')">
                <div class="script-icon">${s.icon}</div>
                <div class="script-title">${s.name}</div>
                <div class="script-desc">${s.desc}</div>
                ${s.tags ? `<div class="script-tags">${s.tags.map(t => `<span class="script-tag">${t}</span>`).join('')}</div>` : ''}
                <div class="script-stats">
                    <div class="script-stat"><div class="script-stat-value">${s.plays || 0}</div><div class="script-stat-label">游玩次数</div></div>
                    <div class="script-stat"><div class="script-stat-value">⭐⭐⭐⭐⭐</div><div class="script-stat-label">评分</div></div>
                </div>
            </div>
        `).join('');

        if (grid) grid.innerHTML = html;
        if (allGrid) allGrid.innerHTML = html;
    },

    async renderInventory() {
        const grid = document.getElementById('inventory-grid');
        if (!grid) return;
        document.getElementById('inventory-count').textContent = GameState.inventory.length;
        const slots = Array(50).fill(null);
        GameState.inventory.forEach((item, i) => { if (i < 50) slots[i] = item; });
        grid.innerHTML = slots.map((item, i) => `
            <div class="inventory-slot ${item ? 'filled' : ''}" onclick="TavernGame.useItem(${i})">
                ${item ? `<div class="item-rarity ${item.rarity || 'common'}"></div><div class="item-icon">${item.icon}</div><div class="item-count">${item.count || 1}</div>` : ''}
            </div>
        `).join('');
    },

    async renderSkills() {
        const tree = document.getElementById('skill-tree');
        if (!tree) return;
        tree.innerHTML = GameState.skills.map(s => `
            <div class="skill-node ${s.unlocked ? 'unlocked' : 'locked'}" onclick="TavernGame.unlockSkill('${s.id}')">
                <div class="skill-icon">${s.icon}</div>
                <div class="skill-name">${s.name}</div>
                <div class="skill-desc">${s.desc}</div>
                <div style="margin-top:8px;font-size:11px;color:var(--primary);">消耗: ${s.cost} 技能点</div>
            </div>
        `).join('');
    },

    async renderAchievements() {
        const list = document.getElementById('achievement-list');
        if (!list) return;
        const unlocked = GameState.achievements.filter(a => a.unlocked).length;
        document.getElementById('unlocked-count').textContent = unlocked;
        document.getElementById('total-achievements').textContent = GameState.achievements.length;
        list.innerHTML = GameState.achievements.map(a => `
            <div class="achievement-item ${a.unlocked ? 'unlocked' : ''}">
                <div class="achievement-icon">${a.icon}</div>
                <div class="achievement-info">
                    <div class="achievement-title">${a.name}</div>
                    <div class="achievement-desc">${a.desc}</div>
                    <div class="achievement-progress">${a.unlocked ? '✅ 已解锁' : `进度: ${a.progress}/${a.max}`}</div>
                </div>
                <div class="achievement-reward">${a.reward}</div>
            </div>
        `).join('');
    },

    async renderCharacter() {
        const info = document.getElementById('character-detail');
        if (!info) return;
        const s = GameState.playerStats;
        info.innerHTML = `
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;">
                <div class="info-section"><h3>基础属性</h3>
                    <div class="info-item"><span class="info-label">等级</span><span class="info-value">${s.level}</span></div>
                    <div class="info-item"><span class="info-label">生命值</span><span class="info-value">${s.hp}/${s.maxHp}</span></div>
                    <div class="info-item"><span class="info-label">魔法值</span><span class="info-value">${s.mp}/${s.maxMp}</span></div>
                    <div class="info-item"><span class="info-label">体力值</span><span class="info-value">${s.stamina}/${s.maxStamina}</span></div>
                    <div class="info-item"><span class="info-label">经验值</span><span class="info-value">${s.exp}/${s.maxExp}</span></div>
                    <div class="info-item"><span class="info-label">金币</span><span class="info-value">${s.gold}</span></div>
                </div>
                <div class="info-section"><h3>战斗属性</h3>
                    <div class="info-item"><span class="info-label">力量</span><span class="info-value">${s.str}</span></div>
                    <div class="info-item"><span class="info-label">敏捷</span><span class="info-value">${s.agi}</span></div>
                    <div class="info-item"><span class="info-label">智力</span><span class="info-value">${s.int}</span></div>
                    <div class="info-item"><span class="info-label">幸运</span><span class="info-value">${s.luk}</span></div>
                </div>
            </div>`;
    },

    async renderStats() {
        const grid = document.getElementById('stats-grid');
        if (!grid) return;
        const pt = Math.floor(GameState.gameStats.totalTime / 60);
        grid.innerHTML = `
            <div class="stat-card"><div class="stat-icon">🎮</div><div class="stat-value">${GameState.gameStats.totalGames}</div><div class="stat-label">总游戏数</div></div>
            <div class="stat-card"><div class="stat-icon">⚡</div><div class="stat-value">${GameState.gameStats.totalActions}</div><div class="stat-label">总行动数</div></div>
            <div class="stat-card"><div class="stat-icon">⏰</div><div class="stat-value">${pt}</div><div class="stat-label">游戏时长(分钟)</div></div>
            <div class="stat-card"><div class="stat-icon">🏆</div><div class="stat-value">${GameState.achievements.filter(a => a.unlocked).length}</div><div class="stat-label">已解锁成就</div></div>
            <div class="stat-card"><div class="stat-icon">📜</div><div class="stat-value">${(await TavernDB.getAll('scripts')).length}</div><div class="stat-label">剧本总数</div></div>
            <div class="stat-card"><div class="stat-icon">💾</div><div class="stat-value">${(await TavernDB.getAll('saves')).length}</div><div class="stat-label">存档数量</div></div>
            <div class="stat-card"><div class="stat-icon">🎒</div><div class="stat-value">${GameState.inventory.length}</div><div class="stat-label">物品数量</div></div>
            <div class="stat-card"><div class="stat-icon">⚡</div><div class="stat-value">${GameState.skills.filter(s => s.unlocked).length}</div><div class="stat-label">已解锁技能</div></div>`;
    },

    async renderApiPool() {
        const configs = await TavernDB.getAll('api_pool');
        const grid = document.getElementById('api-grid');
        if (!grid) return;
        if (configs.length === 0) {
            grid.innerHTML = '<div style="grid-column:1/-1;padding:60px;text-align:center;color:var(--text-dim);font-size:16px;">🔧 暂无API配置，点击右上角添加</div>';
        } else {
            grid.innerHTML = configs.map(c => `
                <div class="api-card ${c.is_active ? 'active' : ''}" onclick="TavernGame.setActiveApi(${c.id})">
                    <div class="api-card-icon">${c.is_active ? '✅' : '🔌'}</div>
                    <div class="api-card-title">${c.config_name}</div>
                    <div class="api-card-meta">${c.provider}</div>
                    <div class="api-card-meta">${c.model_name}</div>
                    <div class="api-card-status ${c.is_active ? 'active' : 'inactive'}">${c.is_active ? '✅ 激活中' : '待激活'}</div>
                    <div class="api-card-actions">
                        <button class="api-btn" onclick="event.stopPropagation(); TavernGame.editApiConfig(${c.id})">编辑</button>
                        <button class="api-btn" onclick="event.stopPropagation(); TavernGame.deleteApiConfig(${c.id})">删除</button>
                    </div>
                </div>
            `).join('');
        }
    },

    async renderSaves() {
        const saves = await TavernDB.getAll('saves');
        const grid = document.getElementById('saves-grid');
        if (!grid) return;
        if (saves.length === 0) {
            grid.innerHTML = '<div style="grid-column:1/-1;padding:60px;text-align:center;color:var(--text-dim);font-size:16px;">💾 暂无存档</div>';
        } else {
            grid.innerHTML = saves.map(s => `
                <div class="save-card" onclick="TavernGame.loadSave(${s.id})">
                    <div class="save-title">${s.script_name}</div>
                    <div class="save-meta">📊 回合数: ${s.turns}</div>
                    <div class="save-meta">⏰ ${new Date(s.timestamp).toLocaleString()}</div>
                    <div class="save-actions">
                        <button class="api-btn" onclick="event.stopPropagation(); TavernGame.loadSave(${s.id})">加载</button>
                        <button class="api-btn" onclick="event.stopPropagation(); TavernGame.deleteSave(${s.id})">删除</button>
                    </div>
                </div>
            `).join('');
        }
    },

    renderLeaderboard() {
        const board = document.getElementById('leaderboard');
        if (!board) return;
        const data = [
            { rank: 1, name: '传奇玩家', score: 99999 }, { rank: 2, name: '冒险大师', score: 88888 },
            { rank: 3, name: '资深玩家', score: 77777 }, { rank: 4, name: '活跃玩家', score: 66666 },
            { rank: 5, name: '新手玩家', score: 55555 }
        ];
        board.innerHTML = data.map(d => `
            <div class="leaderboard-item">
                <div class="leaderboard-rank">#${d.rank}</div>
                <div class="leaderboard-info"><div class="leaderboard-name">${d.name}</div><div class="leaderboard-score">积分: ${d.score}</div></div>
            </div>
        `).join('');
    },

    addStoryEntry(type, text) {
        const content = document.getElementById('story-content');
        if (!content) return;
        const entry = document.createElement('div');
        entry.className = `story-entry ${type}`;
        const labels = { user: '🎮 玩家', ai: '🤖 AI', system: '⚙️ 系统' };
        entry.innerHTML = `<div class="story-label">${labels[type]}</div><div class="story-text">${text}</div><div class="story-timestamp">${new Date().toLocaleTimeString()}</div>`;
        content.appendChild(entry);
        content.scrollTop = content.scrollHeight;
    },

    updateStatusPanel(text) {
        const panel = document.getElementById('dynamic-status');
        if (!panel) return;
        const statusData = {};
        text.split('\n').forEach(line => {
            if (line.includes('：') || line.includes(':')) {
                const parts = line.split(/[：:]/);
                if (parts.length === 2) statusData[parts[0].trim()] = parts[1].trim();
            }
        });
        if (Object.keys(statusData).length > 0) {
            panel.innerHTML = `<h3>📋 游戏状态</h3>${Object.entries(statusData).map(([k, v]) =>
                `<div class="info-item"><span class="info-label">${k}</span><span class="info-value">${v}</span></div>`
            ).join('')}`;
        }
    },

    updateBadges() {
        TavernDB.getAll('scripts').then(s => { const el = document.getElementById('script-count'); if(el) el.textContent = s.length; });
        TavernDB.getAll('achievements').then(a => { const el = document.getElementById('achievement-count'); if(el) el.textContent = a.filter(x => x.unlocked).length; });
        const ib = document.getElementById('inventory-badge'); if(ib) ib.textContent = GameState.inventory.length;
    }
};
