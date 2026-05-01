let isExtracting = false; // 全局（模块作用域）锁

document.addEventListener('DOMContentLoaded', () => {
    const panel = document.getElementById('vector-panel');
    if (!panel) return;

    // 主渲染函数
    async function renderVectorPanel() {
        try {
            await window.vectorDB.initDB();
            panel.innerHTML = `
                <h3><i class="fas fa-atom"></i> 向量化核心记忆</h3>
                <p>这里管理着故事的核心动态信息，为AI提供长期记忆。</p>
                
                ${await renderSection('核心人物状态池', 'characters', '新建/管理人物卡', '从前情提要提取')}
                ${await renderSection('世界观设定状态变化', 'worldview', '添加设定', '从前情提要提取')}
                ${await renderSection('铺垫与伏笔变化', 'clues', '添加伏笔', '从前情提要提取')}
                ${await renderSection('地图系统', 'maps', '添加地点', '从前情提要提取')}
            `;
            addVectorPanelEventListeners();
        } catch (error) {
            console.error("向量库面板渲染失败:", error);
            panel.innerHTML = `<div class="card error-card"><h3><i class="fas fa-exclamation-triangle"></i> 渲染失败</h3><p>无法初始化核心记忆数据库。请检查浏览器设置或联系技术支持。</p><pre>${error.message}</pre></div>`;
        }
    }

    // 渲染单个可折叠区域的通用函数
    async function renderSection(title, type, addBtnText, extractBtnText) {
        const iconMap = {
            characters: 'fa-users',
            worldview: 'fa-globe-asia',
            clues: 'fa-puzzle-piece',
            maps: 'fa-map-marked-alt'
        };
        const pluralCapitalized = type.charAt(0).toUpperCase() + type.slice(1);
        const items = await vectorDB[`getAll${pluralCapitalized}`]();
        
        let itemsHtml = items.length > 0 
            ? items.map(item => createItemHtml(item, type)).join('')
            : `<p class="text-muted" style="padding: 10px;">暂无数据。</p>`;

        return `
            <details class="collapsible-section" open>
                <summary><h4><i class="fas ${iconMap[type]}"></i> ${title}</h4></summary>
                <div class="collapsible-content">
                    <div id="${type}-list" class="dynamic-item-list">${itemsHtml}</div>
                    <button class="action-btn add-vector-item-btn" data-type="${type}">${addBtnText}</button>
                    <button class="settings-btn extract-vector-item-btn" data-type="${type}"><i class="fas fa-magic"></i> ${extractBtnText}</button>
                </div>
            </details>
        `;
    }

    // 创建单个数据项的HTML
    function createItemHtml(item, type) {
        return `
            <div class="dynamic-item" data-id="${item.id}">
                <p>${item.text || '无内容'}</p>
                <div class="dynamic-item-actions">
                    <button class="settings-btn edit-vector-item-btn" data-type="${type}"><i class="fas fa-edit"></i></button>
                    <button class="settings-btn delete-vector-item-btn" data-type="${type}"><i class="fas fa-trash-alt"></i></button>
                </div>
            </div>
        `;
    }
    
    // 统一的事件监听器
    function addVectorPanelEventListeners() {
        panel.addEventListener('click', async (e) => {
            const button = e.target.closest('button');
            if (!button) return;

            const type = button.dataset.type;
            if (!type) return;

            const id = button.closest('.dynamic-item')?.dataset.id;
            const singularKey = type.endsWith('s') ? type.slice(0, -1) : type;
            const singularCapitalized = singularKey.charAt(0).toUpperCase() + singularKey.slice(1);

            if (button.classList.contains('add-vector-item-btn')) {
                const text = prompt(`请输入新的"${type}"内容:`);
                if (text) {
                    await vectorDB[`save${singularCapitalized}`]({ text });
                    await refreshSection(type);
                }
            }
            
            if (button.classList.contains('edit-vector-item-btn') && id) {
                 const item = await vectorDB[`get${singularCapitalized}`](parseInt(id));
                 const newText = prompt('编辑内容:', item.text);
                 if (newText) {
                     item.text = newText;
                     await vectorDB[`save${singularCapitalized}`](item);
                     await refreshSection(type);
                 }
            }

            if (button.classList.contains('delete-vector-item-btn') && id) {
                if (confirm('确定要删除此项吗？')) {
                    await vectorDB[`delete${singularCapitalized}`](parseInt(id));
                    await refreshSection(type);
                }
            }
            
            if (button.classList.contains('extract-vector-item-btn')) {
                if (isExtracting) {
                    showNotification('已有提取任务正在进行中，请稍候。', 'warning');
                    return;
                }
                isExtracting = true;
                const allExtractBtns = panel.querySelectorAll('.extract-vector-item-btn');
                allExtractBtns.forEach(btn => btn.disabled = true);
                
                try {
                    await extractAndSaveFromPreamble(type);
                } finally {
                    isExtracting = false;
                    allExtractBtns.forEach(btn => btn.disabled = false);
                }
            }
        });
    }

    async function refreshSection(type) {
        const pluralCapitalized = type.charAt(0).toUpperCase() + type.slice(1);
        const items = await vectorDB[`getAll${pluralCapitalized}`]();
        const container = document.getElementById(`${type}-list`);
        if (container) {
             container.innerHTML = items.length > 0 
                ? items.map(item => createItemHtml(item, type)).join('')
                : `<p class="text-muted" style="padding: 10px;">暂无数据。</p>`;
        }
    }

    // 从前情提要提取核心要素并存入数据库
    async function extractAndSaveFromPreamble(type) {
        const preambleElement = document.querySelector('#volume-detail-content [data-volume-preamble="true"]');
        
        if (!preambleElement || !preambleElement.innerText.trim()) {
            showNotification('当前卷没有可供提取的前情提要。', 'warning');
            return;
        }

        const preambleText = preambleElement.innerText;

        showNotification(`正在从当前卷的前情提要中提取【${type}】...`, 'info');

        const extractionPrompt = createPreambleExtractionPrompt(preambleText, type);
        try {
            const result = await window.App.api.callApi(extractionPrompt, true);
            let items = [];

            // 增强的JSON解析逻辑
            try {
                // 尝试直接解析
                items = JSON.parse(result);
            } catch (e) {
                // 如果直接解析失败，尝试从文本中提取JSON数组
                console.warn("API返回的不是标准JSON，尝试从文本中提取JSON数组...");
                const jsonMatch = result.match(/(\[[\s\S]*\])/);
                if (jsonMatch && jsonMatch[0]) {
                    try {
                        items = JSON.parse(jsonMatch[0]);
                    } catch (e2) {
                        throw new Error(`从文本中提取JSON数组时解析失败: ${e2.message}`);
                    }
                } else {
                    throw new Error("API响应中既找不到标准JSON，也找不到嵌入的JSON数组。");
                }
            }

            // 确保最终得到的是一个数组
            if (!Array.isArray(items)) {
                // 如果解析后是一个对象，尝试从对象的值中寻找数组
                if (typeof items === 'object' && items !== null) {
                    const arrayFromObject = Object.values(items).find(value => Array.isArray(value));
                    if (arrayFromObject) {
                        items = arrayFromObject;
                    } else {
                        throw new Error("API返回了有效的JSON，但其中不包含数组。");
                    }
                } else {
                    throw new Error("API返回的数据格式无法处理，最终未能得到一个数组。");
                }
            }

            const singularKey = type.endsWith('s') ? type.slice(0, -1) : type;
            const singularCapitalized = singularKey.charAt(0).toUpperCase() + singularKey.slice(1);

            for (const itemText of items) {
                if (itemText && typeof itemText === 'string') {
                    await vectorDB[`save${singularCapitalized}`]({ text: itemText });
                }
            }

            await refreshSection(type);
            showNotification(`成功提取并保存了 ${items.length} 项【${type}】。`, 'success');

        } catch (error) {
            console.error(`从前情提要提取【${type}】时出错:`, error);
            showNotification(`从前情提要提取【${type}】失败: ${error.message}`, 'error');
        }
    }

    // 创建用于从前情提要提取信息的提示
    function createPreambleExtractionPrompt(preambleText, type) {
        const typeMap = {
            characters: '核心人物状态',
            worldview: '世界观设定变化',
            clues: '铺垫与伏笔',
            maps: '核心场景/地图'
        };

        const question = `请从以下小说“前情提要”中，提取所有关于【${typeMap[type]}】的条目。`;

        return `你是一个精确的数据提取助手。
# 任务
${question}

# 要求
- 以JSON数组的格式返回结果，例如：["条目1", "条目2", "条目3"]。
- 每个条目都应该是一个简洁明了的字符串。
- 如果没有找到任何相关条目，请返回一个空数组 []。
- **只关注与【${typeMap[type]}】直接相关的内容。**

# 前情提要文本
---
${preambleText}
---

现在，请提取数据并以JSON数组格式输出。`;
    }

    // 初始化
    renderVectorPanel();
});