/**
 * =================================================================================================
 * DungeonSpire - Purifier Event
 * =================================================================================================
 */
import { GameEvent } from './GameEvent.js';
import { globalBus } from '../../core/EventBus.js';

export class PurifierEvent extends GameEvent {
    constructor() {
        super({
            id: 'purifier',
            title: 'The Purifier',
            body: "A shrine of golden light.",
            image: 'assets/events/purifier.jpg',
            options: [
                {
                    text: "Pray: Remove a card",
                    effect: () => {
                        globalBus.emit('remove_card_screen');
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