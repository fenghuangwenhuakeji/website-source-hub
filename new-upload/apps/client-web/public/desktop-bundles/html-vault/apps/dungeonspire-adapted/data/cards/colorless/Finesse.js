/**
 * =================================================================================================
 * DungeonSpire - Finesse
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class Finesse extends Card {
    constructor() {
        super({
            id: 'finesse',
            name: 'Finesse',
            type: 'skill',
            rarity: 'uncommon',
            color: 'colorless',
            cost: 0,
            block: 2,
            description: "Gain !B! Block.\nDraw 1 card.",
            assetPath: 'assets/cards/colorless/finesse.png'
        });
    }

    applyUpgrade() {
        this.baseBlock += 2;
        this.block = this.baseBlock;
    }

    use(player, target) {
        player.addBlock(this.block);
        player.drawCards(1);
    }
}