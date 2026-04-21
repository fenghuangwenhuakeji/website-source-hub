/**
 * =================================================================================================
 * DungeonSpire - Draw Card Action
 * =================================================================================================
 */
import { AbstractGameAction } from './AbstractGameAction.js';

export class DrawCardAction extends AbstractGameAction {
    constructor(source, amount) {
        super();
        this.source = source;
        this.amount = amount;
    }

    update() {
        if (this.source) {
            this.source.drawCards(this.amount);
        }
        this.isDone = true;
    }
}