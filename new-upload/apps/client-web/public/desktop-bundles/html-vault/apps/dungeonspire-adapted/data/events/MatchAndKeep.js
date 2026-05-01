/**
 * =================================================================================================
 * DungeonSpire - Match and Keep Event
 * =================================================================================================
 */
import { GameEvent } from './GameEvent.js';
import { globalBus } from '../../core/EventBus.js';

export class MatchAndKeepEvent extends GameEvent {
    constructor() {
        super({
            id: 'match_and_keep',
            title: 'Match and Keep',
            body: "A strange game of memory.",
            image: 'assets/events/match.jpg',
            options: [
                {
                    text: "Play: Match cards to keep them",
                    effect: () => {
                        globalBus.emit('start_minigame', 'match_and_keep');
                    }
                }
            ]
        });
    }
}