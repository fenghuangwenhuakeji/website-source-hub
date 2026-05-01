/**
 * =================================================================================================
 * DungeonSpire - Defend (Green)
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class DefendGreen extends Card {
    constructor() {
        super({
            id: 'defend_g',
            name: 'Defend',
            type: 'skill',
            rarity: 'basic',
            color: 'green',
            cost: 1,
            block: 5,
            description: "Gain !B! Block.",
            assetPath: 'assets/cards/green/defend.png'
        });
        this.tags = ['starter'];
    }

    applyUpgrade() {
        this.baseBlock += 3;
        this.block = this.baseBlock;
    }

    use(player, target) {
        player.addBlock(this.block);
    }
}