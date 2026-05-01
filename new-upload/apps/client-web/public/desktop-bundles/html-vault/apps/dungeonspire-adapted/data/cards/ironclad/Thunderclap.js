/**
 * =================================================================================================
 * DungeonSpire - Thunderclap
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class Thunderclap extends Card {
    constructor() {
        super({
            id: 'thunderclap',
            name: 'Thunderclap',
            type: 'attack',
            rarity: 'common',
            color: 'red',
            cost: 1,
            damage: 4,
            magicNumber: 1,
            description: "Deal !D! damage and apply !M! Vulnerable to ALL enemies.",
            assetPath: 'assets/cards/red/thunderclap.png'
        });
    }

    applyUpgrade() {
        this.baseDamage += 3;
        this.damage = this.baseDamage;
    }

    use(player, target) {
        const enemies = window.app.engine.combatManager.enemies;
        enemies.forEach(e => {
            if (!e.isDead) {
                e.takeDamage(this.damage);
                e.addPower('vulnerable', this.magicNumber);
            }
        });
    }
}