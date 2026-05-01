/**
 * =================================================================================================
 * DungeonSpire - Ruby Ring
 * =================================================================================================
 */
import { Item } from '../../Item.js';

export class RubyRing extends Item {
    constructor() {
        super({
            id: 'ruby_ring',
            name: 'Ruby Ring',
            type: 'accessory',
            rarity: 'rare',
            price: 200,
            description: "A ring set with a fiery ruby. Increases Strength by 2.",
            icon: 'assets/items/accessories/ruby_ring.png'
        });
    }

    onEquip(player) {
        player.addPower('strength', 2);
    }
}