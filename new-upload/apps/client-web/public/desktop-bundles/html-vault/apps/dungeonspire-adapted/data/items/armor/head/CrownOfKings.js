/**
 * =================================================================================================
 * DungeonSpire - Crown of Kings
 * =================================================================================================
 */
import { Armor } from '../../Armor.js';

export class CrownOfKings extends Armor {
    constructor() {
        super({
            id: 'crown_of_kings',
            name: 'Crown of Kings',
            rarity: 'legendary',
            price: 1000,
            slot: 'head',
            defense: 5,
            stats: { charisma: 10, leadership: 5 },
            description: "A golden crown worn by ancient rulers. Inspires allies.",
            icon: 'assets/items/armor/crown_of_kings.png'
        });
    }
}