/**
 * =================================================================================================
 * DungeonSpire - Masterful Stab
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class MasterfulStab extends Card {
    constructor() {
        super({
            id: 'masterful_stab',
            name: 'Masterful Stab',
            type: 'attack',
            rarity: 'uncommon',
            color: 'green',
            cost: 0,
            damage: 12,
            description: "Costs 1 additional Energy for each time you lose HP this combat.",
            assetPath: 'assets/cards/green/masterful_stab.png'
        });
    }

    applyUpgrade() {
        this.baseDamage += 4;
        this.damage = this.baseDamage;
    }

    use(player, target) {
        if (target) target.takeDamage(this.damage);
    }
}