/**
 * =================================================================================================
 * DungeonSpire - Energy Potion
 * =================================================================================================
 */
import { Potion } from './Potion.js';

export class EnergyPotion extends Potion {
    constructor() {
        super({
            id: 'energy_potion',
            name: 'Energy Potion',
            rarity: 'common',
            description: "Gain 2 Energy."
        });
    }

    use(target) {
        // window.app.engine.player.gainEnergy(2);
    }
}