/**
 * =================================================================================================
 * DungeonSpire - Poisoned Stab
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class PoisonedStab extends Card {
    constructor() {
        super({
            id: 'poisoned_stab',
            name: 'Poisoned Stab',
            type: 'attack',
            rarity: 'common',
            color: 'green',
            cost: 1,
            damage: 6,
            magicNumber: 3,
            description: "Deal !D! damage.\nApply !M! Poison.",
            assetPath: 'assets/cards/green/poisoned_stab.png'
        });
    }

    applyUpgrade() {
        this.baseDamage += 2;
        this.damage = this.baseDamage;
        this.baseMagicNumber += 1;
        this.magicNumber = this.baseMagicNumber;
    }

    use(player, target) {
        if (target) {
            target.takeDamage(this.damage);
            target.addPower('poison', this.magicNumber);
        }
    }
}