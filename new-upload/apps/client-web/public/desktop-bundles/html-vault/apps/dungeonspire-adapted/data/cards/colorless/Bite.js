/**
 * =================================================================================================
 * DungeonSpire - Bite
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class Bite extends Card {
    constructor() {
        super({
            id: 'bite',
            name: 'Bite',
            type: 'attack',
            rarity: 'special',
            color: 'colorless',
            cost: 1,
            damage: 7,
            description: "Deal !D! damage.\nHeal 2 HP.",
            assetPath: 'assets/cards/colorless/bite.png'
        });
    }

    applyUpgrade() {
        this.baseDamage += 1;
        this.damage = this.baseDamage;
        this.description = "Deal !D! damage.\nHeal 3 HP.";
    }

    use(player, target) {
        if (target) target.takeDamage(this.damage);
        player.heal(this.upgraded ? 3 : 2);
    }
}