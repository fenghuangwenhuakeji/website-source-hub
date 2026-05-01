export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export const APP_NAME = '超无穹';
export const APP_DESCRIPTION = 'AI创作平台';

export const POINTS_RATIO = 10;

export const RECHARGE_PRODUCTS = [
  { id: 1, name: '10灵石', amount: 10, points: 100, bonusPoints: 0, description: '基础套餐' },
  { id: 2, name: '60灵石', amount: 60, points: 600, bonusPoints: 0, description: '标准套餐' },
  { id: 3, name: '120灵石', amount: 120, points: 1200, bonusPoints: 20, description: '赠送20' },
  { id: 4, name: '300灵石', amount: 300, points: 3000, bonusPoints: 50, description: '赠送50' },
  { id: 5, name: '600灵石', amount: 600, points: 6000, bonusPoints: 120, description: '赠送120' },
  { id: 6, name: '980灵石', amount: 980, points: 9800, bonusPoints: 200, description: 'VIP套餐' },
];

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  PROFILE: '/profile',
  RECHARGE: '/recharge',
  NOVELS: '/novels',
  NOVEL_DETAIL: '/novel/:id',
  WRITING: '/writing',
  DASHBOARD: '/dashboard',
} as const;

export const PAY_METHODS = {
  WECHAT: 'wechat',
  ALIPAY: 'alipay',
} as const;
