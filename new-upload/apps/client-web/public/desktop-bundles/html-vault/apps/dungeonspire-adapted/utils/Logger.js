/**
 * =================================================================================================
 * DungeonSpire - Logger
 * =================================================================================================
 */

export class Logger {
    static LEVEL = {
        DEBUG: 0,
        INFO: 1,
        WARN: 2,
        ERROR: 3
    };

    static currentLevel = 0;

    static debug(msg, ...args) {
        if (this.currentLevel <= this.LEVEL.DEBUG) console.log(`[DEBUG] ${msg}`, ...args);
    }

    static info(msg, ...args) {
        if (this.currentLevel <= this.LEVEL.INFO) console.info(`[INFO] ${msg}`, ...args);
    }

    static warn(msg, ...args) {
        if (this.currentLevel <= this.LEVEL.WARN) console.warn(`[WARN] ${msg}`, ...args);
    }

    static error(msg, ...args) {
        if (this.currentLevel <= this.LEVEL.ERROR) console.error(`[ERROR] ${msg}`, ...args);
    }
}