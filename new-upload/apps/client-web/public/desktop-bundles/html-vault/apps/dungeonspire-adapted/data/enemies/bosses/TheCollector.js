/**
 * =================================================================================================
 * DungeonSpire - The Collector (Boss Act 2)
 * =================================================================================================
 */
import { Enemy } from '../Enemy.js';

export class TheCollector extends Enemy {
    constructor() {
        super({
            id: 'the_collector',
            name: 'The Collector',
            maxHp: 282,
            assetPath: 'assets/enemies/collector.png',
            moves: [
                { id: 'fireball', name: 'Fireball', type: 'attack', value: 18 },
                { id: 'buff', name: 'Buff', type: 'buff', effect: 'strength', effectValue: 3 },
                { id: 'spawn', name: 'Spawn Minions', type: 'unknown', value: 0 },
                { id: 'debuff', name: 'Mega Debuff', type: 'debuff', effect: 'weak_vuln_frail', effectValue: 3 }
            ]
        });
    }

    rollIntent() {
        // Initial spawn logic needed
        this.nextMove = this.moves[0];
        super.rollIntent();
    }
}