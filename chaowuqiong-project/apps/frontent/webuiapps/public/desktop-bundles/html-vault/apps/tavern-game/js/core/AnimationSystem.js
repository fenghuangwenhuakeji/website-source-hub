/**
 * AnimationSystem - 动画系统
 * V2.0 核心引擎组件
 * 负责角色、技能等动画播放
 */

export class Animation {
    constructor(options = {}) {
        this.name = options.name || 'unnamed';
        this.frames = options.frames || [];
        this.frameRate = options.frameRate || 12;
        this.looping = options.looping !== undefined ? options.looping : true;
        this.currentFrame = 0;
        this.timer = 0;
        this.playing = false;
        this.finished = false;
        this.onComplete = options.onComplete || null;
    }

    /**
     * 播放动画
     */
    play(reset = true) {
        if (reset) {
            this.currentFrame = 0;
            this.timer = 0;
        }
        this.playing = true;
        this.finished = false;
    }

    /**
     * 停止动画
     */
    stop() {
        this.playing = false;
    }

    /**
     * 暂停动画
     */
    pause() {
        this.playing = false;
    }

    /**
     * 恢复动画
     */
    resume() {
        this.playing = true;
    }

    /**
     * 更新动画
     */
    update(deltaTime) {
        if (!this.playing || this.finished) return;

        this.timer += deltaTime;

        const frameTime = 1000 / this.frameRate;

        while (this.timer >= frameTime) {
            this.timer -= frameTime;
            this.currentFrame++;

            if (this.currentFrame >= this.frames.length) {
                if (this.looping) {
                    this.currentFrame = 0;
                } else {
                    this.currentFrame = this.frames.length - 1;
                    this.finished = true;
                    this.playing = false;
                    if (this.onComplete) {
                        this.onComplete();
                    }
                }
            }
        }
    }

    /**
     * 获取当前帧
     */
    getCurrentFrame() {
        return this.frames[this.currentFrame];
    }
}

export class AnimationSystem {
    constructor(engine) {
        this.engine = engine;
        this.version = '2.0.0';
        this.animations = new Map();
        console.log('✅ 动画系统已创建 (V2.0)');
    }

    async initialize() {
        console.log('🎬 初始化动画系统...');
        this.loadDefaultAnimations();
        console.log('✅ 动画系统初始化完成');
        return { success: true };
    }

    loadDefaultAnimations() {
        // 默认待机动画
        this.registerAnimation('idle', new Animation({
            name: 'idle',
            frames: [0, 1, 2, 1],
            frameRate: 8,
            looping: true
        }));

        // 默认行走动画
        this.registerAnimation('walk', new Animation({
            name: 'walk',
            frames: [0, 1, 2, 3],
            frameRate: 12,
            looping: true
        }));

        // 默认攻击动画
        this.registerAnimation('attack', new Animation({
            name: 'attack',
            frames: [0, 1, 2, 3, 2, 1, 0],
            frameRate: 15,
            looping: false
        }));

        // 默认受击动画
        this.registerAnimation('hit', new Animation({
            name: 'hit',
            frames: [0, 1, 2],
            frameRate: 20,
            looping: false
        }));

        // 默认死亡动画
        this.registerAnimation('death', new Animation({
            name: 'death',
            frames: [0, 1, 2, 3, 4],
            frameRate: 10,
            looping: false
        }));
    }

    registerAnimation(name, animation) {
        this.animations.set(name, animation);
    }

    getAnimation(name) {
        return this.animations.get(name);
    }

    update(deltaTime) {
        this.animations.forEach((animation) => {
            animation.update(deltaTime);
        });
    }

    shutdown() {
        console.log('🛑 关闭动画系统...');
        this.animations.clear();
        console.log('✅ 动画系统已关闭');
    }
}

export default AnimationSystem;
