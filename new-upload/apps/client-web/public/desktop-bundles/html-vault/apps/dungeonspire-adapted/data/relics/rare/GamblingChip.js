/**
 * =================================================================================================
 * DungeonSpire - Gambling Chip (Relic)
 * =================================================================================================
 */
import { Relic } from '../Relic.js';

export class GamblingChip extends Relic {
    constructor() {
        super({
            id: 'gambling_chip',
            name: 'Gambling Chip',
            description: "At the start of each combat, discard any number of cards then draw that many.",
            rarity: 'rare',
            assetPath: 'assets/relics/chip.png'
        });
    }

    onCombatStart(player) {
        // Trigger UI for mulligan
    }
}