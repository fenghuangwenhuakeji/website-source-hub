/**
 * =================================================================================================
 * DungeonSpire - Flechettes
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class Flechettes extends Card {
    constructor() {
        super({
            id: 'flechettes',
            name: 'Flechettes',
            type: 'attack',
            rarity: 'uncommon',
            color: 'green',
            cost: 1,
            damage: 4,
            description: "Deal !D! damage for each Skill in your hand.",
            assetPath: 'assets/cards/green/flechettes.png'
        });
    }

    applyUpgrade() {
        this.baseDamage += 2;
        this.damage = this.baseDamage;
    }

    use(player, target) {
        const skillCount = player.hand.filter(c => c.type === 'skill').length;
        if (target) {
            for (let i = 0; i < skillCount; i++) {
                target.takeDamage(this.damage);
            }
        }
    }
}