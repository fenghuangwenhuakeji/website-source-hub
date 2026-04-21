// ========== 动态背景系统 ==========
// 负责游戏中的动态背景效果（酒馆场景、NPC走动、火炉等）

class DynamicBackground {
    constructor() {
        this.isInitialized = false;
        this.canvas = null;
        this.ctx = null;
        this.elements = [];
        this.animatedElements = [];
        this.particles = [];
        this.layers = [];
        this.currentTime = 0;
        this.activeScene = null;
        this.backgroundImage = null;
        this.ambientAnimation = null;
    }

    // 初始化动态背景系统
    init(canvasId = 'background-canvas') {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            // 如果没有canvas，创建一个
            this.canvas = document.createElement('canvas');
            this.canvas.id = canvasId;
            this.canvas.style.position = 'fixed';
            this.canvas.style.top = '0';
            this.canvas.style.left = '0';
            this.canvas.style.zIndex = '-1';
            document.body.appendChild(this.canvas);
        }

        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();

        window.addEventListener('resize', () => this.resizeCanvas());

        console.log('动态背景系统初始化完成');
        this.isInitialized = true;
    }

    // 调整画布大小
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    // 加载场景
    loadScene(sceneConfig) {
        console.log(`加载场景: ${sceneConfig.name}`);
        this.activeScene = sceneConfig;

        // 加载背景图片
        if (sceneConfig.background) {
            this.loadBackground(sceneConfig.background);
        }

        // 创建场景元素
        this.createSceneElements(sceneConfig.elements || []);

        // 创建动画元素
        this.createAnimatedElements(sceneConfig.animatedElements || []);

        // 创建环境动画（火炉、蜡烛等）
        this.createAmbientAnimation(sceneConfig.ambient || {});

        // 创建环境粒子
        this.createEnvironmentParticles(sceneConfig.particles || {});
    }

    // 加载背景图片
    async loadBackground(imagePath) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                this.backgroundImage = img;
                resolve();
            };
            img.onerror = () => {
                console.warn(`背景图片加载失败: ${imagePath}`);
                resolve();
            };
            img.src = imagePath;
        });
    }

    // 创建场景元素
    createSceneElements(elements) {
        this.elements = elements.map(el => ({
            ...el,
            type: el.type || 'static',
            visible: true
        }));
    }

    // 创建动画元素
    createAnimatedElements(elements) {
        this.animatedElements = elements.map(el => ({
            ...el,
            type: el.type || 'npc',
            state: 'idle',
            animationFrame: 0,
            animationSpeed: el.animationSpeed || 1,
            visible: true
        }));
    }

    // 创建环境动画（火炉、蜡烛等）
    createAmbientAnimation(config) {
        this.ambientAnimation = {
            type: config.type || 'fireplace',
            intensity: config.intensity || 1,
            color: config.color || { r: 255, g: 150, b: 50 }
        };
    }

    // 创建环境粒子（灰尘、光点等）
    createEnvironmentParticles(config) {
        const particleCount = config.count || 30;
        this.particles = [];

        for (let i = 0; i < particleCount; i++) {
            this.particles.push({
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                size: Math.random() * 2 + 1,
                opacity: Math.random() * 0.5 + 0.2,
                type: config.type || 'dust'
            });
        }
    }

    // 更新动态背景
    update(deltaTime) {
        if (!this.isInitialized) return;

        this.currentTime += deltaTime;

        // 更新动画元素
        this.updateAnimatedElements(deltaTime);

        // 更新粒子
        this.updateParticles(deltaTime);

        // 更新环境动画
        this.updateAmbientAnimation(deltaTime);
    }

    // 更新动画元素（NPC走动等）
    updateAnimatedElements(deltaTime) {
        for (const element of this.animatedElements) {
            if (!element.visible) continue;

            switch (element.type) {
                case 'npc':
                    this.updateNPC(element, deltaTime);
                    break;
                case 'object':
                    this.updateObject(element, deltaTime);
                    break;
            }
        }
    }

    // 更新NPC动画
    updateNPC(npc, deltaTime) {
        // NPC简单AI：随机走动
        if (npc.state === 'idle') {
            // 偶尔开始走动
            if (Math.random() < 0.01) {
                npc.state = 'walking';
                npc.targetX = npc.x + (Math.random() - 0.5) * 200;
                npc.targetY = npc.y + (Math.random() - 0.5) * 100;
            }
        } else if (npc.state === 'walking') {
            // 走向目标
            const dx = npc.targetX - npc.x;
            const dy = npc.targetY - npc.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 10) {
                npc.state = 'idle';
                npc.animationFrame = 0;
            } else {
                const speed = 30 * deltaTime;
                npc.x += (dx / distance) * speed;
                npc.y += (dy / distance) * speed;
                npc.animationFrame += deltaTime * npc.animationSpeed * 10;
            }
        }

        // 边界检查
        npc.x = Math.max(50, Math.min(window.innerWidth - 50, npc.x));
        npc.y = Math.max(50, Math.min(window.innerHeight - 50, npc.y));
    }

    // 更新物体动画
    updateObject(obj, deltaTime) {
        // 物体动画逻辑
        if (obj.animation) {
            obj.animationFrame += deltaTime * obj.animationSpeed;
        }
    }

    // 更新粒子
    updateParticles(deltaTime) {
        for (const particle of this.particles) {
            particle.x += particle.vx * deltaTime * 60;
            particle.y += particle.vy * deltaTime * 60;

            // 边界循环
            if (particle.x < 0) particle.x = window.innerWidth;
            if (particle.x > window.innerWidth) particle.x = 0;
            if (particle.y < 0) particle.y = window.innerHeight;
            if (particle.y > window.innerHeight) particle.y = 0;

            // 闪烁效果
            particle.opacity += (Math.random() - 0.5) * 0.02;
            particle.opacity = Math.max(0.1, Math.min(0.8, particle.opacity));
        }
    }

    // 更新环境动画（火炉）
    updateAmbientAnimation(deltaTime) {
        if (!this.ambientAnimation) return;

        // 火炉闪烁
        this.ambientAnimation.intensity += (Math.random() - 0.5) * 0.1;
        this.ambientAnimation.intensity = Math.max(0.5, Math.min(1.5, this.ambientAnimation.intensity));
    }

    // 渲染动态背景
    render() {
        if (!this.isInitialized || !this.ctx) return;

        const ctx = this.ctx;

        // 清空画布
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 渲染背景
        this.renderBackground(ctx);

        // 渲染静态元素
        this.renderStaticElements(ctx);

        // 渲染环境动画
        this.renderAmbientAnimation(ctx);

        // 渲染粒子
        this.renderParticles(ctx);

        // 渲染动画元素
        this.renderAnimatedElements(ctx);
    }

    // 渲染背景
    renderBackground(ctx) {
        if (this.backgroundImage) {
            // 绘制图片
            ctx.drawImage(this.backgroundImage, 0, 0, this.canvas.width, this.canvas.height);
        } else {
            // 默认背景：酒馆室内
            this.renderDefaultTavernBackground(ctx);
        }

        // 应用时间光照
        this.applyTimeLighting(ctx);
    }

    // 渲染默认酒馆背景
    renderDefaultTavernBackground(ctx) {
        // 墙壁
        const wallGradient = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        wallGradient.addColorStop(0, '#4a3728');
        wallGradient.addColorStop(1, '#3a2718');
        ctx.fillStyle = wallGradient;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 地板
        const floorGradient = ctx.createLinearGradient(0, this.canvas.height * 0.7, 0, this.canvas.height);
        floorGradient.addColorStop(0, '#5a4738');
        floorGradient.addColorStop(1, '#4a3728');
        ctx.fillStyle = floorGradient;
        ctx.fillRect(0, this.canvas.height * 0.7, this.canvas.width, this.canvas.height * 0.3);

        // 木板纹理
        ctx.strokeStyle = '#3a2718';
        ctx.lineWidth = 2;
        for (let i = 0; i < this.canvas.width; i += 80) {
            ctx.beginPath();
            ctx.moveTo(i, this.canvas.height * 0.7);
            ctx.lineTo(i, this.canvas.height);
            ctx.stroke();
        }

        // 火炉位置（左侧）
        this.renderFireplace(ctx, 50, this.canvas.height * 0.4, 150, 200);

        // 酒吧台（右侧）
        this.renderBarCounter(ctx, this.canvas.width - 250, this.canvas.height * 0.5, 200, 80);

        // 窗户（顶部）
        this.renderWindows(ctx);
    }

    // 渲染火炉
    renderFireplace(ctx, x, y, width, height) {
        // 火炉外框
        ctx.fillStyle = '#2a1710';
        ctx.fillRect(x, y, width, height);

        // 火炉内框
        ctx.fillStyle = '#1a0700';
        ctx.fillRect(x + 10, y + 10, width - 20, height - 30);

        // 火焰
        if (this.ambientAnimation) {
            const intensity = this.ambientAnimation.intensity;
            const flameHeight = (height - 50) * intensity;

            // 绘制火焰
            const flameGradient = ctx.createLinearGradient(x + 10, y + height - 40, x + 10, y + 20);
            flameGradient.addColorStop(0, `rgba(255, 100, 0, ${0.8 * intensity})`);
            flameGradient.addColorStop(0.5, `rgba(255, 200, 0, ${0.6 * intensity})`);
            flameGradient.addColorStop(1, `rgba(255, 50, 0, ${0.3 * intensity})`);

            ctx.fillStyle = flameGradient;
            ctx.beginPath();
            ctx.moveTo(x + 20, y + height - 40);
            ctx.quadraticCurveTo(x + width / 2, y + 20, x + width - 20, y + height - 40);
            ctx.lineTo(x + width - 20, y + height - 40);
            ctx.quadraticCurveTo(x + width / 2, y + height - 40 - flameHeight, x + 20, y + height - 40);
            ctx.fill();

            // 火光
            const lightRadius = 150 * intensity;
            const lightGradient = ctx.createRadialGradient(
                x + width / 2, y + height / 2, 0,
                x + width / 2, y + height / 2, lightRadius
            );
            lightGradient.addColorStop(0, `rgba(255, 150, 50, ${0.2 * intensity})`);
            lightGradient.addColorStop(1, 'rgba(255, 150, 50, 0)');

            ctx.fillStyle = lightGradient;
            ctx.fillRect(x - lightRadius, y - lightRadius, lightRadius * 2, lightRadius * 2);
        }
    }

    // 渲染吧台
    renderBarCounter(ctx, x, y, width, height) {
        // 吧台主体
        ctx.fillStyle = '#3a2718';
        ctx.fillRect(x, y, width, height);

        // 吧台边缘
        ctx.fillStyle = '#4a3728';
        ctx.fillRect(x, y, width, 15);

        // 酒瓶
        for (let i = 0; i < 5; i++) {
            this.renderBottle(ctx, x + 20 + i * 35, y - 40, 20, 50);
        }
    }

    // 渲染酒瓶
    renderBottle(ctx, x, y, width, height) {
        // 瓶身
        const bottleGradient = ctx.createLinearGradient(x, y, x + width, y + height);
        bottleGradient.addColorStop(0, '#4a90d9');
        bottleGradient.addColorStop(1, '#2a5089');
        ctx.fillStyle = bottleGradient;
        ctx.fillRect(x, y + 15, width, height - 15);

        // 瓶颈
        ctx.fillRect(x + 5, y, width - 10, 20);

        // 瓶塞
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(x + 3, y - 5, width - 6, 8);
    }

    // 渲染窗户
    renderWindows(ctx) {
        const windowWidth = 120;
        const windowHeight = 80;
        const windowY = 50;

        for (let i = 0; i < 3; i++) {
            const windowX = 100 + i * 300;

            // 窗框
            ctx.fillStyle = '#2a1710';
            ctx.fillRect(windowX, windowY, windowWidth, windowHeight);

            // 玻璃（根据时间变化颜色）
            const isNight = window.timeSystem ? window.timeSystem.isNight() : false;
            if (isNight) {
                ctx.fillStyle = '#1a2a3a';
            } else {
                ctx.fillStyle = '#7ab3d9';
            }
            ctx.fillRect(windowX + 5, windowY + 5, windowWidth - 10, windowHeight - 10);

            // 窗格
            ctx.fillStyle = '#2a1710';
            ctx.fillRect(windowX + windowWidth / 2 - 2, windowY, 4, windowHeight);
            ctx.fillRect(windowX, windowY + windowHeight / 2 - 2, windowWidth, 4);
        }
    }

    // 应用时间光照
    applyTimeLighting(ctx) {
        if (!window.timeSystem) return;

        const lightIntensity = window.timeSystem.getLightIntensity();
        const isNight = window.timeSystem.isNight();

        // 应用光照覆盖
        if (lightIntensity < 1) {
            const overlayAlpha = (1 - lightIntensity) * 0.4;
            ctx.fillStyle = `rgba(20, 20, 40, ${overlayAlpha})`;
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }

        // 夜晚时添加月光效果
        if (isNight && window.timeSystem.currentPhase === 'night') {
            const moonlightGradient = ctx.createRadialGradient(
                this.canvas.width * 0.8, 100, 0,
                this.canvas.width * 0.8, 100, 300
            );
            moonlightGradient.addColorStop(0, 'rgba(200, 220, 255, 0.1)');
            moonlightGradient.addColorStop(1, 'rgba(200, 220, 255, 0)');

            ctx.fillStyle = moonlightGradient;
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    // 渲染静态元素
    renderStaticElements(ctx) {
        for (const element of this.elements) {
            if (!element.visible) continue;
            this.renderElement(ctx, element);
        }
    }

    // 渲染环境动画
    renderAmbientAnimation(ctx) {
        // 环境动画已集成到背景渲染中
    }

    // 渲染粒子
    renderParticles(ctx) {
        for (const particle of this.particles) {
            ctx.fillStyle = `rgba(255, 255, 255, ${particle.opacity})`;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // 渲染动画元素
    renderAnimatedElements(ctx) {
        for (const element of this.animatedElements) {
            if (!element.visible) continue;

            switch (element.type) {
                case 'npc':
                    this.renderNPC(ctx, element);
                    break;
                case 'object':
                    this.renderObject(ctx, element);
                    break;
            }
        }
    }

    // 渲染NPC
    renderNPC(ctx, npc) {
        // NPC身体
        ctx.fillStyle = npc.color || '#8B4513';
        ctx.beginPath();
        ctx.arc(npc.x, npc.y, 15, 0, Math.PI * 2);
        ctx.fill();

        // NPC阴影
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(npc.x, npc.y + 18, 12, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // NPC名称
        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(npc.name || 'NPC', npc.x, npc.y - 25);
    }

    // 渲染物体
    renderObject(ctx, obj) {
        ctx.fillStyle = obj.color || '#4a3728';
        ctx.fillRect(obj.x - obj.width / 2, obj.y - obj.height / 2, obj.width, obj.height);
    }

    // 渲染元素
    renderElement(ctx, element) {
        // 简单元素渲染
        if (element.type === 'rect') {
            ctx.fillStyle = element.color || '#4a3728';
            ctx.fillRect(element.x, element.y, element.width, element.height);
        } else if (element.type === 'circle') {
            ctx.fillStyle = element.color || '#4a3728';
            ctx.beginPath();
            ctx.arc(element.x, element.y, element.radius || 10, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // 清除场景
    clearScene() {
        this.activeScene = null;
        this.elements = [];
        this.animatedElements = [];
        this.particles = [];
        this.ambientAnimation = null;
        console.log('场景已清除');
    }

    // 重置动态背景系统
    reset() {
        this.clearScene();
        this.currentTime = 0;
        console.log('动态背景系统已重置');
    }
}

// 创建全局动态背景系统实例
const dynamicBackground = new DynamicBackground();

export default DynamicBackground;
export { dynamicBackground };
