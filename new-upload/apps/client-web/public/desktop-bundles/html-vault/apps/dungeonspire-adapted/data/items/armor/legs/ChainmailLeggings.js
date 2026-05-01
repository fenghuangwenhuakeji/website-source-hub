/**
 * =================================================================================================
 * DungeonSpire - Chainmail Leggings
 * =================================================================================================
 */
import { Armor } from '../../Armor.js';

export class ChainmailLeggings extends Armor {
    constructor() {
        super({
            id: 'chainmail_leggings',
            name: 'Chainmail Leggings',
            rarity: 'common',
            price: 50,
            slot: 'legs',
            defense: 5,
            description: "Leggings made of chainmail.",
            icon: 'assets/items/armor/chainmail_leggings.png'
        });
    }
}