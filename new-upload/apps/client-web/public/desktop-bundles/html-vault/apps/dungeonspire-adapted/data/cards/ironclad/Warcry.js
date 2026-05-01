/**
 * =================================================================================================
 * DungeonSpire - Warcry
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class Warcry extends Card {
    constructor() {
        super({
            id: 'warcry',
            name: 'Warcry',
            type: 'skill',
            rarity: 'common',
            color: 'red',
            cost: 0,
            magicNumber: 1,
            description: "Draw !M! card.\nPut a card from your hand onto the top of your draw pile.",
            assetPath: 'assets/cards/red/warcry.png'
        });
    }

    applyUpgrade() {
        this.baseMagicNumber += 1;
        this.magicNumber = this.baseMagicNumber;
        this.description = "Draw !M! cards.\nPut a card from your hand onto the top of your draw pile.";
    }

    use(player, target) {
        player.drawCards(this.magicNumber);
        
        // Put back logic (simplified: put last drawn card back)
        if (player.hand.length > 0) {
            const card = player.hand.pop();
            player.drawPile.push(card);
        }
    }
}