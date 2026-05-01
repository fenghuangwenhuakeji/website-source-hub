/**
 * =================================================================================================
 * DungeonSpire - J.A.X.
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class JAX extends Card {
    constructor() {
        super({
            id: 'jax',
            name: 'J.A.X.',
            type: 'skill',
            rarity: 'special',
            color: 'colorless',
            cost: 0,
            description: "Lose 3 HP.\nGain 2 Strength.",
            assetPath: 'assets/cards/colorless/jax.png'
        });
    }

    applyUpgrade() {
        this.description = "Lose 3 HP.\nGain 3 Strength.";
    }

    use(player, target) {
        player.takeDamage(3);
        player.addPower('strength', this.upgraded ? 3 : 2);
    }
}