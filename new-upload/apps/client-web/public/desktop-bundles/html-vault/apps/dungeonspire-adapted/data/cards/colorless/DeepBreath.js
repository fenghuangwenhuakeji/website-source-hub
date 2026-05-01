/**
 * =================================================================================================
 * DungeonSpire - Deep Breath
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class DeepBreath extends Card {
    constructor() {
        super({
            id: 'deep_breath',
            name: 'Deep Breath',
            type: 'skill',
            rarity: 'uncommon',
            color: 'colorless',
            cost: 0,
            magicNumber: 1,
            description: "Shuffle your discard pile into your draw pile.\nDraw !M! card.",
            assetPath: 'assets/cards/colorless/deep_breath.png'
        });
    }

    applyUpgrade() {
        this.baseMagicNumber += 1;
        this.magicNumber = this.baseMagicNumber;
        this.description = "Shuffle your discard pile into your draw pile.\nDraw !M! cards.";
    }

    use(player, target) {
        player.drawPile.push(...player.discardPile);
        player.discardPile = [];
        player.shuffleDeck();
        player.drawCards(this.magicNumber);
    }
}