/**
 * =================================================================================================
 * DungeonSpire - Note For Yourself Event
 * =================================================================================================
 */
import { GameEvent } from './GameEvent.js';
import { globalBus } from '../../core/EventBus.js';

export class NoteForYourselfEvent extends GameEvent {
    constructor() {
        super({
            id: 'note_for_yourself',
            title: 'Note For Yourself',
            body: "You find a note left by... yourself?",
            image: 'assets/events/note.jpg',
            options: [
                {
                    text: "Take: Gain stored card",
                    effect: () => {
                        // Logic to retrieve card from persistent storage
                        globalBus.emit('gain_stored_card');
                    }
                },
                {
                    text: "Store: Store a card for next run",
                    effect: () => {
                        globalBus.emit('store_card_screen');
                    }
                }
            ]
        });
    }
}