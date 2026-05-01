/**
 * =================================================================================================
 * DungeonSpire - Singing Bowl (Relic)
 * =================================================================================================
 */
import { Relic } from '../Relic.js';

export class SingingBowl extends Relic {
    constructor() {
        super({
            id: 'singing_bowl',
            name: 'Singing Bowl',
            description: "When choosing a card reward, you can choose to gain +2 Max HP instead.",
            rarity: 'uncommon',
            assetPath: 'assets/relics/singing_bowl.png'
        });
    }

    // Hook into Reward screen UI
}