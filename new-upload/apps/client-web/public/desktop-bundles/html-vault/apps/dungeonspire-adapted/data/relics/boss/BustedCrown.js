/**
 * =================================================================================================
 * DungeonSpire - Busted Crown (Boss Relic)
 * =================================================================================================
 */
import { Relic } from '../Relic.js';

export class BustedCrown extends Relic {
    constructor() {
        super({
            id: 'busted_crown',
            name: 'Busted Crown',
            description: "Gain 1 Energy at the start of each turn. Future Card Rewards have 2 fewer cards to choose from.",
            rarity: 'boss',
            assetPath: 'assets/relics/crown.png'
        });
    }

    onTurnStart(player) {
        player.gainEnergy(1);
    }
}