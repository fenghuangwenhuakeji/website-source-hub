/**
 * =================================================================================================
 * DungeonSpire - Secret Technique
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class SecretTechnique extends Card {
    constructor() {
        super({
            id: 'secret_technique',
            name: 'Secret Technique',
            type: 'skill',
            rarity: 'rare',
            color: 'colorless',
            cost: 0,
            description: "Choose a Skill from your draw pile and place it into your hand.\nExhaust.",
            assetPath: 'assets/cards/colorless/secret_technique.png',
            exhaust: true
        });
    }

    applyUpgrade() {
        this.exhaust = false;
        this.description = "Choose a Skill from your draw pile and place it into your hand.";
    }

    use(player, target) {
        // UI to select skill from draw pile
    }
}