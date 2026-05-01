/**
 * =================================================================================================
 * DungeonSpire - Die Die Die
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class DieDieDie extends Card {
    constructor() {
        super({
            id: 'die_die_die',
            name: 'Die Die Die',
            type: 'attack',
            rarity: 'rare',
            color: 'green',
            cost: 1,
            damage: 13,
            description: "Deal !D! damage to ALL enemies.\nExhaust.",
            assetPath: 'assets/cards/green/die_die_die.png',
            exhaust: true
        });
    }

    applyUpgrade() {
        this.baseDamage += 4;
        this.damage = this.baseDamage;
    }

    use(player, target) {
        const enemies = window.app.engine.combatManager.enemies;
        enemies.forEach(e => {
            if (!e.isDead) e.takeDamage(this.damage);
        });
    }
}