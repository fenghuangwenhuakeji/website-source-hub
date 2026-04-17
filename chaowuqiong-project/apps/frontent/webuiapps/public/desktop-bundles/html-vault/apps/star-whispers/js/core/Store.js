/* Store.js - 全局状态管理 */
export class Store {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.state = {
            user: {
                ageGroup: null, // 'kids', 'teen', 'adult'
                name: '访客',
                personality: null,
                constellation: null
            },
            chatHistory: [],
            currentView: 'home'
        };
        
        // 从本地存储加载
        this.load();
    }

    setState(key, value) {
        this.state[key] = value;
        this.eventBus.emit('state-changed', { key, value });
        this.save();
    }
    
    updateUser(userData) {
        this.state.user = { ...this.state.user, ...userData };
        this.eventBus.emit('user-updated', this.state.user);
        this.save();
    }

    getState() {
        return this.state;
    }

    save() {
        localStorage.setItem('star_whispers_state', JSON.stringify(this.state));
    }

    load() {
        const saved = localStorage.getItem('star_whispers_state');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                this.state = { ...this.state, ...parsed };
            } catch (e) {
                console.error('Failed to load state', e);
            }
        }
    }
}