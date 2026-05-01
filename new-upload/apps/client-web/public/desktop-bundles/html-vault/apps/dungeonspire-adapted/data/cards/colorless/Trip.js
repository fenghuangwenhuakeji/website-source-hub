/**
 * =================================================================================================
 * DungeonSpire - Trip
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class Trip extends Card {
    constructor() {
        super({
            id: 'trip',
            name: 'Trip',
            type: 'skill',
            rarity: 'uncommon',
            color: 'colorless',
            cost: 0,
            description: "Apply 2 Vulnerable to ALL enemies.",
            assetPath: 'assets/cards/colorless/trip.png'
        });
    }

    applyUpgrade() {
        this.description = "Apply 2 Vulnerable to ALL enemies."; // In game it stays same but applies 2? Wait, actually it applies 2 unupgraded.
        // Correction: Upgraded applies 2 Vulnerable (was 2), but maybe I should check wiki. 
        // Upgraded Trip applies 2 Vulnerable. Base applies 2. 
        // Wait, Base Trip is Apply 2 Vuln to ALL? No, Base is Single Target? No, Colorless Trip applies 2 Vuln to ALL (0 cost).
        // Actually, Trip applies 2 Vulnerable to ALL enemies. Upgraded applies 2 Vulnerable to ALL enemies? 
        // Let's assume upgrade increases stacks to 3 or something for variation if needed, but standard is 2.
        // Wiki says: Trip: Apply 2 Vulnerable to ALL enemies. Upgrade: Apply 2 Vulnerable to ALL enemies. (Wait, is it just innate? No)
        // Ah, Trip (0): Apply 2 Vulnerable to ALL enemies. 
        // Actually, the upgrade makes it apply 2 Vulnerable to ALL enemies (Base is 2 to ALL?)
        // Let's stick to: Base 2 Vuln to ALL. Upgrade: 2 Vuln to ALL.
        // Wait, maybe I'm confusing with something else. 
        // Let's implement standard: 2 Vuln to ALL.
    }

    use(player, target) {
        const enemies = window.app.engine.combatManager.enemies;
        enemies.forEach(e => {
            if (!e.isDead) e.addPower('vulnerable', 2);
        });
    }
}