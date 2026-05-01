/**
 * =================================================================================================
 * DungeonSpire - Iron Skin (Defense Talent)
 * =================================================================================================
 */
import { Talent } from '../../Talent.js';

export class IronSkin extends Talent {
    constructor() {
        super({
            id: 'iron_skin',
            name: 'Iron Skin',
            type: 'defense',
            tier: 1,
            maxRank: 5,
            description: "Increases Max HP by 10 per rank.",
            icon: 'assets/talents/defense/iron_skin.png'
        });
    }

    apply(player) {
        player.maxHp += 10 * this.currentRank;
    }
}