/**
 * =================================================================================================
 * DungeonSpire - Stone Calendar (Relic)
 * =================================================================================================
 */
import { Relic } from '../Relic.js';

export class StoneCalendar extends Relic {
    constructor() {
        super({
            id: 'stone_calendar',
            name: 'Stone Calendar',
            description: "At the end of turn 7, deal 52 damage to ALL enemies.",
            rarity: 'rare',
            assetPath: 'assets/relics/calendar.png'
        });
        this.turn = 0;
    }

    onCombatStart() {
        this.turn = 0;
    }

    onTurnEnd(player) {
        this.turn++;
        if (this.turn === 7) {
            const enemies = window.app.engine.combatManager.enemies;
            enemies.forEach(e => {
                if (!e.isDead) e.takeDamage(52);
            });
        }
    }
}