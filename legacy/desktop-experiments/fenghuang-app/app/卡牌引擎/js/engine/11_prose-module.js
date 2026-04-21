/*
 * 文件路径: /js/engine/11_prose-module.js
 * 版本: V110.0 - 博士构造版 (作家圣殿)
 * 描述: 【正文模块】核心逻辑。一个沉浸式的写作环境，与细纲模块深度联动。
 */

const ProseModule = (() => {
    // --- 模块私有变量 ---
    let _canvas;
    let _activePlotCardId = null;
    let _activeSceneId = null;

    // --- DOM 元素缓存 ---
    let _editorEl, _sidebarEl, _saveBtn, _generateBtn, _analyzeBtn, _styleSelect;

    function init() {
        console.log("引擎模块 [正文模块] 开始唤醒...");
        _canvas = document.getElementById('prose-canvas');
        if (!_canvas) {
            console.error("[正文模块] 初始化失败: 未找到核心DOM元素 'prose-canvas'。");
            return;
        }
        console.log("引擎模块 [正文模块] 已成功唤醒，作家圣殿已准备就绪。");
    }

    // --- 核心功能：加载指定场景进行写作 ---
    function loadScene(plotCardId, sceneId) {
        _activePlotCardId = plotCardId;
        _activeSceneId = sceneId;

        const plotCard = CardManager.getAllCards().find(c => c.id === plotCardId);
        if (!plotCard || !plotCard.data.scenes) {
            _displayError("无法找到指定的情节卡。");
            return;
        }

        const scene = plotCard.data.scenes.find(s => s.id === sceneId);
        if (!scene) {
            _displayError("无法在情节卡中找到指定的场景。");
            return;
        }

        _renderWritingInterface(scene);
    }

    // --- 渲染写作界面 ---
    function _renderWritingInterface(scene) {
        _canvas.innerHTML = `
            <div class="prose-sidebar">
                <h3><i class="fa-solid fa-clipboard-list"></i> 场景提纲</h3>
                <div class="sidebar-content">
                    <h4>${scene.name}</h4>
                    <p><strong><i class="fa-solid fa-clock"></i> 时间:</strong> ${scene.time || '未设定'}</p>
                    <p><strong><i class="fa-solid fa-map-marker-alt"></i> 地点:</strong> ${scene.location || '未设定'}</p>
                    <p><strong><i class="fa-solid fa-users"></i> 角色:</strong> ${scene.characters || '未设定'}</p>
                    <p><strong><i class="fa-solid fa-bolt"></i> 核心事件:</strong> ${scene.event || '未设定'}</p>
                    <p><strong><i class="fa-solid fa-comments"></i> 对话要点:</strong> ${scene.dialogue || '未设定'}</p>
                    <p><strong><i class="fa-solid fa-bullseye"></i> 场景目的:</strong> ${scene.purpose || '未设定'}</p>
                </div>
                <div class="sidebar-actions">
                    <h3><i class="fa-solid fa-robot"></i> AI 助手</h3>
                    <div class="form-group">
                        <label for="prose-style-select">生成风格</label>
                        <select id="prose-style-select">
                            <option value="冷静客观">冷静客观</option>
                            <option value="华丽抒情">华丽抒情</option>
                            <option value="悬疑紧张">悬疑紧张</option>
                            <option value="轻松幽默">轻松幽默</option>
                            <option value="史诗宏大">史诗宏大</option>
                        </select>
                    </div>
                    <button id="prose-generate-btn" class="glow-button"><i class="fa-solid fa-wand-magic-sparkles"></i> 生成草稿</button>
                    <button id="prose-analyze-btn" class="glow-button"><i class="fa-solid fa-magnifying-glass-chart"></i> 潜文本分析</button>
                </div>
            </div>
            <div class="prose-main">
                <div id="prose-editor" contenteditable="true" spellcheck="false"></div>
                <div class="prose-toolbar">
                     <button id="prose-save-btn" class="glow-button"><i class="fa-solid fa-save"></i> 保存正文</button>
                </div>
            </div>
        `;

        // 缓存新创建的DOM元素
        _editorEl = document.getElementById('prose-editor');
        _sidebarEl = _canvas.querySelector('.prose-sidebar');
        _saveBtn = document.getElementById('prose-save-btn');
        _generateBtn = document.getElementById('prose-generate-btn');
        _analyzeBtn = document.getElementById('prose-analyze-btn');
        _styleSelect = document.getElementById('prose-style-select');

        // 填充已有的正文内容
        _editorEl.innerHTML = scene.prose || '';

        // 绑定事件
        _saveBtn.addEventListener('click', _handleSave);
        _generateBtn.addEventListener('click', () => _handleGenerateDraft(scene));
    }

    // --- 事件处理函数 ---
    function _handleSave() {
        if (!_activePlotCardId || !_activeSceneId) return;

        const plotCard = CardManager.getAllCards().find(c => c.id === _activePlotCardId);
        if (!plotCard || !plotCard.data.scenes) return;

        const scene = plotCard.data.scenes.find(s => s.id === _activeSceneId);
        if (scene) {
            scene.prose = _editorEl.innerHTML;
            CardManager.notifyUpdate(); // 虽然不会直接重绘画布，但这是个好习惯
            showNotification(`场景 [${scene.name}] 的正文已保存！`, 'success');
        } else {
            showNotification('保存失败：找不到当前场景。', 'warning');
        }
    }

    async function _handleGenerateDraft(scene) {
        const style = _styleSelect.value;
        const confirmation = confirm(`即将使用AI生成 [${style}] 风格的草稿，这会覆盖当前编辑区的内容。确定要继续吗？`);
        if (!confirmation) return;

        const prompt = `
            你是一位专业的小说家。请根据以下场景提纲，以【${style}】的风格，为我撰写一段场景正文。
            你的任务是专注于描写，将提纲中的信息生动地展现出来，不要添加任何额外的解释或剧情推进。
            
            **场景提纲:**
            - 场景名称: ${scene.name}
            - 时间: ${scene.time}
            - 地点: ${scene.location}
            - 出场角色: ${scene.characters}
            - 核心事件: ${scene.event}
            - 对话要点: ${scene.dialogue}
            - 场景目的: ${scene.purpose}

            请直接输出正文内容。
        `;

        _setButtonLoading(_generateBtn, true, 'AI正在创作...');
        _editorEl.innerHTML = '<p><i>AI 正在挥洒文笔，请稍候...</i></p>';

        try {
            const aiResponse = await APIInterface.sendMessage(prompt, 'creative');
            if (aiResponse.error) {
                _editorEl.innerHTML = `<p style="color: #e74c3c;">生成失败: ${aiResponse.error}</p>`;
            } else {
                _editorEl.innerHTML = aiResponse.replace(/\n/g, '<br>');
            }
        } catch (error) {
            _editorEl.innerHTML = `<p style="color: #e74c3c;">生成失败: 发生网络错误。</p>`;
        } finally {
            _setButtonLoading(_generateBtn, false, '生成草稿');
        }
    }


    // --- 辅助函数 ---
    function _displayError(message) {
        _canvas.innerHTML = `<p class="empty-message">${message}</p>`;
    }

    function _setButtonLoading(button, isLoading, message) {
        const icon = button.querySelector('i').className;
        if (isLoading) {
            button.disabled = true;
            button.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${message}`;
        } else {
            button.disabled = false;
            button.innerHTML = `<i class="${icon}"></i> ${message}`;
        }
    }
    
    // 渲染初始欢迎界面
    function render() {
        if (_canvas && !_canvas.querySelector('.prose-main')) {
             _canvas.innerHTML = `
                <div class="prose-welcome-message">
                    <h2><i class="fa-solid fa-pen-nib"></i> 欢迎来到作家圣殿</h2>
                    <p>请先前往【细纲模块】，在任意一个场景卡上点击【 <i class="fa-solid fa-pen-to-square"></i> 撰写】按钮，以载入场景并开始创作。</p>
                </div>
            `;
        }
    }


    // --- 模块接口 ---
    return {
        init,
        render,
        loadScene // 将此方法暴露给外部，以便其他模块调用
    };
})();