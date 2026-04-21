/**
 * =================================================================================================
 * DungeonSpire - Abstract Game Action
 * =================================================================================================
 */
export class AbstractGameAction {
    constructor() {
        this.duration = 0.5;
        this.actionType = 'WAIT';
        this.isDone = false;
    }

    update() {
        // To be implemented by subclasses
    }
}