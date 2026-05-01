/**
 * =================================================================================================
 * DungeonSpire - Clothesline
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class Clothesline extends Card {
    constructor() {
        super({
            id: 'clothesline',
            name: 'Clothesline',
            type: 'attack',
            rarity: 'common',
            color: 'red',
            cost: 2,
            damage: 12,
            magicNumber: 2,
            description: "Deal !D! damage.\nApply !M! Weak.",
            assetPath: 'assets/cards/red/clothesline.png'
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