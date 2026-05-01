/**
 * =================================================================================================
 * DungeonSpire - Art of War (Relic)
 * =================================================================================================
 */
import { Relic } from '../Relic.js';

export class ArtOfWar extends Relic {
    constructor() {
        super({
            id: 'art_of_war',
            name: 'Art of War',
            description: "If you do not play any Attacks during your turn, gain an extra Energy next turn.",
            rarity: 'common',
            assetPath: 'assets/relics/art_of_war.png'
        });
    }

    onTurnEnd(player) {
        // Check if attacks played
        // if (!player.playedAttackThisTurn) player.addPower('next_turn_energy', 1);
    }
}