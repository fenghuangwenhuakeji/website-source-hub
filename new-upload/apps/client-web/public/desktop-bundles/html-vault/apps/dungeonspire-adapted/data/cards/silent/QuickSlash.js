/**
 * =================================================================================================
 * DungeonSpire - Quick Slash
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class QuickSlash extends Card {
    constructor() {
        super({
            id: 'quick_slash',
            name: 'Quick Slash',
            type: 'attack',
            rarity: 'common',
            color: 'green',
            cost: 1,
            damage: 8,
            magicNumber: 1,
            description: "Deal !D! damage.\nDraw !M! card.",
            assetPath: 'assets/cards/green/quick_slash.png'
        });
    }

    applyUpgrade() {
        this.baseDamage += 4;
        this.damage = this.baseDamage;
    }

    use(player, target) {
        if (target) target.takeDamage(this.damage);
        player.drawCards(this.magicNumber);
    }
}