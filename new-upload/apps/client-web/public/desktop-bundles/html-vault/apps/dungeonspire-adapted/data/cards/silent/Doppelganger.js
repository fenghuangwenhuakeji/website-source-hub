/**
 * =================================================================================================
 * DungeonSpire - Doppelganger
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class Doppelganger extends Card {
    constructor() {
        super({
            id: 'doppelganger',
            name: 'Doppelganger',
            type: 'skill',
            rarity: 'rare',
            color: 'green',
            cost: -1,
            description: "Next turn, draw X cards and gain X Energy.",
            assetPath: 'assets/cards/green/doppelganger.png',
            exhaust: true
        });
    }

    applyUpgrade() {
        this.description = "Next turn, draw X+1 cards and gain X+1 Energy.";
    }

    use(player, target) {
        const energy = player.energy;
        const amount = this.upgraded ? energy + 1 : energy;
        player.addPower('draw_next_turn', amount);
        player.addPower('energy_next_turn', amount);
        player.energy = 0;
    }
}