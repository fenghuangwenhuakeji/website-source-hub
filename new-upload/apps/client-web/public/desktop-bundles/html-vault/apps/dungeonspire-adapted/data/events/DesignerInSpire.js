/**
 * =================================================================================================
 * DungeonSpire - Designer In-Spire Event
 * =================================================================================================
 */
import { GameEvent } from './GameEvent.js';
import { globalBus } from '../../core/EventBus.js';

export class DesignerInSpireEvent extends GameEvent {
    constructor() {
        super({
            id: 'designer_in_spire',
            title: 'Designer In-Spire',
            body: "A fashionable entity critiques your deck.",
            image: 'assets/events/designer.jpg',
            options: [
                {
                    text: "Adjust: Upgrade a card (40 Gold)",
                    effect: () => {
                        globalBus.emit('lose_gold', 40);
                        globalBus.emit('upgrade_card_screen');
                    }
                },
                {
                    text: "Clean Up: Remove a card (60 Gold)",
                    effect: () => {
                        globalBus.emit('lose_gold', 60);
                        globalBus.emit('remove_card_screen');
                    }
                },
                {
                    text: "Punch: Take 3 damage",
                    effect: () => {
                        globalBus.emit('player_take_damage', 3);
                    }
                }
            ]
        });
    }
}