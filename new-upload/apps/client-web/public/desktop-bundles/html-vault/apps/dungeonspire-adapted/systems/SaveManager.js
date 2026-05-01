/**
 * =================================================================================================
 * DungeonSpire - Save Manager
 * Version: 1.0.0
 * Author: HyperInfinity
 * =================================================================================================
 * Description:
 * Handles saving and loading run data to localStorage.
 * =================================================================================================
 */

export class SaveManager {
    static SAVE_KEY = 'dungeon_spire_save_v1';

    static saveRun(data) {
        try {
            const json = JSON.stringify(data);
            localStorage.setItem(this.SAVE_KEY, json);
            console.log("[SaveManager] Game saved.");
            return true;
        } catch (e) {
            console.error("[SaveManager] Save failed:", e);
            return false;
        }
    }

    static loadRun() {
        try {
            const json = localStorage.getItem(this.SAVE_KEY);
            if (!json) return null;
            return JSON.parse(json);
        } catch (e) {
            console.error("[SaveManager] Load failed:", e);
            return null;
        }
    }

    static hasSave() {
        return localStorage.getItem(this.SAVE_KEY) !== null;
    }

    static deleteSave() {
        localStorage.removeItem(this.SAVE_KEY);
    }
}