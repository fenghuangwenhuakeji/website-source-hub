const GameState = {
    currentScript: null,
    gameHistory: [],
    playerStats: {
        hp: 100, maxHp: 100, mp: 100, maxMp: 100,
        exp: 0, maxExp: 100, level: 1, gold: 0,
        stamina: 100, maxStamina: 100,
        str: 10, agi: 10, int: 10, luk: 10
    },
    inventory: [],
    achievements: [],
    skills: [],
    gameStats: {
        totalGames: 0, totalActions: 0, totalTime: 0,
        favoriteScript: '', totalPlayTime: 0
    },
    gameStartTime: null,
    voiceEnabled: false,
    autoPlayEnabled: false,

    reset() {
        this.gameHistory = [];
        this.playerStats = {
            hp: 100, maxHp: 100, mp: 100, maxMp: 100,
            exp: 0, maxExp: 100, level: 1, gold: 0,
            stamina: 100, maxStamina: 100,
            str: 10, agi: 10, int: 10, luk: 10
        };
        this.inventory = [];
        this.gameStartTime = Date.now();
    },

    async saveStats() {
        await TavernDB.put('stats', { id: 1, ...this.gameStats });
    }
};
