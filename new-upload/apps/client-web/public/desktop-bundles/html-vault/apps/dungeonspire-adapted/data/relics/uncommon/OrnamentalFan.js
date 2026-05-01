/**
 * =================================================================================================
 * DungeonSpire - Ornamental Fan (Relic)
 * =================================================================================================
 */
import { Relic } from '../Relic.js';

export class OrnamentalFan extends Relic {
    constructor() {
        super({
            id: 'ornamental_fan',
            name: 'Ornamental Fan',
            description: "Every time you play 3 Attacks in a single turn, gain 4 Block.",
            rarity: 'uncommon',
            assetPath: 'assets/relics/fan.png'
        });
        this.counter = 0;
    }

    onTurnStart() {
        this.counter = 0;
    }

    onCardPlayed(card, player) {
        if (card.type === 'attack') {
            this.counter++;
            if (this.counter % 3 === 0) {
                player.addBlock(4);
            }
        }
    }
}