/**
 * @file module-toolbox.js
 * @description (V71.0 梦想最终修正) 辅助工具箱模块。
 * 负责渲染工具箱主页，并动态加载各个独立的辅助工具面板。
 * ✨✨✨ (博士重构 - 最终修正) ✨✨✨
 * 1. 【核心修复】修正了 `loadAuxiliaryPanel` 函数中动态生成初始化函数名的逻辑。通过添加 "Panel" 后缀，现在可以100%正确地拼接出所有辅助工具的初始化函数名（如 `initWritingEnhancerPanel`），彻底解决了按钮点击无响应的致命bug。
 */

function initializeToolbox() {
    renderToolboxPanel();
    
    const container = document.getElementById('toolbox-panel');
    if (!container) return;

    container.addEventListener('click', (e) => {
        const card = e.target.closest('.card[data-panel-target]');
        if (card) {
            e.preventDefault();
            const panelId = card.dataset.panelTarget;
            loadAuxiliaryPanel(panelId);
        }
        
        if (e.target.closest('.back-to-toolbox-btn')) {
            e.preventDefault();
            renderToolboxPanel(); // 返回主页
        }
    });
}

// 渲染工具箱主面板
function renderToolboxPanel() {
    const container = document.getElementById('toolbox-panel');
    if (container && UITemplates.toolboxPanel) {
        container.innerHTML = UITemplates.toolboxPanel;
    }
}

// 加载并显示指定的辅助工具面板
function loadAuxiliaryPanel(panelId) {
    const container = document.getElementById('toolbox-panel');
    if (!container) return;
    
    // 从模板库中获取对应工具的HTML
    const panelTemplate = UITemplates[panelId + 'Panel'];
    
    if (panelTemplate) {
        container.innerHTML = panelTemplate;
        
        // ✨✨✨ 最终核心修复：正确拼接函数名，加上 "Panel" 后缀 ✨✨✨
        const initFunctionName = `init${panelId.charAt(0).toUpperCase() + panelId.slice(1)}Panel`;
        
        if (typeof window[initFunctionName] === 'function') {
            window[initFunctionName]();
        } else {
            console.warn(`未找到工具 '${panelId}' 的初始化函数: ${initFunctionName}`);
        }
    } else {
        showNotification(`工具 "${panelId}" 正在开发中...`, 'info');
        container.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h3><i class="fas fa-wrench"></i> 开发中</h3>
                    <button class="settings-btn back-to-toolbox-btn"><i class="fas fa-arrow-left"></i> 返回工具箱</button>
                </div>
                <p class="placeholder-text">您所选择的工具 "${panelId}" 尚未完成，敬请期待！</p>
            </div>
        `;
    }
}