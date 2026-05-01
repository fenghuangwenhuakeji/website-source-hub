/**
 * =================================================================================================
 * DungeonSpire - Sucker Punch
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class SuckerPunch extends Card {
    constructor() {
        super({
            id: 'sucker_punch',
            name: 'Sucker Punch',
            type: 'attack',
            rarity: 'common',
            color: 'green',
            cost: 1,
            damage: 7,
            magicNumber: 1,
            description: "Deal !D! damage.\nApply !M! Weak.",
            assetPath: 'assets/cards/green/sucker_punch.png'
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
            target.addPower('weak', this.magicNumber);
        }
    }
}