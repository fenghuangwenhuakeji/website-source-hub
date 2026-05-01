/**
 * =================================================================================================
 * DungeonSpire - The Bomb
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class TheBomb extends Card {
    constructor() {
        super({
            id: 'the_bomb',
            name: 'The Bomb',
            type: 'skill',
            rarity: 'rare',
            color: 'colorless',
            cost: 2,
            damage: 40,
            description: "At the end of 3 turns, deal !D! damage to ALL enemies.",
            assetPath: 'assets/cards/colorless/the_bomb.png'
        });
    }

    applyUpgrade() {
        this.baseDamage += 10;
        this.damage = this.baseDamage;
    }

    use(player, target) {
        player.addPower('the_bomb', this.damage);
    }
}