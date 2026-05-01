/**
 * =================================================================================================
 * DungeonSpire - Blind
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class Blind extends Card {
    constructor() {
        super({
            id: 'blind',
            name: 'Blind',
            type: 'skill',
            rarity: 'uncommon',
            color: 'colorless',
            cost: 0,
            description: "Apply 2 Weak.",
            assetPath: 'assets/cards/colorless/blind.png'
        });
    }

    applyUpgrade() {
        this.description = "Apply 2 Weak to ALL enemies.";
    }

    use(player, target) {
        if (this.upgraded) {
            const enemies = window.app.engine.combatManager.enemies;
            enemies.forEach(e => {
                if (!e.isDead) e.addPower('weak', 2);
            });
        } else if (target) {
            target.addPower('weak', 2);
        }
    }
}