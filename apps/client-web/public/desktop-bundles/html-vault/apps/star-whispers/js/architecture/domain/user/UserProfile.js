/**
 * 用户档案 (User Profile)
 * 存储用户的个人信息和偏好
 */

export class UserProfile {
    constructor(data = {}) {
        this.nickname = data.nickname || '星语用户';
        this.avatar = data.avatar || null;
        this.gender = data.gender || null; // male, female, other
        this.birthDate = data.birthDate || null;
        this.birthTime = data.birthTime || null; // 用于八字计算
        this.birthLocation = data.birthLocation || null;
        this.bio = data.bio || '';
        this.interests = data.interests || [];
        this.nptiType = data.nptiType || null; // NPTI人格类型
        this.mbtiType = data.mbtiType || null; // MBTI类型
    }

    /**
     * 更新档案
     */
    update(data) {
        Object.keys(data).forEach(key => {
            if (this.hasOwnProperty(key)) {
                this[key] = data[key];
            }
        });
    }

    /**
     * 设置人格类型
     */
    setPersonalityType(type, source = 'npti') {
        if (source === 'npti') {
            this.nptiType = type;
        } else if (source === 'mbti') {
            this.mbtiType = type;
        }
    }

    /**
     * 获取年龄
     */
    getAge() {
        if (!this.birthDate) return null;
        const today = new Date();
        const birth = new Date(this.birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    }

    /**
     * 添加兴趣
     */
    addInterest(interest) {
        if (!this.interests.includes(interest)) {
            this.interests.push(interest);
        }
    }

    /**
     * 移除兴趣
     */
    removeInterest(interest) {
        const index = this.interests.indexOf(interest);
        if (index > -1) {
            this.interests.splice(index, 1);
        }
    }

    /**
     * 转换为JSON
     */
    toJSON() {
        return {
            nickname: this.nickname,
            avatar: this.avatar,
            gender: this.gender,
            birthDate: this.birthDate,
            birthTime: this.birthTime,
            birthLocation: this.birthLocation,
            bio: this.bio,
            interests: this.interests,
            nptiType: this.nptiType,
            mbtiType: this.mbtiType
        };
    }
}