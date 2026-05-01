/**
 * =================================================================================================
 * DungeonSpire - Transmogrifier Event
 * =================================================================================================
 */
import { GameEvent } from './GameEvent.js';
import { globalBus } from '../../core/EventBus.js';

export class TransmogrifierEvent extends GameEvent {
    constructor() {
        super({
            id: 'transmogrifier',
            title: 'Transmogrifier',
            body: "A shrine offers to transform a card.",
            image: 'assets/events/transmogrifier.jpg',
            options: [
                {
                    text: "Transform: Choose a card",
                    effect: () => {
                        globalBus.emit('transform_card_screen', 1);
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