/**
 * =================================================================================================
 * DungeonSpire - Dash
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class Dash extends Card {
    constructor() {
        super({
            id: 'dash',
            name: 'Dash',
            type: 'attack',
            rarity: 'uncommon',
            color: 'green',
            cost: 2,
            block: 10,
            damage: 10,
            description: "Gain !B! Block.\nDeal !D! damage.",
            assetPath: 'assets/cards/green/dash.png'
        });
    }

    applyUpgrade() {
        this.baseBlock += 3;
        this.block = this.baseBlock;
        this.baseDamage += 3;
        this.damage = this.baseDamage;
    }

    use(player, target) {
        player.addBlock(this.block);
        if (target) target.takeDamage(this.damage);
    }
}