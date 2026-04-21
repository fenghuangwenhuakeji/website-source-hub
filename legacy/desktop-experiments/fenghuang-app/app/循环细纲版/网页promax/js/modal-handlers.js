// 文件路径: 网页promax/js/modal-handlers.js
// 描述: 负责处理所有工具箱内通用模态框的打开、关闭和提交逻辑。

// 映射工具箱按钮ID到其对应的模态框ID和提示词标题
const MODAL_CONFIG = {
    // 卡牌系统
    'card-deconstruct-btn': { modalId: 'card-deconstruct-modal', promptTitle: '卡牌拆解助手' },
    'card-library-btn': { modalId: 'card-library-modal' }, //
    'card-composer-btn': { modalId: 'card-composer-modal', promptTitle: '卡牌组合助手' },
    // 核心构建
    'persona-module-btn': { modalId: 'persona-module-modal', promptTitle: '人设构建助手' },
    'worldview-module-btn': { modalId: 'worldview-module-modal', promptTitle: '世界观构建助手' },
    'outline-module-btn': { modalId: 'outline-module-modal', promptTitle: '细纲生成助手' },
    'golden-chapters-btn': { modalId: 'golden-chapters-modal', promptTitle: '黄金三章生成器' },
    // 万物皆可拆 (特殊处理)
    'deconstruct-character-btn': { type: 'deconstruction', title: '拆人物' },
    'deconstruct-structure-btn': { type: 'deconstruction', title: '拆结构' },
    'deconstruct-emotion-btn': { type: 'deconstruction', title: '拆情绪' },
    'deconstruct-plot-btn': { type: 'deconstruction', title: '拆情节' },
    'deconstruct-theme-btn': { type: 'deconstruction', title: '拆主题' },
    // 结构与仿写
    'clue-extraction-btn': { modalId: 'clue-extraction-modal', promptTitle: '线索伏笔提取器' },
    'loop-construction-btn': { modalId: 'loop-construction-modal', promptTitle: '循环构建助手' },
    'imitation-writer-btn': { modalId: 'imitation-writer-modal', promptTitle: '结构化仿写模板' },
    // 场景与转换
    'scene-character-btn': { modalId: 'scene-character-modal', promptTitle: '场景人物构建' },
    'novel-to-script-btn': { modalId: 'novel-to-script-modal', promptTitle: '小说转剧本助手' },
    'novel-to-anime-btn': { modalId: 'novel-to-anime-modal', promptTitle: '动漫分镜助手' },
    // 写作辅助
    'worldview-btn': { modalId: 'worldview-modal', promptTitle: '世界观设定助手' },
    'character-design-btn': { modalId: 'character-design-modal', promptTitle: '角色设计助手' },
    'plot-planner-btn': { modalId: 'plot-planner-modal', promptTitle: '情节规划助手' },
    'style-analyzer-btn': { modalId: 'style-analyzer-modal', promptTitle: '写作风格分析器' },
    'dialogue-enhancer-btn': { modalId: 'dialogue-enhancer-modal', promptTitle: '对白润色专家' },
    'pov-shifter-btn': { modalId: 'pov-shifter-modal', promptTitle: '第一/第三人称转换' },
    'emotion-mapper-btn': { modalId: 'emotion-mapper-modal', promptTitle: '情绪曲线分析' },
    'naming-helper-btn': { modalId: 'naming-helper-modal', promptTitle: '起名助手' },
    'review-simulator-btn': { modalId: 'review-simulator-modal', promptTitle: '模拟读者评论' },
    // 代码工具
    'code-refactor-btn': { modalId: 'code-refactor-modal', promptTitle: '代码重构建议' },
    'code-explainer-btn': { modalId: 'code-explainer-modal', promptTitle: '代码解释器' },
    'test-case-generator-btn': { modalId: 'test-case-generator-modal', promptTitle: '测试用例生成器' },
    'api-doc-generator-btn': { modalId: 'api-doc-generator-modal', promptTitle: 'API文档生成器' },
    'regex-helper-btn': { modalId: 'regex-helper-modal', promptTitle: '正则表达式助手' },
    'commit-message-generator-btn': { modalId: 'commit-message-generator-modal', promptTitle: 'Git提交信息生成器' },
    'sql-generator-btn': { modalId: 'sql-generator-modal', promptTitle: 'SQL查询生成器' },
    'frontend-component-generator-btn': { modalId: 'frontend-component-generator-modal', promptTitle: '前端组件生成器' },
    'ci-cd-generator-btn': { modalId: 'ci-cd-generator-modal', promptTitle: 'CI/CD配置生成器' },
};

/**
 * 初始化所有通用模态框的事件监听器。
 */
function initializeModalHandlers() {
    // 1. 为所有配置好的按钮添加打开模态框的事件
    for (const btnId in MODAL_CONFIG) {
        const btn = document.getElementById(btnId);
        const config = MODAL_CONFIG[btnId];
        if (!btn) continue;

        if (config.type === 'deconstruction') {
            btn.addEventListener('click', () => openDeconstructionModal(config.title));
        } else {
            const modal = document.getElementById(config.modalId);
            if (modal) {
                btn.addEventListener('click', () => modal.classList.add('visible'));
            }
        }
    }

    // 2. 为所有模态框内的通用提交按钮添加事件
    document.querySelectorAll('.action-btn.generic-modal-btn').forEach(submitBtn => {
        const modalId = submitBtn.dataset.modalId;
        const promptTitle = submitBtn.dataset.promptTitle;
        const modal = document.getElementById(modalId);
        
        if (modal && promptTitle) {
            submitBtn.addEventListener('click', () => {
                handleGenericModalSubmit(modalId, promptTitle);
                modal.classList.remove('visible');
            });
        }
    });

    // 3. "万物皆可拆" 模态框的特殊提交逻辑
    const deconstructionModal = document.getElementById('deconstruction-modal');
    if (deconstructionModal) {
        const confirmBtn = document.getElementById('confirm-deconstruction-btn');
        confirmBtn.addEventListener('click', () => {
            const title = deconstructionModal.querySelector('#deconstruction-title').textContent.trim();
            handleDeconstructionSubmit(title);
            deconstructionModal.classList.remove('visible');
        });
    }
    
    // 4. 为所有模态框添加通用的关闭逻辑 (点击遮罩或关闭按钮)
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', e => {
            if (e.target === modal || e.target.closest('.close-btn')) {
                modal.classList.remove('visible');
            }
        });
    });
    const cardLibraryBtn = document.getElementById('card-library-btn');
    if (cardLibraryBtn) {
        cardLibraryBtn.addEventListener('click', () => {
            const display = document.getElementById('card-library-display');
            if (display) {
                display.innerHTML = '<p>这里将来会展示所有已拆解和创建的卡牌。</p>';
            }
            //
        });
    }
}

/**
 * 处理通用模态框的提交事件。
 * @param {string} modalId - 模态框的ID。
 * @param {string} promptTitle - 对应的提示词标题。
 */
function handleGenericModalSubmit(modalId, promptTitle) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    const template = promptMap[promptTitle];
    if (!template) {
        showNotification(`错误：未在提示词库中找到 "${promptTitle}"`, 'error');
        return;
    }

    let finalPrompt = template;
    const inputs = modal.querySelectorAll('input, textarea, select');
    let allFieldsValid = true;

    inputs.forEach(input => {
        // 使用id作为替换的key
        const key = input.id;
        if (key) {
            const regex = new RegExp(`{${key}}`, 'g');
            finalPrompt = finalPrompt.replace(regex, input.value);
        }
        if (input.required && !input.value.trim()) {
            allFieldsValid = false;
        }
    });

    if (!allFieldsValid) {
        showNotification('请填写所有必填字段！', 'error');
        return;
    }

    document.getElementById('message-input').value = finalPrompt;
    handleSendMessage();
    showNotification(`“${promptTitle}”任务已启动...`, 'info');
}

/**
 * 打开通用的“拆解”模态框。
 * @param {string} title - 要显示的拆解类型标题。
 */
function openDeconstructionModal(title) {
    const modal = document.getElementById('deconstruction-modal');
    if (modal) {
        modal.querySelector('#deconstruction-title').innerHTML = `<i class="fas fa-search-plus"></i> ${title}`;
        modal.querySelector('#deconstruction-text').value = '';
        modal.querySelector('#deconstruction-custom-prompt').value = '';
        modal.classList.add('visible');
    }
}

/**
 * 处理“拆解”模态框的提交事件。
 * @param {string} title - 拆解类型标题。
 */
function handleDeconstructionSubmit(title) {
    const template = promptMap[title];
    if (!template) {
        showNotification(`错误：未在提示词库中找到 "${title}"`, 'error');
        return;
    }
    const text = document.getElementById('deconstruction-text').value;
    const customPrompt = document.getElementById('deconstruction-custom-prompt').value;

    if (!text.trim()) {
        showNotification('待分析文本不能为空！', 'error');
        return;
    }

    const finalPrompt = template
        .replace('{deconstruction-text}', text)
        .replace('{deconstruction-custom-prompt}', customPrompt || '无');
    
    document.getElementById('message-input').value = finalPrompt;
    handleSendMessage();
    showNotification(`“${title}”任务已启动...`, 'info');
}