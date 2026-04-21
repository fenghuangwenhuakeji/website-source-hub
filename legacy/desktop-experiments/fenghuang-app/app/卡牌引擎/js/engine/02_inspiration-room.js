/*
 * 文件路径: /js/engine/02_inspiration-room.js
 * 版本: V102 - 博士改造版 (已接入卡牌管理器)
 * 描述: 【灵感室】模块的核心逻辑。现已能将生成的卡牌自动归档至CardManager。
 */

const InspirationRoom = (() => {
    // --- 模块私有变量 ---
    let _inputArea, _generateBtn, _canvas;

    // --- 模块初始化函数 ---
    function init() {
        console.log("引擎模块 [灵感室] 开始唤醒...");

        // 缓存页面上的元素，提高性能
        _inputArea = document.getElementById('inspiration-input');
        _generateBtn = document.getElementById('inspiration-generate-btn');
        _canvas = document.getElementById('inspiration-canvas');

        // 绑定核心事件
        _generateBtn.addEventListener('click', _handleGenerate);

        console.log("引擎模块 [灵感室] 已成功唤醒，准备捕捉灵感。");
    }

    // --- 核心处理函数：处理生成请求 ---
    async function _handleGenerate() {
        const userInput = _inputArea.value.trim();
        if (!userInput || _generateBtn.disabled) { return; }

        _setButtonLoading(true, '正在连接奇点...');

        const structuredPrompt = `
            请将以下用户灵感解析为一个结构化的JSON对象。
            JSON对象必须包含以下三个字段:
            1. "title": 一个高度概括、酷炫的标题 (字符串)。
            2. "summary": 对灵感核心内容的简要描述 (字符串, 约50-100字)。
            3. "tags": 3到5个最相关的关键词 (字符串数组)。

            严格按照此JSON格式返回，不要添加任何额外的解释或文本。

            用户的灵感如下:
            ---
            ${userInput}
            ---
        `;

        try {
            const aiResponse = await APIInterface.sendMessage(structuredPrompt, 'balanced');
            const cardData = _parseAIResponse(aiResponse);
            
            if (cardData.error) {
                _createErrorCard(cardData.error);
            } else {
                _createInspirationCard(cardData);
            }

        } catch (error) {
            console.error("生成灵感卡时发生严重错误:", error);
            _createErrorCard(`[网络错误] 无法连接至AI服务，详情请见控制台。`);
        } finally {
            _setButtonLoading(false, '生成灵感卡');
            _inputArea.value = '';
        }
    }

    // --- 辅助函数：解析AI返回的数据 ---
    function _parseAIResponse(response) {
        if (!response || typeof response !== 'string') {
            return { error: "AI未返回有效数据。" };
        }
        if (response.error) {
            return { error: response.error };
        }

        try {
            const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
            const jsonString = jsonMatch ? jsonMatch[1] : response;
            const parsedData = JSON.parse(jsonString);

            if (!parsedData.title || !parsedData.summary || !Array.isArray(parsedData.tags)) {
                throw new Error("返回的JSON格式不完整。");
            }
            return parsedData;

        } catch (e) {
            console.error("解析AI响应失败:", e, "原始响应:", response);
            return { error: `无法解析AI的响应。请确保AI返回了正确的JSON格式。原始返回: ${response.slice(0, 100)}...` };
        }
    }

    // --- 辅助函数：创建灵感卡片 ---
    function _createInspirationCard(cardData) {
        // --- 博士新增：将成功生成的卡牌数据登记到管理器 ---
        CardManager.addCard('inspiration', cardData);

        const card = document.createElement('div');
        card.className = 'inspiration-card';

        let tagsHTML = cardData.tags.map(tag => `<span class="tag">#${tag}</span>`).join('');

        card.innerHTML = `
            <h3><i class="fa-solid fa-wand-magic-sparkles"></i> ${cardData.title}</h3>
            <p>${cardData.summary}</p>
            <div class="card-tags">${tagsHTML}</div>
        `;
        _canvas.prepend(card);
    }
    
    // --- 辅助函数：创建错误卡片 ---
    function _createErrorCard(errorMessage) {
        // --- 博士新增：将错误信息也作为一种特殊卡牌登记到管理器 ---
        CardManager.addCard('error', { errorMessage: errorMessage });

        const card = document.createElement('div');
        card.className = 'inspiration-card error-card'; 

        card.innerHTML = `
            <h3><i class="fa-solid fa-exclamation-triangle"></i> 生成失败</h3>
            <p style="color: #e74c3c;">${errorMessage}</p>
        `;
        _canvas.prepend(card);
    }

    // --- 辅助函数：控制按钮的加载状态 ---
    function _setButtonLoading(isLoading, message) {
        if (isLoading) {
            _generateBtn.disabled = true;
            _generateBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${message}`;
        } else {
            _generateBtn.disabled = false;
            _generateBtn.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles"></i> ${message}`;
        }
    }

    // --- 模块接口 ---
    return {
        init: init
    };
})();