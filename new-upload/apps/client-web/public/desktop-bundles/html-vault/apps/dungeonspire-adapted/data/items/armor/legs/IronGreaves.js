/**
 * =================================================================================================
 * DungeonSpire - Iron Greaves
 * =================================================================================================
 */
import { Armor } from '../../Armor.js';

export class IronGreaves extends Armor {
    constructor() {
        super({
            id: 'iron_greaves',
            name: 'Iron Greaves',
            rarity: 'uncommon',
            price: 85,
            slot: 'legs',
            defense: 8,
            description: "Iron armor protecting the lower legs.",
            icon: 'assets/items/armor/iron_greaves.png'
        });
    }
}