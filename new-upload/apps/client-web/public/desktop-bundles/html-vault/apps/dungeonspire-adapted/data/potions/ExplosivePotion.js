/**
 * =================================================================================================
 * DungeonSpire - Explosive Potion
 * =================================================================================================
 */
import { Potion } from './Potion.js';

export class ExplosivePotion extends Potion {
    constructor() {
        super({
            id: 'explosive_potion',
            name: 'Explosive Potion',
            rarity: 'common',
            description: "Deal 10 damage to ALL enemies."
        });
    }

    use(target) {
        // Logic to damage all enemies
    }
}