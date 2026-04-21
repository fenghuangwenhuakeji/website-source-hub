/**
 * =================================================================================================
 * DungeonSpire - Audio Manager
 * Version: 1.0.0
 * Author: HyperInfinity
 * =================================================================================================
 * Description:
 * Handles BGM and SFX playback.
 * Supports simple volume control and crossfading (simulated).
 * =================================================================================================
 */

export class AudioManager {
    constructor() {
        this.sounds = {};
        this.bgm = null;
        this.volume = {
            master: 0.5,
            music: 0.5,
            sfx: 0.8
        };
        this.enabled = true;
    }

    load(key, src) {
        const audio = new Audio(src);
        this.sounds[key] = audio;
    }

    playSfx(key) {
        if (!this.enabled || !this.sounds[key]) return;
        
        // Clone to allow overlapping sounds
        const sound = this.sounds[key].cloneNode();
        sound.volume = this.volume.master * this.volume.sfx;
        sound.play().catch(e => console.warn("Audio play blocked:", e));
    }

    playMusic(key) {
        if (!this.enabled || !this.sounds[key]) return;

        if (this.bgm) {
            this.bgm.pause();
            this.bgm.currentTime = 0;
        }

        this.bgm = this.sounds[key];
        this.bgm.loop = true;
        this.bgm.volume = this.volume.master * this.volume.music;
        this.bgm.play().catch(e => console.warn("Music play blocked:", e));
    }

    setVolume(type, value) {
        if (this.volume[type] !== undefined) {
            this.volume[type] = Math.max(0, Math.min(1, value));
            if (type === 'music' && this.bgm) {
                this.bgm.volume = this.volume.master * this.volume.music;
            }
        }
    }
}