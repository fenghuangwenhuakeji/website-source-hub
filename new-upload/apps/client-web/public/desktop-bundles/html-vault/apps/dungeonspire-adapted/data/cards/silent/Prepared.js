/**
 * =================================================================================================
 * DungeonSpire - Prepared
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class Prepared extends Card {
    constructor() {
        super({
            id: 'prepared',
            name: 'Prepared',
            type: 'skill',
            rarity: 'common',
            color: 'green',
            cost: 0,
            magicNumber: 1,
            description: "Draw !M! card.\nDiscard !M! card.",
            assetPath: 'assets/cards/green/prepared.png'
        });
    }

    applyUpgrade() {
        this.baseMagicNumber += 1;
        this.magicNumber = this.baseMagicNumber;
        this.description = "Draw !M! cards.\nDiscard !M! cards.";
    }

    use(player, target) {
        player.drawCards(this.magicNumber);
        // Trigger discard logic
        for (let i = 0; i < this.magicNumber; i++) {
            if (player.hand.length > 0) {
                const idx = Math.floor(Math.random() * player.hand.length);
                player.discardCard(idx);
            }
        }
    }
}