/**
 * =================================================================================================
 * DungeonSpire - Animation Manager
 * =================================================================================================
 */

export class AnimationManager {
    constructor() {
        this.animations = [];
    }

    play(animFn) {
        this.animations.push(animFn);
        // Execute immediately for now, but could be queued
        animFn();
    }

    clear() {
        this.animations = [];
    }
}