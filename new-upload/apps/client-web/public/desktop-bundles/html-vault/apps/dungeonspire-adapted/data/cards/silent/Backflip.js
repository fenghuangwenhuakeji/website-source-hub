/**
 * =================================================================================================
 * DungeonSpire - Backflip
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class Backflip extends Card {
    constructor() {
        super({
            id: 'backflip',
            name: 'Backflip',
            type: 'skill',
            rarity: 'common',
            color: 'green',
            cost: 1,
            block: 5,
            magicNumber: 2,
            description: "Gain !B! Block.\nDraw !M! cards.",
            assetPath: 'assets/cards/green/backflip.png'
        });
    }

    applyUpgrade() {
        this.baseBlock += 3;
        this.block = this.baseBlock;
    }

    use(player, target) {
        player.addBlock(this.block);
        player.drawCards(this.magicNumber);
    }
}