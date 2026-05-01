/**
 * =================================================================================================
 * DungeonSpire - Ink Bottle (Relic)
 * =================================================================================================
 */
import { Relic } from '../Relic.js';

export class InkBottle extends Relic {
    constructor() {
        super({
            id: 'ink_bottle',
            name: 'Ink Bottle',
            description: "Whenever you play 10 cards, draw 1 card.",
            rarity: 'uncommon',
            assetPath: 'assets/relics/ink_bottle.png'
        });
        this.counter = 0;
    }

    onCardPlayed(card, player) {
        this.counter++;
        if (this.counter === 10) {
            player.drawCards(1);
            this.counter = 0;
        }
    }
}