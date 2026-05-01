/**
 * =================================================================================================
 * DungeonSpire - Black Star (Boss Relic)
 * =================================================================================================
 */
import { Relic } from '../Relic.js';

export class BlackStar extends Relic {
    constructor() {
        super({
            id: 'black_star',
            name: 'Black Star',
            description: "Elites now drop 2 Relics when defeated.",
            rarity: 'boss',
            assetPath: 'assets/relics/black_star.png'
        });
    }

    // Hook into reward generation
}