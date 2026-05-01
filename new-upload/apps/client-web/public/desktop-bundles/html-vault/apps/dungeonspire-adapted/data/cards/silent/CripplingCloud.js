/**
 * =================================================================================================
 * DungeonSpire - Crippling Cloud
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class CripplingCloud extends Card {
    constructor() {
        super({
            id: 'crippling_cloud',
            name: 'Crippling Cloud',
            type: 'skill',
            rarity: 'uncommon',
            color: 'green',
            cost: 2,
            magicNumber: 4,
            description: "Apply !M! Poison and 2 Weak to ALL enemies.\nExhaust.",
            assetPath: 'assets/cards/green/crippling_cloud.png',
            exhaust: true
        });
    }

    applyUpgrade() {
        this.baseMagicNumber += 3;
        this.magicNumber = this.baseMagicNumber;
    }

    use(player, target) {
        const enemies = window.app.engine.combatManager.enemies;
        enemies.forEach(e => {
            if (!e.isDead) {
                e.addPower('poison', this.magicNumber);
                e.addPower('weak', 2);
            }
        });
    }
}