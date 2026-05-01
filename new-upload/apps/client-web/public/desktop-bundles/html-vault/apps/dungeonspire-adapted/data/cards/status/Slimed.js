/**
 * =================================================================================================
 * DungeonSpire - Slimed
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class Slimed extends Card {
    constructor() {
        super({
            id: 'slimed',
            name: 'Slimed',
            type: 'status',
            rarity: 'common',
            color: 'colorless',
            cost: 1,
            description: "Exhaust.",
            assetPath: 'assets/cards/status/slimed.png',
            exhaust: true
        });
    }

    use(player, target) {
        // Do nothing, just exhaust
    }
}