/**
 * =================================================================================================
 * DungeonSpire - Preserved Insect (Relic)
 * =================================================================================================
 */
import { Relic } from '../Relic.js';

export class PreservedInsect extends Relic {
    constructor() {
        super({
            id: 'preserved_insect',
            name: 'Preserved Insect',
            description: "Enemies in Elite rooms have 25% less HP.",
            rarity: 'common',
            assetPath: 'assets/relics/insect.png'
        });
    }

    // Hook into enemy spawn logic
}