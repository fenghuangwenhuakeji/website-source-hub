/**
 * =================================================================================================
 * DungeonSpire - Gain Block Action
 * =================================================================================================
 */
import { AbstractGameAction } from './AbstractGameAction.js';

export class GainBlockAction extends AbstractGameAction {
    constructor(target, amount) {
        super();
        this.target = target;
        this.amount = amount;
    }

    update() {
        if (this.target && !this.target.isDead) {
            this.target.addBlock(this.amount);
        }
        this.isDone = true;
    }
}