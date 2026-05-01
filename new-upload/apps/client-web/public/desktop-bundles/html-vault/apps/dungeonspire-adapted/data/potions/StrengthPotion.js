/**
 * =================================================================================================
 * DungeonSpire - Strength Potion
 * =================================================================================================
 */
import { Potion } from './Potion.js';

export class StrengthPotion extends Potion {
    constructor() {
        super({
            id: 'strength_potion',
            name: 'Strength Potion',
            rarity: 'common',
            description: "Gain 2 Strength."
        });
    }

    use(target) {
        // window.app.engine.player.addPower('strength', 2);
    }
}