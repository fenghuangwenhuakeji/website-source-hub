/**
 * =================================================================================================
 * DungeonSpire - Dodge and Roll
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class DodgeAndRoll extends Card {
    constructor() {
        super({
            id: 'dodge_and_roll',
            name: 'Dodge and Roll',
            type: 'skill',
            rarity: 'common',
            color: 'green',
            cost: 1,
            block: 4,
            description: "Gain !B! Block.\nNext turn gain !B! Block.",
            assetPath: 'assets/cards/green/dodge_and_roll.png'
        });
    }

    applyUpgrade() {
        this.baseBlock += 2;
        this.block = this.baseBlock;
    }

    use(player, target) {
        player.addBlock(this.block);
        player.addPower('next_turn_block', this.block);
    }
}