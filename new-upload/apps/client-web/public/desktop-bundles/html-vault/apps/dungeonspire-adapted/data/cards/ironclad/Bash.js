/**
 * =================================================================================================
 * DungeonSpire - Bash
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class Bash extends Card {
    constructor() {
        super({
            id: 'bash',
            name: 'Bash',
            type: 'attack',
            rarity: 'basic',
            color: 'red',
            cost: 2,
            damage: 8,
            magicNumber: 2,
            description: "Deal !D! damage.\nApply !M! Vulnerable.",
            assetPath: 'assets/cards/red/bash.png'
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
            target.addPower('vulnerable', this.magicNumber);
        }
    }
}