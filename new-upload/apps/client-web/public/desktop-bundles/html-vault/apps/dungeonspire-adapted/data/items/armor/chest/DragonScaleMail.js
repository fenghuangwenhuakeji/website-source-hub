/**
 * =================================================================================================
 * DungeonSpire - Dragon Scale Mail
 * =================================================================================================
 */
import { Armor } from '../../Armor.js';

export class DragonScaleMail extends Armor {
    constructor() {
        super({
            id: 'dragon_scale_mail',
            name: 'Dragon Scale Mail',
            rarity: 'legendary',
            price: 1200,
            slot: 'chest',
            defense: 20,
            stats: { fireResist: 50 },
            description: "Armor forged from the scales of an ancient red dragon.",
            icon: 'assets/items/armor/dragon_scale_mail.png'
        });
    }
}