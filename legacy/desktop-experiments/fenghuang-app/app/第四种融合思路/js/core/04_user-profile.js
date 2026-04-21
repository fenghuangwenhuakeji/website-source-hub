/*
 * 创世纪引擎 V74.0 - 纯粹版
 * 核心JS模块 4: 系统设置 (System Settings)
 * 职责: 管理API密钥设置模态框的交互。
 * ✨✨✨ (博士重构) ✨✨✨ 已移除所有用户 profile 相关逻辑，本文件现在只负责API设置面板。
 */

// 初始化API设置模态框
function initializeApiSettingsModal() {
    const modal = document.getElementById('api-settings-modal');
    const closeBtn = document.getElementById('close-api-modal-btn');
    const saveBtn = document.getElementById('save-api-key-btn');
    const providerSelect = document.getElementById('api-provider');

    if (!modal || !closeBtn || !saveBtn || !providerSelect) {
        console.error("API settings modal elements are missing from the DOM.");
        return;
    }
    
    loadApiSettings(); // 加载保存的设置

    closeBtn.addEventListener('click', () => modal.style.display = 'none');
    saveBtn.addEventListener('click', saveAndCloseSettings);
    providerSelect.addEventListener('change', updateApiSettingsVisibility);
    
    window.addEventListener('click', (event) => {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    });
}

function updateApiSettingsVisibility() {
    const provider = document.getElementById("api-provider").value;
    
    const toggle = (id, condition) => {
        const el = document.getElementById(id);
        if (el) el.classList.toggle("hidden", !condition);
    };

    toggle("api-key-group", !['ollama'].includes(provider));
    toggle("api-base-url-group", ['ollama', 'custom'].includes(provider));
    toggle("api-model-name-group", ['ollama', 'custom', 'siliconflow'].includes(provider));
    toggle("api-gemini-model-group", provider === 'gemini');
    toggle("api-claude-model-group", provider === 'claude');
    toggle("api-deepseek-model-group", provider === 'deepseek');
}

function loadApiSettings() {
    const get = (key, defaultValue) => localStorage.getItem(key) || defaultValue;
    
    const setValue = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.value = value;
    };
    
    setValue("api-provider", get("api_provider", "gemini"));
    setValue("api-key", get("api_key", "")); // 直接从 localStorage 加载
    setValue("api-base-url", get("api_base_url", ""));
    setValue("api-model-name", get("api_model_name", ""));
    setValue("api-gemini-model", get("gemini_model", "gemini-1.5-flash-latest"));
    setValue("api-claude-model", get("claude_model", "claude-3-sonnet-20240229"));
    setValue("api-deepseek-model", get("deepseek_model", "deepseek-chat"));
    
    updateApiSettingsVisibility();
}

function saveAndCloseSettings() {
    const getValue = (id) => document.getElementById(id)?.value || null;
    
    localStorage.setItem("api_provider", getValue("api-provider"));
    localStorage.setItem("api_key", getValue("api-key")); // 直接保存到 localStorage
    localStorage.setItem("api_base_url", getValue("api-base-url"));
    localStorage.setItem("api_model_name", getValue("api-model-name"));
    localStorage.setItem("gemini_model", getValue("api-gemini-model"));
    localStorage.setItem("claude_model", getValue("api-claude-model"));
    localStorage.setItem("deepseek_model", getValue("api-deepseek-model"));

    showNotification('API 设置已保存!', 'success');
    document.getElementById("api-settings-modal").style.display = 'none';
}