export class TriggerSystem {
    constructor(game) {
        this.game = game;
        this.triggers = new Map();
    }

    registerTrigger(keyword, action) {
        this.triggers.set(keyword.toLowerCase(), action);
    }

    analyzeResponse(text) {
        for (const [keyword, action] of this.triggers) {
            if (text.toLowerCase().includes(keyword)) {
                action(this.game);
                return true;
            }
        }
        return false;
    }
}