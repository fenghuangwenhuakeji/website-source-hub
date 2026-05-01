/**
 * =================================================================================================
 * DungeonSpire - Deflect
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class Deflect extends Card {
    constructor() {
        super({
            id: 'deflect',
            name: 'Deflect',
            type: 'skill',
            rarity: 'common',
            color: 'green',
            cost: 0,
            block: 4,
            description: "Gain !B! Block.",
            assetPath: 'assets/cards/green/deflect.png'
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