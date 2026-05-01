/**
 * =================================================================================================
 * DungeonSpire - N'loth Event
 * =================================================================================================
 */
import { GameEvent } from './GameEvent.js';
import { globalBus } from '../../core/EventBus.js';

export class NlothEvent extends GameEvent {
    constructor() {
        super({
            id: 'nloth',
            title: 'N\'loth',
            body: "A strange creature asks for a gift.",
            image: 'assets/events/nloth.jpg',
            options: [
                {
                    text: "Offer Relic: Gain N\'loth\'s Gift",
                    effect: () => {
                        globalBus.emit('remove_relic_screen');
                        globalBus.emit('gain_relic', 'nloths_gift');
                    }
                },
                {
                    text: "Leave",
                    effect: () => {}
                }
            ]
        });
    }
}