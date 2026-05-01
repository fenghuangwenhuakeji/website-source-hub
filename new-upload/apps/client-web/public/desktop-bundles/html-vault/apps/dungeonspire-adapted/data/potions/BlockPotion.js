/**
 * =================================================================================================
 * DungeonSpire - Block Potion
 * =================================================================================================
 */
import { Potion } from './Potion.js';

export class BlockPotion extends Potion {
    constructor() {
        super({
            id: 'block_potion',
            name: 'Block Potion',
            rarity: 'common',
            description: "Gain 12 Block."
        });
    }

    use(target) {
        // window.app.engine.player.addBlock(12);
    }
}