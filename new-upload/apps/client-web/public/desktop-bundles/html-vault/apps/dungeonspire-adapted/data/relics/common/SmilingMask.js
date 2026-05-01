/**
 * =================================================================================================
 * DungeonSpire - Smiling Mask (Relic)
 * =================================================================================================
 */
import { Relic } from '../Relic.js';

export class SmilingMask extends Relic {
    constructor() {
        super({
            id: 'smiling_mask',
            name: 'Smiling Mask',
            description: "The Merchant's card removal service now always costs 50 Gold.",
            rarity: 'common',
            assetPath: 'assets/relics/mask.png'
        });
    }

    // Hook into Shop logic
}