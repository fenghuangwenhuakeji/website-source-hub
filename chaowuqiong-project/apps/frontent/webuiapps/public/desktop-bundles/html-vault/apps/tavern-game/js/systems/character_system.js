import { eventBus } from '../core/event_bus.js';

export const characterSystem = {
    stats: {
        hp: 100, maxHp: 100, mp: 100, maxMp: 100,
        exp: 0, maxExp: 100, level: 1, gold: 0,
        stamina: 100, maxStamina: 100,
        str: 10, agi: 10, int: 10, luk: 10
    },

    init(savedStats) {
        if (savedStats) {
            this.stats = { ...this.stats, ...savedStats };
        } else {
            this.reset();
        }
        this.emitUpdate();
    },

    reset() {
        this.stats = {
            hp: 100, maxHp: 100, mp: 100, maxMp: 100,
            exp: 0, maxExp: 100, level: 1, gold: 0,
            stamina: 100, maxStamina: 100,
            str: 10, agi: 10, int: 10, luk: 10
        };
        this.emitUpdate();
    },

    update(updates) {
        this.stats = { ...this.stats, ...updates };
        this.emitUpdate();
    },

    emitUpdate() {
        eventBus.emit('character-updated', this.stats);
    }
};