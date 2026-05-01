/**
 * =================================================================================================
 * DungeonSpire - Blood Potion
 * =================================================================================================
 */
import { Potion } from './Potion.js';

export class BloodPotion extends Potion {
    constructor() {
        super({
            id: 'blood_potion',
            name: 'Blood Potion',
            rarity: 'common',
            description: "Heal for 20% of your Max HP."
        });
    }

    use(target) {
        // Logic to heal player
        // window.app.engine.player.heal(...)
    }
}