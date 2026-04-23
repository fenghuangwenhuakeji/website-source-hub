export const API_BASE_URL = '';

export const STORAGE_KEYS = {
  AUTH: 'fhwh-auth',
  TOKEN: 'fhwh_token',
  REFRESH_TOKEN: 'fhwh_refresh_token',
  USER: 'fhwh_user',
} as const;

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    REFRESH: '/api/auth/refresh',
  },
  USER: {
    PROFILE: '/api/users/profile',
    STATS: '/api/users/stats',
  },
} as const;

export const ROUTES = {
  HOME: '/',
  SHOWCASE: '/showcase',
  DASHBOARD: '/dashboard',
  NOVELS: '/novels',
  WRITING: '/writing',
  LOGIN: '/login',
  REGISTER: '/register',
  PROFILE: '/profile',
} as const;
