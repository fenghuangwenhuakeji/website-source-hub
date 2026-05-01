/**
 * =================================================================================================
 * DungeonSpire - Riddle with Holes
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class RiddleWithHoles extends Card {
    constructor() {
        super({
            id: 'riddle_with_holes',
            name: 'Riddle with Holes',
            type: 'attack',
            rarity: 'uncommon',
            color: 'green',
            cost: 2,
            damage: 3,
            description: "Deal !D! damage 5 times.",
            assetPath: 'assets/cards/green/riddle_with_holes.png'
        });
    }

    applyUpgrade() {
        this.baseDamage += 1;
        this.damage = this.baseDamage;
    }

    use(player, target) {
        if (target) {
            for (let i = 0; i < 5; i++) {
                target.takeDamage(this.damage);
            }
        }
    }
}