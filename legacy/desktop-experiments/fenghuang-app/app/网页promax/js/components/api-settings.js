// 文件路径: js/components/api-settings.js
// 描述: API设置弹窗模块

import { showNotification } from '../ui/notifications.js';

function updateApiSettingsVisibility(){
    const provider = document.getElementById("api-provider").value;
    const needsApiKey = ['gemini', 'openai', 'deepseek', 'siliconflow', 'claude', 'custom'].includes(provider);
    document.getElementById("api-key-group").classList.toggle("hidden", !needsApiKey);
    
    const needsBaseUrl = ['ollama', 'custom', 'claude'].includes(provider);
    document.getElementById("api-base-url-group").classList.toggle("hidden", !needsBaseUrl);
    
    const needsModelName = ['ollama', 'custom', 'siliconflow'].includes(provider);
    document.getElementById("api-model-name-group").classList.toggle("hidden", !needsModelName);

    document.getElementById("api-gemini-model-group").classList.toggle("hidden", provider !== 'gemini');
    document.getElementById("api-deepseek-model-group").classList.toggle("hidden", provider !== 'deepseek');
    document.getElementById("api-claude-model-group").classList.toggle("hidden", provider !== 'claude');
}

function loadSettings(){
    document.getElementById("api-provider").value = localStorage.getItem("api_provider") || "gemini";
    document.getElementById("api-key").value = localStorage.getItem("api_key") || "";
    document.getElementById("api-base-url").value = localStorage.getItem("api_base_url") || "";
    document.getElementById("api-model-name").value = localStorage.getItem("api_model_name") || "";
    document.getElementById("api-gemini-model").value = localStorage.getItem("gemini_model") || "gemini-1.5-flash";
    document.getElementById("api-deepseek-model").value = localStorage.getItem("deepseek_model") || "deepseek-chat";
    document.getElementById("api-claude-model").value = localStorage.getItem("claude_model") || "claude-3-opus-20240229";
    updateApiSettingsVisibility();
}

function saveAndCloseSettings(){
    localStorage.setItem("api_provider", document.getElementById("api-provider").value);
    localStorage.setItem("api_key", document.getElementById("api-key").value);
    localStorage.setItem("api_base_url", document.getElementById("api-base-url").value);
    localStorage.setItem("api_model_name", document.getElementById("api-model-name").value);
    localStorage.setItem("gemini_model", document.getElementById("api-gemini-model").value);
    localStorage.setItem("deepseek_model", document.getElementById("api-deepseek-model").value);
    localStorage.setItem("claude_model", document.getElementById("api-claude-model").value);
    
    const statusEl = document.getElementById("settings-status");
    if(statusEl) statusEl.textContent = "设置已保存!";
    
    showNotification("API设置已成功保存！", "success");

    setTimeout(() => { 
        if(statusEl) statusEl.textContent = ""; 
        document.getElementById("api-settings-modal").classList.remove('visible');
    }, 1500);
}

export function initializeApiSettingsModal(){
    const modal = document.getElementById('api-settings-modal');
    const openBtn = document.getElementById('settings-btn');
    const closeBtn = modal.querySelector('.close-btn');
    
    openBtn.addEventListener('click', () => modal.classList.add('visible'));
    closeBtn.addEventListener('click', () => modal.classList.remove('visible'));
    modal.addEventListener('click', (e) => { if (e.target === modal) { modal.classList.remove('visible'); } });
    
    document.getElementById('save-settings-btn').addEventListener('click', saveAndCloseSettings);
    document.getElementById('api-provider').addEventListener('change', updateApiSettingsVisibility);
    loadSettings();
}