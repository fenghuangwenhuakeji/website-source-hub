/**
 * =================================================================================================
 * DungeonSpire - Weapon Base Class
 * =================================================================================================
 */
import { Item } from '../Item.js';

export class Weapon extends Item {
    constructor(data) {
        super({ ...data, type: 'weapon' });
        this.damage = data.damage || 0;
        this.scaling = data.scaling || { str: 0, dex: 0, int: 0 };
        this.effects = data.effects || [];
    }

    getDamage(stats) {
        let dmg = this.damage;
        dmg += stats.strength * (this.scaling.str || 0);
        dmg += stats.dexterity * (this.scaling.dex || 0);
        dmg += stats.intelligence * (this.scaling.int || 0);
        return Math.floor(dmg);
    }
}