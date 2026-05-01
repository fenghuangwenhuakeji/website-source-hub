/**
 * =================================================================================================
 * DungeonSpire - Swift Potion
 * =================================================================================================
 */
import { Potion } from './Potion.js';

export class SwiftPotion extends Potion {
    constructor() {
        super({
            id: 'swift_potion',
            name: 'Swift Potion',
            rarity: 'common',
            description: "Draw 3 cards."
        });
    }

    use(target) {
        // window.app.engine.player.drawCards(3);
    }
}