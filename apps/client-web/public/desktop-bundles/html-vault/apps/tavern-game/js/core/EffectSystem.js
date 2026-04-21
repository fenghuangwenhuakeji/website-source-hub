/**
 * EffectSystem - 特效系统
 * V2.0 核心引擎组件
 * 负责游戏特效（伤害数字、状态效果、慢动作等）
 */

export class Effect {
    constructor(options = {}) {
        this.type = options.type || 'damage';
        this.x = options.x || 0;
        this.y = options.y || 0;
        this.value = options.value || 0;
        this.color = options.color || '#fff';
        this.life = options.life || 60;
        this.maxLife = this.life;
        this.alpha = 1;
        this.scale = options.scale || 1;
        this.active = true;
    }

    update() {
        this.life--;
        this.y -= 2; // 向上飘动
        this.alpha = this.life / this.maxLife;
        this.scale = this.life / this.maxLife;

        if (this.life <= 0) {
            this.active = false;
        }
    }

    render(ctx) {
        if (!this.active) return;

        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.translate(this.x, this.y);
        ctx.scale(this.scale, this.scale);

        if (this.type === 'damage') {
            ctx.font = 'bold 24px Arial';
            ctx.fillStyle = this.color;
            ctx.textAlign = 'center';
            ctx.fillText(`-${this.value}`, 0, 0);
        } else if (this.type === 'heal') {
            ctx.font = 'bold 24px Arial';
            ctx.fillStyle = '#51cf66';
            ctx.textAlign = 'center';
            ctx.fillText(`+${this.value}`, 0, 0);
        } else if (this.type === 'crit') {
            ctx.font = 'bold 36px Arial';
            ctx.fillStyle = '#ffd700';
            ctx.textAlign = 'center';
            ctx.fillText(`${this.value}!`, 0, 0);
        }

        ctx.restore();
    }
}

export class EffectSystem {
    constructor(engine) {
        this.engine = engine;
        this.version = '2.0.0';
        this.effects = [];

        // 摄像机震动
        this.cameraShake = {
            active: false,
            duration: 0,
            intensity: 0
        };

        // 慢动作
        this.slowMotion = {
            active: false,
            duration: 0,
            factor: 1.0
        };

        console.log('✅ 特效系统已创建 (V2.0)');
    }

    async initialize() {
        console.log('✨ 初始化特效系统...');
        console.log('✅ 特效系统初始化完成');
        return { success: true };
    }

    /**
     * 创建伤害数字
     */
    createDamageNumber(x, y, value, isCrit = false) {
        const color = isCrit ? '#ffd700' : '#ff6b6b';
        const type = isCrit ? 'crit' : 'damage';

        this.effects.push(new Effect({
            type,
            x,
            y,
            value,
            color,
            scale: isCrit ? 1.5 : 1,
            life: isCrit ? 90 : 60
        }));
    }

    /**
     * 创建治疗数字
     */
    createHealNumber(x, y, value) {
        this.effects.push(new Effect({
            type: 'heal',
            x,
            y,
            value,
            life: 60
        }));
    }

    /**
     * 创建状态效果
     */
    createStatusEffect(x, y, type, duration = 60) {
        const icons = {
            poison: '☠️',
            burn: '🔥',
            freeze: '❄️',
            stun: '💫',
            bleed: '🩸'
        };

        this.effects.push(new Effect({
            type: 'status',
            x,
            y,
            value: icons[type] || '❓',
            color: '#fff',
            life: duration
        }));
    }

    /**
     * 触发摄像机震动
     */
    shakeCamera(duration, intensity) {
        this.cameraShake.active = true;
        this.cameraShake.duration = duration;
        this.cameraShake.intensity = intensity;

        if (this.engine.renderer) {
            this.engine.renderer.shake(duration, intensity);
        }
    }

    /**
     * 触发慢动作
     */
    triggerSlowMotion(duration, factor = 0.3) {
        this.slowMotion.active = true;
        this.slowMotion.duration = duration;
        this.slowMotion.factor = factor;
    }

    /**
     * 更新所有特效
     */
    update() {
        // 更新特效列表
        for (let i = this.effects.length - 1; i >= 0; i--) {
            const effect = this.effects[i];
            effect.update();

            if (!effect.active) {
                this.effects.splice(i, 1);
            }
        }

        // 更新摄像机震动
        if (this.cameraShake.active) {
            this.cameraShake.duration--;
            if (this.cameraShake.duration <= 0) {
                this.cameraShake.active = false;
            }
        }

        // 更新慢动作
        if (this.slowMotion.active) {
            this.slowMotion.duration--;
            if (this.slowMotion.duration <= 0) {
                this.slowMotion.active = false;
                this.slowMotion.factor = 1.0;
            }
        }
    }

    /**
     * 渲染所有特效
     */
    render(ctx) {
        this.effects.forEach(effect => {
            effect.render(ctx);
        });
    }

    /**
     * 清除所有特效
     */
    clear() {
        this.effects = [];
    }

    /**
     * 获取时间缩放因子
     */
    getTimeScale() {
        return this.slowMotion.factor;
    }

    shutdown() {
        console.log('🛑 关闭特效系统...');
        this.clear();
        console.log('✅ 特效系统已关闭');
    }
}

export default EffectSystem;
