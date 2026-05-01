/**
 * =================================================================================================
 * DungeonSpire - Leather Tunic
 * =================================================================================================
 */
import { Armor } from '../../Armor.js';

export class LeatherTunic extends Armor {
    constructor() {
        super({
            id: 'leather_tunic',
            name: 'Leather Tunic',
            rarity: 'common',
            price: 30,
            slot: 'chest',
            defense: 3,
            description: "A simple tunic made of cured leather.",
            icon: 'assets/items/armor/leather_tunic.png'
        });
    }
}