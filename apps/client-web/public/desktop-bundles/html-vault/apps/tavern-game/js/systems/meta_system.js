import { dbManager } from '../core/db_manager.js';
import { eventBus } from '../core/event_bus.js';
import { defaultAchievements } from '../../data/achievements_data.js';

export const metaSystem = {
    achievements: [],
    stats: {
        totalGames: 0, totalActions: 0, totalTime: 0,
        favoriteScript: '', totalPlayTime: 0
    },

    async init() {
        await this.loadAchievements();
        await this.loadStats();
    },

    async loadAchievements() {
        let saved = await dbManager.getAll('achievements');
        if (saved.length === 0) {
            for (const ach of defaultAchievements) await dbManager.put('achievements', ach);
            saved = defaultAchievements;
        }
        this.achievements = saved;
        this.emitAchievementsUpdate();
    },

    async loadStats() {
        const saved = await dbManager.getAll('stats');
        if (saved.length > 0) this.stats = saved[0];
    },

    async checkAchievement(id, progress) {
        const ach = this.achievements.find(a => a.id === id);
        if (!ach || ach.unlocked) return;
        
        ach.progress = progress;
        if (ach.progress >= ach.max) {
            ach.unlocked = true;
            await dbManager.put('achievements', ach);
            eventBus.emit('notification', { message: `🏆 成就解锁: ${ach.name}\n奖励: ${ach.reward}`, type: 'success' });
            this.emitAchievementsUpdate();
        }
    },

    async updateStat(key, value) {
        this.stats[key] = value;
        await dbManager.put('stats', { id: 1, ...this.stats });
    },

    async incrementStat(key) {
        if (typeof this.stats[key] === 'number') {
            this.stats[key]++;
            await dbManager.put('stats', { id: 1, ...this.stats });
        }
    },

    emitAchievementsUpdate() {
        eventBus.emit('achievements-updated', this.achievements);
    }
};