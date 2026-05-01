/**
 * =================================================================================================
 * DungeonSpire - Flash of Steel
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class FlashOfSteel extends Card {
    constructor() {
        super({
            id: 'flash_of_steel',
            name: 'Flash of Steel',
            type: 'attack',
            rarity: 'uncommon',
            color: 'colorless',
            cost: 0,
            damage: 3,
            description: "Deal !D! damage.\nDraw 1 card.",
            assetPath: 'assets/cards/colorless/flash_of_steel.png'
        });
    }

    applyUpgrade() {
        this.baseDamage += 3;
        this.damage = this.baseDamage;
    }

    use(player, target) {
        if (target) target.takeDamage(this.damage);
        player.drawCards(1);
    }
}