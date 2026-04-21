/**
 * =================================================================================================
 * DungeonSpire - Daily Run Mode
 * =================================================================================================
 */
export class DailyRunMode {
    constructor() {
        this.seed = this.getDailySeed();
        this.modifiers = this.getDailyModifiers();
    }

    getDailySeed() {
        const today = new Date();
        return today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    }

    getDailyModifiers() {
        // Randomly select 3 modifiers based on seed
        return ['lethality', 'shiny', 'vintage'];
    }
}