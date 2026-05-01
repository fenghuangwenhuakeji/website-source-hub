/**
 * =================================================================================================
 * DungeonSpire - Chainmail Coif
 * =================================================================================================
 */
import { Armor } from '../../Armor.js';

export class ChainmailCoif extends Armor {
    constructor() {
        super({
            id: 'chainmail_coif',
            name: 'Chainmail Coif',
            rarity: 'common',
            price: 45,
            slot: 'head',
            defense: 4,
            description: "A hood made of interlocking metal rings.",
            icon: 'assets/items/armor/chainmail_coif.png'
        });
    }
}