/**
 * =================================================================================================
 * DungeonSpire - Vampires Event
 * =================================================================================================
 */
import { GameEvent } from './GameEvent.js';
import { globalBus } from '../../core/EventBus.js';

export class VampiresEvent extends GameEvent {
    constructor() {
        super({
            id: 'vampires',
            title: 'Vampires',
            body: "A group of vampires offers you immortality.",
            image: 'assets/events/vampires.jpg',
            options: [
                {
                    text: "Accept: Remove all Strikes, Gain 5 Bites, Lose 30% Max HP",
                    effect: () => {
                        globalBus.emit('remove_all_strikes');
                        globalBus.emit('gain_card', 'bite', 5);
                        globalBus.emit('player_max_hp_down', { percent: 0.3 });
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