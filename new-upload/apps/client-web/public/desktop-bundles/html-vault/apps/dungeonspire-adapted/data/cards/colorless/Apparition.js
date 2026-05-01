/**
 * =================================================================================================
 * DungeonSpire - Apparition
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class Apparition extends Card {
    constructor() {
        super({
            id: 'apparition',
            name: 'Apparition',
            type: 'skill',
            rarity: 'special',
            color: 'colorless',
            cost: 1,
            description: "Gain 1 Intangible.\nExhaust.",
            assetPath: 'assets/cards/colorless/apparition.png',
            exhaust: true
        });
    }

    applyUpgrade() {
        this.exhaust = false;
        this.description = "Gain 1 Intangible.";
    }

    use(player, target) {
        player.addPower('intangible', 1);
    }
}