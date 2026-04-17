const TavernGame = {
    async checkAchievement(id, progress) {
        const ach = GameState.achievements.find(a => a.id === id);
        if (!ach || ach.unlocked) return;
        ach.progress = progress;
        if (ach.progress >= ach.max) {
            ach.unlocked = true;
            await TavernDB.put('achievements', ach);
            TavernUI.showNotification(`🏆 成就解锁: ${ach.name}\n奖励: ${ach.reward}`, 'success');
            TavernRender.updateBadges();
        }
    },

    async selectScript(id) {
        const scripts = await TavernDB.getAll('scripts');
        GameState.currentScript = scripts.find(s => s.id === id);
        TavernRender.renderScriptGrid();
    },

    async newGame() {
        if (!GameState.currentScript) { TavernUI.showNotification('请先选择剧本', 'error'); return; }
        const apiConfig = await TavernAPI.getActiveApi();
        if (!apiConfig) { TavernUI.showNotification('请先配置并激活API', 'error'); switchView('api'); return; }

        GameState.reset();
        document.getElementById('game-interface').style.display = 'block';
        const card = document.querySelector('#view-game .card');
        if (card) card.style.display = 'none';

        await this.checkAchievement('first_game', 1);
        GameState.gameStats.totalGames++;
        await GameState.saveStats();
        await this.startGame();
    },

    async startGame() {
        const sc = document.getElementById('story-content');
        if (sc) sc.innerHTML = '';
        TavernRender.addStoryEntry('system', '🎮 游戏开始，正在初始化世界...');
        try {
            const response = await TavernAPI.callAPI(GameState.currentScript.prompt);
            TavernRender.addStoryEntry('ai', response);
            TavernRender.updateStatusPanel(response);
        } catch (e) {
            TavernRender.addStoryEntry('system', '❌ 错误: ' + e.message);
        }
    },

    async sendAction() {
        const input = document.getElementById('user-input');
        const action = input.value.trim();
        if (!action) return;

        TavernRender.addStoryEntry('user', action);
        input.value = '';
        GameState.gameHistory.push({ role: 'user', content: action });

        GameState.gameStats.totalActions++;
        await this.checkAchievement('actions_10', GameState.gameStats.totalActions);
        await this.checkAchievement('actions_50', GameState.gameStats.totalActions);
        await this.checkAchievement('actions_100', GameState.gameStats.totalActions);
        await this.checkAchievement('actions_500', GameState.gameStats.totalActions);
        await this.checkAchievement('long_game_20', GameState.gameHistory.length);
        await this.checkAchievement('long_game_50', GameState.gameHistory.length);
        await this.checkAchievement('long_game_100', GameState.gameHistory.length);

        try {
            const context = GameState.gameHistory.slice(-10).map(h => `${h.role}: ${h.content}`).join('\n\n');
            const response = await TavernAPI.callAPI(context + '\n\n' + action);
            TavernRender.addStoryEntry('ai', response);
            GameState.gameHistory.push({ role: 'assistant', content: response });
            TavernRender.updateStatusPanel(response);
            await this.autoSave();
        } catch (e) {
            TavernRender.addStoryEntry('system', '❌ 错误: ' + e.message);
        }
    },

    quickAction(action) {
        document.getElementById('user-input').value = action;
        this.sendAction();
    },

    async autoSave() {
        if (!GameState.currentScript || GameState.gameHistory.length === 0) return;
        const save = {
            script_name: GameState.currentScript.name,
            script: GameState.currentScript,
            history: GameState.gameHistory,
            playerStats: GameState.playerStats,
            inventory: GameState.inventory,
            turns: GameState.gameHistory.length,
            timestamp: Date.now()
        };
        await TavernDB.put('saves', save);
        const saves = await TavernDB.getAll('saves');
        await this.checkAchievement('save_5', saves.length);
        await this.checkAchievement('save_10', saves.length);
    },

    async loadSave(id) {
        const saves = await TavernDB.getAll('saves');
        const save = saves.find(s => s.id === id);
        if (!save) return;
        GameState.currentScript = save.script;
        GameState.gameHistory = save.history;
        GameState.playerStats = save.playerStats;
        GameState.inventory = save.inventory;
        document.getElementById('game-interface').style.display = 'block';
        const card = document.querySelector('#view-game .card');
        if (card) card.style.display = 'none';
        const sc = document.getElementById('story-content');
        if (sc) sc.innerHTML = '';
        GameState.gameHistory.forEach(h => TavernRender.addStoryEntry(h.role === 'user' ? 'user' : 'ai', h.content));
        TavernUI.showNotification('存档已加载', 'success');
        switchView('game');
    },

    async deleteSave(id) {
        if (!confirm('确定删除此存档?')) return;
        await TavernDB.delete('saves', id);
        TavernRender.renderSaves();
        TavernUI.showNotification('存档已删除', 'success');
    },

    useItem(index) {
        const item = GameState.inventory[index];
        if (!item) return;
        TavernUI.showNotification(`使用了 ${item.name}`, 'success');
    },

    async unlockSkill(id) {
        const skill = GameState.skills.find(s => s.id === id);
        if (!skill || skill.unlocked) return;
        skill.unlocked = true;
        await TavernDB.put('skills', skill);
        TavernRender.renderSkills();
        TavernUI.showNotification(`⚡ 技能解锁: ${skill.name}`, 'success');
    },

    // API 管理
    addApiConfig() {
        document.getElementById('api-modal-title').textContent = '添加API配置';
        ['api-name', 'api-key', 'api-url', 'api-model'].forEach(id => document.getElementById(id).value = '');
        document.getElementById('api-provider').value = 'gemini';
        document.getElementById('api-modal').dataset.id = '';
        TavernUI.openModal('api-modal');
    },

    async editApiConfig(id) {
        const configs = await TavernDB.getAll('api_pool');
        const c = configs.find(x => x.id === id);
        if (!c) return;
        document.getElementById('api-modal-title').textContent = '编辑API配置';
        document.getElementById('api-name').value = c.config_name;
        document.getElementById('api-provider').value = c.provider;
        document.getElementById('api-key').value = c.api_key;
        document.getElementById('api-url').value = c.base_url;
        document.getElementById('api-model').value = c.model_name;
        document.getElementById('api-modal').dataset.id = id;
        TavernUI.openModal('api-modal');
    },

    async saveApiConfig() {
        const id = document.getElementById('api-modal').dataset.id;
        const config = {
            config_name: document.getElementById('api-name').value.trim(),
            provider: document.getElementById('api-provider').value,
            api_key: document.getElementById('api-key').value.trim(),
            base_url: document.getElementById('api-url').value.trim(),
            model_name: document.getElementById('api-model').value.trim(),
            is_active: 0
        };
        if (!config.config_name || !config.api_key) { TavernUI.showNotification('请填写配置名称和API Key', 'error'); return; }
        if (id) {
            config.id = parseInt(id);
            const configs = await TavernDB.getAll('api_pool');
            const old = configs.find(c => c.id === config.id);
            config.is_active = old ? old.is_active : 0;
        }
        await TavernDB.put('api_pool', config);
        await TavernRender.renderApiPool();
        await this.checkAchievement('api_1', (await TavernDB.getAll('api_pool')).length);
        await this.checkAchievement('api_5', (await TavernDB.getAll('api_pool')).length);
        TavernUI.closeModal('api-modal');
        TavernUI.showNotification(id ? 'API配置已更新' : 'API配置已添加', 'success');
    },

    async deleteApiConfig(id) {
        if (!confirm('确定删除此API配置?')) return;
        await TavernDB.delete('api_pool', id);
        await TavernRender.renderApiPool();
        TavernUI.showNotification('已删除', 'success');
    },

    async setActiveApi(id) {
        const configs = await TavernDB.getAll('api_pool');
        for (const c of configs) { c.is_active = c.id === id ? 1 : 0; await TavernDB.put('api_pool', c); }
        await TavernRender.renderApiPool();
        TavernUI.showNotification('已激活', 'success');
    },

    async testApiConfig() {
        const config = {
            provider: document.getElementById('api-provider').value,
            api_key: document.getElementById('api-key').value.trim(),
            base_url: document.getElementById('api-url').value.trim(),
            model_name: document.getElementById('api-model').value.trim()
        };
        if (!config.api_key) { TavernUI.showNotification('请输入API Key', 'error'); return; }
        TavernUI.showNotification('正在测试连接...', 'success');
        try {
            const { url, headers, body } = TavernAPI.buildRequest(config, '你好');
            const response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
            if (!response.ok) throw new Error(`API错误 ${response.status}`);
            const data = await response.json();
            const result = TavernAPI.parseResponse(config.provider, data);
            alert(`✅ 连接成功！\n\n模型回复:\n${result.substring(0, 100)}...`);
            TavernUI.showNotification('连接成功', 'success');
        } catch (e) {
            alert(`❌ 连接失败\n\n错误信息:\n${e.message}`);
            TavernUI.showNotification('连接失败', 'error');
        }
    },

    // 剧本管理
    createScript() {
        ['script-name', 'script-icon', 'script-desc', 'script-tags', 'script-prompt'].forEach(id => document.getElementById(id).value = '');
        TavernUI.openModal('script-modal');
    },

    async saveScript() {
        const script = {
            id: 'custom_' + Date.now(),
            name: document.getElementById('script-name').value.trim(),
            icon: document.getElementById('script-icon').value.trim() || '📝',
            desc: document.getElementById('script-desc').value.trim(),
            tags: document.getElementById('script-tags').value.split(',').map(t => t.trim()).filter(t => t),
            prompt: document.getElementById('script-prompt').value.trim(),
            plays: 0
        };
        if (!script.name || !script.prompt) { TavernUI.showNotification('请填写剧本名称和提示词', 'error'); return; }
        await TavernDB.put('scripts', script);
        await TavernRender.renderScriptGrid();
        const customs = (await TavernDB.getAll('scripts')).filter(s => s.id.startsWith('custom_')).length;
        await this.checkAchievement('script_1', customs);
        await this.checkAchievement('script_5', customs);
        TavernUI.closeModal('script-modal');
        TavernUI.showNotification('剧本已创建', 'success');
        TavernRender.updateBadges();
    },

    filterScripts(type) {
        TavernUI.showNotification(`筛选: ${type}`, 'success');
    },

    exportStory() {
        const text = GameState.gameHistory.map(h => `${h.role === 'user' ? '玩家' : 'AI'}: ${h.content}`).join('\n\n');
        const blob = new Blob([text], { type: 'text/plain' });
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
        a.download = `故事_${Date.now()}.txt`; a.click();
        TavernUI.showNotification('故事已导出', 'success');
    },

    exportData() {
        const data = { playerStats: GameState.playerStats, inventory: GameState.inventory, achievements: GameState.achievements, gameStats: GameState.gameStats };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
        a.download = `游戏数据_${Date.now()}.json`; a.click();
        TavernUI.showNotification('数据已导出', 'success');
    }
};
