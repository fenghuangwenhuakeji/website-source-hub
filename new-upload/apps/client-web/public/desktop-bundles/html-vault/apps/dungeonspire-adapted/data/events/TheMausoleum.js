/**
 * =================================================================================================
 * DungeonSpire - The Mausoleum Event
 * =================================================================================================
 */
import { GameEvent } from './GameEvent.js';
import { globalBus } from '../../core/EventBus.js';

export class TheMausoleumEvent extends GameEvent {
    constructor() {
        super({
            id: 'the_mausoleum',
            title: 'The Mausoleum',
            body: "You enter a large mausoleum. It feels cursed.",
            image: 'assets/events/mausoleum.jpg',
            options: [
                {
                    text: "Open Sarcophagus: Gain Relic, 50% chance of Writhe",
                    effect: () => {
                        globalBus.emit('gain_random_relic');
                        if (Math.random() < 0.5) {
                            globalBus.emit('gain_curse', 'writhe');
                        }
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