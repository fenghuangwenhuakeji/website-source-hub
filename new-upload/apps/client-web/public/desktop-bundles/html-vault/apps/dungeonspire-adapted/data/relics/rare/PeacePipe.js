/**
 * =================================================================================================
 * DungeonSpire - Peace Pipe (Relic)
 * =================================================================================================
 */
import { Relic } from '../Relic.js';

export class PeacePipe extends Relic {
    constructor() {
        super({
            id: 'peace_pipe',
            name: 'Peace Pipe',
            description: "You can now remove cards from your deck at Rest Sites.",
            rarity: 'rare',
            assetPath: 'assets/relics/pipe.png'
        });
    }

    onRest(player) {
        // Add Toke option to Campfire UI
    }
}