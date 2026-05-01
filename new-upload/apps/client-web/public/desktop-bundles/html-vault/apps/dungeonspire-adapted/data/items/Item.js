/**
 * =================================================================================================
 * DungeonSpire - Item Base Class
 * =================================================================================================
 */
export class Item {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.type = data.type; // weapon, armor, accessory, material
        this.rarity = data.rarity || 'common';
        this.price = data.price || 0;
        this.description = data.description || "";
        this.icon = data.icon || 'assets/items/placeholder.png';
    }

    onEquip(player) {}
    onUnequip(player) {}
}