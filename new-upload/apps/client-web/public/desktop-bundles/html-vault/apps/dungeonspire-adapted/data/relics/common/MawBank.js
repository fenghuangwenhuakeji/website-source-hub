/**
 * =================================================================================================
 * DungeonSpire - Maw Bank (Relic)
 * =================================================================================================
 */
import { Relic } from '../Relic.js';

export class MawBank extends Relic {
    constructor() {
        super({
            id: 'maw_bank',
            name: 'Maw Bank',
            description: "Whenever you climb a floor, gain 12 Gold. No longer works when you spend Gold at a shop.",
            rarity: 'common',
            assetPath: 'assets/relics/maw_bank.png'
        });
        this.active = true;
    }

    onFloorClimb(player) {
        if (this.active) {
            player.gainGold(12);
        }
    }

    onShopSpend() {
        this.active = false;
        this.description += " (Inactive)";
    }
}