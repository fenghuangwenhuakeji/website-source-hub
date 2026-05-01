/**
 * =================================================================================================
 * DungeonSpire - Finisher
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class Finisher extends Card {
    constructor() {
        super({
            id: 'finisher',
            name: 'Finisher',
            type: 'attack',
            rarity: 'uncommon',
            color: 'green',
            cost: 1,
            damage: 6,
            description: "Deal !D! damage for each Attack played this turn.",
            assetPath: 'assets/cards/green/finisher.png'
        });
    }

    applyUpgrade() {
        this.baseDamage += 2;
        this.damage = this.baseDamage;
    }

    use(player, target) {
        // Need attack count from player state
        // const count = player.attacksPlayedThisTurn;
        const count = 1; // Placeholder
        if (target) {
            for (let i = 0; i < count; i++) {
                target.takeDamage(this.damage);
            }
        }
    }
}