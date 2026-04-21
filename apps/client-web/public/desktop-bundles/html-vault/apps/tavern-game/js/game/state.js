let currentScript = null;
let gameHistory = [];
let playerStats = {
    hp: 100, maxHp: 100, mp: 100, maxMp: 100,
    exp: 0, maxExp: 100, level: 1, gold: 0,
    stamina: 100, maxStamina: 100,
    str: 10, agi: 10, int: 10, luk: 10
};
let inventory = [];
let achievements = [];
let skills = [];
let gameStats = {
    totalGames: 0, totalActions: 0, totalTime: 0,
    favoriteScript: '', totalPlayTime: 0
};
let gameStartTime = null;
let voiceEnabled = false;
let autoPlayEnabled = false;