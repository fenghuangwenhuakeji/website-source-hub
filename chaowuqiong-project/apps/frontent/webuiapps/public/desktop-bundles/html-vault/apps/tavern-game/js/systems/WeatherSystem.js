// ========== 天气系统 ==========
// 负责游戏中的天气效果（晴天、雨天、雪天等）

class WeatherSystem {
    constructor() {
        this.isInitialized = false;
        this.currentWeather = 'clear';
        this.particles = [];
        this.transitions = {
            'clear': { opacity: 0, intensity: 0 },
            'rain': { opacity: 0.6, intensity: 1 },
            'snow': { opacity: 0.8, intensity: 0.8 }
        };
        this.weatherEffects = {
            'clear': null,
            'rain': 'rain',
            'snow': 'snow'
        };
        this.transitioning = false;
        this.transitionProgress = 0;
        this.targetWeather = 'clear';
        this.transitionDuration = 2000; // 2秒过渡
        this.lastUpdate = 0;
    }

    // 初始化天气系统
    init() {
        console.log('天气系统初始化完成');
        this.isInitialized = true;
    }

    // 设置天气
    setWeather(weatherType) {
        if (!this.transitions[weatherType]) {
            console.warn(`未知天气类型: ${weatherType}`);
            return;
        }

        if (this.currentWeather === weatherType) {
            return;
        }

        console.log(`天气变化: ${this.currentWeather} -> ${weatherType}`);
        this.targetWeather = weatherType;
        this.transitioning = true;
        this.transitionProgress = 0;
        this.lastUpdate = Date.now();

        // 触发天气变化事件
        eventSystem.emit('weather-change', {
            from: this.currentWeather,
            to: weatherType
        });
    }

    // 更新天气系统
    update(deltaTime) {
        if (!this.isInitialized) return;

        // 更新过渡
        if (this.transitioning) {
            this.updateTransition(deltaTime);
        }

        // 更新天气粒子
        this.updateParticles(deltaTime);
    }

    // 更新天气过渡
    updateTransition(deltaTime) {
        const now = Date.now();
        const elapsed = now - this.lastUpdate;
        this.transitionProgress = Math.min(1, elapsed / this.transitionDuration);

        if (this.transitionProgress >= 1) {
            this.transitioning = false;
            this.currentWeather = this.targetWeather;
            console.log(`天气过渡完成: ${this.currentWeather}`);
        }
    }

    // 更新天气粒子
    updateParticles(deltaTime) {
        const weather = this.getEffectiveWeather();
        const config = this.transitions[weather];

        if (weather === 'clear') {
            // 晴天：清除粒子
            if (this.particles.length > 0) {
                this.particles = [];
            }
            return;
        }

        // 生成新粒子
        const spawnRate = weather === 'rain' ? 50 : 30;
        const targetCount = weather === 'rain' ? 200 : 150;

        // 调整粒子数量
        const currentCount = this.particles.length;
        const targetWithOpacity = Math.floor(targetCount * config.intensity);

        if (currentCount < targetWithOpacity) {
            // 添加新粒子
            const addCount = Math.min(spawnRate, targetWithOpacity - currentCount);
            for (let i = 0; i < addCount; i++) {
                this.particles.push(this.createParticle(weather));
            }
        } else if (currentCount > targetWithOpacity) {
            // 移除多余粒子
            this.particles.splice(0, currentCount - targetWithOpacity);
        }

        // 更新现有粒子
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            this.updateParticle(particle, weather, deltaTime);

            // 移除超出屏幕的粒子
            if (particle.y > window.innerHeight) {
                this.particles.splice(i, 1);
            }
        }
    }

    // 创建天气粒子
    createParticle(weather) {
        return {
            x: Math.random() * window.innerWidth,
            y: -10,
            vx: weather === 'rain' ? (Math.random() - 0.5) * 2 : (Math.random() - 0.5) * 1,
            vy: weather === 'rain' ? Math.random() * 10 + 15 : Math.random() * 2 + 1,
            size: weather === 'rain' ? Math.random() * 2 + 1 : Math.random() * 4 + 2,
            opacity: Math.random() * 0.5 + 0.3
        };
    }

    // 更新单个粒子
    updateParticle(particle, weather, deltaTime) {
        particle.x += particle.vx * deltaTime * 60;
        particle.y += particle.vy * deltaTime * 60;

        // 雨滴的风吹效果
        if (weather === 'rain') {
            particle.x += Math.sin(particle.y * 0.01) * 0.5;
        }

        // 雪花的飘动效果
        if (weather === 'snow') {
            particle.x += Math.sin(particle.y * 0.02) * 0.8;
        }
    }

    // 渲染天气效果
    render(ctx) {
        if (!this.isInitialized) return;

        const weather = this.getEffectiveWeather();
        const config = this.transitions[weather];

        if (weather === 'clear') {
            return;
        }

        // 保存上下文
        ctx.save();

        // 设置天气效果
        if (weather === 'rain') {
            this.renderRain(ctx, config);
        } else if (weather === 'snow') {
            this.renderSnow(ctx, config);
        }

        // 恢复上下文
        ctx.restore();
    }

    // 渲染雨天效果
    renderRain(ctx, config) {
        ctx.strokeStyle = `rgba(174, 194, 224, ${config.opacity * 0.6})`;
        ctx.lineWidth = 1.5;
        ctx.lineCap = 'round';

        for (const particle of this.particles) {
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(particle.x + particle.vx * 2, particle.y + particle.vy * 2);
            ctx.stroke();
        }

        // 添加雨天气氛围
        const gradient = ctx.createLinearGradient(0, 0, 0, window.innerHeight);
        gradient.addColorStop(0, `rgba(100, 120, 150, ${config.opacity * 0.1})`);
        gradient.addColorStop(1, `rgba(100, 120, 150, ${config.opacity * 0.2})`);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
    }

    // 渲染雪天效果
    renderSnow(ctx, config) {
        ctx.fillStyle = `rgba(255, 255, 255, ${config.opacity * 0.8})`;

        for (const particle of this.particles) {
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
        }

        // 添加雪天气氛围
        const gradient = ctx.createLinearGradient(0, 0, 0, window.innerHeight);
        gradient.addColorStop(0, `rgba(200, 220, 240, ${config.opacity * 0.15})`);
        gradient.addColorStop(1, `rgba(200, 220, 240, ${config.opacity * 0.25})`);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
    }

    // 获取当前有效天气（考虑过渡）
    getEffectiveWeather() {
        if (!this.transitioning) {
            return this.currentWeather;
        }

        // 过渡期间，根据进度返回适当天气
        if (this.transitionProgress < 0.5) {
            return this.currentWeather;
        } else {
            return this.targetWeather;
        }
    }

    // 获取当前天气
    getWeather() {
        return this.currentWeather;
    }

    // 获取天气配置
    getWeatherConfig(weather) {
        return this.transitions[weather] || this.transitions['clear'];
    }

    // 检查是否正在过渡
    isTransitioning() {
        return this.transitioning;
    }

    // 获取过渡进度
    getTransitionProgress() {
        return this.transitionProgress;
    }

    // 强制完成过渡
    completeTransition() {
        if (this.transitioning) {
            this.transitioning = false;
            this.currentWeather = this.targetWeather;
            console.log(`天气过渡强制完成: ${this.currentWeather}`);
        }
    }

    // 清除所有粒子
    clearParticles() {
        this.particles = [];
    }

    // 重置天气系统
    reset() {
        this.currentWeather = 'clear';
        this.targetWeather = 'clear';
        this.transitioning = false;
        this.transitionProgress = 0;
        this.clearParticles();
        console.log('天气系统已重置');
    }
}

// 创建全局天气系统实例
const weatherSystem = new WeatherSystem();

export default WeatherSystem;
export { weatherSystem };
