/**
 * =================================================================================================
 * DungeonSpire - Acrobatics
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class Acrobatics extends Card {
    constructor() {
        super({
            id: 'acrobatics',
            name: 'Acrobatics',
            type: 'skill',
            rarity: 'common',
            color: 'green',
            cost: 1,
            magicNumber: 3,
            description: "Draw !M! cards.\nDiscard 1 card.",
            assetPath: 'assets/cards/green/acrobatics.png'
        });
    }

    applyUpgrade() {
        this.baseMagicNumber += 1;
        this.magicNumber = this.baseMagicNumber;
    }

    use(player, target) {
        player.drawCards(this.magicNumber);
        // Simplified discard
        if (player.hand.length > 0) {
            const idx = Math.floor(Math.random() * player.hand.length);
            player.discardCard(idx);
        }
    }
}