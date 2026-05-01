/**
 * =================================================================================================
 * DungeonSpire - Dagger Spray
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class DaggerSpray extends Card {
    constructor() {
        super({
            id: 'dagger_spray',
            name: 'Dagger Spray',
            type: 'attack',
            rarity: 'common',
            color: 'green',
            cost: 1,
            damage: 4,
            description: "Deal !D! damage to ALL enemies twice.",
            assetPath: 'assets/cards/green/dagger_spray.png'
        });
    }

    applyUpgrade() {
        this.baseDamage += 2;
        this.damage = this.baseDamage;
    }

    use(player, target) {
        const enemies = window.app.engine.combatManager.enemies;
        enemies.forEach(e => {
            if (!e.isDead) {
                e.takeDamage(this.damage);
                e.takeDamage(this.damage);
            }
        });
    }
}