/**
 * =================================================================================================
 * DungeonSpire - Unload
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class Unload extends Card {
    constructor() {
        super({
            id: 'unload',
            name: 'Unload',
            type: 'attack',
            rarity: 'rare',
            color: 'green',
            cost: 1,
            damage: 14,
            description: "Deal !D! damage.\nDiscard all non-Attack cards.",
            assetPath: 'assets/cards/green/unload.png'
        });
    }

    applyUpgrade() {
        this.baseDamage += 4;
        this.damage = this.baseDamage;
    }

    use(player, target) {
        if (target) target.takeDamage(this.damage);
        // Discard logic
        for (let i = player.hand.length - 1; i >= 0; i--) {
            if (player.hand[i].type !== 'attack') {
                player.discardCard(i);
            }
        }
    }
}