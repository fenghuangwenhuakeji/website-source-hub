/**
 * 主题管理器
 * 负责切换 CSS 变量和 UI 风格
 */
export class ThemeManager {
    constructor() {
        this.body = document.body;
    }

    /**
     * 应用特定年龄段的主题
     * @param {string} groupID (child/teen/adult)
     */
    applyTheme(groupID) {
        // 移除旧主题类
        this.body.classList.remove('theme-child', 'theme-teen', 'theme-adult');
        
        // 添加新主题类
        if (groupID) {
            this.body.classList.add(`theme-${groupID}`);
        }
    }
}