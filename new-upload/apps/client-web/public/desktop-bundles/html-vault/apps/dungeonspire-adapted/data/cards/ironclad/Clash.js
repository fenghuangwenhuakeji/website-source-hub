/**
 * =================================================================================================
 * DungeonSpire - Clash
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class Clash extends Card {
    constructor() {
        super({
            id: 'clash',
            name: 'Clash',
            type: 'attack',
            rarity: 'common',
            color: 'red',
            cost: 0,
            damage: 14,
            description: "Can only be played if every card in your hand is an Attack.",
            assetPath: 'assets/cards/red/clash.png'
        });
    }

    applyUpgrade() {
        this.baseDamage += 4;
        this.damage = this.baseDamage;
    }

    canPlay(player, enemies) {
        if (!super.canPlay(player, enemies)) return false;
        
        // Check if all cards in hand are attacks
        return player.hand.every(c => c.type === 'attack');
    }

    use(player, target) {
        if (target) {
            target.takeDamage(this.damage);
        }
    }
}