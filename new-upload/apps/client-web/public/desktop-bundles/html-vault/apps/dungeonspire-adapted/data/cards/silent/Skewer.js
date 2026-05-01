/**
 * =================================================================================================
 * DungeonSpire - Skewer
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class Skewer extends Card {
    constructor() {
        super({
            id: 'skewer',
            name: 'Skewer',
            type: 'attack',
            rarity: 'uncommon',
            color: 'green',
            cost: -1,
            damage: 7,
            description: "Deal !D! damage X times.",
            assetPath: 'assets/cards/green/skewer.png'
        });
    }

    applyUpgrade() {
        this.baseDamage += 3;
        this.damage = this.baseDamage;
    }

    use(player, target) {
        if (target) {
            const energy = player.energy;
            for (let i = 0; i < energy; i++) {
                target.takeDamage(this.damage);
            }
            player.energy = 0;
        }
    }
}