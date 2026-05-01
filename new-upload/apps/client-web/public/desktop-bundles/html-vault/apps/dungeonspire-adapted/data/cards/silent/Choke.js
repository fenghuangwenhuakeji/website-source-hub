/**
 * =================================================================================================
 * DungeonSpire - Choke
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class Choke extends Card {
    constructor() {
        super({
            id: 'choke',
            name: 'Choke',
            type: 'attack',
            rarity: 'uncommon',
            color: 'green',
            cost: 2,
            damage: 12,
            description: "Deal !D! damage.\nWhenever you play a card this turn, target loses 3 HP.",
            assetPath: 'assets/cards/green/choke.png'
        });
    }

    applyUpgrade() {
        this.baseDamage += 3;
        this.damage = this.baseDamage;
        this.description = "Deal !D! damage.\nWhenever you play a card this turn, target loses 5 HP.";
    }

    use(player, target) {
        if (target) {
            target.takeDamage(this.damage);
            target.addPower('choke', this.upgraded ? 5 : 3);
        }
    }
}