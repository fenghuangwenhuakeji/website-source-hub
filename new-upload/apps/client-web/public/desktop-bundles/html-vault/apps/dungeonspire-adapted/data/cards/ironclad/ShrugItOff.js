/**
 * =================================================================================================
 * DungeonSpire - Shrug It Off
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class ShrugItOff extends Card {
    constructor() {
        super({
            id: 'shrug_it_off',
            name: 'Shrug It Off',
            type: 'skill',
            rarity: 'common',
            color: 'red',
            cost: 1,
            block: 8,
            magicNumber: 1,
            description: "Gain !B! Block.\nDraw !M! card.",
            assetPath: 'assets/cards/red/shrug_it_off.png'
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