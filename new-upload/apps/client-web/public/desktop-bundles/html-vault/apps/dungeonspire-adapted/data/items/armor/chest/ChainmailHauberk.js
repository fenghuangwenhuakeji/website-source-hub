/**
 * =================================================================================================
 * DungeonSpire - Chainmail Hauberk
 * =================================================================================================
 */
import { Armor } from '../../Armor.js';

export class ChainmailHauberk extends Armor {
    constructor() {
        super({
            id: 'chainmail_hauberk',
            name: 'Chainmail Hauberk',
            rarity: 'common',
            price: 60,
            slot: 'chest',
            defense: 6,
            description: "A shirt of mail reaching down to the knees.",
            icon: 'assets/items/armor/chainmail_hauberk.png'
        });
    }
}