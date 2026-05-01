/**
 * =================================================================================================
 * DungeonSpire - Blur
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class Blur extends Card {
    constructor() {
        super({
            id: 'blur',
            name: 'Blur',
            type: 'skill',
            rarity: 'uncommon',
            color: 'green',
            cost: 1,
            block: 5,
            description: "Gain !B! Block.\nBlock is not removed at the start of your next turn.",
            assetPath: 'assets/cards/green/blur.png'
        });
    }

    applyUpgrade() {
        this.baseBlock += 3;
        this.block = this.baseBlock;
    }

    use(player, target) {
        player.addBlock(this.block);
        player.addPower('blur', 1);
    }
}