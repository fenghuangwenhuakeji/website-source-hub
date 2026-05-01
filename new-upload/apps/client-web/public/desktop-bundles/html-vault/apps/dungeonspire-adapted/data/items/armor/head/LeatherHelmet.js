/**
 * =================================================================================================
 * DungeonSpire - Leather Helmet
 * =================================================================================================
 */
import { Armor } from '../../Armor.js';

export class LeatherHelmet extends Armor {
    constructor() {
        super({
            id: 'leather_helmet',
            name: 'Leather Helmet',
            rarity: 'common',
            price: 20,
            slot: 'head',
            defense: 2,
            description: "A basic leather cap providing minimal protection.",
            icon: 'assets/items/armor/leather_helmet.png'
        });
    }
}