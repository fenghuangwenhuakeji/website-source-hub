/**
 * =================================================================================================
 * DungeonSpire - Living Wall Event
 * =================================================================================================
 */
import { GameEvent } from './GameEvent.js';
import { globalBus } from '../../core/EventBus.js';

export class LivingWallEvent extends GameEvent {
    constructor() {
        super({
            id: 'living_wall',
            title: 'Living Wall',
            body: "A wall of faces blocks your path.",
            image: 'assets/events/living_wall.jpg',
            options: [
                {
                    text: "Forget: Remove a card",
                    effect: () => {
                        globalBus.emit('remove_card_screen');
                    }
                },
                {
                    text: "Change: Transform a card",
                    effect: () => {
                        globalBus.emit('transform_card_screen');
                    }
                },
                {
                    text: "Grow: Upgrade a card",
                    effect: () => {
                        globalBus.emit('upgrade_card_screen');
                    }
                }
            ]
        });
    }
}