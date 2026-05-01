/**
 * =================================================================================================
 * DungeonSpire - Defend (Red)
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class DefendRed extends Card {
    constructor() {
        super({
            id: 'defend_r',
            name: 'Defend',
            type: 'skill',
            rarity: 'basic',
            color: 'red',
            cost: 1,
            block: 5,
            description: "Gain !B! Block.",
            assetPath: 'assets/cards/red/defend.png'
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