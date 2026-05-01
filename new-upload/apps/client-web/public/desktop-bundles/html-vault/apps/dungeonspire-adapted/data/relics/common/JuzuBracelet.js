/**
 * =================================================================================================
 * DungeonSpire - Juzu Bracelet (Relic)
 * =================================================================================================
 */
import { Relic } from '../Relic.js';

export class JuzuBracelet extends Relic {
    constructor() {
        super({
            id: 'juzu_bracelet',
            name: 'Juzu Bracelet',
            description: "Regular enemy encounters no longer appear in ? rooms.",
            rarity: 'common',
            assetPath: 'assets/relics/juzu.png'
        });
    }

    // Hook into map generation or event node logic
}