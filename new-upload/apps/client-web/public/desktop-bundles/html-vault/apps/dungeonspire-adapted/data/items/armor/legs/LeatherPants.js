/**
 * =================================================================================================
 * DungeonSpire - Leather Pants
 * =================================================================================================
 */
import { Armor } from '../../Armor.js';

export class LeatherPants extends Armor {
    constructor() {
        super({
            id: 'leather_pants',
            name: 'Leather Pants',
            rarity: 'common',
            price: 25,
            slot: 'legs',
            defense: 2,
            description: "Durable leather trousers.",
            icon: 'assets/items/armor/leather_pants.png'
        });
    }
}