/**
 * =================================================================================================
 * DungeonSpire - Coffee Dripper (Boss Relic)
 * =================================================================================================
 */
import { Relic } from '../Relic.js';

export class CoffeeDripper extends Relic {
    constructor() {
        super({
            id: 'coffee_dripper',
            name: 'Coffee Dripper',
            description: "Gain 1 Energy at the start of each turn. You can no longer Rest at Rest Sites.",
            rarity: 'boss',
            assetPath: 'assets/relics/dripper.png'
        });
    }

    onTurnStart(player) {
        player.gainEnergy(1);
    }

    // Hook into Campfire UI to disable Rest
}