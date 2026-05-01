/**
 * =================================================================================================
 * DungeonSpire - We Meet Again Event
 * =================================================================================================
 */
import { GameEvent } from './GameEvent.js';
import { globalBus } from '../../core/EventBus.js';

export class WeMeetAgainEvent extends GameEvent {
    constructor() {
        super({
            id: 'we_meet_again',
            title: 'We Meet Again',
            body: "A familiar face greets you.",
            image: 'assets/events/meet_again.jpg',
            options: [
                {
                    text: "Give Potion: Gain Relic",
                    effect: () => {
                        globalBus.emit('remove_potion');
                        globalBus.emit('gain_random_relic');
                    }
                },
                {
                    text: "Give Gold: Gain Relic",
                    effect: () => {
                        globalBus.emit('lose_gold', 50); // Simplified amount
                        globalBus.emit('gain_random_relic');
                    }
                },
                {
                    text: "Give Card: Gain Relic",
                    effect: () => {
                        globalBus.emit('remove_card_screen');
                        globalBus.emit('gain_random_relic');
                    }
                }
            ]
        });
    }
}