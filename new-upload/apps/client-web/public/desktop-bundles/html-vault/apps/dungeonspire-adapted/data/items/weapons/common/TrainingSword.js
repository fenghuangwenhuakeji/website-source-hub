/**
 * =================================================================================================
 * DungeonSpire - Training Sword
 * =================================================================================================
 */
import { Weapon } from '../../Weapon.js';

export class TrainingSword extends Weapon {
    constructor() {
        super({
            id: 'training_sword',
            name: 'Training Sword',
            rarity: 'common',
            price: 15,
            damage: 6,
            scaling: { str: 0.6 },
            description: "A standard issue sword for new recruits. Reliable but unremarkable.",
            icon: 'assets/items/weapons/training_sword.png'
        });
    }
}