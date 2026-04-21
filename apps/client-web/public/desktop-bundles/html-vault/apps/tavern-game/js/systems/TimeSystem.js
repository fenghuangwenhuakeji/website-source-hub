// ========== 时间系统 ==========
// 负责游戏中的时间流逝和日夜循环

class TimeSystem {
    constructor() {
        this.isInitialized = false;
        this.dayTime = 6; // 游戏内时间（小时），从6:00开始
        this.dayCount = 1; // 游戏天数
        this.timeScale = 1; // 时间流逝速度（倍率）
        this.minutes = 0; // 当前分钟

        // 时间阶段
        this.timePhases = {
            'dawn': { start: 5, end: 7, name: '黎明' },
            'morning': { start: 7, end: 11, name: '上午' },
            'noon': { start: 11, end: 13, name: '中午' },
            'afternoon': { start: 13, end: 17, name: '下午' },
            'dusk': { start: 17, end: 19, name: '黄昏' },
            'evening': { start: 19, end: 21, name: '傍晚' },
            'night': { start: 21, end: 5, name: '夜晚' },
            'midnight': { start: 0, end: 1, name: '午夜' }
        };

        // 日夜循环配置
        this.dayNightCycle = {
            'day': {
                start: 6,
                end: 18,
                ambientColor: { r: 255, g: 255, b: 255 },
                lightIntensity: 1.0
            },
            'night': {
                start: 18,
                end: 6,
                ambientColor: { r: 50, g: 50, b: 100 },
                lightIntensity: 0.3
            }
        };

        // 时间事件
        this.timeEvents = [];
        this.lastHour = 6;
        this.currentPhase = 'morning';

        // 时间流逝配置
        this.realSecondsPerGameHour = 60; // 现实1分钟 = 游戏1小时
        this.accumulatedTime = 0;
    }

    // 初始化时间系统
    init() {
        console.log('时间系统初始化完成');
        this.updatePhase();
        this.isInitialized = true;
    }

    // 更新时间系统
    update(deltaTime) {
        if (!this.isInitialized) return;

        // 累积时间
        this.accumulatedTime += deltaTime * this.timeScale;

        // 计算流逝的小时数
        const hoursPassed = this.accumulatedTime / this.realSecondsPerGameHour;
        this.accumulatedTime = this.accumulatedTime % this.realSecondsPerGameHour;

        // 更新游戏时间
        this.advanceTime(hoursPassed);
    }

    // 推进时间
    advanceTime(hours) {
        const oldHour = Math.floor(this.dayTime);
        const oldMinutes = this.minutes;

        // 更新分钟和小时
        this.minutes += (hours * 60) % 60;
        this.dayTime += Math.floor(hours);

        // 处理日期变更
        while (this.dayTime >= 24) {
            this.dayTime -= 24;
            this.dayCount++;
            console.log(`新的一天开始: 第${this.dayCount}天`);
            eventSystem.emit('new-day', { day: this.dayCount });
        }

        // 检查小时变化
        const newHour = Math.floor(this.dayTime);
        if (newHour !== oldHour) {
            this.onHourChange(oldHour, newHour);
        }
    }

    // 小时变化事件
    onHourChange(oldHour, newHour) {
        this.lastHour = oldHour;

        // 检查阶段变化
        this.updatePhase();

        // 触发时间事件
        this.checkTimeEvents(newHour);

        // 触发小时变化事件
        eventSystem.emit('hour-change', {
            oldHour,
            newHour,
            day: this.dayCount
        });
    }

    // 更新时间阶段
    updatePhase() {
        const newPhase = this.getTimePhase();
        if (newPhase !== this.currentPhase) {
            const oldPhase = this.currentPhase;
            this.currentPhase = newPhase;

            console.log(`时间阶段变化: ${oldPhase} -> ${newPhase}`);
            eventSystem.emit('phase-change', {
                from: oldPhase,
                to: newPhase
            });
        }
    }

    // 获取当前时间阶段
    getTimePhase() {
        for (const [name, phase] of Object.entries(this.timePhases)) {
            if (this.isInPhase(phase)) {
                return name;
            }
        }
        return 'night';
    }

    // 检查是否在指定阶段
    isInPhase(phase) {
        if (phase.start <= phase.end) {
            return this.dayTime >= phase.start && this.dayTime < phase.end;
        } else {
            // 跨天的情况（如夜晚 21:00 - 5:00）
            return this.dayTime >= phase.start || this.dayTime < phase.end;
        }
    }

    // 检查时间事件
    checkTimeEvents(hour) {
        for (const event of this.timeEvents) {
            if (event.hour === hour && !event.triggered) {
                if (event.day ? event.day === this.dayCount : true) {
                    event.triggered = true;
                    if (event.callback) {
                        event.callback();
                    }
                    eventSystem.emit('time-event', event);
                }
            }
        }
    }

    // 添加时间事件
    addTimeEvent(config) {
        const event = {
            id: config.id || generateId(),
            hour: config.hour,
            day: config.day || null, // null表示每天触发
            callback: config.callback || null,
            triggered: false,
            data: config.data || {}
        };
        this.timeEvents.push(event);
        return event;
    }

    // 移除时间事件
    removeTimeEvent(eventId) {
        const index = this.timeEvents.findIndex(e => e.id === eventId);
        if (index !== -1) {
            this.timeEvents.splice(index, 1);
        }
    }

    // 获取当前时间（格式化为字符串）
    getTimeString() {
        const hours = Math.floor(this.dayTime);
        const mins = Math.floor(this.minutes);
        return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    }

    // 获取详细时间信息
    getTimeInfo() {
        return {
            hours: Math.floor(this.dayTime),
            minutes: Math.floor(this.minutes),
            formatted: this.getTimeString(),
            day: this.dayCount,
            phase: this.currentPhase,
            phaseName: this.timePhases[this.currentPhase].name,
            isDay: this.isDay(),
            isNight: this.isNight()
        };
    }

    // 检查是否是白天
    isDay() {
        return this.dayTime >= this.dayNightCycle.day.start &&
               this.dayTime < this.dayNightCycle.day.end;
    }

    // 检查是否是夜晚
    isNight() {
        return !this.isDay();
    }

    // 获取环境光颜色
    getAmbientColor() {
        if (this.isDay()) {
            return { ...this.dayNightCycle.day.ambientColor };
        } else {
            return { ...this.dayNightCycle.night.ambientColor };
        }
    }

    // 获取光照强度（插值）
    getLightIntensity() {
        const targetIntensity = this.isDay()
            ? this.dayNightCycle.day.lightIntensity
            : this.dayNightCycle.night.lightIntensity;

        // 在黎明和黄昏时插值
        if (this.currentPhase === 'dawn' || this.currentPhase === 'dusk') {
            const phase = this.timePhases[this.currentPhase];
            const progress = (this.dayTime - phase.start) / (phase.end - phase.start);
            const dayIntensity = this.dayNightCycle.day.lightIntensity;
            const nightIntensity = this.dayNightCycle.night.lightIntensity;

            if (this.currentPhase === 'dawn') {
                // 黎明：夜晚 -> 白天
                return nightIntensity + (dayIntensity - nightIntensity) * progress;
            } else {
                // 黄昏：白天 -> 夜晚
                return dayIntensity - (dayIntensity - nightIntensity) * progress;
            }
        }

        return targetIntensity;
    }

    // 设置时间
    setTime(hours, minutes = 0) {
        const oldHour = Math.floor(this.dayTime);
        this.dayTime = hours + minutes / 60;
        this.minutes = minutes % 60;
        const newHour = Math.floor(this.dayTime);

        // 处理日期变更
        while (this.dayTime >= 24) {
            this.dayTime -= 24;
            this.dayCount++;
        }

        // 触发更新
        if (newHour !== oldHour) {
            this.onHourChange(oldHour, newHour);
        }

        console.log(`时间设置为: ${this.getTimeString()}`);
        eventSystem.emit('time-set', this.getTimeInfo());
    }

    // 跳转到指定时间
    jumpToTime(hours, minutes = 0) {
        this.setTime(hours, minutes);
    }

    // 设置天数
    setDay(day) {
        this.dayCount = day;
        console.log(`天数设置为: 第${this.dayCount}天`);
        eventSystem.emit('day-set', { day: this.dayCount });
    }

    // 增加天数
    advanceDay(days = 1) {
        this.dayCount += days;
        console.log(`天数增加: 第${this.dayCount}天`);
        eventSystem.emit('day-advanced', {
            from: this.dayCount - days,
            to: this.dayCount
        });

        // 重置当日事件
        this.resetDailyEvents();
    }

    // 重置每日事件
    resetDailyEvents() {
        for (const event of this.timeEvents) {
            if (event.day === null) {
                event.triggered = false;
            }
        }
    }

    // 设置时间流逝速度
    setTimeScale(scale) {
        this.timeScale = scale;
        console.log(`时间流逝速度设置为: ${scale}x`);
        eventSystem.emit('time-scale-changed', { scale });
    }

    // 获取时间流逝速度
    getTimeScale() {
        return this.timeScale;
    }

    // 获取当前阶段
    getCurrentPhase() {
        return this.currentPhase;
    }

    // 获取阶段信息
    getPhaseInfo(phaseName) {
        return this.timePhases[phaseName] || null;
    }

    // 暂停时间
    pause() {
        this.paused = true;
        console.log('时间系统已暂停');
    }

    // 恢复时间
    resume() {
        this.paused = false;
        console.log('时间系统已恢复');
    }

    // 切换暂停状态
    togglePause() {
        if (this.paused) {
            this.resume();
        } else {
            this.pause();
        }
    }

    // 重置时间系统
    reset() {
        this.dayTime = 6;
        this.dayCount = 1;
        this.minutes = 0;
        this.timeScale = 1;
        this.accumulatedTime = 0;
        this.timeEvents = [];
        this.lastHour = 6;
        this.currentPhase = 'morning';
        console.log('时间系统已重置');
    }

    // 获取时间统计信息
    getStats() {
        return {
            dayCount: this.dayCount,
            currentTime: this.getTimeString(),
            currentPhase: this.currentPhase,
            timeScale: this.timeScale,
            totalHoursPlayed: (this.dayCount - 1) * 24 + this.dayTime,
            pendingEvents: this.timeEvents.filter(e => !e.triggered).length
        };
    }
}

// 创建全局时间系统实例
const timeSystem = new TimeSystem();

export default TimeSystem;
export { timeSystem };
