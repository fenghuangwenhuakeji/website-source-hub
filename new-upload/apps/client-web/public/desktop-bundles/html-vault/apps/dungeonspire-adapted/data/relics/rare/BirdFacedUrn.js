/**
 * =================================================================================================
 * DungeonSpire - Bird-Faced Urn (Relic)
 * =================================================================================================
 */
import { Relic } from '../Relic.js';

export class BirdFacedUrn extends Relic {
    constructor() {
        super({
            id: 'bird_faced_urn',
            name: 'Bird-Faced Urn',
            description: "Whenever you play a Power, heal 2 HP.",
            rarity: 'rare',
            assetPath: 'assets/relics/urn.png'
        });
    }

    onCardPlayed(card, player) {
        if (card.type === 'power') {
            player.heal(2);
        }
    }
}