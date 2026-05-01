/**
 * =================================================================================================
 * DungeonSpire - Dexterity Potion
 * =================================================================================================
 */
import { Potion } from './Potion.js';

export class DexterityPotion extends Potion {
    constructor() {
        super({
            id: 'dexterity_potion',
            name: 'Dexterity Potion',
            rarity: 'common',
            description: "Gain 2 Dexterity."
        });
    }

    use(target) {
        // window.app.engine.player.addPower('dexterity', 2);
    }
}