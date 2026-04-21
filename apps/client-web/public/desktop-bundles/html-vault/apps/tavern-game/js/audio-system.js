/**
 * 音频系统
 * 处理游戏音效和背景音乐
 */

class AudioSystem {
    constructor() {
        this.initialized = false;
        this.sounds = {};
        this.music = null;
        this.sfxEnabled = true;
        this.musicEnabled = true;
        this.volume = 0.5;
    }

    /**
     * 初始化音频系统
     */
    async initialize() {
        try {
            console.log('🎵 音频系统初始化中...');

            // 检查浏览器音频支持
            if (!window.AudioContext && !window.webkitAudioContext) {
                console.warn('⚠️ 浏览器不支持Web Audio API');
                this.initialized = true;
                return { success: true, warning: '浏览器不支持Web Audio API' };
            }

            // 创建音频上下文
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

            // 初始化默认音效
            this._initializeDefaultSounds();

            this.initialized = true;
            console.log('✅ 音频系统初始化成功');

            return { success: true };
        } catch (error) {
            console.error('❌ 音频系统初始化失败:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 初始化默认音效
     */
    _initializeDefaultSounds() {
        // 预定义音效列表（使用合成器）
        this.sounds = {
            click: this._createClickSound(),
            success: this._createSuccessSound(),
            error: this._createErrorSound(),
            notification: this._createNotificationSound(),
            battle: this._createBattleSound(),
            victory: this._createVictorySound(),
            levelup: this._createLevelUpSound()
        };
    }

    /**
     * 创建点击音效
     */
    _createClickSound() {
        return () => {
            if (!this.sfxEnabled) return;
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            osc.connect(gain);
            gain.connect(this.audioContext.destination);
            osc.frequency.value = 800;
            gain.gain.setValueAtTime(0.1 * this.volume, this.audioContext.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
            osc.start(this.audioContext.currentTime);
            osc.stop(this.audioContext.currentTime + 0.1);
        };
    }

    /**
     * 创建成功音效
     */
    _createSuccessSound() {
        return () => {
            if (!this.sfxEnabled) return;
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            osc.connect(gain);
            gain.connect(this.audioContext.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(523.25, this.audioContext.currentTime);
            osc.frequency.setValueAtTime(659.25, this.audioContext.currentTime + 0.1);
            osc.frequency.setValueAtTime(783.99, this.audioContext.currentTime + 0.2);
            gain.gain.setValueAtTime(0.15 * this.volume, this.audioContext.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
            osc.start(this.audioContext.currentTime);
            osc.stop(this.audioContext.currentTime + 0.3);
        };
    }

    /**
     * 创建错误音效
     */
    _createErrorSound() {
        return () => {
            if (!this.sfxEnabled) return;
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            osc.connect(gain);
            gain.connect(this.audioContext.destination);
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(200, this.audioContext.currentTime);
            osc.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.2);
            gain.gain.setValueAtTime(0.1 * this.volume, this.audioContext.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
            osc.start(this.audioContext.currentTime);
            osc.stop(this.audioContext.currentTime + 0.2);
        };
    }

    /**
     * 创建通知音效
     */
    _createNotificationSound() {
        return () => {
            if (!this.sfxEnabled) return;
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            osc.connect(gain);
            gain.connect(this.audioContext.destination);
            osc.type = 'square';
            osc.frequency.setValueAtTime(440, this.audioContext.currentTime);
            osc.frequency.setValueAtTime(880, this.audioContext.currentTime + 0.05);
            gain.gain.setValueAtTime(0.08 * this.volume, this.audioContext.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);
            osc.start(this.audioContext.currentTime);
            osc.stop(this.audioContext.currentTime + 0.15);
        };
    }

    /**
     * 创建战斗音效
     */
    _createBattleSound() {
        return () => {
            if (!this.sfxEnabled) return;
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            osc.connect(gain);
            gain.connect(this.audioContext.destination);
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(150, this.audioContext.currentTime);
            gain.gain.setValueAtTime(0.2 * this.volume, this.audioContext.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
            osc.start(this.audioContext.currentTime);
            osc.stop(this.audioContext.currentTime + 0.3);
        };
    }

    /**
     * 创建胜利音效
     */
    _createVictorySound() {
        return () => {
            if (!this.sfxEnabled) return;
            const now = this.audioContext.currentTime;
            const frequencies = [523.25, 659.25, 783.99, 1046.50];

            frequencies.forEach((freq, i) => {
                setTimeout(() => {
                    const osc = this.audioContext.createOscillator();
                    const gain = this.audioContext.createGain();
                    osc.connect(gain);
                    gain.connect(this.audioContext.destination);
                    osc.type = 'sine';
                    osc.frequency.value = freq;
                    gain.gain.setValueAtTime(0.1 * this.volume, this.audioContext.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
                    osc.start(this.audioContext.currentTime);
                    osc.stop(this.audioContext.currentTime + 0.3);
                }, i * 100);
            });
        };
    }

    /**
     * 创建升级音效
     */
    _createLevelUpSound() {
        return () => {
            if (!this.sfxEnabled) return;
            const now = this.audioContext.currentTime;
            const frequencies = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99];

            frequencies.forEach((freq, i) => {
                setTimeout(() => {
                    const osc = this.audioContext.createOscillator();
                    const gain = this.audioContext.createGain();
                    osc.connect(gain);
                    gain.connect(this.audioContext.destination);
                    osc.type = 'sine';
                    osc.frequency.value = freq;
                    gain.gain.setValueAtTime(0.12 * this.volume, this.audioContext.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
                    osc.start(this.audioContext.currentTime);
                    osc.stop(this.audioContext.currentTime + 0.2);
                }, i * 80);
            });
        };
    }

    /**
     * 播放音效
     */
    playSound(soundName) {
        if (!this.initialized || !this.sounds[soundName]) {
            console.warn(`音效 "${soundName}" 不存在或系统未初始化`);
            return;
        }

        try {
            this.sounds[soundName]();
        } catch (error) {
            console.error(`播放音效 "${soundName}" 失败:`, error);
        }
    }

    /**
     * 播放背景音乐（使用合成器生成）
     */
    playMusic(type) {
        if (!this.musicEnabled) return;

        try {
            // 停止当前音乐
            if (this.music) {
                this.music.stop();
            }

            // 根据类型生成音乐
            this.music = this._createMusic(type);
            if (this.music) {
                this.music.start();
            }
        } catch (error) {
            console.error('播放音乐失败:', error);
        }
    }

    /**
     * 创建音乐生成器
     */
    _createMusic(type) {
        if (!this.audioContext) return null;

        const now = this.audioContext.currentTime;
        const gain = this.audioContext.createGain();
        gain.connect(this.audioContext.destination);
        gain.gain.setValueAtTime(0.05 * this.volume, now);

        const oscillator = this.audioContext.createOscillator();
        oscillator.connect(gain);
        oscillator.type = 'sine';

        switch(type) {
            case 'tavern':
                oscillator.frequency.value = 196.00; // G3
                break;
            case 'battle':
                oscillator.type = 'sawtooth';
                oscillator.frequency.value = 110.00; // A2
                gain.gain.value = 0.03 * this.volume;
                break;
            case 'menu':
                oscillator.frequency.value = 261.63; // C4
                break;
            default:
                oscillator.frequency.value = 220.00; // A3
        }

        oscillator.start(now);

        return {
            stop: () => {
                gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.5);
                oscillator.stop(this.audioContext.currentTime + 0.5);
            }
        };
    }

    /**
     * 停止音乐
     */
    stopMusic() {
        if (this.music) {
            this.music.stop();
            this.music = null;
        }
    }

    /**
     * 设置音量
     */
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
    }

    /**
     * 切换音效开关
     */
    toggleSFX() {
        this.sfxEnabled = !this.sfxEnabled;
        return this.sfxEnabled;
    }

    /**
     * 切换音乐开关
     */
    toggleMusic() {
        this.musicEnabled = !this.musicEnabled;
        if (!this.musicEnabled) {
            this.stopMusic();
        }
        return this.musicEnabled;
    }
}

// 创建全局实例
const audioSystem = new AudioSystem();

// 自动初始化
document.addEventListener('DOMContentLoaded', () => {
    audioSystem.initialize();
});

// 导出（用于模块化系统）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = audioSystem;
} else {
    window.AudioSystem = audioSystem;
    window.audioSystem = audioSystem;
}

console.log('✅ 音频系统加载完成');
