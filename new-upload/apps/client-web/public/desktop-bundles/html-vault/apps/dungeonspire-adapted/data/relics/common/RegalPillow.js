/**
 * =================================================================================================
 * DungeonSpire - Regal Pillow (Relic)
 * =================================================================================================
 */
import { Relic } from '../Relic.js';

export class RegalPillow extends Relic {
    constructor() {
        super({
            id: 'regal_pillow',
            name: 'Regal Pillow',
            description: "Heal an additional 15 HP when you Rest.",
            rarity: 'common',
            assetPath: 'assets/relics/pillow.png'
        });
    }

    onRest(player) {
        player.heal(15);
    }
}