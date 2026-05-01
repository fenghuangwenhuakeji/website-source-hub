/**
 * =================================================================================================
 * DungeonSpire - Paper Phrog (Relic)
 * =================================================================================================
 */
import { Relic } from '../Relic.js';

export class PaperPhrog extends Relic {
    constructor() {
        super({
            id: 'paper_phrog',
            name: 'Paper Phrog',
            description: "Enemies with Vulnerable take 75% more damage rather than 50%.",
            rarity: 'uncommon',
            assetPath: 'assets/relics/paper_phrog.png'
        });
    }

    // Hook into damage calculation logic for Vulnerable
}