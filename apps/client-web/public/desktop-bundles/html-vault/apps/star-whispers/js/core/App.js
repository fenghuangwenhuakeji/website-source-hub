/**
 * StarWhispers Core Application Entry
 */

class App {
    constructor() {
        this.init();
    }

    init() {
        console.log('StarWhispers Engine Initialized.');
        console.log('Current Theme:', document.body.getAttribute('data-theme'));
        
        // TODO: Initialize Modules
        // this.router = new Router();
        // this.security = new SecurityGuard();
    }
}

// 启动应用
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
