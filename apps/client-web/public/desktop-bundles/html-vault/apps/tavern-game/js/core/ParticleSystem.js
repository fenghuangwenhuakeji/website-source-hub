/**
 * ParticleSystem - 粒子系统
 * V2.0 核心引擎组件
 * 负责游戏中的粒子特效（爆炸、火花、烟雾等）
 */

export class Particle {
    constructor(options = {}) {
        this.reset(options);
    }

    /**
     * 重置粒子
     */
    reset(options = {}) {
        // 位置
        this.x = options.x || 0;
        this.y = options.y || 0;

        // 速度
        this.vx = options.vx || (Math.random() - 0.5) * 5;
        this.vy = options.vy || (Math.random() - 0.5) * 5;

        // 加速度
        this.ax = options.ax || 0;
        this.ay = options.ay || 0;

        // 大小
        this.size = options.size || 5;
        this.startSize = this.size;
        this.endSize = options.endSize !== undefined ? options.endSize : this.size;

        // 旋转
        this.rotation = options.rotation || 0;
        this.rotationSpeed = options.rotationSpeed || (Math.random() - 0.5) * 0.2;

        // 颜色
        this.color = options.color || '#ffffff';
        this.startColor = this.color;
        this.endColor = options.endColor || this.color;

        // 透明度
        this.alpha = options.alpha !== undefined ? options.alpha : 1;
        this.startAlpha = this.alpha;
        this.endAlpha = options.endAlpha !== undefined ? options.endAlpha : 0;

        // 生命周期
        this.life = options.life || 60;
        this.maxLife = this.life;

        // 形状
        this.shape = options.shape || 'circle';

        // 纹理
        this.texture = options.texture || null;

        // 重力
        this.gravity = options.gravity || 0;

        // 摩擦力
        this.friction = options.friction || 0.99;

        // 弹性
        this.bounce = options.bounce || 0;

        // 混合模式
        this.blendMode = options.blendMode || 'source-over';

        // 活跃状态
        this.active = true;
    }

    /**
     * 更新粒子
     */
    update() {
        if (!this.active) return;

        // 应用重力
        this.vy += this.gravity;

        // 应用摩擦力
        this.vx *= this.friction;
        this.vy *= this.friction;

        // 更新速度
        this.vx += this.ax;
        this.vy += this.ay;

        // 更新位置
        this.x += this.vx;
        this.y += this.vy;

        // 更新旋转
        this.rotation += this.rotationSpeed;

        // 更新大小
        const lifeRatio = 1 - this.life / this.maxLife;
        this.size = this.startSize + (this.endSize - this.startSize) * lifeRatio;

        // 更新透明度
        this.alpha = this.startAlpha + (this.endAlpha - this.startAlpha) * lifeRatio;

        // 更新生命周期
        this.life--;

        // 检查是否死亡
        if (this.life <= 0) {
            this.active = false;
        }
    }

    /**
     * 渲染粒子
     */
    render(ctx) {
        if (!this.active || this.alpha <= 0) return;

        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.globalCompositeOperation = this.blendMode;

        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        if (this.texture) {
            // 渲染纹理
            ctx.drawImage(
                this.texture,
                -this.size / 2,
                -this.size / 2,
                this.size,
                this.size
            );
        } else {
            // 渲染形状
            ctx.fillStyle = this.color;

            if (this.shape === 'circle') {
                ctx.beginPath();
                ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
                ctx.fill();
            } else if (this.shape === 'square') {
                ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
            } else if (this.shape === 'triangle') {
                ctx.beginPath();
                ctx.moveTo(0, -this.size / 2);
                ctx.lineTo(-this.size / 2, this.size / 2);
                ctx.lineTo(this.size / 2, this.size / 2);
                ctx.closePath();
                ctx.fill();
            }
        }

        ctx.restore();
    }

    /**
     * 克隆粒子
     */
    clone() {
        return new Particle({
            x: this.x,
            y: this.y,
            vx: this.vx,
            vy: this.vy,
            ax: this.ax,
            ay: this.ay,
            size: this.size,
            endSize: this.endSize,
            rotation: this.rotation,
            rotationSpeed: this.rotationSpeed,
            color: this.color,
            endColor: this.endColor,
            alpha: this.alpha,
            endAlpha: this.endAlpha,
            life: this.life,
            shape: this.shape,
            texture: this.texture,
            gravity: this.gravity,
            friction: this.friction,
            bounce: this.bounce,
            blendMode: this.blendMode
        });
    }
}

export class ParticleSystem {
    constructor(engine) {
        this.engine = engine;
        this.version = '2.0.0';

        // 粒子池
        this.particlePool = [];
        this.poolSize = 1000;
        this.activeParticles = [];

        // 粒子发射器
        this.emitters = [];

        // 预设效果
        this.presets = {};

        // 统计
        this.stats = {
            activeCount: 0,
            totalCount: 0,
            spawnedCount: 0,
            recycledCount: 0
        };

        console.log('✅ 粒子系统已创建 (V2.0)');
    }

    /**
     * 初始化粒子系统
     */
    async initialize() {
        console.log('✨ 初始化粒子系统...');

        try {
            // 初始化粒子池
            this.initPool();

            // 加载预设效果
            this.loadPresets();

            console.log('✅ 粒子系统初始化完成');
            return { success: true };
        } catch (error) {
            console.error('❌ 粒子系统初始化失败:', error);
            throw error;
        }
    }

    /**
     * 初始化粒子池
     */
    initPool() {
        for (let i = 0; i < this.poolSize; i++) {
            this.particlePool.push(new Particle());
        }
        console.log(`🏊 粒子池初始化完成 (${this.poolSize}个粒子)`);
    }

    /**
     * 从池中获取粒子
     */
    getParticle() {
        let particle;

        if (this.particlePool.length > 0) {
            particle = this.particlePool.pop();
            this.stats.recycledCount++;
        } else {
            particle = new Particle();
            this.poolSize++;
        }

        this.activeParticles.push(particle);
        this.stats.spawnedCount++;
        return particle;
    }

    /**
     * 回收粒子
     */
    recycleParticle(particle) {
        const index = this.activeParticles.indexOf(particle);
        if (index !== -1) {
            this.activeParticles.splice(index, 1);
            this.particlePool.push(particle);
        }
    }

    /**
     * 发射粒子
     */
    emit(options) {
        const count = options.count || 1;

        for (let i = 0; i < count; i++) {
            const particle = this.getParticle();
            particle.reset(options);
        }

        return count;
    }

    /**
     * 创建爆炸效果
     */
    explode(x, y, options = {}) {
        const count = options.count || 50;
        const colors = options.colors || ['#ff6b6b', '#ffa500', '#ffff00', '#ff0000'];

        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count + Math.random() * 0.2;
            const speed = options.speed || 5 + Math.random() * 5;

            this.emit({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: options.size || 5 + Math.random() * 10,
                endSize: 0,
                color: colors[Math.floor(Math.random() * colors.length)],
                alpha: 1,
                endAlpha: 0,
                life: options.life || 30 + Math.random() * 20,
                shape: options.shape || 'circle',
                gravity: options.gravity || 0.1,
                friction: 0.98
            });
        }
    }

    /**
     * 创建火花效果
     */
    sparks(x, y, options = {}) {
        const count = options.count || 20;
        const colors = options.colors || ['#ffd700', '#ffaa00', '#ffffff'];

        for (let i = 0; i < count; i++) {
            this.emit({
                x,
                y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8 - 5,
                size: 2 + Math.random() * 3,
                endSize: 0,
                color: colors[Math.floor(Math.random() * colors.length)],
                alpha: 1,
                endAlpha: 0,
                life: 20 + Math.random() * 20,
                shape: 'circle',
                gravity: 0.3,
                friction: 0.95
            });
        }
    }

    /**
     * 创建烟雾效果
     */
    smoke(x, y, options = {}) {
        const count = options.count || 10;
        const colors = options.colors || ['rgba(200,200,200,0.3)', 'rgba(150,150,150,0.2)'];

        for (let i = 0; i < count; i++) {
            this.emit({
                x: x + (Math.random() - 0.5) * 20,
                y: y + (Math.random() - 0.5) * 20,
                vx: (Math.random() - 0.5) * 1,
                vy: -1 - Math.random() * 2,
                size: 10 + Math.random() * 20,
                endSize: 50 + Math.random() * 30,
                color: colors[Math.floor(Math.random() * colors.length)],
                alpha: 0.5,
                endAlpha: 0,
                life: 60 + Math.random() * 60,
                shape: 'circle',
                friction: 0.99,
                blendMode: 'lighter'
            });
        }
    }

    /**
     * 创建冲击波效果
     */
    shockwave(x, y, options = {}) {
        const count = options.count || 30;
        const color = options.color || '#ffffff';

        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count;
            const speed = options.speed || 8;

            this.emit({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: options.size || 3,
                endSize: options.endSize || 20,
                color,
                alpha: 1,
                endAlpha: 0,
                life: 20 + Math.random() * 10,
                shape: 'circle',
                friction: 0.95,
                blendMode: 'lighter'
            });
        }
    }

    /**
     * 创建血液效果
     */
    blood(x, y, options = {}) {
        const count = options.count || 20;
        const colors = options.colors || ['#8b0000', '#a52a2a', '#b22222'];

        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 6;

            this.emit({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 2 + Math.random() * 4,
                color: colors[Math.floor(Math.random() * colors.length)],
                alpha: 1,
                endAlpha: 0,
                life: 40 + Math.random() * 40,
                shape: 'circle',
                gravity: 0.2,
                friction: 0.98
            });
        }
    }

    /**
     * 创建魔法效果
     */
    magic(x, y, options = {}) {
        const count = options.count || 30;
        const colors = options.colors || ['#4dabf7', '#74c0fc', '#91a7ff'];

        for (let i = 0; i < count; i++) {
            this.emit({
                x,
                y,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                size: 3 + Math.random() * 5,
                color: colors[Math.floor(Math.random() * colors.length)],
                alpha: 1,
                endAlpha: 0,
                life: 30 + Math.random() * 30,
                shape: 'circle',
                friction: 0.95,
                blendMode: 'lighter'
            });
        }
    }

    /**
     * 创建发射器
     */
    createEmitter(options) {
        const emitter = {
            x: options.x || 0,
            y: options.y || 0,
            rate: options.rate || 10, // 发射频率（帧）
            count: options.count || 1,
            life: options.life || 60,
            duration: options.duration || -1, // -1为永久
            timer: 0,
            particleOptions: options.particleOptions || {},
            active: true,
            onComplete: options.onComplete || null
        };

        this.emitters.push(emitter);
        return emitter;
    }

    /**
     * 更新所有粒子
     */
    update() {
        // 更新活跃粒子
        for (let i = this.activeParticles.length - 1; i >= 0; i--) {
            const particle = this.activeParticles[i];
            particle.update();

            if (!particle.active) {
                this.recycleParticle(particle);
            }
        }

        // 更新发射器
        for (let i = this.emitters.length - 1; i >= 0; i--) {
            const emitter = this.emitters[i];

            if (!emitter.active) {
                this.emitters.splice(i, 1);
                continue;
            }

            if (emitter.duration > 0) {
                emitter.duration--;
                if (emitter.duration <= 0) {
                    emitter.active = false;
                    if (emitter.onComplete) {
                        emitter.onComplete();
                    }
                    continue;
                }
            }

            emitter.timer++;

            if (emitter.timer >= emitter.rate) {
                emitter.timer = 0;

                const options = {
                    ...emitter.particleOptions,
                    x: emitter.x,
                    y: emitter.y
                };

                for (let j = 0; j < emitter.count; j++) {
                    this.emit(options);
                }
            }
        }

        // 更新统计
        this.stats.activeCount = this.activeParticles.length;
    }

    /**
     * 渲染所有粒子
     */
    render(ctx) {
        this.activeParticles.forEach(particle => {
            particle.render(ctx);
        });
    }

    /**
     * 清除所有粒子
     */
    clear() {
        this.activeParticles.forEach(particle => {
            particle.active = false;
            this.recycleParticle(particle);
        });
        this.emitters = [];
    }

    /**
     * 加载预设效果
     */
    loadPresets() {
        this.presets = {
            explosion: {
                type: 'explode',
                count: 50,
                colors: ['#ff6b6b', '#ffa500', '#ffff00'],
                speed: 6,
                life: 40
            },
            spark: {
                type: 'sparks',
                count: 20,
                colors: ['#ffd700', '#ffaa00'],
                life: 30
            },
            smoke: {
                type: 'smoke',
                count: 10,
                colors: ['rgba(200,200,200,0.3)'],
                life: 80
            },
            shockwave: {
                type: 'shockwave',
                count: 30,
                color: '#ffffff',
                speed: 8,
                life: 25
            },
            blood: {
                type: 'blood',
                count: 20,
                colors: ['#8b0000', '#a52a2a'],
                life: 50
            },
            magic: {
                type: 'magic',
                count: 30,
                colors: ['#4dabf7', '#74c0fc'],
                life: 40
            }
        };
    }

    /**
     * 使用预设效果
     */
    usePreset(name, x, y, options = {}) {
        const preset = this.presets[name];
        if (!preset) {
            console.warn(`预设效果不存在: ${name}`);
            return;
        }

        const finalOptions = { ...preset, ...options };

        switch (preset.type) {
            case 'explode':
                this.explode(x, y, finalOptions);
                break;
            case 'sparks':
                this.sparks(x, y, finalOptions);
                break;
            case 'smoke':
                this.smoke(x, y, finalOptions);
                break;
            case 'shockwave':
                this.shockwave(x, y, finalOptions);
                break;
            case 'blood':
                this.blood(x, y, finalOptions);
                break;
            case 'magic':
                this.magic(x, y, finalOptions);
                break;
        }
    }

    /**
     * 获取统计信息
     */
    getStats() {
        return {
            ...this.stats,
            poolSize: this.poolSize,
            poolAvailable: this.particlePool.length,
            emitterCount: this.emitters.length
        };
    }

    /**
     * 关闭粒子系统
     */
    shutdown() {
        console.log('🛑 关闭粒子系统...');
        this.clear();
        console.log('✅ 粒子系统已关闭');
    }
}

// 默认导出
export default ParticleSystem;
