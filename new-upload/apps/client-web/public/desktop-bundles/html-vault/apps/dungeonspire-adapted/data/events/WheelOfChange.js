/**
 * =================================================================================================
 * DungeonSpire - Wheel of Change Event
 * =================================================================================================
 */
import { GameEvent } from './GameEvent.js';
import { globalBus } from '../../core/EventBus.js';

export class WheelOfChangeEvent extends GameEvent {
    constructor() {
        super({
            id: 'wheel_of_change',
            title: 'Wheel of Change',
            body: "A gremlin spins a giant wheel.",
            image: 'assets/events/wheel.jpg',
            options: [
                {
                    text: "Spin: Random Effect",
                    effect: () => {
                        // 1. Heal, 2. Gold, 3. Relic, 4. Damage, 5. Curse, 6. Remove Card
                        globalBus.emit('spin_wheel');
                    }
                }
            ]
        });
    }
}