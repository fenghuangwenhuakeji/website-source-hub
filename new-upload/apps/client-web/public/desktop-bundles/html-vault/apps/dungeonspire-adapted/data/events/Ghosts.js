/**
 * =================================================================================================
 * DungeonSpire - Ghosts Event
 * =================================================================================================
 */
import { GameEvent } from './GameEvent.js';
import { globalBus } from '../../core/EventBus.js';

export class GhostsEvent extends GameEvent {
    constructor() {
        super({
            id: 'ghosts',
            title: 'Council of Ghosts',
            body: "Three ghosts appear. They offer you power.",
            image: 'assets/events/ghosts.jpg',
            options: [
                {
                    text: "Accept: Lose 50% Max HP, Gain 5 Apparitions",
                    effect: () => {
                        globalBus.emit('player_max_hp_down', { percent: 0.5 });
                        globalBus.emit('gain_card', 'apparition', 5);
                    }
                },
                {
                    text: "Refuse",
                    effect: () => {}
                }
            ]
        });
    }
}