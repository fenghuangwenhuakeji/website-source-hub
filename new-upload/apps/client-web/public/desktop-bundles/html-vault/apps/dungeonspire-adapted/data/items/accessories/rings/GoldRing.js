/**
 * =================================================================================================
 * DungeonSpire - Gold Ring
 * =================================================================================================
 */
import { Item } from '../../Item.js';

export class GoldRing extends Item {
    constructor() {
        super({
            id: 'gold_ring',
            name: 'Gold Ring',
            type: 'accessory',
            rarity: 'uncommon',
            price: 100,
            description: "A flashy gold ring. Increases Max HP by 10.",
            icon: 'assets/items/accessories/gold_ring.png'
        });
    }

    onEquip(player) {
        player.maxHp += 10;
    }
}