/**
 * =================================================================================================
 * DungeonSpire - Woman in Blue Event
 * =================================================================================================
 */
import { GameEvent } from './GameEvent.js';
import { globalBus } from '../../core/EventBus.js';

export class WomanInBlueEvent extends GameEvent {
    constructor() {
        super({
            id: 'woman_in_blue',
            title: 'Woman in Blue',
            body: "A woman in blue offers you potions.",
            image: 'assets/events/woman_in_blue.jpg',
            options: [
                {
                    text: "Buy 1 Potion (20 Gold)",
                    effect: () => {
                        globalBus.emit('lose_gold', 20);
                        globalBus.emit('obtain_potion');
                    }
                },
                {
                    text: "Buy 2 Potions (30 Gold)",
                    effect: () => {
                        globalBus.emit('lose_gold', 30);
                        globalBus.emit('obtain_potion', 2);
                    }
                },
                {
                    text: "Buy 3 Potions (40 Gold)",
                    effect: () => {
                        globalBus.emit('lose_gold', 40);
                        globalBus.emit('obtain_potion', 3);
                    }
                }
            ]
        });
    }
}