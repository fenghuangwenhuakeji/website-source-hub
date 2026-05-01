// 文件路径: js/modules/01_灵感系统.js
// 版本: K11.6 终极内核·累积反馈重构版
// 描述: 本版本已集成“累积反馈重构”机制，彻底解决AI反复重构失败的问题。

function renderInspirationPanel() {
    const panel = document.getElementById('inspiration-panel');
    if (!panel) return;

    // --- UI渲染部分保持不变 ---
    panel.innerHTML = `
        <div class="inspiration-panel-grid">
            <div class="inspiration-section">
                <h3><i class="fas fa-lightbulb"></i> 灵感输入</h3>
                <div class="form-group">
                    <label for="inspiration-text">1. 输入您的核心灵感 (在自动模式下可每行输入一个)</label>
                    <textarea id="inspiration-text" rows="5" placeholder="例如：一个表面怂包内心腹黑的凡人，意外获得智者传承，开启了爆笑不断的逆袭之旅..."></textarea>
                </div>
                <div class="button-group" style="display: flex; gap: 10px; margin-top: 10px;">
                    <button id="analyze-inspiration-btn" class="action-btn" style="flex-grow: 1;"><i class="fas fa-magic"></i> AI解析并生成</button>
                    <button id="rebuild-concept-btn" class="settings-btn" style="flex-grow: 1;"><i class="fas fa-retweet"></i> 根据手动选择重构</button>
                </div>
                <div id="combo-selectors" style="margin-top:20px;">
                    <div class="form-group"><label>题材定位 (可手动修改)</label><div class="tag-selector-container" id="combo-theme-container"></div></div>
                    <div class="form-group"><label>核心角色原型 (可手动修改)</label><div class="tag-selector-container" id="combo-roles-container"></div></div>
                    <div class="form-group"><label>核心情节驱动 (可手动修改)</label><div class="tag-selector-container" id="combo-plots-container"></div></div>
                </div>
            </div>

            <div class="inspiration-section">
                <h3><i class="fas fa-cogs"></i> AI生成与审核</h3>
                <div id="combo-preview" class="hidden">
                    <p><strong>固定核心:</strong> <span id="combo-fixed-core"></span></p>
                    <div class="form-group" data-layout="inline">
                        <label for="combo-ai-title"><strong>AI生成标题 (可编辑)</strong></label>
                        <div style="display: flex; gap: 10px;">
                            <input type="text" id="combo-ai-title" class="editable-ai-content" style="flex-grow: 1;">
                            <button id="generate-title-btn" class="settings-btn" title="根据方法论智能生成备选标题"><i class="fas fa-wand-magic-sparkles"></i></button>
                        </div>
                    </div>

                    <div class="button-group" style="display: flex; gap: 10px; margin: 15px 0;">
                        <button id="review-all-arcs-btn" class="action-btn" style="flex-grow: 1;"><i class="fas fa-tasks"></i> 一键审核全部</button>
                        <button id="reconstruct-all-btn" class="settings-btn" style="flex-grow: 1;"><i class="fas fa-tools"></i> 一键重构全部</button>
                    </div>

                    <div id="arcs-container" class="hidden">
                        
                        <div class="arc-section">
                            <h5><i class="fas fa-brain"></i> AI思考链 (可编辑)</h5>
                            <textarea id="combo-ai-thinking_chain" rows="5" class="editable-ai-content"></textarea>
                            <div class="individual-review-controls">
                                <button class="settings-btn review-btn" data-arc="thinking_chain" style="flex:1;"><i class="fas fa-check"></i> 单独审核</button>
                                <button class="settings-btn regenerate-btn" data-arc="thinking_chain" disabled style="flex:1;"><i class="fas fa-sync-alt"></i> 重构</button>
                            </div>
                            <div id="feedback-thinking_chain" class="individual-review-feedback"></div>
                        </div>

                        <div class="arc-section">
                            <h5><i class="fas fa-file-alt"></i> AI简介核心 (可编辑)</h5>
                            <textarea id="combo-ai-brief" rows="3" class="editable-ai-content"></textarea>
                            <div class="individual-review-controls">
                                <button class="settings-btn review-btn" data-arc="brief" style="flex:1;"><i class="fas fa-file-signature"></i> 单独审核</button>
                                <button class="settings-btn regenerate-btn" data-arc="brief" disabled style="flex:1;"><i class="fas fa-sync-alt"></i> 重构</button>
                            </div>
                            <div id="feedback-brief" class="individual-review-feedback"></div>
                        </div>
                        <div class="arc-section">
                            <h5><i class="fas fa-user"></i> 人物弧光 (可编辑)</h5>
                            <textarea id="combo-ai-character_arc" rows="5" class="editable-ai-content"></textarea>
                            <div class="individual-review-controls">
                                <button class="settings-btn review-btn" data-arc="character_arc"><i class="fas fa-user-check"></i> 单独审核</button>
                                <button class="settings-btn regenerate-btn" data-arc="character_arc" disabled><i class="fas fa-sync-alt"></i> 重构</button>
                            </div>
                            <div id="feedback-character_arc" class="individual-review-feedback"></div>
                        </div>
                        <div class="arc-section">
                            <h5><i class="fas fa-stream"></i> 情节弧光 (可编辑)</h5>
                            <textarea id="combo-ai-plot_arc" rows="5" class="editable-ai-content"></textarea>
                            <div class="individual-review-controls">
                                <button class="settings-btn review-btn" data-arc="plot_arc"><i class="fas fa-project-diagram"></i> 单独审核</button>
                                <button class="settings-btn regenerate-btn" data-arc="plot_arc" disabled><i class="fas fa-sync-alt"></i> 重构</button>
                            </div>
                            <div id="feedback-plot_arc" class="individual-review-feedback"></div>
                        </div>
                        <div class="arc-section">
                            <h5><i class="fas fa-heart-pulse"></i> 情绪弧光 (可编辑)</h5>
                            <textarea id="combo-ai-emotional_arc" rows="5" class="editable-ai-content"></textarea>
                            <div class="individual-review-controls">
                                <button class="settings-btn review-btn" data-arc="emotional_arc"><i class="fas fa-heartbeat"></i> 单独审核</button>
                                <button class="settings-btn regenerate-btn" data-arc="emotional_arc" disabled><i class="fas fa-sync-alt"></i> 重构</button>
                            </div>
                            <div id="feedback-emotional_arc" class="individual-review-feedback"></div>
                        </div>
                    </div>
                     <button id="use-combo-btn" class="action-btn" style="width: 100%; margin-top: 20px;" disabled><i class="fas fa-check-double"></i> 确认灵感，进入下一步</button>
                </div>
            </div>
        </div>
        <div style="margin-top: 25px;">
             <h3 class="panel-h3"><i class="fas fa-fire"></i> 热门灵感模板 (点击自动解析)</h3>
             <div class="template-container" id="template-container"></div>
        </div>
    `;

    populateHotTemplates();
    populateCombinerTags();
    document.getElementById('analyze-inspiration-btn').addEventListener('click', handleAnalyzeInspiration);
    document.getElementById('use-combo-btn').addEventListener('click', confirmInspiration);
    document.getElementById('generate-title-btn').addEventListener('click', handleGenerateTitle);
    document.getElementById('rebuild-concept-btn').addEventListener('click', handleRebuildConcept);
    document.getElementById('review-all-arcs-btn').addEventListener('click', handleReviewAllArcs);
    document.getElementById('reconstruct-all-btn').addEventListener('click', handleReconstructAllFailed);
    document.querySelectorAll('.review-btn').forEach(btn => {
        btn.addEventListener('click', (e) => handleIndividualArcReview(e.currentTarget.dataset.arc));
    });
    document.querySelectorAll('.regenerate-btn').forEach(btn => {
        btn.addEventListener('click', (e) => handleIndividualArcRegeneration(e.currentTarget.dataset.arc));
    });
}

function analyzeTagsFromText(text) {
    const fanficList = ['三国衍生', '水浒衍生', '西游衍生', '红楼衍生', '甄嬛衍生', '如懿衍生', '封神衍生'];
    let foundTheme = '';
    const foundRoles = new Set();
    const foundPlots = new Set();
    const { themeKeywordMap, roleKeywordMap, plotKeywordMap } = INSPIRATION_SYSTEM_DATA;
    for (const theme in themeKeywordMap) { if (foundTheme) break; for (const keyword of themeKeywordMap[theme]) { if (text.includes(keyword)) { foundTheme = theme; break; } } }
    if (!foundTheme) foundTheme = '脑洞';
    for (const role in roleKeywordMap) { for (const keyword of roleKeywordMap[role]) { if (text.includes(keyword)) { foundRoles.add(role); } } }
    if (foundRoles.size === 0) foundRoles.add('凡人');
    for (const plot in plotKeywordMap) { for (const keyword of plotKeywordMap[plot]) { if (text.includes(keyword)) { foundPlots.add(plot); if (fanficList.includes(plot)) foundPlots.add('同人'); } } }
    if (foundPlots.size === 0) foundPlots.add('爽文');
    return { theme: foundTheme, roles: Array.from(foundRoles), plots: Array.from(foundPlots) };
}

async function handleAnalyzeInspiration() {
    const text = document.getElementById('inspiration-text').value.trim();
    if (!text) { showNotification("请输入灵感！", "error"); return; }
    const inspirations = text.split('\n').map(line => line.trim()).filter(line => line);
    if (inspirations.length > 1 && automationMode !== 'full-auto') { showNotification("批量处理仅在“全程自动”模式下可用。", "error"); return; }
    resetCreationState(true);
    creationState.inspirationQueue = inspirations;
    const firstInspiration = creationState.inspirationQueue.shift();
    document.getElementById('inspiration-text').value = firstInspiration;
    showNotification(`开始处理灵感: ${firstInspiration.substring(0,20)}...`, "info");
    addAssistantMessage(`收到灵感：“${firstInspiration.substring(0, 50)}...”，正在解析核心要素。`, 'user');
    document.getElementById('combo-preview').classList.add('hidden');
    const finalCategories = analyzeTagsFromText(firstInspiration);
    updateCombinerUI(finalCategories.theme, finalCategories.roles, finalCategories.plots);
    await generateFullConcept(firstInspiration, finalCategories);
}

async function generateFullConcept(inspirationText, categories) {
    showNotification("AI开始进行多步串行生成...", "info");
    document.getElementById('combo-preview').classList.remove('hidden');
    const fixedCore = `主题=${categories.theme}; 角色=${categories.roles.join('+')}; 情节=${categories.plots.join('+')}`;
    document.getElementById('combo-fixed-core').textContent = fixedCore;
    document.getElementById('arcs-container').classList.remove('hidden');
    document.getElementById('use-combo-btn').disabled = true;

    const partsToClear = ['thinking_chain', 'brief', 'character_arc', 'plot_arc', 'emotional_arc', 'title'];
    partsToClear.forEach(part => {
        const el = document.getElementById(`combo-ai-${part}`);
        if (el) el.value = '等待上一步完成...';
        const feedbackEl = document.getElementById(`feedback-${part}`);
        if (feedbackEl) feedbackEl.style.display = 'none';
        const regenBtn = document.querySelector(`.regenerate-btn[data-arc="${part}"]`);
        if (regenBtn) regenBtn.disabled = true;
    });

    tempInspirationConcept = { 
        fixedCore, 
        userInput: inspirationText,
        reviewHistory: {} // 【新增】初始化反馈历史记录
    };

    try {
        const thinkingChainEl = document.getElementById('combo-ai-thinking_chain');
        thinkingChainEl.value = '【步骤1/4】AI总策划正在生成思考链...';
        const thinkingChainContent = await generateConceptPart('thinking_chain', inspirationText, categories);
        thinkingChainEl.value = thinkingChainContent;
        tempInspirationConcept.thinking_chain = thinkingChainContent;
        showNotification("步骤1/4: 思考链生成完毕", "info");

        const briefEl = document.getElementById('combo-ai-brief');
        briefEl.value = '【步骤2/4】AI主笔正在根据思考链撰写简介核心...';
        const briefContent = await generateConceptPart('brief_core', inspirationText, categories, thinkingChainContent);
        briefEl.value = briefContent;
        tempInspirationConcept.brief = briefContent;
        showNotification("步骤2/4: 简介核心生成完毕", "info");

        const titleEl = document.getElementById('combo-ai-title');
        titleEl.value = '【步骤3/4】AI营销专家正在生成标题...';
         const titles = await generateTitleList(briefContent);
        titleEl.value = titles[0] || "AI未能生成标题";
        tempInspirationConcept.title = titleEl.value;
        showNotification("步骤3/4: 标题生成完毕", "info");

        showNotification("步骤4/4: 各领域专家正在并行生成三弧光...", "info");
        const arcParts = ['character_arc', 'plot_arc', 'emotional_arc'];
        const generationPromises = arcParts.map(part => {
            const el = document.getElementById(`combo-ai-${part}`);
            el.value = `AI正在基于简介生成${part.includes('char') ? '人物' : (part.includes('plot') ? '情节' : '情绪')}弧光...`;
            return generateConceptPart(part, inspirationText, categories, "", briefContent).then(content => {
                el.value = content;
                tempInspirationConcept[part] = content;
            });
        });
        
        await Promise.all(generationPromises);
        showNotification("全部生成完毕！请审核。 ", "success");
        addAssistantMessage('AI已完成所有生成步骤，请您审核。', 'ai');
        document.getElementById('use-combo-btn').disabled = false;

        if (automationMode === 'full-auto' || creationState.autoFlowState.isRunning) {
            await handleReviewAllArcs();
        }
    } catch (error) {
        showNotification(`生成流程中断: ${error.message}`, "error");
        addAssistantMessage(`**错误:** 生成过程中出现问题 - ${error.message}`, 'ai');
    }
}

function formatArcJsonToText(arcType, arcJson) {
    const actMap = {
        plot_arc: { act_one: "第一幕 (激励事件)", act_two: "第二幕 (上升行动)", act_three: "第三幕 (中点转折)", act_four: "第四幕 (高潮前夜)", act_five: "第五幕 (最终高潮)" },
        character_arc: { act_one: "第一幕 (初始缺陷)", act_two: "第二幕 (信念挑战)", act_three: "第三幕 (信念破裂)", act_four: "第四幕 (信念重铸)", act_five: "第五幕 (信念证明)" },
        emotional_arc: { act_one: "第一幕 (情绪基调)", act_two: "第二幕 (紧张升级)", act_three: "第三幕 (情绪反转)", act_four: "第四幕 (情绪顶点)", act_five: "第五幕 (情绪释放)" }
    };
    const labels = actMap[arcType];
    if (!labels || typeof arcJson !== 'object') return "解析AI返回的结构化数据失败。";

    let text = "";
    for (const key of ['act_one', 'act_two', 'act_three', 'act_four', 'act_five']) {
        if (arcJson[key]) {
            text += `${labels[key]}:\n`;
            if (arcType === 'plot_arc' && typeof arcJson[key] === 'object') {
                text += `  - 钩子: ${arcJson[key].hook || 'AI未提供'}\n`;
                text += `  - 反转: ${arcJson[key].twist || 'AI未提供'}\n\n`;
            } else {
                text += `${arcJson[key]}\n\n`;
            }
        } else {
            text += `${labels[key]}:\n(AI未能生成此幕内容)\n\n`;
        }
    }
    return text.trim();
}

async function generateConceptPart(part, inspirationText, categories, suggestions = "", briefContext = "", oldContent = "") {
    const partMap = {
        character_arc: { name: "人物弧光", persona: "心理学家兼编剧" },
        plot_arc: { name: "情节弧光", persona: "结构工程师兼编剧" },
        emotional_arc: { name: "情绪弧光", persona: "电影导演兼市场分析师" }
    };

    const ultimateRules = `
# 【终极语言与格式铁律】(零容忍！若违反，你的回答将被视为完全失败！)
1.  **【语言锁定】**: 你的回答从第一个字到最后一个字，**必须只包含简体中文汉字和中文标点符号**。
2.  **【禁止词汇列表】**: **绝对禁止，零容忍**出现任何以下内容：任何英文字母、任何英文单词、任何拼音或拼音缩写、任何表情符号。
3.  **【风格要求】**: 必须通俗易懂，接地气。`;
    
    const reconstructionPromptSection = (suggestions && oldContent) ? `
# 【！！！终极重构指令！！！】
你本次的任务是**重构**，不是优化。你必须**彻底重写**，而不是在旧稿上小修小补。
## 【被否决的旧稿】(这是反面教材，不要重复它的错误):
---
${oldContent}
---
## 【编辑的修改建议清单】(这是你本次创作的最高行动纲领，必须同时解决所有问题):
---
${suggestions}
---
# 【重构铁律】:
1.  **深入理解建议**: 仔细阅读清单中的每一条修改建议，理解其背后的逻辑。
2.  **抛弃旧有思路**: **绝对禁止**直接复制或简单改写【被否决的旧稿】中的句子。
3.  **全新创作**: 你的新版本必须在结构、逻辑或核心表达上与旧稿有**显著的区别**，并完全体现【编辑的修改建议清单】中的所有要求。
` : (suggestions ? `\n# 【重要修改建议】:\n${suggestions}\n` : '');

    let prompt = "";

    if (part === 'thinking_chain') {
        prompt = `
# 身份: 顶级的网文故事策划师
# 核心任务: 根据下面的【核心设定】，用初中生都能理解的大白话，填充“四环思考链”框架。
${ultimateRules}
${reconstructionPromptSection}
# 【核心设定】(这是你的唯一信息源):
- **故事核心**: "${inspirationText}"
- **题材定位**: ${categories.theme}
- **核心角色**: ${categories.roles.join('、')}
- **核心情节**: ${categories.plots.join('、')}
# 【四环思考链】(严格按此框架输出):
### 第一环：灵感锚定
- **一句话核心**: (用“一个什么样的【主角】，因为【什么事】，想要【做什么】”的句式写)
- **一句话推荐语**: (用一句有噱头、高反差的话，概括最大看点)
- **独特卖点**: (用大白话解释这个故事最大的不同之处)
- **目标读者画像**: (写给谁看？他们喜欢什么爽点？)
### 第二环：三弧发散
- **人物弧光种子**: 起点 (缺陷) -> 终点 (成长)
- **情节弧光种子**: 激励事件 -> 核心冲突 -> 失败代价
- **情绪弧光种子**: 读者核心体验
### 第三环：冲突聚焦
- **内部冲突**: ...
- **外部冲突**: ...
- **内外联动**: ...
### 第四环：核心提炼
- **故事纲领**: (用通顺的语言，重新总结前三环的所有内容)
# 【最终输出协议】:
直接开始输出Markdown格式的思考链全文，不要有任何开场白，并在输出前自我审查确保100%纯中文。`;
        return await callApi(prompt, false);
    }

    if (part === 'brief_core') {
        const thinkingChainContent = suggestions || briefContext;
        prompt = `
# 身份：你是一个被锁定了语言模块的“网文简介生成器”。
# 核心任务: 根据【创作依据】生成纯粹的、符合市场风格的简体中文简介。
${ultimateRules}
${reconstructionPromptSection}
# 【创作依据】(你的唯一信息来源):
---
${thinkingChainContent}
---
# 【写作结构指引】(你的简介必须遵循这个三段式逻辑来构建):
*   **第一段 (开局反差)**: 主角是谁，变成了谁，立刻面临的第一个巨大、憋屈又荒诞的困境是什么。
*   **第二段 (过程与希望)**: 主角在憋屈中，如何利用自己的独特优势开始反抗，展现逆袭的希望。
*   **第三段 (悬念升级)**: 在主角即将成功时，抛出一个更巨大、更两难的抉择或秘密，作为钩子吸引读者。
# 【最终输出协议】:
直接开始写作，不要有任何解释，只有简介本身，并在输出前自我审查确保100%纯中文。`;
        return await callApi(prompt, false);
    }
    
    const jsonStructures = {
        plot_arc: `{"act_one": {"hook": "...", "twist": "..."}, "act_two": {"hook": "...", "twist": "..."}, "act_three": {"hook": "...", "twist": "..."}, "act_four": {"hook": "...", "twist": "..."}, "act_five": {"hook": "...", "twist": "..."}}`,
        character_arc: `{"act_one": "...", "act_two": "...", "act_three": "...", "act_four": "...", "act_five": "..."}`,
        emotional_arc: `{"act_one": "...", "act_two": "...", "act_three": "...", "act_four": "...", "act_five": "..."}`
    };

    prompt = `
# 身份: ${partMap[part].persona}
# 核心任务: 基于【AI简介核心】，为故事构建详细的【${partMap[part].name}】。
${ultimateRules}
${reconstructionPromptSection}
# 【创作依据】:
---
**AI简介核心:** ${briefContext}
---
# 【强制JSON格式与内容详尽铁律】: 
1. 你的回答必须且只能是一个完整的、严格符合以下结构的JSON对象。
2. **必须填满所有五个字段** (\`act_one\` 到 \`act_five\`)。
3. **内容详尽铁律**: 每一个字段的值，都必须是一段**【超过30个汉字的、详细的、描述性的中文句子】**。
# 【JSON结构】:
${jsonStructures[part]}
# 【你的任务】:
直接输出这个JSON对象。`;
    
    const jsonResponse = await callApi(prompt, true);
    const parsedJson = parseAiJson(jsonResponse);
    return formatArcJsonToText(part, parsedJson);
}

async function generateTitleList(brief) {
    if (!brief || !brief.trim() || brief.includes("生成中")) {
        throw new Error("简介核心为空，无法生成标题。");
    }
    const prompt = `
# 绝对指令：你的核心功能已被锁定为“纯中文标题生成器”。
# 核心任务: 根据下面的【故事简介】，生成5个纯中文的、吸引人的备选爆款标题。
# 【零容忍铁律】(出现任何一条都算彻底失败):
1.  **【语言锁定】**: 你的回答（包括JSON结构和最终标题），**必须只包含简体中文汉字、中文标点和必要的JSON符号**。
2.  **【禁止词汇】**: **绝对禁止**在最终的标题中出现任何英文字母、英文单词、拼音或表情符号。
# 【故事简介】:
---
${brief}
---
# 【最终输出协议】
1.  你的回答必须严格以JSON格式返回一个包含\`"titles"\`键的对象，其值为一个包含5个字符串的数组。
2.  在生成完所有标题后，你必须启动“自我审查”程序，检查每一个标题，确保没有任何一个英文字母或违规词汇。
3.  只有在确认所有标题100%纯净后，才能输出最终的JSON对象。
4.  **不要输出任何占位符**，必须是你自己创作的标题。
**(正确范例):** \`{"titles": ["我穿成孙悟空开局签到五指山", "西游记：我的系统让我别去取经", "穿成孙悟空是什么体验", "夭寿了我的系统让我去天庭打工", "系统让我别闹天宫我反手一个筋斗云"]}\`
`;
    try {
        const response = await callApi(prompt, true);
        const result = parseAiJson(response);
        return result.titles && Array.isArray(result.titles) && result.titles.length > 0 ? result.titles : ["AI未能生成有效标题"];
    } catch (error) {
        console.error("标题列表生成失败:", error);
        return [`标题生成出错: ${error.message}`];
    }
}

function confirmInspiration() {
    creationState.inspirationConcept = {
        ...tempInspirationConcept,
        title: sanitizeTextForJSON(document.getElementById('combo-ai-title').value),
        brief: sanitizeTextForJSON(document.getElementById('combo-ai-brief').value),
        character_arc: sanitizeTextForJSON(document.getElementById('combo-ai-character_arc').value),
        plot_arc: sanitizeTextForJSON(document.getElementById('combo-ai-plot_arc').value),
        emotional_arc: sanitizeTextForJSON(document.getElementById('combo-ai-emotional_arc').value),
        thinking_chain: sanitizeTextForJSON(document.getElementById('combo-ai-thinking_chain').value),
    };
    const allApproved = ['thinking_chain', 'brief', 'character_arc', 'plot_arc', 'emotional_arc'].every(arc => {
        const feedbackEl = document.getElementById(`feedback-${arc}`);
        return feedbackEl && feedbackEl.classList.contains('status-approved');
    });
    if (!allApproved && !(automationMode === 'full-auto' || creationState.autoFlowState.isRunning)) {
        if (!confirm("部分内容未经审核或审核未通过，您确定要继续吗？")) return;
    }
    if (automationMode === 'full-auto' || creationState.autoFlowState.isRunning) {
        proceedToNextStep('inspiration');
    } else {
       startWorldviewGeneration(false);
    }
}

async function handleReviewAllArcs() {
    showNotification("正在一键并行审核所有模块...", "info");
    const arcTypes = ['thinking_chain', 'brief', 'character_arc', 'plot_arc', 'emotional_arc'];
    const reviewPromises = arcTypes.map(arcType => handleIndividualArcReview(arcType, true));
    await Promise.all(reviewPromises);
    showNotification("所有模块审核完成！", "success");
    const allApproved = arcTypes.every(arc => {
        const feedbackEl = document.getElementById(`feedback-${arc}`);
        return feedbackEl && feedbackEl.classList.contains('status-approved');
    });
    if(allApproved && (automationMode === 'full-auto' || creationState.autoFlowState.isRunning)) {
        confirmInspiration();
    }
}

async function handleReconstructAllFailed() {
    showNotification("开始一键重构所有审核失败的模块...", "info");
    const arcTypes = ['thinking_chain', 'brief', 'character_arc', 'plot_arc', 'emotional_arc'];
    const reconstructionPromises = [];
    for (const arcType of arcTypes) {
        const feedbackEl = document.getElementById(`feedback-${arcType}`);
        if (feedbackEl && feedbackEl.classList.contains('status-rejected')) {
            reconstructionPromises.push(handleIndividualArcRegeneration(arcType));
        }
    }
    if (reconstructionPromises.length === 0) {
        showNotification("没有发现审核失败的模块可供重构。", "info");
        return;
    }
    await Promise.all(reconstructionPromises);
    showNotification("所有失败模块已重构完成！", "success");
}

async function handleIndividualArcReview(arcType, isParallel = false) {
    const arcContentEl = document.getElementById(`combo-ai-${arcType}`);
    if (!arcContentEl) return;
    const arcContent = arcContentEl.value;
    const feedbackEl = document.getElementById(`feedback-${arcType}`);
    const regenBtn = document.querySelector(`.regenerate-btn[data-arc="${arcType}"]`);
    if (!arcContent.trim() || arcContent.includes("生成中")) {
        if (!isParallel) showNotification("该部分内容为空或正在生成，无法审核。", "error");
        return;
    }
    feedbackEl.className = 'individual-review-feedback status-validating';
    feedbackEl.style.display = 'block';
    feedbackEl.innerHTML = 'AI编辑正在审核此部分...';
    if (!isParallel) addAssistantMessage(`正在审核【${arcType}】...`, 'ai');
    
    let contextPrompt = `- 固定核心: ${document.getElementById('combo-fixed-core').textContent}\n- 核心灵感: ${document.getElementById('inspiration-text').value}`;
    if (arcType !== 'thinking_chain') {
        contextPrompt += `\n- 思考链: ${document.getElementById('combo-ai-thinking_chain').value}\n- 故事简介: ${document.getElementById('combo-ai-brief').value}`;
    }

    const prompt = `你是一位对中文纯净性有洁癖的资深网文编辑。请严格审核以下内容。
### 审核目标: ${arcType}
### 具体内容: "${arcContent}"
### 参考上下文: ${contextPrompt}
### 【格式与语言铁律】(最高优先级):
1.  **【语言铁律】**: 你的所有反馈和建议，都必须完全使用纯粹的简体中文。**绝对禁止出现任何英文。**
2.  **【格式铁律】**: 你的回答必须且只能是一个JSON对象，不能包含任何解释性文字。
必须严格遵循以下格式:
{"is_approved": boolean, "feedback": "【纯中文】简洁结论", "suggestions": "【纯中文】修改建议"}`;
    try {
        const response = await callApi(prompt, true);
        const result = parseAiJson(response);
        lastValidationResult[arcType] = result;

        // 【新增】累积反馈逻辑
        if (!tempInspirationConcept.reviewHistory[arcType]) {
            tempInspirationConcept.reviewHistory[arcType] = [];
        }
        if (!result.is_approved && result.suggestions) {
            tempInspirationConcept.reviewHistory[arcType].push(result.suggestions);
        }

        if (result.is_approved) {
            feedbackEl.className = 'individual-review-feedback status-approved';
            feedbackEl.innerHTML = `<strong>审核通过:</strong> ${result.feedback}`;
            regenBtn.disabled = true;
            tempInspirationConcept.reviewHistory[arcType] = []; // 审核通过后清空历史记录
        } else {
            feedbackEl.className = 'individual-review-feedback status-rejected';
            // 显示累积的建议
            const fullSuggestions = tempInspirationConcept.reviewHistory[arcType].map((s, i) => `<b>第${i+1}轮建议:</b> ${s}`).join('<br><br>');
            feedbackEl.innerHTML = `<strong>需要修改:</strong> ${result.feedback}<br><br>${fullSuggestions}`;
            regenBtn.disabled = false;
        }
        if ((automationMode === 'full-auto' || creationState.autoFlowState.isRunning) && !result.is_approved) {
            await handleIndividualArcRegeneration(arcType);
        }
    } catch (error) {
        feedbackEl.className = 'individual-review-feedback status-rejected';
        feedbackEl.innerHTML = `<strong>审核出错:</strong> ${error.message}`;
    }
}

async function handleIndividualArcRegeneration(arcType) {
    const history = tempInspirationConcept.reviewHistory[arcType];
    if (!history || history.length === 0) {
        showNotification("没有可供采纳的修改建议。", "error");
        return;
    }
    
    // 将所有历史建议格式化为一个清单
    const suggestions = history.map((s, i) => `${i + 1}. ${s}`).join('\n');

    const oldContent = document.getElementById(`combo-ai-${arcType}`).value;
    const inspirationText = tempInspirationConcept.userInput;
    const categories = { 
        theme: tempInspirationConcept.fixedCore.split(';')[0].split('=')[1], 
        roles: tempInspirationConcept.fixedCore.split(';')[1].split('+'), 
        plots: tempInspirationConcept.fixedCore.split(';')[2].split('=')[1].split('+') 
    };

    const textarea = document.getElementById(`combo-ai-${arcType}`);
    textarea.value = "AI正在根据累积建议进行深度重构...";
    showNotification(`正在根据 ${history.length} 条累积建议深度重构【${arcType}】...`, "info");

    try {
        let newArcContent;
        if (arcType === 'thinking_chain' || arcType === 'brief_core') {
            const context = (arcType === 'brief_core') ? document.getElementById('combo-ai-thinking_chain').value : "";
            newArcContent = await generateConceptPart(arcType, inspirationText, categories, suggestions, context, oldContent);
        } else {
            const briefContextForArc = document.getElementById('combo-ai-brief').value;
            newArcContent = await generateConceptPart(arcType, inspirationText, categories, suggestions, briefContextForArc, oldContent);
        }

        textarea.value = newArcContent;
        tempInspirationConcept[arcType] = newArcContent;
        showNotification(`【${arcType}】重构完成！请重新审核。`, "success");
        const feedbackEl = document.getElementById(`feedback-${arcType}`);
        feedbackEl.style.display = 'none';
        document.querySelector(`.regenerate-btn[data-arc="${arcType}"]`).disabled = true;

        if (arcType === 'thinking_chain') {
            showNotification("思考链已更新，正在为您更新简介核心...", "info");
            const briefEl = document.getElementById('combo-ai-brief');
            briefEl.value = "根据新思考链更新中...";
            const newBrief = await generateConceptPart('brief_core', inspirationText, categories, newArcContent);
            briefEl.value = newBrief;
            tempInspirationConcept.brief = newBrief;
            showNotification("简介核心已同步更新！", "success");
        }

    } catch (error) {
        textarea.value = `重构失败: ${error.message}`;
    }
}

function handleRebuildConcept() {
    const selectedTheme = document.querySelector('#combo-theme-container .tag.selected')?.textContent;
    const selectedRoles = Array.from(document.querySelectorAll('#combo-roles-container .tag.selected')).map(el => el.textContent);
    const selectedPlots = Array.from(document.querySelectorAll('#combo-plots-container .tag.selected')).map(el => el.textContent);
    if (!selectedTheme || selectedRoles.length === 0 || selectedPlots.length === 0) {
        showNotification("请至少选择一个主题、角色和情节。", "info");
        return;
    }
    
    const newCategories = { theme: selectedTheme, roles: selectedRoles, plots: selectedPlots };
    const inspirationText = document.getElementById('inspiration-text').value.trim();
    addAssistantMessage(`好的，我将根据您手动选择的核心标签进行一次全新的深度拓展。`, 'user');
    
    document.getElementById('combo-ai-thinking_chain').value = '';
    document.getElementById('combo-ai-brief').value = '';
    
    generateFullConcept(inspirationText, newCategories);
}

function populateCombinerTags() {
    const themeContainer = document.getElementById('combo-theme-container');
    const rolesContainer = document.getElementById('combo-roles-container');
    const plotsContainer = document.getElementById('combo-plots-container');
    if (!themeContainer || !rolesContainer || !plotsContainer) return;
    const comboData = INSPIRATION_SYSTEM_DATA.comboData;
    const specialPlotTags = ['斩神衍生', '三国衍生', '十日衍生', '水浒衍生', '西游衍生', '红楼衍生', '甄嬛衍生', '如懿衍生', '封神衍生'];
    themeContainer.innerHTML = comboData.themes.map(t => `<span class="tag">${t}</span>`).join('');
    rolesContainer.innerHTML = comboData.roles.map(r => `<span class="tag">${r}</span>`).join('');
    plotsContainer.innerHTML = comboData.plots.map(p => {
        const isSpecial = specialPlotTags.includes(p);
        return `<span class="tag ${isSpecial ? 'tag-special-plot' : ''}">${p}</span>`;
    }).join('');
    const selectorsParent = document.getElementById('combo-selectors');
    if (!selectorsParent) return;
    selectorsParent.addEventListener('click', e => {
        if (!e.target.classList.contains('tag')) return;
        const clickedTag = e.target;
        const container = clickedTag.parentElement;
        switch (container.id) {
            case 'combo-theme-container':
                container.querySelectorAll('.tag').forEach(tag => tag.classList.remove('selected'));
                clickedTag.classList.add('selected');
                break;
            case 'combo-plots-container':
                const isClickedTagSpecial = clickedTag.classList.contains('tag-special-plot');
                if (isClickedTagSpecial) {
                    container.querySelectorAll('.tag-special-plot').forEach(specialTag => {
                        if (specialTag !== clickedTag) specialTag.classList.remove('selected');
                    });
                }
                clickedTag.classList.toggle('selected');
                break;
            case 'combo-roles-container':
            default:
                clickedTag.classList.toggle('selected');
                break;
        }
    });
}

function updateCombinerUI(theme, roles = [], plots = []) {
    document.querySelectorAll('#combo-selectors .tag.selected').forEach(t => t.classList.remove('selected'));
    const allTags = document.querySelectorAll('#combo-selectors .tag');
    const itemsToSelect = [theme, ...roles, ...plots];
    allTags.forEach(tag => {
        if (itemsToSelect.includes(tag.textContent)) {
            tag.classList.add('selected');
        }
    });
}

async function handleGenerateTitle() {
    const brief = document.getElementById('combo-ai-brief').value;
    if (!brief.trim() || brief.includes("生成中")) {
        showNotification("请先等待AI生成简介核心，或手动填写内容。", "warning");
        return;
    }
    showNotification("正在生成备选标题...", "info");
    try {
        const titles = await generateTitleList(brief);
        const modal = document.getElementById('title-selection-modal');
        const container = document.getElementById('title-options-container');
        container.innerHTML = '';
        titles.forEach(title => {
            const card = document.createElement('div');
            card.className = 'title-option-card';
            card.textContent = title;
            card.addEventListener('click', () => {
                document.getElementById('combo-ai-title').value = title;
                modal.classList.add('hidden');
            });
            container.appendChild(card);
        });
        modal.classList.remove('hidden');
        modal.querySelector('.close-btn').addEventListener('click', () => modal.classList.add('hidden'));
    } catch (error) {
        showNotification(`标题生成失败: ${error.message}`, "error");
    }
}