/**
 * =================================================================================================
 * DungeonSpire - Input Controller
 * Version: 1.0.0
 * Author: HyperInfinity
 * =================================================================================================
 * Description:
 * Handles keyboard hotkeys and advanced mouse interactions.
 * =================================================================================================
 */

import { globalBus } from '../core/EventBus.js';

export class InputController {
    constructor() {
        this.keys = {};
        this.bindKeys();
    }

    bindKeys() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            this.handleHotkeys(e);
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }

    handleHotkeys(e) {
        // Number keys for card selection (1-0)
        if (e.key >= '1' && e.key <= '9') {
            const index = parseInt(e.key) - 1;
            // Logic to select card at index
            console.log(`Hotkey: Select card ${index}`);
        }

        // E for End Turn
        if (e.code === 'KeyE') {
            globalBus.emit('end_turn_clicked');
        }

        // M for Map
        if (e.code === 'KeyM') {
            globalBus.emit('toggle_map');
        }

        // D for Deck View
        if (e.code === 'KeyD') {
            globalBus.emit('view_deck');
        }
    }
}