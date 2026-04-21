export default class UserContext {
    constructor() {
        this.ageGroup = 'adult'; // default
        this.userProfile = {};
    }

    setAgeGroup(group) {
        this.ageGroup = group;
        console.log(`[UserContext] Age group set to: ${group}`);
    }

    getAgeGroup() {
        return this.ageGroup;
    }
}