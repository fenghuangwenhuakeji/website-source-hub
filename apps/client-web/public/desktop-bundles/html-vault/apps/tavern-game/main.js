// ========== 主入口文件 ==========

// 等待所有模块加载完成
window.addEventListener('load', () => {
    console.log('========================================');
    console.log('      传奇酒馆 - 角色扮演游戏          ');
    console.log('      Legendary Tavern RPG              ');
    console.log('========================================');
    console.log('版本: 1.0.0');
    console.log('作者: AI Assistant');
    console.log('========================================');

    // 检查浏览器兼容性
    if (!window.localStorage) {
        alert('您的浏览器不支持本地存储，游戏将无法保存进度！');
    }

    if (!window.AudioContext && !window.webkitAudioContext) {
        console.warn('您的浏览器不支持Web Audio API，音效将无法播放');
    }

    // 预加载资源（可以在这里添加资源预加载逻辑）
    preloadAssets();

    // 显示欢迎消息
    setTimeout(() => {
        console.log('游戏准备就绪！');
        game.showNotification('欢迎来到传奇酒馆！', 'info');
    }, 500);
});

// 预加载资源
function preloadAssets() {
    console.log('预加载游戏资源...');
    
    // 可以在这里添加图片、音频等资源的预加载
    // 目前使用CSS和JavaScript生成资源，所以不需要预加载
    
    console.log('资源预加载完成');
}

// 调试函数（开发模式使用）
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.debug = {
        // 调试：添加金币
        addGold: (amount) => {
            if (game.player) {
                game.player.gold += amount;
                game.updateUI();
                game.showNotification(`调试：添加了 ${amount} 金币`, 'info');
            }
        },

        // 调试：添加经验
        addExp: (amount) => {
            if (game.player) {
                game.player.exp += amount;
                game.checkLevelUp();
                game.updateUI();
                game.showNotification(`调试：添加了 ${amount} 经验`, 'info');
            }
        },

        // 调试：恢复生命
        fullRestore: () => {
            if (game.player) {
                game.player.hp = game.player.maxHp;
                game.player.mp = game.player.maxMp;
                game.updateUI();
                game.showNotification('调试：完全恢复', 'info');
            }
        },

        // 调试：立即升级
        levelUp: () => {
            if (game.player) {
                game.player.exp = game.player.expToNext;
                game.checkLevelUp();
                game.updateUI();
                game.showNotification('调试：升级', 'info');
            }
        },

        // 调试：开始战斗
        startBattle: (monsterId) => {
            if (monsterId) {
                battleSystem.startBattle(monsterId);
            } else {
                const monsters = Object.keys(GameData.monsters);
                const randomMonster = monsters[Math.floor(Math.random() * monsters.length)];
                battleSystem.startBattle(randomMonster);
            }
        },

        // 调试：显示所有数据
        showData: () => {
            console.log('========== 游戏数据 ==========');
            console.log('玩家:', game.player);
            console.log('地图:', mapSystem);
            console.log('战斗:', battleSystem);
            console.log('卡牌:', cardSystem);
            console.log('任务:', questSystem);
            console.log('==============================');
        },

        // 调试：清除存档
        clearSave: () => {
            if (confirm('调试：清除所有存档？')) {
                saveSystem.clearAllData();
            }
        },

        // 调试：获取所有卡牌
        getAllCards: () => {
            if (game.player) {
                Object.keys(GameData.cards).forEach(cardId => {
                    cardSystem.addCardToDeck(cardId);
                });
                game.showNotification('调试：获得所有卡牌', 'info');
            }
        }
    };

    console.log('调试模式已启用');
    console.log('可用调试命令:');
    console.log('  debug.addGold(amount) - 添加金币');
    console.log('  debug.addExp(amount) - 添加经验');
    console.log('  debug.fullRestore() - 完全恢复');
    console.log('  debug.levelUp() - 立即升级');
    console.log('  debug.startBattle(monsterId) - 开始战斗');
    console.log('  debug.showData() - 显示所有数据');
    console.log('  debug.clearSave() - 清除存档');
    console.log('  debug.getAllCards() - 获得所有卡牌');
}

// 错误处理
window.onerror = function(message, source, lineno, colno, error) {
    console.error('发生错误:', message);
    console.error('来源:', source);
    console.error('行号:', lineno);
    console.error('错误对象:', error);
    
    // 显示用户友好的错误消息
    if (game) {
        game.showNotification('游戏发生错误，请刷新页面', 'error');
    }
    
    return false;
};

// 游戏性能监控
if (window.performance && window.performance.mark) {
    window.performance.mark('game-start');
    
    window.addEventListener('load', () => {
        window.performance.mark('game-load');
        window.performance.measure('game-initialization', 'game-start', 'game-load');
        
        const measure = window.performance.getEntriesByName('game-initialization')[0];
        console.log(`游戏初始化耗时: ${measure.duration.toFixed(2)}ms`);
    });
}

// 导出全局对象（用于调试）
window.RPG_TAVERN = {
    game,
    audioSystem,
    mapSystem,
    tavernSystem,
    battleSystem,
    cardSystem,
    storySystem,
    characterSystem,
    upgradeSystem,
    classSystem,
    questSystem,
    saveSystem,
    GameData
};

console.log('主入口文件加载完成');
