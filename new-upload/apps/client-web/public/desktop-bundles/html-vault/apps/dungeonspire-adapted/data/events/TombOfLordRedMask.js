/**
 * =================================================================================================
 * DungeonSpire - Tomb of Lord Red Mask Event
 * =================================================================================================
 */
import { GameEvent } from './GameEvent.js';
import { globalBus } from '../../core/EventBus.js';

export class TombOfLordRedMaskEvent extends GameEvent {
    constructor() {
        super({
            id: 'tomb_of_lord_red_mask',
            title: 'Tomb of Lord Red Mask',
            body: "You enter the tomb of a legendary bandit.",
            image: 'assets/events/tomb.jpg',
            options: [
                {
                    text: "Don the Mask: Gain Red Mask Relic",
                    effect: () => {
                        globalBus.emit('gain_relic', 'red_mask');
                    }
                },
                {
                    text: "Leave: Gain nothing",
                    effect: () => {}
                }
            ]
        });
    }
}