/**
 * =================================================================================================
 * DungeonSpire - Good Instincts
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class GoodInstincts extends Card {
    constructor() {
        super({
            id: 'good_instincts',
            name: 'Good Instincts',
            type: 'skill',
            rarity: 'uncommon',
            color: 'colorless',
            cost: 0,
            block: 6,
            description: "Gain !B! Block.",
            assetPath: 'assets/cards/colorless/good_instincts.png'
        });
    }

    applyUpgrade() {
        this.baseBlock += 3;
        this.block = this.baseBlock;
    }

    use(player, target) {
        player.addBlock(this.block);
    }
}