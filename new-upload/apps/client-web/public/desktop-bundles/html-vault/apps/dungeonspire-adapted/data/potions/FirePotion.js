/**
 * =================================================================================================
 * DungeonSpire - Fire Potion
 * =================================================================================================
 */
import { Potion } from './Potion.js';

export class FirePotion extends Potion {
    constructor() {
        super({
            id: 'fire_potion',
            name: 'Fire Potion',
            rarity: 'common',
            description: "Deal 20 damage."
        });
    }

    use(target) {
        // Logic to damage target
    }
}