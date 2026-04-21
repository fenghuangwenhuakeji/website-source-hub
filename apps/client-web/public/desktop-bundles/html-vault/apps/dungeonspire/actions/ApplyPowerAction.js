/**
 * =================================================================================================
 * DungeonSpire - Apply Power Action
 * =================================================================================================
 */
import { AbstractGameAction } from './AbstractGameAction.js';

export class ApplyPowerAction extends AbstractGameAction {
    constructor(target, source, powerId, amount) {
        super();
        this.target = target;
        this.source = source;
        this.powerId = powerId;
        this.amount = amount;
    }

    update() {
        if (this.target && !this.target.isDead) {
            this.target.addPower(this.powerId, this.amount);
        }
        this.isDone = true;
    }
}