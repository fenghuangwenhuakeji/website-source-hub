/**
 * =================================================================================================
 * DungeonSpire - Sadistic Nature
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class SadisticNature extends Card {
    constructor() {
        super({
            id: 'sadistic_nature',
            name: 'Sadistic Nature',
            type: 'power',
            rarity: 'rare',
            color: 'colorless',
            cost: 0,
            damage: 5,
            description: "Whenever you apply a Debuff to an enemy, they take !D! damage.",
            assetPath: 'assets/cards/colorless/sadistic_nature.png'
        });
    }

    applyUpgrade() {
        this.baseDamage += 2;
        this.damage = this.baseDamage;
    }

    use(player, target) {
        player.addPower('sadistic_nature', this.damage);
    }
}