/*
 * 文件路径: /js/core/05_api-settings.js
 * V79.1 统一配置版 - 使用主窗口API配置
 */

let _cachedApiConfig = null;

const APISettings = (() => {
    function init() {
        console.log('卡牌引擎: 使用主窗口统一API配置');
        window.parent?.postMessage({ type: 'get-api-config' }, '*');
    }

    function getSettings() {
        if (_cachedApiConfig) return _cachedApiConfig;
        const stored = localStorage.getItem('genesis_api_config');
        if (stored) {
            try {
                _cachedApiConfig = JSON.parse(stored);
                return _cachedApiConfig;
            } catch (e) {}
        }
        return {};
    }

    return { init, getSettings };
})();

window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'api-config-update') {
        _cachedApiConfig = event.data.config;
        localStorage.setItem('genesis_api_config', JSON.stringify(event.data.config));
        console.log('API 配置已从主窗口同步');
    }
});
