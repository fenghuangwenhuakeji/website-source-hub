/**
 * =================================================================================================
 * DungeonSpire - Endless Mode
 * =================================================================================================
 */
export class EndlessMode {
    constructor() {
        this.floor = 1;
        this.difficultyScale = 1.0;
    }

    nextFloor() {
        this.floor++;
        this.difficultyScale += 0.1;
        // Apply blight modifiers
    }
}