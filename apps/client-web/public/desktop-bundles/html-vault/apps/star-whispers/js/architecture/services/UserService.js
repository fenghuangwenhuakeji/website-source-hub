/**
 * 用户服务 (UserService)
 */
export class UserService {
    constructor() {
        this.users = new Map();
    }

    createUser(data) {
        const user = { id: 'user_' + Date.now(), ...data, createdAt: new Date() };
        this.users.set(user.id, user);
        return user;
    }

    getUser(userId) {
        return this.users.get(userId);
    }

    updateUser(userId, data) {
        const user = this.users.get(userId);
        if (user) Object.assign(user, data);
        return user;
    }
}