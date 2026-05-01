/**
 * =================================================================================================
 * DungeonSpire - Torii (Relic)
 * =================================================================================================
 */
import { Relic } from '../Relic.js';

export class Torii extends Relic {
    constructor() {
        super({
            id: 'torii',
            name: 'Torii',
            description: "Whenever you would take 5 or less unblocked Attack damage, reduce it to 1.",
            rarity: 'rare',
            assetPath: 'assets/relics/torii.png'
        });
    }

    // Hook into receiveDamage logic
    onReceiveDamage(amount) {
        if (amount > 0 && amount <= 5) return 1;
        return amount;
    }
}