/**
 * =================================================================================================
 * DungeonSpire - Secret Weapon
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class SecretWeapon extends Card {
    constructor() {
        super({
            id: 'secret_weapon',
            name: 'Secret Weapon',
            type: 'skill',
            rarity: 'rare',
            color: 'colorless',
            cost: 0,
            description: "Choose an Attack from your draw pile and place it into your hand.\nExhaust.",
            assetPath: 'assets/cards/colorless/secret_weapon.png',
            exhaust: true
        });
    }

    applyUpgrade() {
        this.exhaust = false;
        this.description = "Choose an Attack from your draw pile and place it into your hand.";
    }

    use(player, target) {
        // UI to select attack from draw pile
    }
}