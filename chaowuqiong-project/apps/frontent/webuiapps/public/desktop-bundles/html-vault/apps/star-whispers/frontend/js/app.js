import { UIManager } from './ui/ui_manager.js';
import { APIClient } from './core/api_client.js';

class App {
    constructor() {
        this.ui = new UIManager();
        this.api = new APIClient();
        this.state = {
            user: null,
            ageGroup: null // 'child', 'teen', 'adult'
        };
    }

    async init() {
        console.log('StarWhispers initializing...');
        await this.ui.renderWelcomeScreen();
    }
}

window.app = new App();
window.app.init();