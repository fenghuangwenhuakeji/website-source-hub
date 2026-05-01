/**
 * =================================================================================================
 * DungeonSpire - Potion Base Class
 * =================================================================================================
 */

export class Potion {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.rarity = data.rarity;
        this.description = data.description;
    }

    use(target) {
        console.log(`Used potion: ${this.name}`);
    }
}