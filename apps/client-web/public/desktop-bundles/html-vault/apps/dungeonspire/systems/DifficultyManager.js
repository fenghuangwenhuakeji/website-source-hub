/**
 * =================================================================================================
 * DungeonSpire - Difficulty Manager
 * Description: Handles scaling difficulty and modifiers.
 * =================================================================================================
 */

export class DifficultyManager {
    constructor() {
        this.level = 1; // Ascension level
        this.modifiers = [];
    }

    applyModifiers(enemy) {
        // Scale HP and Damage based on level
        const scale = 1 + (this.level * 0.1);
        enemy.maxHp = Math.floor(enemy.maxHp * scale);
        enemy.currentHp = enemy.maxHp;
        
        // Enhance moves
        if (enemy.moves) {
            enemy.moves.forEach(move => {
                if (move.value) move.value = Math.floor(move.value * scale);
            });
        }
    }

    getLevelName() {
        return `Ascension ${this.level}`;
    }
}