/**
 * =================================================================================================
 * DungeonSpire - Weak Potion
 * =================================================================================================
 */
import { Potion } from './Potion.js';

export class WeakPotion extends Potion {
    constructor() {
        super({
            id: 'weak_potion',
            name: 'Weak Potion',
            rarity: 'common',
            description: "Apply 3 Weak."
        });
    }

    use(target) {
        // target.addPower('weak', 3);
    }
}