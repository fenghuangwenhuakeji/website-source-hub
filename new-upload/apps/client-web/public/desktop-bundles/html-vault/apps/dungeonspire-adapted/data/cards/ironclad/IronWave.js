/**
 * =================================================================================================
 * DungeonSpire - Iron Wave
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class IronWave extends Card {
    constructor() {
        super({
            id: 'iron_wave',
            name: 'Iron Wave',
            type: 'attack',
            rarity: 'common',
            color: 'red',
            cost: 1,
            damage: 5,
            block: 5,
            description: "Gain !B! Block.\nDeal !D! damage.",
            assetPath: 'assets/cards/red/iron_wave.png'
        });
    }

    applyUpgrade() {
        this.baseDamage += 2;
        this.damage = this.baseDamage;
        this.baseBlock += 2;
        this.block = this.baseBlock;
    }

    use(player, target) {
        player.addBlock(this.block);
        if (target) {
            target.takeDamage(this.damage);
        }
    }
}