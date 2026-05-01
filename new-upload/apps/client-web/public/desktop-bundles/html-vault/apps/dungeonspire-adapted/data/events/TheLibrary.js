/**
 * =================================================================================================
 * DungeonSpire - The Library Event
 * =================================================================================================
 */
import { GameEvent } from './GameEvent.js';
import { globalBus } from '../../core/EventBus.js';

export class TheLibraryEvent extends GameEvent {
    constructor() {
        super({
            id: 'the_library',
            title: 'The Library',
            body: "A massive library stretches before you.",
            image: 'assets/events/library.jpg',
            options: [
                {
                    text: "Read: Choose 1 of 20 cards to add to your deck",
                    effect: () => {
                        globalBus.emit('library_card_selection');
                    }
                },
                {
                    text: "Sleep: Heal 33% HP",
                    effect: () => {
                        globalBus.emit('player_heal', { percent: 0.33 });
                    }
                }
            ]
        });
    }
}