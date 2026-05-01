/**
 * =================================================================================================
 * DungeonSpire - True Grit
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class TrueGrit extends Card {
    constructor() {
        super({
            id: 'true_grit',
            name: 'True Grit',
            type: 'skill',
            rarity: 'common',
            color: 'red',
            cost: 1,
            block: 7,
            description: "Gain !B! Block.\nExhaust a random card from your hand.",
            assetPath: 'assets/cards/red/true_grit.png'
        });
    }

    applyUpgrade() {
        this.baseBlock += 2;
        this.block = this.baseBlock;
        this.description = "Gain !B! Block.\nExhaust a card from your hand.";
    }

    use(player, target) {
        player.addBlock(this.block);
        
        // Exhaust logic
        if (player.hand.length > 0) {
            if (this.upgraded) {
                // Targeted exhaust (simplified to random for demo)
                const idx = Math.floor(Math.random() * player.hand.length);
                player.exhaustCard(idx);
            } else {
                // Random exhaust
                const idx = Math.floor(Math.random() * player.hand.length);
                player.exhaustCard(idx);
            }
        }
    }
}