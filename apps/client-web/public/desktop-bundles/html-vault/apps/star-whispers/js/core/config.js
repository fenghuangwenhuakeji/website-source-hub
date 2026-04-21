export const CONFIG = {
    appName: '星语心伴',
    version: '1.0.0',
    defaultTheme: 'adult',
    ageGroups: {
        CHILD: { min: 6, max: 12, theme: 'child', label: '儿童版' },
        TEEN: { min: 13, max: 18, theme: 'teen', label: '青少年版' },
        ADULT: { min: 19, max: 100, theme: 'adult', label: '成人版' }
    },
    api: {
        baseUrl: '/api/v1',
        timeout: 10000
    }
};