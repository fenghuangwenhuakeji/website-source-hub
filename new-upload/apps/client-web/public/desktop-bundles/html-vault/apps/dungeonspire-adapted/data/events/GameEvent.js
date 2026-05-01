/**
 * =================================================================================================
 * DungeonSpire - Event Base Class
 * =================================================================================================
 */

export class GameEvent {
    constructor(data) {
        this.id = data.id;
        this.title = data.title;
        this.body = data.body;
        this.image = data.image;
        this.options = data.options || [];
    }

    enter() {
        // Show event UI
        console.log(`Entered Event: ${this.title}`);
    }

    selectOption(index) {
        const option = this.options[index];
        if (option && option.effect) {
            option.effect();
        }
    }
}