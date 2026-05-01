/**
 * =================================================================================================
 * DungeonSpire - Girya (Relic)
 * =================================================================================================
 */
import { Relic } from '../Relic.js';

export class Girya extends Relic {
    constructor() {
        super({
            id: 'girya',
            name: 'Girya',
            description: "You can now gain Strength at Rest Sites. (Max 3 times)",
            rarity: 'rare',
            assetPath: 'assets/relics/girya.png'
        });
        this.counter = 0;
    }

    onRest(player) {
        // Add option to Campfire UI
    }
    
    onCombatStart(player) {
        if (this.counter > 0) {
            player.addPower('strength', this.counter);
        }
    }
}