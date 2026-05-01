/**
 * =================================================================================================
 * DungeonSpire - Iron Breastplate
 * =================================================================================================
 */
import { Armor } from '../../Armor.js';

export class IronBreastplate extends Armor {
    constructor() {
        super({
            id: 'iron_breastplate',
            name: 'Iron Breastplate',
            rarity: 'uncommon',
            price: 100,
            slot: 'chest',
            defense: 10,
            description: "A solid plate of iron protecting the torso.",
            icon: 'assets/items/armor/iron_breastplate.png'
        });
    }
}