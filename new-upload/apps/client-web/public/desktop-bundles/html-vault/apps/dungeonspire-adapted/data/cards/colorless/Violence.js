/**
 * =================================================================================================
 * DungeonSpire - Violence
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class Violence extends Card {
    constructor() {
        super({
            id: 'violence',
            name: 'Violence',
            type: 'skill',
            rarity: 'rare',
            color: 'colorless',
            cost: 0,
            description: "Place 3 random Attacks from your draw pile into your hand.\nExhaust.",
            assetPath: 'assets/cards/colorless/violence.png',
            exhaust: true
        });
    }

    applyUpgrade() {
        this.description = "Place 4 random Attacks from your draw pile into your hand.\nExhaust.";
    }

    use(player, target) {
        const count = this.upgraded ? 4 : 3;
        // Logic to pull random attacks from draw pile
    }
}