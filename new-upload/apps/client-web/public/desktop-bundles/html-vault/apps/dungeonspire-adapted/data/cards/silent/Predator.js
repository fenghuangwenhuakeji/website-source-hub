/**
 * =================================================================================================
 * DungeonSpire - Predator
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class Predator extends Card {
    constructor() {
        super({
            id: 'predator',
            name: 'Predator',
            type: 'attack',
            rarity: 'uncommon',
            color: 'green',
            cost: 2,
            damage: 15,
            description: "Deal !D! damage.\nNext turn draw 2 additional cards.",
            assetPath: 'assets/cards/green/predator.png'
        });
    }

    applyUpgrade() {
        this.baseDamage += 5;
        this.damage = this.baseDamage;
    }

    use(player, target) {
        if (target) target.takeDamage(this.damage);
        player.addPower('draw_next_turn', 2);
    }
}