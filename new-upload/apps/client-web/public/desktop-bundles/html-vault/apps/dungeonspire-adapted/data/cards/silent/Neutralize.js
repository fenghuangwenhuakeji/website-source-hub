/**
 * =================================================================================================
 * DungeonSpire - Neutralize (Silent Starter)
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class Neutralize extends Card {
    constructor() {
        super({
            id: 'neutralize',
            name: 'Neutralize',
            type: 'attack',
            rarity: 'basic',
            color: 'green',
            cost: 0,
            damage: 3,
            magicNumber: 1,
            description: "Deal !D! damage.\nApply !M! Weak.",
            assetPath: 'assets/cards/green/neutralize.png'
        });
    }

    applyUpgrade() {
        this.baseDamage += 1;
        this.damage = this.baseDamage;
        this.baseMagicNumber += 1;
        this.magicNumber = this.baseMagicNumber;
    }

    use(player, target) {
        if (target) {
            target.takeDamage(this.damage);
            target.addPower('weak', this.magicNumber);
        }
    }
}