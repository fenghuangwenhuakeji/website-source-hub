/**
 * =================================================================================================
 * DungeonSpire - Sapphire Amulet
 * =================================================================================================
 */
import { Item } from '../../Item.js';

export class SapphireAmulet extends Item {
    constructor() {
        super({
            id: 'sapphire_amulet',
            name: 'Sapphire Amulet',
            type: 'accessory',
            rarity: 'rare',
            price: 200,
            description: "An amulet with a cold sapphire. Increases Intelligence by 2.",
            icon: 'assets/items/accessories/sapphire_amulet.png'
        });
    }

    onEquip(player) {
        player.addPower('intelligence', 2);
    }
}