export class AuthSystem {
    constructor(eventBus, store) {
        this.eventBus = eventBus;
        this.store = store;
        
        this.eventBus.on('set-age-group', this.setAgeGroup.bind(this));
    }

    setAgeGroup(ageInfo) {
        // ageInfo: { age: number, group: 'kids'|'teen'|'adult' }
        const { age, group } = ageInfo;
        console.log(`Setting age group to: ${group} (${age} years old)`);
        
        this.store.updateUser({
            age: age,
            ageGroup: group
        });
        
        // 触发主题切换事件
        this.eventBus.emit('theme-change', group);
        
        // 导航到下一步：人格/星座选择
        this.eventBus.emit('navigate', 'profile-setup');
    }
}