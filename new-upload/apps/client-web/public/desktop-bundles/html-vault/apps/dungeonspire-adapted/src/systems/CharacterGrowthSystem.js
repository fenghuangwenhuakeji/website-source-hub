export class CharacterGrowthSystem {
    constructor(game) {
        this.game = game;
    }

    gainExp(character, amount) {
        character.exp += amount;
        if (character.exp >= character.nextLevelExp) {
            this.levelUp(character);
        }
    }

    levelUp(character) {
        character.level++;
        // 增加属性
        character.stats.strength += Math.floor(Math.random() * 3) + 1;
        // 解锁技能槽
    }

    interact(charA, charB) {
        // 角色互动，增加好感度
        // 触发特殊剧情
    }
}