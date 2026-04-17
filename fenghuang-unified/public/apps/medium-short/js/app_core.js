import { DB } from '../core/db.js';
import { UI } from './ui.js';
import { Utils } from '../utils/helpers.js';

export const App = {
    state: {
        currentView: 'home',
        currentBookId: null,
        currentChapterId: null,
        theme: 'light'
    },
    
    async init() {
        await DB.init();
        this.loadSettings();
        this.bindEvents();
        this.nav('home');
        console.log("App Initialized");
    },
    
    loadSettings: async () => {
        const s = await DB.get('settings', 'main');
        if(s) {
            if(s.theme === 'dark') document.documentElement.classList.add('dark');
        }
    },
    
    bindEvents: () => {
        // Global event listeners
    },
    
    nav: (view) => {
        this.state.currentView = view;
        document.querySelectorAll('.view-section').forEach(el => el.classList.add('hidden'));
        const target = document.getElementById(`view-${view}`);
        if(target) target.classList.remove('hidden');
        
        // Update sidebar active state
        document.querySelectorAll('.sidebar-item').forEach(el => el.classList.remove('active'));
        // TODO: Add logic to highlight active sidebar item based on view
    }
};