/*
 * 文件路径: /js/engine/04_deconstruction-room.js
 * 版本: V104.1 - 博士升级版 (兼容V104角色卡)
 * 描述: 【拆解室】模块核心逻辑。AI指令已升级，能输出与角色模块完全兼容的结构化数据。
 */

const DeconstructionRoom = (() => {
    let _inputText, _genreSelect, _lengthSelect, _generateBtn;
    let _loader, _resultsContainer;

    function init() {
        console.log("引擎模块 [拆解室] 开始唤醒...");
        _inputText = document.getElementById('decon-input-text');
        _genreSelect = document.getElementById('decon-strategy-genre');
        _lengthSelect = document.getElementById('decon-strategy-length');
        _generateBtn = document.getElementById('decon-generate-btn');
        _loader = document.getElementById('decon-output-loader');
        _resultsContainer = document.getElementById('decon-output-results');
        _generateBtn.addEventListener('click', _handleDeconstruct);
        console.log("引擎模块 [拆解室] 已成功唤醒，准备进行叙事解析。");
    }

    async function _handleDeconstruct() {
        const text = _inputText.value.trim();
        const genre = _genreSelect.value;
        const length = _lengthSelect.value;
        if (!text || _generateBtn.disabled) return;
        _setLoading(true);
        _resultsContainer.innerHTML = '';
        const structuredPrompt = _buildAIPrompt(text, genre, length);
        try {
            const aiResponse = await APIInterface.sendMessage(structuredPrompt, 'logical');
            const parsedData = _parseAIResponse(aiResponse);
            if (parsedData.error) {
                _displayError(parsedData.error);
            } else {
                _renderResults(parsedData);
            }
        } catch (error) {
            console.error("拆解过程中发生严重错误:", error);
            _displayError(`[网络错误] 无法连接至AI服务，详情请见控制台。`);
        } finally {
            _setLoading(false);
        }
    }

    function _buildAIPrompt(text, genre, length) {
        return `
            你是一个专业的叙事分析引擎。你的任务是读取以下提供的文本，并根据指定的策略，将其严格地、无遗漏地拆解为结构化的JSON数据。

            **拆解策略:**
            - 题材侧重: ${genre}
            - 篇幅视角: ${length}

            **输出要求:**
            你必须返回一个单一的、格式正确的JSON对象，该对象包含四个键: "characters", "plots", "locations", "clues"。每个键对应一个数组。

            **JSON结构定义 (角色卡部分已升级，必须严格遵守):**
            - **characters**: 数组中的每个对象代表一个角色。每个角色对象必须包含一个名为 "timeline" 的键，其值是一个【只包含一个元素】的数组。这个数组内的对象代表角色的“初始设定”，且必须包含以下所有字段:
                - "stageName": (字符串) 固定填写为“初始设定”。
                - "name": (字符串) 角色名称。
                - "summary": (字符串) 对角色的一句话简介。
                - "tags": (字符串) 3-5个描述角色的关键词，用逗号分隔，例如 "主角, 侦探, 矛盾"。
                - "background": (字符串) 角色的背景故事。
                - "personality": (字符串) 角色的性格特点。
                - "abilities": (字符串) 角色的能力设定。
                - "flaws": (字符串) 角色的心理缺陷。
                - "arc": (字符串) 角色的成长弧光。
                - "motive": (字符串) AI代理的核心动机。
                - "values": (字符串) AI代理的核心价值观。
                - "action": (字符串) AI代理的行动逻辑。
                - "role": (字符串) 从[${ARCHETYPE_DETAILS.map(a => a.name).join(', ')}]中选择一个最合适的角色原型。
            - **plots**: 数组中的每个对象必须包含 "name", "description", "tags" (数组)。
            - **locations**: 数组中的每个对象必须包含 "name", "description", "tags" (数组)。
            - **clues**: 数组中的每个对象必须包含 "name", "description", "tags" (数组)。
            
            **重要规则:**
            1. 严格遵循上述JSON结构，特别是 "characters" 对象的timeline结构。
            2. 如果某个类别下没有提取到任何内容，请返回一个空数组[]。
            3. 你的唯一输出必须是纯粹的JSON。

            **待拆解的源文本:**
            ---
            ${text}
            ---
        `;
    }

    function _parseAIResponse(response) {
        if (response.error) { return { error: response.error }; }
        try {
            const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
            const jsonString = jsonMatch ? jsonMatch[1] : response;
            const parsed = JSON.parse(jsonString);
            if (!parsed.characters || !parsed.plots || !parsed.locations || !parsed.clues) {
                 throw new Error("返回的JSON缺少顶级键。");
            }
            return parsed;
        } catch (e) {
            console.error("解析AI响应失败:", e, "原始响应:", response);
            return { error: `无法解析AI的响应。详情见控制台。` };
        }
    }

    function _renderResults(data) {
        const cardTypeMap = {
            plots: { name: '情节卡', icon: 'fa-scroll' },
            locations: { name: '地点卡', icon: 'fa-map-marker-alt' },
            clues: { name: '线索卡', icon: 'fa-key' }
        };
        
        if (data.characters && data.characters.length > 0) {
            data.characters.forEach(charData => {
                const initialStage = charData.timeline[0] || {};
                const cardElement = _createCardElement(initialStage, { name: '角色卡', icon: 'fa-user' });
                _resultsContainer.appendChild(cardElement);
                CardManager.addCard('character', charData);
            });
        }

        for (const key in cardTypeMap) {
            if (data[key] && data[key].length > 0) {
                data[key].forEach(itemData => {
                    const cardElement = _createCardElement(itemData, cardTypeMap[key]);
                    _resultsContainer.appendChild(cardElement);
                    CardManager.addCard(key.slice(0, -1), itemData);
                });
            }
        }
    }
    
    function _createCardElement(itemData, typeInfo) {
        const card = document.createElement('div');
        card.className = 'card';
        card.setAttribute('data-card-type', typeInfo.name);
        let tagsHTML = '';
        const tags = itemData.tags || [];
        if (Array.isArray(tags)) {
            tagsHTML = tags.map(tag => `<span class="tag">#${tag}</span>`).join('');
        } else if (typeof tags === 'string') {
            tagsHTML = tags.split(',').map(tag => `<span class="tag">#${tag.trim()}</span>`).join('');
        }
        const description = itemData.description || itemData.summary || '暂无描述';
        card.innerHTML = `
            <h3><i class="fa-solid ${typeInfo.icon}"></i> ${itemData.name}</h3>
            <p>${description}</p>
            <div class="card-tags">${tagsHTML}</div>
        `;
        return card;
    }

    function _displayError(message) {
        _resultsContainer.innerHTML = `<div class="card error-card" data-card-type="错误报告"><h3><i class="fa-solid fa-exclamation-triangle"></i> 拆解失败</h3><p>${message}</p></div>`;
    }

    function _setLoading(isLoading) {
        if (isLoading) {
            _generateBtn.disabled = true;
            _generateBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> 正在拆解...`;
            _loader.classList.remove('hidden');
        } else {
            _generateBtn.disabled = false;
            _generateBtn.innerHTML = `<i class="fa-solid fa-atom"></i> 开始拆解`;
            _loader.classList.add('hidden');
        }
    }

    return { init };
})();