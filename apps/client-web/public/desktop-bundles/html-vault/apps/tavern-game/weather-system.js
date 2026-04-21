// ========== 天气系统 ==========

class WeatherSystem {
    constructor() {
        this.currentWeather = 'sunny';
        this.weatherTypes = ['sunny', 'rainy', 'snowy', 'foggy', 'stormy'];
        this.weatherEffects = new Map();
        this.weatherParticles = [];
        this.isInitialized = false;
        this.weatherDuration = 0;
        this.maxDuration = 60000; // 天气持续时间（毫秒）
        this.weatherTransition = false;
    }

    // 初始化天气系统
    init() {
        if (this.isInitialized) return;

        console.log('初始化天气系统...');
        this.setupWeatherTypes();
        this.setupWeatherUI();
        this.startWeatherCycle();
        this.isInitialized = true;
        console.log('天气系统初始化完成');
    }

    // 设置天气类型
    setupWeatherTypes() {
        this.weatherTypes = {
            sunny: {
                name: '晴天',
                icon: '☀️',
                description: '阳光明媚的好天气',
                visibility: 1.0,
                effect: null
            },
            rainy: {
                name: '雨天',
                icon: '🌧️',
                description: '淅淅沥沥的雨声',
                visibility: 0.8,
                effect: 'rain'
            },
            snowy: {
                name: '雪天',
                icon: '❄️',
                description: '雪花飘落的浪漫时刻',
                visibility: 0.7,
                effect: 'snow'
            },
            foggy: {
                name: '雾天',
                icon: '🌫️',
                description: '雾气弥漫，能见度降低',
                visibility: 0.5,
                effect: 'fog'
            },
            stormy: {
                name: '暴风雨',
                icon: '⛈️',
                description: '雷声隆隆，电闪雷鸣',
                visibility: 0.6,
                effect: 'storm'
            }
        };
    }

    // 设置天气UI
    setupWeatherUI() {
        // 创建天气显示元素
        if (!document.getElementById('weather-display')) {
            const weatherDisplay = document.createElement('div');
            weatherDisplay.id = 'weather-display';
            weatherDisplay.className = 'weather-display';
            weatherDisplay.innerHTML = `
                <div class="weather-icon" id="weather-icon">☀️</div>
                <div class="weather-info">
                    <div class="weather-name" id="weather-name">晴天</div>
                    <div class="weather-timer" id="weather-timer">00:00</div>
                </div>
            `;
            document.body.appendChild(weatherDisplay);
        }

        // 创建天气粒子容器
        if (!document.getElementById('weather-particles')) {
            const particleContainer = document.createElement('div');
            particleContainer.id = 'weather-particles';
            particleContainer.className = 'weather-particles';
            document.body.appendChild(particleContainer);
        }
    }

    // 开始天气循环
    startWeatherCycle() {
        this.weatherDuration = this.maxDuration;
        this.updateWeatherTimer();

        setInterval(() => {
            this.weatherDuration -= 1000;

            if (this.weatherDuration <= 0) {
                this.changeWeather();
                this.weatherDuration = this.maxDuration;
            }

            this.updateWeatherTimer();
            this.updateWeatherParticles();
        }, 1000);
    }

    // 改变天气
    changeWeather(newWeather = null) {
        const weatherKeys = Object.keys(this.weatherTypes);

        if (newWeather && this.weatherTypes[newWeather]) {
            this.currentWeather = newWeather;
        } else {
            // 随机选择天气（避免连续相同天气）
            let availableWeather = weatherKeys.filter(w => w !== this.currentWeather);
            const randomIndex = Math.floor(Math.random() * availableWeather.length);
            this.currentWeather = availableWeather[randomIndex];
        }

        this.updateWeatherDisplay();
        this.applyWeatherEffects();
        this.createWeatherParticles();

        const weatherInfo = this.weatherTypes[this.currentWeather];
        if (game.player) {
            game.showNotification(`天气变化：${weatherInfo.name}`, 'info');
        }
    }

    // 更新天气显示
    updateWeatherDisplay() {
        const weatherInfo = this.weatherTypes[this.currentWeather];

        // 更新天气图标
        const weatherIcon = document.getElementById('weather-icon');
        if (weatherIcon) {
            weatherIcon.textContent = weatherInfo.icon;
            weatherIcon.style.animation = this.getWeatherAnimation();
        }

        // 更新天气名称
        const weatherName = document.getElementById('weather-name');
        if (weatherName) {
            weatherName.textContent = weatherInfo.name;
        }

        // 更新背景透明度
        document.body.style.filter = `brightness(${weatherInfo.visibility})`;
    }

    // 获取天气动画
    getWeatherAnimation() {
        const animations = {
            sunny: 'none',
            rainy: 'shake 0.5s infinite',
            snowy: 'float 3s ease-in-out infinite',
            foggy: 'pulse 4s ease-in-out infinite',
            stormy: 'shake 0.2s infinite'
        };
        return animations[this.currentWeather] || 'none';
    }

    // 更新天气计时器
    updateWeatherTimer() {
        const weatherTimer = document.getElementById('weather-timer');
        if (weatherTimer) {
            const minutes = Math.floor(this.weatherDuration / 60000);
            const seconds = Math.floor((this.weatherDuration % 60000) / 1000);
            weatherTimer.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    }

    // 应用天气效果
    applyWeatherEffects() {
        const weatherInfo = this.weatherTypes[this.currentWeather];

        // 清除之前的天气效果
        this.clearWeatherEffects();

        // 应用新天气效果
        switch (this.currentWeather) {
            case 'rainy':
                this.createRainEffect();
                break;
            case 'snowy':
                this.createSnowEffect();
                break;
            case 'foggy':
                this.createFogEffect();
                break;
            case 'stormy':
                this.createStormEffect();
                break;
        }

        // 播放天气音效
        this.playWeatherSound();
    }

    // 创建雨滴效果
    createRainEffect() {
        const container = document.getElementById('weather-particles');
        if (!container) return;

        for (let i = 0; i < 100; i++) {
            const raindrop = document.createElement('div');
            raindrop.className = 'raindrop';
            raindrop.style.left = Math.random() * 100 + '%';
            raindrop.style.animationDelay = Math.random() * 2 + 's';
            raindrop.style.animationDuration = (0.5 + Math.random() * 0.5) + 's';
            container.appendChild(raindrop);
        }
    }

    // 创建雪花效果
    createSnowEffect() {
        const container = document.getElementById('weather-particles');
        if (!container) return;

        for (let i = 0; i < 50; i++) {
            const snowflake = document.createElement('div');
            snowflake.className = 'snowflake';
            snowflake.textContent = '❄';
            snowflake.style.left = Math.random() * 100 + '%';
            snowflake.style.animationDelay = Math.random() * 5 + 's';
            snowflake.style.animationDuration = (3 + Math.random() * 2) + 's';
            snowflake.style.fontSize = (10 + Math.random() * 15) + 'px';
            container.appendChild(snowflake);
        }
    }

    // 创建雾气效果
    createFogEffect() {
        const container = document.getElementById('weather-particles');
        if (!container) return;

        const fog = document.createElement('div');
        fog.className = 'fog-effect';
        fog.style.animation = 'fog-move 10s ease-in-out infinite';
        container.appendChild(fog);
    }

    // 创建暴风雨效果
    createStormEffect() {
        // 添加雨滴
        this.createRainEffect();

        // 添加闪电效果
        const container = document.getElementById('weather-particles');
        if (!container) return;

        const lightning = document.createElement('div');
        lightning.className = 'lightning-effect';
        lightning.style.animation = 'flash 5s ease-in-out infinite';
        container.appendChild(lightning);
    }

    // 更新天气粒子
    updateWeatherParticles() {
        // 定期更新粒子位置和状态
    }

    // 清除天气效果
    clearWeatherEffects() {
        const container = document.getElementById('weather-particles');
        if (container) {
            container.innerHTML = '';
        }
    }

    // 播放天气音效
    playWeatherSound() {
        if (!audioSystem) return;

        switch (this.currentWeather) {
            case 'rainy':
                audioSystem.playBackgroundMusic('rain');
                break;
            case 'stormy':
                audioSystem.playBackgroundMusic('storm');
                break;
            case 'sunny':
            case 'snowy':
            case 'foggy':
                // 保持默认音乐
                break;
        }
    }

    // 获取当前天气
    getCurrentWeather() {
        return {
            type: this.currentWeather,
            info: this.weatherTypes[this.currentWeather],
            duration: this.weatherDuration
        };
    }

    // 手动设置天气
    setWeather(weatherType) {
        if (this.weatherTypes[weatherType]) {
            this.changeWeather(weatherType);
            this.weatherDuration = this.maxDuration;
            return true;
        }
        return false;
    }

    // 获取天气影响
    getWeatherImpact() {
        const impacts = {
            sunny: { combat: 1.0, exploration: 1.2, mood: 1.2 },
            rainy: { combat: 0.9, exploration: 0.8, mood: 0.9 },
            snowy: { combat: 0.8, exploration: 0.7, mood: 1.0 },
            foggy: { combat: 0.7, exploration: 0.6, mood: 0.8 },
            stormy: { combat: 1.2, exploration: 0.5, mood: 0.7 }
        };
        return impacts[this.currentWeather] || impacts.sunny;
    }

    // 获取系统信息
    getSystemInfo() {
        return {
            isInitialized: this.isInitialized,
            currentWeather: this.currentWeather,
            weatherDuration: this.weatherDuration,
            weatherTypes: Object.keys(this.weatherTypes)
        };
    }
}

// 创建全局天气系统实例
const weatherSystem = new WeatherSystem();
