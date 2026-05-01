/**
 * =================================================================================================
 * DungeonSpire - Shiv
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class Shiv extends Card {
    constructor() {
        super({
            id: 'shiv',
            name: 'Shiv',
            type: 'attack',
            rarity: 'special',
            color: 'colorless',
            cost: 0,
            damage: 4,
            description: "Deal !D! damage.\nExhaust.",
            assetPath: 'assets/cards/colorless/shiv.png',
            exhaust: true
        });
    }

    applyUpgrade() {
        this.baseDamage += 2;
        this.damage = this.baseDamage;
    }

    use(player, target) {
        if (target) target.takeDamage(this.damage);
    }
}