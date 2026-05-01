/**
 * =================================================================================================
 * DungeonSpire - Malaise
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class Malaise extends Card {
    constructor() {
        super({
            id: 'malaise',
            name: 'Malaise',
            type: 'skill',
            rarity: 'rare',
            color: 'green',
            cost: -1,
            description: "Enemy loses X Strength. Apply X Weak.\nExhaust.",
            assetPath: 'assets/cards/green/malaise.png',
            exhaust: true
        });
    }

    applyUpgrade() {
        this.description = "Enemy loses X+1 Strength. Apply X+1 Weak.\nExhaust.";
    }

    use(player, target) {
        if (target) {
            const energy = player.energy;
            const amount = this.upgraded ? energy + 1 : energy;
            target.addPower('strength', -amount);
            target.addPower('weak', amount);
            player.energy = 0;
        }
    }
}