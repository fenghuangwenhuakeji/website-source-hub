export class UserManager {
    constructor(eventBus) {
        this.bus = eventBus;
        this.currentUser = null;
    }

    login(userData) {
        this.currentUser = userData;
        console.log(`User logged in: ${userData.name}, Age: ${userData.age}`);
        
        this.updateThemeBasedOnAge(userData.age);
        this.bus.emit('user-login', this.currentUser);
    }

    updateThemeBasedOnAge(age) {
        let theme = 'adult';
        if (age < 12) theme = 'child';
        else if (age < 18) theme = 'teen';
        
        console.log(`Applying theme: ${theme}`);
        this.bus.emit('theme-change', theme);
    }
}