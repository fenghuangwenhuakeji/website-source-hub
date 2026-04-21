// ========== 音频系统 ==========

class AudioSystem {
    constructor() {
        this.audioContext = null;
        this.sounds = {};
        this.musicVolume = 0.5;
        this.sfxVolume = 0.7;
        this.currentMusic = null;
        this.isInitialized = false;
    }

    // 初始化音频系统
    init() {
        if (this.isInitialized) return;

        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.isInitialized = true;
            console.log('音频系统初始化成功');
        } catch (error) {
            console.error('音频系统初始化失败:', error);
        }
    }

    // 播放音效
    playSound(soundType) {
        if (!this.isInitialized) this.init();

        const sound = this.getSoundData(soundType);
        if (!sound) return;

        this.playTone(sound.frequency, sound.duration, sound.type, this.sfxVolume);
    }

    // 获取音效数据
    getSoundData(type) {
        const sounds = {
            // 战斗音效
            attack: { frequency: 150, duration: 0.1, type: 'square' },
            hit: { frequency: 100, duration: 0.15, type: 'sawtooth' },
            critical: { frequency: 200, duration: 0.2, type: 'square' },
            block: { frequency: 80, duration: 0.1, type: 'triangle' },
            
            // 技能音效
            magic: { frequency: 300, duration: 0.3, type: 'sine' },
            heal: { frequency: 400, duration: 0.4, type: 'sine' },
            buff: { frequency: 500, duration: 0.3, type: 'sine' },
            
            // 界面音效
            click: { frequency: 800, duration: 0.05, type: 'sine' },
            hover: { frequency: 600, duration: 0.03, type: 'sine' },
            notification: { frequency: 1000, duration: 0.2, type: 'sine' },
            
            // 游戏音效
            levelUp: { frequency: 523, duration: 0.5, type: 'sine' },
            item: { frequency: 700, duration: 0.2, type: 'sine' },
            gold: { frequency: 900, duration: 0.15, type: 'sine' },
            
            // 错误音效
            error: { frequency: 200, duration: 0.3, type: 'sawtooth' }
        };

        return sounds[type] || null;
    }

    // 播放音调
    playTone(frequency, duration, type = 'sine', volume = 0.5) {
        if (!this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = type;

        gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }

    // 播放和弦
    playChord(frequencies, duration, type = 'sine', volume = 0.5) {
        frequencies.forEach(freq => {
            this.playTone(freq, duration, type, volume);
        });
    }

    // 播放升级音效
    playLevelUp() {
        // 升级音效：连续上升的音符
        setTimeout(() => this.playTone(523, 0.2, 'sine', this.sfxVolume), 0);
        setTimeout(() => this.playTone(659, 0.2, 'sine', this.sfxVolume), 200);
        setTimeout(() => this.playTone(784, 0.2, 'sine', this.sfxVolume), 400);
        setTimeout(() => this.playTone(1047, 0.4, 'sine', this.sfxVolume), 600);
    }

    // 播放战斗开始音效
    playBattleStart() {
        this.playChord([200, 250, 300], 0.3, 'square', this.sfxVolume);
    }

    // 播放胜利音效
    playVictory() {
        setTimeout(() => this.playTone(523, 0.2, 'sine', this.sfxVolume), 0);
        setTimeout(() => this.playTone(659, 0.2, 'sine', this.sfxVolume), 200);
        setTimeout(() => this.playTone(784, 0.2, 'sine', this.sfxVolume), 400);
    }

    // 播放失败音效
    playDefeat() {
        setTimeout(() => this.playTone(400, 0.3, 'sawtooth', this.sfxVolume), 0);
        setTimeout(() => this.playTone(300, 0.3, 'sawtooth', this.sfxVolume), 300);
        setTimeout(() => this.playTone(200, 0.5, 'sawtooth', this.sfxVolume), 600);
    }

    // 播放背景音乐（使用Web Audio API生成简单旋律）
    playBackgroundMusic(musicType = 'tavern') {
        if (!this.isInitialized) this.init();

        const melodies = {
            tavern: [
                { note: 262, duration: 0.5 },
                { note: 294, duration: 0.5 },
                { note: 330, duration: 0.5 },
                { note: 349, duration: 0.5 },
                { note: 392, duration: 1 },
                { note: 349, duration: 0.5 },
                { note: 330, duration: 0.5 },
                { note: 294, duration: 1 }
            ],
            battle: [
                { note: 200, duration: 0.2 },
                { note: 220, duration: 0.2 },
                { note: 200, duration: 0.2 },
                { note: 180, duration: 0.4 },
                { note: 200, duration: 0.2 },
                { note: 220, duration: 0.2 },
                { note: 200, duration: 0.2 },
                { note: 160, duration: 0.4 }
            ],
            forest: [
                { note: 330, duration: 0.6 },
                { note: 392, duration: 0.4 },
                { note: 440, duration: 0.6 },
                { note: 392, duration: 0.4 },
                { note: 330, duration: 0.6 },
                { note: 294, duration: 0.4 },
                { note: 262, duration: 1 }
            ]
        };

        const melody = melodies[musicType] || melodies.tavern;
        let delay = 0;

        melody.forEach(({ note, duration }) => {
            setTimeout(() => {
                this.playTone(note, duration, 'sine', this.musicVolume * 0.3);
            }, delay * 1000);
            delay += duration;
        });
    }

    // 设置音量
    setSfxVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
    }

    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
    }

    // 静音
    mute() {
        this.sfxVolume = 0;
        this.musicVolume = 0;
    }

    // 取消静音
    unmute() {
        this.sfxVolume = 0.7;
        this.musicVolume = 0.5;
    }
}

// 创建全局音频系统实例
const audioSystem = new AudioSystem();
