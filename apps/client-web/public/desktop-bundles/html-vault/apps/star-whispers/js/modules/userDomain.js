export class UserDomain {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.currentUser = null;
    }

    loadUser(userData) {
        this.currentUser = userData;
        this.eventBus.emit('user:loaded', this.currentUser);
        this.updateThemeBasedOnAge();
    }

    updateThemeBasedOnAge() {
        if (!this.currentUser) return;
        
        const age = this.currentUser.age;
        let theme = 'adult';
        
        if (age >= 6 && age < 12) theme = 'child';
        else if (age >= 12 && age < 18) theme = 'teen';
        
        document.documentElement.setAttribute('data-theme', theme);
        console.log(`Theme updated to: ${theme} (Age: ${age})`);
    }
}