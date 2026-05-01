/**
 * =================================================================================================
 * DungeonSpire - Survivor
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class Survivor extends Card {
    constructor() {
        super({
            id: 'survivor',
            name: 'Survivor',
            type: 'skill',
            rarity: 'basic',
            color: 'green',
            cost: 1,
            block: 8,
            description: "Gain !B! Block.\nDiscard a card.",
            assetPath: 'assets/cards/green/survivor.png'
        });
    }

    applyUpgrade() {
        this.baseBlock += 3;
        this.block = this.baseBlock;
    }

    use(player, target) {
        player.addBlock(this.block);
        // Trigger discard UI/logic
        // Simplified: random discard
        if (player.hand.length > 0) {
            const idx = Math.floor(Math.random() * player.hand.length);
            player.discardCard(idx);
        }
    }
}