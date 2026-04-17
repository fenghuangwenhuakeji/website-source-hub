/**
 * 用户状态管理模块
 * 负责用户登录、年龄段设置、偏好存储
 */

const UserState = {
    isLoggedIn: false,
    profile: {
        ageGroup: 'adult', // 默认成人
        nickname: '',
        nptiType: null,
        horoscope: null
    }
};

export default UserState;