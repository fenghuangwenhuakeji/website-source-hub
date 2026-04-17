// ========== 时间系统 ==========

class TimeSystem {
    constructor() {
        this.isInitialized = false;
        this.gameTime = 6; // 游戏开始时间（6:00，早晨）
        this.dayCount = 1;
        this.timeScale = 1; // 时间流逝速度
        this.realSecondsPerGameHour = 60; // 每游戏小时对应现实秒数（默认1分钟）
        this.timeOfDay = 'morning';
        this.timeUpdateInterval = null;
        this.dayNightCycleEnabled = true;
        this.timeEvents = [];
    }

    // 初始化时间系统
    init() {
        if (this.isInitialized) return;

        console.log('初始化时间系统...');
        this.setupTimeUI();
        this.startTimeLoop();
        this.applyDayNightEffects();
        this.isInitialized = true;
        console.log('时间系统初始化完成');
    }

    // 设置时间UI
    setupTimeUI() {
        // 创建时间显示元素
        if (!document.getElementById('time-display')) {
            const timeDisplay = document.createElement('div');
            timeDisplay.id = 'time-display';
            timeDisplay.className = 'time-display';
            timeDisplay.innerHTML = `
                <div class="time-icon" id="time-icon">🌅</div>
                <div class="time-info">
                    <div class="time-text" id="time-text">06:00</div>
                    <div class="day-count" id="day-count">第 1 天</div>
                </div>
            `;
            document.body.appendChild(timeDisplay);
        }
    }

    // 开始时间循环
    startTimeLoop() {
        const updateInterval = 1000; // 每秒更新一次

        this.timeUpdateInterval = setInterval(() => {
            this.advanceTime(updateInterval);
        }, updateInterval);
    }

    // 推进时间
    advanceTime(realMs) {
        // 计算推进的游戏小时数
        const hoursToAdvance = (realMs / 1000) / this.realSecondsPerGameHour * this.timeScale;

        this.gameTime += hoursToAdvance;

        // 检查是否跨天
        if (this.gameTime >= 24) {
            this.gameTime -= 24;
            this.dayCount++;
            this.onNewDay();
        }

        // 检查时间时段变化
        const newTimeOfDay = this.getTimeOfDay();
        if (newTimeOfDay !== this.timeOfDay) {
            this.timeOfDay = newTimeOfDay;
            this.onTimeOfDayChange();
        }

        this.updateTimeDisplay();
        this.checkTimeEvents();
    }

    // 获取当前时间段
    getTimeOfDay() {
        if (this.gameTime >= 5 && this.gameTime < 8) {
            return 'dawn'; // 黎明 5:00-8:00
        } else if (this.gameTime >= 8 && this.gameTime < 12) {
            return 'morning'; // 上午 8:00-12:00
        } else if (this.gameTime >= 12 && this.gameTime < 14) {
            return 'noon'; // 中午 12:00-14:00
        } else if (this.gameTime >= 14 && this.gameTime < 18) {
            return 'afternoon'; // 下午 14:00-18:00
        } else if (this.gameTime >= 18 && this.gameTime < 20) {
            return 'evening'; // 傍晚 18:00-20:00
        } else if (this.gameTime >= 20 && this.gameTime < 23) {
            return 'night'; // 夜晚 20:00-23:00
        } else {
            return 'midnight'; // 深夜 23:00-5:00
        }
    }

    // 更新时间显示
    updateTimeDisplay() {
        const timeIcon = document.getElementById('time-icon');
        const timeText = document.getElementById('time-text');
        const dayCount = document.getElementById('day-count');

        if (timeIcon) {
            timeIcon.textContent = this.getTimeOfDayIcon();
        }

        if (timeText) {
            const hours = Math.floor(this.gameTime);
            const minutes = Math.floor((this.gameTime - hours) * 60);
            timeText.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        }

        if (dayCount) {
            dayCount.textContent = `第 ${this.dayCount} 天`;
        }
    }

    // 获取时间段图标
    getTimeOfDayIcon() {
        const icons = {
            dawn: '🌅',
            morning: '☀️',
            noon: '🌞',
            afternoon: '🌤️',
            evening: '🌆',
            night: '🌙',
            midnight: '🌑'
        };
        return icons[this.timeOfDay] || '☀️';
    }

    // 时段变化事件
    onTimeOfDayChange() {
        if (!this.dayNightCycleEnabled) return;

        // 更新日夜效果
        this.applyDayNightEffects();

        // 播放时段音效
        this.playTimeOfDaySound();

        // 显示通知
        const timeNames = {
            dawn: '黎明',
            morning: '上午',
            noon: '中午',
            afternoon: '下午',
            evening: '傍晚',
            night: '夜晚',
            midnight: '深夜'
        };

        if (game.player) {
            game.showNotification(`现在是${timeNames[this.timeOfDay]}`, 'info');
        }
    }

    // 应用日夜效果
    applyDayNightEffects() {
        const brightnessLevels = {
            dawn: 0.6,
            morning: 1.0,
            noon: 1.2,
            afternoon: 0.9,
            evening: 0.7,
            night: 0.4,
            midnight: 0.3
        };

        const brightness = brightnessLevels[this.timeOfDay] || 1.0;
        document.body.style.filter = `brightness(${brightness})`;

        // 更新地图可见度
        if (mapSystem) {
            mapSystem.updateVisibility(brightness);
        }

        // 更新NPC行为
        if (npcSystem) {
            npcSystem.updateNPCBehavior(this.timeOfDay);
        }
    }

    // 播放时段音效
    playTimeOfDaySound() {
        if (!audioSystem) return;

        switch (this.timeOfDay) {
            case 'morning':
            case 'noon':
                audioSystem.playBackgroundMusic('day');
                break;
            case 'evening':
            case 'night':
            case 'midnight':
                audioSystem.playBackgroundMusic('night');
                break;
            case 'dawn':
                audioSystem.playSound('dawn');
                break;
        }
    }

    // 新的一天事件
    onNewDay() {
        if (!game.player) return;

        console.log(`第 ${this.dayCount} 天开始`);

        // 每日恢复
        this.dailyRecovery();

        // 触发每日事件
        this.triggerDailyEvents();

        // 显示通知
        game.showNotification(`第 ${this.dayCount} 天开始了！`, 'success');
        audioSystem.playSound('notification');

        // 保存游戏
        if (saveSystem) {
            saveSystem.saveGame('auto');
        }
    }

    // 每日恢复
    dailyRecovery() {
        if (!game.player) return;

        // 恢复生命值和魔法值
        const hpRecovery = Math.floor(game.player.maxHp * 0.2);
        const mpRecovery = Math.floor(game.player.maxMp * 0.3);

        game.player.hp = Math.min(game.player.maxHp, game.player.hp + hpRecovery);
        game.player.mp = Math.min(game.player.maxMp, game.player.mp + mpRecovery);

        game.showNotification(`每日恢复：HP +${hpRecovery}，MP +${mpRecovery}`, 'heal');
    }

    // 触发每日事件
    triggerDailyEvents() {
        // 检查日常任务
        if (questSystem) {
            questSystem.checkDailyQuests();
        }

        // 检查每日刷新
        this.refreshDailyContent();
    }

    // 刷新每日内容
    refreshDailyContent() {
        // 商店刷新（如果在酒馆）
        if (tavernSystem && tavernSystem.shopItems) {
            tavernSystem.refreshShop();
        }

        // 任务刷新
        if (questSystem) {
            questSystem.refreshDailyQuests();
        }
    }

    // 添加时间事件
    addTimeEvent(hour, callback, once = true) {
        this.timeEvents.push({
            hour,
            callback,
            once,
            triggered: false
        });
    }

    // 检查时间事件
    checkTimeEvents() {
        const currentHour = Math.floor(this.gameTime);

        this.timeEvents.forEach((event, index) => {
            if (!event.triggered && currentHour >= event.hour) {
                try {
                    event.callback();
                } catch (error) {
                    console.error('时间事件执行失败:', error);
                }

                if (event.once) {
                    event.triggered = true;
                } else {
                    // 如果是重复事件，重置到下一天
                    event.triggered = false;
                }
            }
        });

        // 清理已触发的一次性事件
        this.timeEvents = this.timeEvents.filter(event => !event.triggered || !event.once);
    }

    // 设置时间
    setTime(hours, minutes = 0) {
        this.gameTime = hours + minutes / 60;
        this.timeOfDay = this.getTimeOfDay();
        this.updateTimeDisplay();
        this.applyDayNightEffects();
    }

    // 跳过时间
    skipTime(hours) {
        this.gameTime += hours;

        if (this.gameTime >= 24) {
            const daysPassed = Math.floor(this.gameTime / 24);
            this.gameTime %= 24;
            this.dayCount += daysPassed;
            for (let i = 0; i < daysPassed; i++) {
                this.onNewDay();
            }
        }

        this.timeOfDay = this.getTimeOfDay();
        this.updateTimeDisplay();
        this.applyDayNightEffects();

        game.showNotification(`时间跳过了 ${hours} 小时`, 'info');
    }

    // 获取时间信息
    getTimeInfo() {
        const hours = Math.floor(this.gameTime);
        const minutes = Math.floor((this.gameTime - hours) * 60);

        return {
            hours,
            minutes,
            formatted: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`,
            timeOfDay: this.timeOfDay,
            dayCount: this.dayCount,
            timeScale: this.timeScale
        };
    }

    // 设置时间流速
    setTimeScale(scale) {
        this.timeScale = Math.max(0.1, Math.min(10, scale));
        console.log(`时间流速设置为: ${this.timeScale}x`);
    }

    // 启用/禁用日夜循环
    setDayNightCycle(enabled) {
        this.dayNightCycleEnabled = enabled;
        if (enabled) {
            this.applyDayNightEffects();
        } else {
            document.body.style.filter = 'brightness(1.0)';
        }
    }

    // 获取时间段描述
    getTimeOfDayDescription() {
        const descriptions = {
            dawn: '太阳刚刚升起，世界开始苏醒',
            morning: '阳光明媚，充满活力的上午',
            noon: '太阳高悬，是活动的好时机',
            afternoon: '阳光西斜，适合继续探索',
            evening: '夕阳西下，是时候休息了',
            night: '夜幕降临，神秘的夜晚',
            midnight: '万籁俱寂，只有星星在闪耀'
        };
        return descriptions[this.timeOfDay] || '';
    }

    // 检查是否在特定时段
    isInTimeOfDay(timeOfDay) {
        return this.timeOfDay === timeOfDay;
    }

    // 检查是否在时间段内
    isInTimeRange(startHour, endHour) {
        const currentHour = Math.floor(this.gameTime);
        return currentHour >= startHour && currentHour < endHour;
    }

    // 获取系统信息
    getSystemInfo() {
        return {
            isInitialized: this.isInitialized,
            gameTime: this.gameTime,
            dayCount: this.dayCount,
            timeOfDay: this.timeOfDay,
            timeScale: this.timeScale,
            dayNightCycleEnabled: this.dayNightCycleEnabled,
            timeEventsCount: this.timeEvents.length
        };
    }
}

// 创建全局时间系统实例
const timeSystem = new TimeSystem();
