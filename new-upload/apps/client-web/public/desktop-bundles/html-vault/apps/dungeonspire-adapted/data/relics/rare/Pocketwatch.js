/**
 * =================================================================================================
 * DungeonSpire - Pocketwatch (Relic)
 * =================================================================================================
 */
import { Relic } from '../Relic.js';

export class Pocketwatch extends Relic {
    constructor() {
        super({
            id: 'pocketwatch',
            name: 'Pocketwatch',
            description: "Whenever you play 3 or less cards in a turn, draw 3 additional cards at the start of your next turn.",
            rarity: 'rare',
            assetPath: 'assets/relics/watch.png'
        });
        this.cardsPlayed = 0;
    }

    onTurnStart(player) {
        this.cardsPlayed = 0;
    }

    onCardPlayed() {
        this.cardsPlayed++;
    }

    onTurnEnd(player) {
        if (this.cardsPlayed <= 3) {
            // Logic to add draw buff for next turn
            player.addPower('draw_next_turn', 3);
        }
    }
}