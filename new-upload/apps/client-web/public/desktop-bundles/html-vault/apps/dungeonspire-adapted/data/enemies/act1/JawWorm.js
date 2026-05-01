/**
 * =================================================================================================
 * DungeonSpire - Jaw Worm (Enemy)
 * =================================================================================================
 */
import { Enemy } from '../Enemy.js';
import { Random } from '../../utils/Random.js';

export class JawWorm extends Enemy {
    constructor() {
        super({
            id: 'jaw_worm',
            name: 'Jaw Worm',
            maxHp: 44,
            assetPath: 'assets/enemies/jaw_worm.png',
            moves: [
                { id: 'chomp', name: 'Chomp', type: 'attack', value: 11 },
                { id: 'thrash', name: 'Thrash', type: 'attack', value: 7, block: 5 },
                { id: 'bellow', name: 'Bellow', type: 'buff', effect: 'strength', value: 3, block: 6 }
            ]
        });
        this.rng = new Random();
    }

    rollIntent() {
        // Random logic: 25% Chomp, 30% Thrash, 45% Bellow
        const r = this.rng.next();
        if (r < 0.25) this.nextMove = this.moves[0];
        else if (r < 0.55) this.nextMove = this.moves[1];
        else this.nextMove = this.moves[2];

        super.rollIntent();
    }

    takeTurn(target) {
        // Override for special moves like Thrash (Attack + Block)
        if (this.nextMove.id === 'thrash') {
            target.takeDamage(this.nextMove.value);
            this.addBlock(this.nextMove.block);
        } else if (this.nextMove.id === 'bellow') {
            this.addPower('strength', this.nextMove.value);
            this.addBlock(this.nextMove.block);
        } else {
            super.takeTurn(target);
        }
    }
}