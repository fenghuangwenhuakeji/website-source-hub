/**
 * =================================================================================================
 * DungeonSpire - Deck Manager
 * =================================================================================================
 */

export class DeckManager {
    constructor(player) {
        this.player = player;
    }

    addCard(card) {
        this.player.masterDeck.push(card);
    }

    removeCard(cardId) {
        const idx = this.player.masterDeck.findIndex(c => c.id === cardId);
        if (idx > -1) {
            this.player.masterDeck.splice(idx, 1);
        }
    }
}