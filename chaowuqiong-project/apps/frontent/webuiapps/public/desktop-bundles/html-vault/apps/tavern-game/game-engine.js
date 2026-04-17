// ========== 游戏引擎 ==========

class GameEngine {
    constructor() {
        this.player = null;
        this.currentView = 'main-menu';
        this.isInitialized = false;
        this.playTime = 0;
        this.frameCount = 0;
        this.lastFrameTime = 0;
        this.deltaTime = 0;
    }

    // 初始化游戏引擎
    init() {
        if (this.isInitialized) return;

        console.log('初始化游戏引擎...');

        // 初始化所有系统
        audioSystem.init();
        mapSystem.init();
        tavernSystem.init();
        cardSystem.init();
        storySystem.init();
        characterSystem.init();
        upgradeSystem.init();
        classSystem.init();
        questSystem.init();
        saveSystem.init();

        // 初始化Round 2新系统
        if (typeof weatherSystem !== 'undefined') {
            weatherSystem.init();
        }
        if (typeof timeSystem !== 'undefined') {
            timeSystem.init();
        }
        if (typeof achievementSystem !== 'undefined') {
            achievementSystem.init();
        }

        // 绑定事件
        this.bindEvents();

        // 设置游戏循环
        this.startGameLoop();

        this.isInitialized = true;
        console.log('游戏引擎初始化完成');
    }

    // 开始新游戏
    startNewGame() {
        audioSystem.playSound('click');

        // 创建角色选择界面
        this.showCharacterCreation();
    }

    // 显示角色创建界面
    showCharacterCreation() {
        const name = prompt('请输入你的角色名称：', '勇者');
        if (!name) {
            game.showNotification('角色名称不能为空', 'error');
            return;
        }

        // 显示职业选择
        const classes = Object.entries(GameData.classes);
        let classMessage = '选择你的职业：\n\n';
        classes.forEach(([id, classData]) => {
            classMessage += `${classData.icon} ${classData.name} - ${classData.description}\n`;
        });
        classMessage += '\n输入职业编号（1-' + classes.length + '）：';

        const classChoice = prompt(classMessage, '1');
        const classIndex = parseInt(classChoice) - 1;

        if (classIndex < 0 || classIndex >= classes.length) {
            game.showNotification('无效的职业选择', 'error');
            return;
        }

        const selectedClass = classes[classIndex][0];

        // 创建角色
        this.createCharacter(selectedClass, name);
    }

    // 创建角色
    createCharacter(classType, name) {
        this.player = characterSystem.createNewCharacter(classType, name);
        
        if (!this.player) {
            game.showNotification('角色创建失败', 'error');
            return;
        }

        // 初始化卡牌系统
        cardSystem.init();
        cardSystem.initialDraw();

        // 初始化升级系统
        upgradeSystem.skillPoints = 0;

        // 隐藏主菜单，显示游戏界面
        document.getElementById('main-menu').style.display = 'none';
        document.getElementById('game-interface').style.display = 'flex';

        // 切换到地图视图
        this.switchView('map');

        // 开始剧情
        setTimeout(() => {
            storySystem.startChapter('prologue');
        }, 1000);

        audioSystem.playSound('levelUp');
        game.showNotification(`欢迎，${name}！`, 'success');
    }

    // 绑定事件
    bindEvents() {
        // 设置面板事件
        document.getElementById('sfx-volume').addEventListener('input', (e) => {
            audioSystem.setSfxVolume(e.target.value / 100);
        });

        document.getElementById('music-volume').addEventListener('input', (e) => {
            audioSystem.setMusicVolume(e.target.value / 100);
        });

        // 键盘事件
        document.addEventListener('keydown', (e) => {
            if (!this.player) return;

            switch(e.key) {
                case 'Escape':
                    this.openMenu();
                    break;
                case '1':
                    this.switchView('map');
                    break;
                case '2':
                    this.switchView('tavern');
                    break;
                case '3':
                    this.switchView('character');
                    break;
                case '4':
                    this.switchView('card-collection');
                    break;
                case '5':
                    this.switchView('class');
                    break;
            }
        });

        // 卡牌收藏过滤
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                cardSystem.renderCardCollection(e.target.dataset.type);
            });
        });
    }

    // 游戏主循环
    startGameLoop() {
        const gameLoop = (timestamp) => {
            if (!this.lastFrameTime) {
                this.lastFrameTime = timestamp;
            }

            this.deltaTime = (timestamp - this.lastFrameTime) / 1000;
            this.lastFrameTime = timestamp;

            this.frameCount++;
            this.playTime += this.deltaTime;

            // 更新游戏状态
            this.update(this.deltaTime);

            requestAnimationFrame(gameLoop);
        };

        requestAnimationFrame(gameLoop);
    }

    // 更新游戏状态
    update(deltaTime) {
        // 更新播放时间
        // 可以在这里添加其他需要每帧更新的逻辑
    }

    // 切换视图
    switchView(viewName) {
        // 隐藏所有视图
        document.querySelectorAll('.game-view').forEach(view => {
            view.classList.remove('active');
        });

        // 显示目标视图
        const targetView = document.getElementById(`${viewName}-view`);
        if (targetView) {
            targetView.classList.add('active');
        }

        this.currentView = viewName;

        // 根据视图初始化相关系统
        switch (viewName) {
            case 'map':
                mapSystem.init();
                break;
            case 'tavern':
                tavernSystem.init();
                audioSystem.playBackgroundMusic('tavern');
                break;
            case 'character':
                characterSystem.updateCharacterPanel();
                break;
            case 'upgrade':
                upgradeSystem.updateUpgradeUI();
                break;
            case 'class':
                classSystem.renderClassList();
                break;
            case 'card-collection':
                cardSystem.renderCardCollection();
                break;
        }

        audioSystem.playSound('click');
    }

    // 更新UI
    updateUI() {
        if (!this.player) return;

        // 更新顶部信息栏
        document.getElementById('player-name').textContent = this.player.name;
        document.getElementById('player-level').textContent = `Lv.${this.player.level}`;
        document.getElementById('gold').textContent = `💰 ${this.player.gold}`;
        document.getElementById('diamond').textContent = `💎 ${this.player.diamonds}`;

        // 更新生命值
        const hpPercent = (this.player.hp / this.player.maxHp) * 100;
        document.getElementById('hp-bar').style.width = `${hpPercent}%`;
        document.getElementById('hp-text').textContent = `${Math.max(0, this.player.hp)}/${this.player.maxHp}`;

        // 更新魔法值
        const mpPercent = (this.player.mp / this.player.maxMp) * 100;
        document.getElementById('mp-bar').style.width = `${mpPercent}%`;
        document.getElementById('mp-text').textContent = `${Math.max(0, this.player.mp)}/${this.player.maxMp}`;

        // 更新经验值
        const expPercent = (this.player.exp / this.player.expToNext) * 100;
        document.getElementById('exp-bar').style.width = `${expPercent}%`;
        document.getElementById('exp-text').textContent = `${this.player.exp}/${this.player.expToNext}`;

        // 更新角色面板（如果可见）
        if (this.currentView === 'character') {
            characterSystem.updateCharacterPanel();
        }
    }

    // 检查升级
    checkLevelUp() {
        if (this.player) {
            upgradeSystem.checkLevelUp(this.player);

            // 检查成就
            if (typeof achievementSystem !== 'undefined') {
                achievementSystem.checkAchievements(this.player);
            }
        }
    }

    // 检查成就
    checkAchievements() {
        if (this.player && typeof achievementSystem !== 'undefined') {
            achievementSystem.checkAchievements(this.player);
        }
    }

    // 显示成就面板
    showAchievements() {
        if (typeof achievementSystem !== 'undefined') {
            achievementSystem.showPanel();
        }
    }

    // 打开菜单
    openMenu() {
        document.getElementById('game-menu').classList.remove('hidden');
        audioSystem.playSound('click');
    }

    // 关闭菜单
    closeMenu() {
        document.getElementById('game-menu').classList.add('hidden');
        audioSystem.playSound('click');
    }

    // 显示设置
    showSettings() {
        document.getElementById('settings-panel').classList.remove('hidden');
        this.closeMenu();
        audioSystem.playSound('click');
    }

    // 关闭设置
    closeSettings() {
        document.getElementById('settings-panel').classList.add('hidden');
        audioSystem.playSound('click');
    }

    // 应用设置
    applySettings() {
        saveSystem.saveGame();
        this.closeSettings();
        game.showNotification('设置已保存', 'success');
        audioSystem.playSound('notification');
    }

    // 保存游戏
    saveGame() {
        saveSystem.saveGame();
        this.closeMenu();
    }

    // 读取游戏
    loadGame() {
        if (saveSystem.loadGame()) {
            this.closeMenu();
        }
    }

    // 返回标题
    returnToTitle() {
        if (confirm('确定要返回标题吗？未保存的进度将会丢失！')) {
            location.reload();
        }
    }

    // 显示通知
    showNotification(message, type = 'info') {
        const container = document.getElementById('notification-container');
        if (!container) return;

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        container.appendChild(notification);

        // 3秒后自动消失
        setTimeout(() => {
            notification.style.animation = 'fadeOut 0.3s ease-out';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);

        // 添加淡出动画
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeOut {
                from { opacity: 1; transform: translateX(0); }
                to { opacity: 0; transform: translateX(100px); }
            }
        `;
        document.head.appendChild(style);
    }

    // 获取游戏信息
    getGameInfo() {
        return {
            version: '1.0.0',
            playTime: this.playTime,
            frameCount: this.frameCount
        };
    }
}

// 创建全局游戏引擎实例
const game = new GameEngine();

// 页面加载完成后初始化游戏
window.addEventListener('DOMContentLoaded', () => {
    console.log('页面加载完成，初始化游戏...');
    game.init();
});

// 页面卸载前保存游戏
window.addEventListener('beforeunload', (e) => {
    if (game.player) {
        saveSystem.saveGame('auto');
        e.preventDefault();
        e.returnValue = '';
    }
});
