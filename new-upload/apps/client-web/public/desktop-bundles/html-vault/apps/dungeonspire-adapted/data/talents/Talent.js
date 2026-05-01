/**
 * =================================================================================================
 * DungeonSpire - Talent Base Class
 * =================================================================================================
 */
export class Talent {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.type = data.type; // offense, defense, utility
        this.tier = data.tier || 1;
        this.maxRank = data.maxRank || 1;
        this.currentRank = 0;
        this.description = data.description || "";
        this.icon = data.icon || 'assets/talents/placeholder.png';
    }

    apply(player) {}
    remove(player) {}
}