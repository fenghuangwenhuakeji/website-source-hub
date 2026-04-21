/**
 * 音频系统
 * 管理游戏中的音效和背景音乐
 */

export class AudioSystem {
    constructor(engine) {
        this.engine = engine;
        this.sounds = {};
        this.music = {};
        this.sfxVolume = 0.7;
        this.musicVolume = 0.5;
        this.currentMusic = null;
        this.isMuted = false;
    }

    async init() {
        console.log('[AudioSystem] 初始化音频系统...');

        // 初始化音效
        this.sounds = {
            click: this.createBeep(440, 0.1),
            levelUp: this.createBeep(660, 0.3),
            combat: this.createBeep(220, 0.2),
            success: this.createBeep(880, 0.15),
            error: this.createBeep(165, 0.2),
            notification: this.createBeep(550, 0.1)
        };

        console.log('[AudioSystem] 音频系统初始化完成');
    }

    // 创建简单的蜂鸣音效（使用Web Audio API）
    createBeep(frequency, duration) {
        return {
            play: (volume = 1) => {
                try {
                    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                    const oscillator = audioContext.createOscillator();
                    const gainNode = audioContext.createGain();

                    oscillator.connect(gainNode);
                    gainNode.connect(audioContext.destination);

                    oscillator.frequency.value = frequency;
                    oscillator.type = 'sine';

                    gainNode.gain.setValueAtTime(volume * this.sfxVolume, audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

                    oscillator.start(audioContext.currentTime);
                    oscillator.stop(audioContext.currentTime + duration);

                    setTimeout(() => audioContext.close(), duration * 1000 + 100);
                } catch (error) {
                    console.warn('[AudioSystem] 播放音效失败:', error);
                }
            }
        };
    }

    // 播放音效
    playSound(soundName) {
        if (this.isMuted) return;

        const sound = this.sounds[soundName];
        if (sound && sound.play) {
            sound.play();
        } else {
            console.warn(`[AudioSystem] 音效 "${soundName}" 不存在`);
        }
    }

    // 播放背景音乐
    playBackgroundMusic(musicName) {
        if (this.isMuted) return;

        // 停止当前音乐
        if (this.currentMusic) {
            this.stopMusic();
        }

        console.log(`[AudioSystem] 播放背景音乐: ${musicName}`);

        // 这里可以添加实际的背景音乐逻辑
        // 目前只是模拟
        this.currentMusic = musicName;
    }

    // 停止音乐
    stopMusic() {
        if (this.currentMusic) {
            console.log(`[AudioSystem] 停止背景音乐: ${this.currentMusic}`);
            this.currentMusic = null;
        }
    }

    // 设置音效音量
    setSfxVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
    }

    // 设置音乐音量
    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
    }

    // 静音/取消静音
    toggleMute() {
        this.isMuted = !this.isMuted;
        return this.isMuted;
    }
}
