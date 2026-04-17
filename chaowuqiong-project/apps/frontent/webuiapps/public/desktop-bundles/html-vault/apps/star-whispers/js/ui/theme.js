/**
 * 主题管理模块
 * 负责根据用户年龄段切换 CSS 变量
 */

/**
 * 应用主题
 * @param {string} ageGroup - 'child' | 'teen' | 'adult'
 */
export function applyTheme(ageGroup) {
    const themeMap = {
        'child': 'child',
        'teen': 'teen',
        'adult': 'default'
    };
    
    const themeName = themeMap[ageGroup] || 'default';
    document.body.setAttribute('data-theme', themeName);
    console.log(`Theme applied: ${themeName}`);
}