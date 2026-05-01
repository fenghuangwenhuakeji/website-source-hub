/**
 * =================================================================================================
 * DungeonSpire - Armor Base Class
 * =================================================================================================
 */
import { Item } from '../Item.js';

export class Armor extends Item {
    constructor(data) {
        super({ ...data, type: 'armor' });
        this.slot = data.slot; // head, chest, legs, feet
        this.defense = data.defense || 0;
        this.stats = data.stats || {}; // { maxHp: 10, strength: 1 }
    }

    onEquip(player) {
        player.maxHp += (this.stats.maxHp || 0);
        // Apply other stats
    }
}