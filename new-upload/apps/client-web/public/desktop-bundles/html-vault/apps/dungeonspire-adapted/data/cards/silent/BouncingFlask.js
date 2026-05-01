/**
 * =================================================================================================
 * DungeonSpire - Bouncing Flask
 * =================================================================================================
 */
import { Card } from '../Card.js';
import { MathUtils } from '../../../utils/MathUtils.js';

export class BouncingFlask extends Card {
    constructor() {
        super({
            id: 'bouncing_flask',
            name: 'Bouncing Flask',
            type: 'skill',
            rarity: 'uncommon',
            color: 'green',
            cost: 2,
            magicNumber: 3,
            description: "Apply 3 Poison to a random enemy !M! times.",
            assetPath: 'assets/cards/green/bouncing_flask.png'
        });
    }

    applyUpgrade() {
        this.baseMagicNumber += 1;
        this.magicNumber = this.baseMagicNumber;
    }

    use(player, target) {
        const enemies = window.app.engine.combatManager.enemies.filter(e => !e.isDead);
        if (enemies.length === 0) return;

        for (let i = 0; i < this.magicNumber; i++) {
            const randomEnemy = MathUtils.pickRandom(enemies);
            if (randomEnemy) {
                randomEnemy.addPower('poison', 3);
            }
        }
    }
}