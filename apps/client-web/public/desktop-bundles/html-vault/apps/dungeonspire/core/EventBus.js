/**
 * =================================================================================================
 * DungeonSpire - Event Bus
 * Version: 1.0.0
 * Author: HyperInfinity
 * =================================================================================================
 * Description:
 * A lightweight Publish-Subscribe (Pub/Sub) system for decoupled communication between modules.
 * Allows disparate systems (e.g., UI and Logic) to communicate without direct references.
 * =================================================================================================
 */

export class EventBus {
    constructor() {
        this.listeners = {};
        this.debug = false;
    }

    /**
     * Subscribe to an event.
     * @param {string} event - The event name.
     * @param {Function} callback - The function to call when event is emitted.
     * @returns {Function} - Unsubscribe function.
     */
    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);

        // Return unsubscribe handle
        return () => this.off(event, callback);
    }

    /**
     * Unsubscribe from an event.
     * @param {string} event 
     * @param {Function} callback 
     */
    off(event, callback) {
        if (!this.listeners[event]) return;
        this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }

    /**
     * Emit an event to all subscribers.
     * @param {string} event 
     * @param {any} data 
     */
    emit(event, data) {
        if (this.debug) {
            console.log(`%c[EventBus] Emit: ${event}`, 'color: #7289da', data);
        }

        if (!this.listeners[event]) return;

        this.listeners[event].forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`[EventBus] Error in listener for event '${event}':`, error);
            }
        });
    }

    /**
     * Subscribe to an event once. Automatically unsubscribes after first trigger.
     * @param {string} event 
     * @param {Function} callback 
     */
    once(event, callback) {
        const wrapper = (data) => {
            callback(data);
            this.off(event, wrapper);
        };
        this.on(event, wrapper);
    }

    /**
     * Clear all listeners. Useful for cleanup.
     */
    clear() {
        this.listeners = {};
    }
}

// Export a global singleton instance
export const globalBus = new EventBus();