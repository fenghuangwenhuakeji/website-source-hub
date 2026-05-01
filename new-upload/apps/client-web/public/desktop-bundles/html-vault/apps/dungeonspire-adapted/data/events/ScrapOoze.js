/**
 * =================================================================================================
 * DungeonSpire - Scrap Ooze Event
 * =================================================================================================
 */
import { GameEvent } from './GameEvent.js';
import { globalBus } from '../../core/EventBus.js';

export class ScrapOozeEvent extends GameEvent {
    constructor() {
        super({
            id: 'scrap_ooze',
            title: 'Scrap Ooze',
            body: "You find a pile of goo with treasure inside.",
            image: 'assets/events/scrap_ooze.jpg',
            options: [
                {
                    text: "Reach Inside: Take damage, chance for Relic",
                    effect: () => {
                        // Complex logic handled in UI usually
                        globalBus.emit('scrap_ooze_attempt');
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