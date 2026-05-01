/**
 * =================================================================================================
 * DungeonSpire - Fear Potion
 * =================================================================================================
 */
import { Potion } from './Potion.js';

export class FearPotion extends Potion {
    constructor() {
        super({
            id: 'fear_potion',
            name: 'Fear Potion',
            rarity: 'common',
            description: "Apply 3 Vulnerable."
        });
    }

    use(target) {
        // target.addPower('vulnerable', 3);
    }
}