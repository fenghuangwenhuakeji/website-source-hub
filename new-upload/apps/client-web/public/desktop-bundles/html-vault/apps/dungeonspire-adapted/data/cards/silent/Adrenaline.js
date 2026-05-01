/**
 * =================================================================================================
 * DungeonSpire - Adrenaline
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class Adrenaline extends Card {
    constructor() {
        super({
            id: 'adrenaline',
            name: 'Adrenaline',
            type: 'skill',
            rarity: 'rare',
            color: 'green',
            cost: 0,
            description: "Gain 1 Energy.\nDraw 2 cards.\nExhaust.",
            assetPath: 'assets/cards/green/adrenaline.png',
            exhaust: true
        });
    }

    applyUpgrade() {
        this.description = "Gain 2 Energy.\nDraw 2 cards.\nExhaust.";
    }

    use(player, target) {
        player.gainEnergy(this.upgraded ? 2 : 1);
        player.drawCards(2);
    }
}