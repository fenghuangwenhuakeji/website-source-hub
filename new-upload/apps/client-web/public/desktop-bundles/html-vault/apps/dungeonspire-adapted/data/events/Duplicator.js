/**
 * =================================================================================================
 * DungeonSpire - Duplicator Event
 * =================================================================================================
 */
import { GameEvent } from './GameEvent.js';
import { globalBus } from '../../core/EventBus.js';

export class DuplicatorEvent extends GameEvent {
    constructor() {
        super({
            id: 'duplicator',
            title: 'Duplicator',
            body: "A shrine offers to duplicate one of your cards.",
            image: 'assets/events/duplicator.jpg',
            options: [
                {
                    text: "Duplicate: Choose a card",
                    effect: () => {
                        globalBus.emit('duplicate_card_screen');
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