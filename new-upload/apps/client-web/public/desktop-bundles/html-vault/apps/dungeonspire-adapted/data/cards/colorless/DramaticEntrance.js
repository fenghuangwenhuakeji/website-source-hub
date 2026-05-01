/**
 * =================================================================================================
 * DungeonSpire - Dramatic Entrance
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class DramaticEntrance extends Card {
    constructor() {
        super({
            id: 'dramatic_entrance',
            name: 'Dramatic Entrance',
            type: 'attack',
            rarity: 'uncommon',
            color: 'colorless',
            cost: 0,
            damage: 8,
            description: "Innate.\nDeal !D! damage to ALL enemies.\nExhaust.",
            assetPath: 'assets/cards/colorless/dramatic_entrance.png',
            innate: true,
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