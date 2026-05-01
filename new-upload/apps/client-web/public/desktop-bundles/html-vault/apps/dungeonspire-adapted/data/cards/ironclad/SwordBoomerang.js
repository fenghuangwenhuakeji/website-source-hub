/**
 * =================================================================================================
 * DungeonSpire - Sword Boomerang
 * =================================================================================================
 */
import { Card } from '../Card.js';
import { MathUtils } from '../../../utils/MathUtils.js';

export class SwordBoomerang extends Card {
    constructor() {
        super({
            id: 'sword_boomerang',
            name: 'Sword Boomerang',
            type: 'attack',
            rarity: 'common',
            color: 'red',
            cost: 1,
            damage: 3,
            magicNumber: 3,
            description: "Deal !D! damage to a random enemy !M! times.",
            assetPath: 'assets/cards/red/sword_boomerang.png'
        });
    }

    applyUpgrade() {
        this.baseMagicNumber += 1;
        this.magicNumber = this.baseMagicNumber;
    }

    use(player, target) {
        // Need reference to all enemies
        const enemies = window.app.engine.combatManager.enemies.filter(e => !e.isDead);
        if (enemies.length === 0) return;

        for (let i = 0; i < this.magicNumber; i++) {
            const randomEnemy = MathUtils.pickRandom(enemies);
            if (randomEnemy) {
                randomEnemy.takeDamage(this.damage);
            }
        }
    }
}