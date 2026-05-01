/**
 * =================================================================================================
 * DungeonSpire - Piercing Wail
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class PiercingWail extends Card {
    constructor() {
        super({
            id: 'piercing_wail',
            name: 'Piercing Wail',
            type: 'skill',
            rarity: 'common',
            color: 'green',
            cost: 1,
            magicNumber: 6,
            description: "ALL enemies lose !M! Strength for 1 turn.\nExhaust.",
            assetPath: 'assets/cards/green/piercing_wail.png',
            exhaust: true
        });
    }

    applyUpgrade() {
        this.baseMagicNumber += 2;
        this.magicNumber = this.baseMagicNumber;
    }

    use(player, target) {
        const enemies = window.app.engine.combatManager.enemies;
        enemies.forEach(e => {
            if (!e.isDead) {
                e.addPower('strength', -this.magicNumber);
                e.addPower('gain_strength_next_turn', this.magicNumber);
            }
        });
    }
}