/**
 * =================================================================================================
 * DungeonSpire - Silver Ring
 * =================================================================================================
 */
import { Item } from '../../Item.js';

export class SilverRing extends Item {
    constructor() {
        super({
            id: 'silver_ring',
            name: 'Silver Ring',
            type: 'accessory',
            rarity: 'common',
            price: 50,
            description: "A simple silver ring. Increases Max HP by 5.",
            icon: 'assets/items/accessories/silver_ring.png'
        });
    }

    onEquip(player) {
        player.maxHp += 5;
    }
}