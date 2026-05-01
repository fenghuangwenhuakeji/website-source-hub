/**
 * =================================================================================================
 * DungeonSpire - Pommel Strike
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class PommelStrike extends Card {
    constructor() {
        super({
            id: 'pommel_strike',
            name: 'Pommel Strike',
            type: 'attack',
            rarity: 'common',
            color: 'red',
            cost: 1,
            damage: 9,
            magicNumber: 1,
            description: "Deal !D! damage.\nDraw !M! card.",
            assetPath: 'assets/cards/red/pommel_strike.png'
        });
        this.tags = ['strike'];
    }

    applyUpgrade() {
        this.baseDamage += 1;
        this.damage = this.baseDamage;
        this.baseMagicNumber += 1;
        this.magicNumber = this.baseMagicNumber;
        this.description = "Deal !D! damage.\nDraw !M! cards.";
    }

    use(player, target) {
        if (target) {
            target.takeDamage(this.damage);
        }
        player.drawCards(this.magicNumber);
    }
}