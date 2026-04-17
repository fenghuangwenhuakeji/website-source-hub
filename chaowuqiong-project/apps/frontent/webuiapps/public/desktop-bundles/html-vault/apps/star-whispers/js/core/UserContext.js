/**
 * 用户上下文管理
 * 负责存储用户年龄、人格、星座等核心状态
 */
export class UserContext {
    constructor() {
        this.profile = {
            age: 25, // 默认成人
            ageGroup: 'adult', // child, teen, adult
            npti: null,
            horoscope: 'aries',
            name: 'User'
        };
        this.listeners = [];
    }

    setAge(age) {
        this.profile.age = age;
        if (age < 12) this.profile.ageGroup = 'child';
        else if (age < 18) this.profile.ageGroup = 'teen';
        else this.profile.ageGroup = 'adult';
        
        this.notify('ageChanged', this.profile.ageGroup);
    }

    setNPTI(type) {
        this.profile.npti = type;
        this.notify('nptiChanged', type);
    }

    subscribe(event, callback) {
        this.listeners.push({ event, callback });
    }

    notify(event, data) {
        this.listeners.filter(l => l.event === event)
            .forEach(l => l.callback(data));
    }

    getProfile() {
        return this.profile;
    }
}