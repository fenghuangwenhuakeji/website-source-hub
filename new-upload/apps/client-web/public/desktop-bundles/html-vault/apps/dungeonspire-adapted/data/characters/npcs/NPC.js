/**
 * =================================================================================================
 * DungeonSpire - NPC Base Class
 * =================================================================================================
 */
export class NPC {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.dialogue = data.dialogue || [];
        this.shopInventory = data.shopInventory || [];
        this.quest = data.quest || null;
    }

    talk() {
        // Return random dialogue or progress quest
    }
}