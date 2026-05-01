/**
 * =================================================================================================
 * DungeonSpire - Ritual Dagger
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class RitualDagger extends Card {
    constructor() {
        super({
            id: 'ritual_dagger',
            name: 'Ritual Dagger',
            type: 'attack',
            rarity: 'special',
            color: 'colorless',
            cost: 1,
            damage: 15,
            description: "Deal !D! damage.\nIf this kills an enemy, permanently increase this card's damage by 3.\nExhaust.",
            assetPath: 'assets/cards/colorless/ritual_dagger.png',
            exhaust: true
        });
    }

    applyUpgrade() {
        this.baseDamage += 5;
        this.damage = this.baseDamage;
        this.description = "Deal !D! damage.\nIf this kills an enemy, permanently increase this card's damage by 5.\nExhaust.";
    }

    use(player, target) {
        if (target) {
            const killed = target.currentHp <= this.damage;
            target.takeDamage(this.damage);
            if (killed) {
                this.baseDamage += this.upgraded ? 5 : 3;
                this.damage = this.baseDamage;
            }
        }
    }
}