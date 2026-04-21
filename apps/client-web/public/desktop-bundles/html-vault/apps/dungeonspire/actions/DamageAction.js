/**
 * =================================================================================================
 * DungeonSpire - Damage Action
 * =================================================================================================
 */
import { AbstractGameAction } from './AbstractGameAction.js';
import { globalBus } from '../core/EventBus.js';

export class DamageAction extends AbstractGameAction {
    constructor(target, info, effect = 'NONE') {
        super();
        this.target = target;
        this.info = info; // { damage: 5, type: 'NORMAL' }
        this.effect = effect;
        this.duration = 0.1;
    }

    update() {
        if (this.target && !this.target.isDead) {
            this.target.takeDamage(this.info.damage);
            // Trigger visual effect based on this.effect
        }
        this.isDone = true;
    }
}