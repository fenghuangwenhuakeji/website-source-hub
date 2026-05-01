/**
 * =================================================================================================
 * DungeonSpire - Emerald Amulet
 * =================================================================================================
 */
import { Item } from '../../Item.js';

export class EmeraldAmulet extends Item {
    constructor() {
        super({
            id: 'emerald_amulet',
            name: 'Emerald Amulet',
            type: 'accessory',
            rarity: 'rare',
            price: 200,
            description: "An amulet with a vibrant emerald. Increases Dexterity by 2.",
            icon: 'assets/items/accessories/emerald_amulet.png'
        });
    }

    onEquip(player) {
        player.addPower('dexterity', 2);
    }
}