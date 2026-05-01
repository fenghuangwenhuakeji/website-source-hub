/**
 * =================================================================================================
 * DungeonSpire - Endless Agony
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class EndlessAgony extends Card {
    constructor() {
        super({
            id: 'endless_agony',
            name: 'Endless Agony',
            type: 'attack',
            rarity: 'uncommon',
            color: 'green',
            cost: 0,
            damage: 4,
            description: "Deal !D! damage.\nWhenever you draw this card, add a copy of it to your hand.\nExhaust.",
            assetPath: 'assets/cards/green/endless_agony.png',
            exhaust: true
        });
    }

    applyUpgrade() {
        this.baseDamage += 2;
        this.damage = this.baseDamage;
    }

    onDraw() {
        // Logic to add copy
        const copy = this.makeCopy();
        // Need access to player here, usually passed or global
        // window.app.engine.player.hand.push(copy);
    }

    use(player, target) {
        if (target) target.takeDamage(this.damage);
    }
}