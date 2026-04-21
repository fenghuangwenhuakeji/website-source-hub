// =================================================================
// JavaScript Logic for 创世纪 - 自动化故事引擎 V16.3 (终版)
// Author: Gemini
// Change Log:
// - 【模式选择】新增“手动生成蓝图”与“一键生成大纲”双模式选择，重构`initializeCoreEngine`。
// - 【自动流程】新增`startAutomaticOutlineProcess`函数，实现从创意到大纲的全自动化。
// - 【UI重构】重写`startStoryWriting`函数，实现“全文大纲+本章梗概+写作区”的单栏堆叠布局。
// - 【Prompt强化】重写`getSingleChapterPrompt`，指令AI进行1500-2500字深度创作。
// - 【功能增强】新增Markdown和DOCX格式的导出功能。
// =================================================================


// =============================================================
// SECTION 1: GLOBAL STATE & INITIALIZATION
// =============================================================

let generationState = {};
let currentUser = null;
const knowledgeBase = {
    narrativeLaws: {}, fibonacciRhythms: {}, aiDictionary: {},
    storySettings: {}, inspirationDatabase: { archetypes: [] },
    openingBlueprints: [],
};

document.addEventListener('DOMContentLoaded', () => {
    extractAllKnowledge();
    initializeTabs();
    initializeModals();
    initializeChoiceCards();
    initializeAuth();
    initializeProjectSystem();
    initializeAdvancedCustomization();
    initializeCoreEngine();
});


// =============================================================
// SECTION 2: KNOWLEDGE BASE PARSING
// =============================================================
function extractAllKnowledge() {
    console.log("创世纪引擎V16.3：正在加载知识库...");
    try {
        knowledgeBase.narrativeLaws.fullText = document.getElementById('canon-panel')?.innerText || '';
        const law2Header = Array.from(document.querySelectorAll('#canon-panel h2')).find(h => h.textContent.includes('第二律法'));
        if (law2Header) {
            const modesTable = law2Header.nextElementSibling?.nextElementSibling;
            if (modesTable?.tagName === 'TABLE') {
                knowledgeBase.narrativeLaws.openingModes = Array.from(modesTable.querySelectorAll('tbody tr')).map((row, index) => {
                    const cells = row.querySelectorAll('td');
                    if (cells.length < 5) return null;
                    const ratingMap = { '★★★★★': 5, '★☆☆☆☆': 1, '★★☆☆☆': 2 };
                    return { id: `opening-mode-${index + 1}`, title: cells[0]?.textContent.trim() || '', description: (cells[4]?.textContent.trim().split('。')[0] || '') + '。', stars: ratingMap[cells[2]?.textContent.trim()] || 0 };
                }).filter(m => m && m.title);
            }
        }
        const fibonacciPanel = document.getElementById('fibonacci-panel');
        if (fibonacciPanel) {
            knowledgeBase.fibonacciRhythms.fullText = fibonacciPanel.innerText;
            knowledgeBase.fibonacciRhythms.waves = [];
            fibonacciPanel.querySelectorAll('.sub-section').forEach((section, index) => {
                const title = section.querySelector('h4')?.textContent.trim() || '';
                const sequence = section.querySelector('p > strong')?.textContent.match(/节奏序列: (.*)/)?.[1]?.trim() || '';
                const interpretation = section.querySelector('p:nth-of-type(2)')?.textContent || '';
                if (title && sequence) knowledgeBase.fibonacciRhythms.waves.push({ id: `wave-${index + 1}`, title, sequence, interpretation });
            });
        }
        knowledgeBase.aiDictionary.fullText = document.getElementById('dictionary-panel')?.innerText || '';
        knowledgeBase.openingBlueprints = Array.from(document.querySelectorAll('#blueprints-panel .blueprint-card')).map(card => ({
            title: card.querySelector('h3')?.innerText || '未知',
            content: card.querySelector('pre')?.innerText || ''
        }));

        const cleanArchetypes=['英雄','统治者','创造者','智者','探险家','凡人','爱人','弄臣','看护者','颠覆者','魔术师','孤儿','复仇者','幸存者','欺诈者','谋士','守护者','求知者','侦探','疗愈者','咸鱼','神豪','剧情破壁者','伪装的凡人','伪装的后勤兵','战略家','演员','商人','爱国者','战士','观察者','流浪者','殉道者'];
        knowledgeBase.inspirationDatabase.archetypes=[...new Set(cleanArchetypes)].sort((a,b)=>a.localeCompare(b,'zh-CN'));
        
        console.log("知识库加载完毕!");
    } catch (e) {
        console.error("解析知识库时发生严重错误:", e);
        showNotification("页面知识库模块加载失败，核心功能可能受影响。", "error");
    }
}


// =============================================================
// SECTION 3: REAL API INTERACTION
// =============================================================

let _cachedApiConfig = null;

function getUnifiedApiConfig() {
    if (_cachedApiConfig) return _cachedApiConfig;
    const stored = localStorage.getItem('genesis_api_config');
    if (stored) {
        _cachedApiConfig = JSON.parse(stored);
        return _cachedApiConfig;
    }
    return {
        provider: localStorage.getItem('api_provider') || 'gemini',
        apiKey: localStorage.getItem('api_key') || '',
        baseUrl: localStorage.getItem('api_base_url') || '',
        model: localStorage.getItem('api_model_name') || ''
    };
}

window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'api-config-update') {
        _cachedApiConfig = event.data.config;
        localStorage.setItem('genesis_api_config', JSON.stringify(event.data.config));
        console.log('API 配置已从主窗口同步');
    }
});

window.parent?.postMessage({ type: 'get-api-config' }, '*');

async function callApi(prompt) {
    const config = getUnifiedApiConfig();
    const provider = config.provider || 'gemini';
    const apiKey = config.apiKey || '';
    const baseUrl = config.baseUrl || '';
    const modelName = config.model || '';

    let endpoint = '';
    let headers = { 'Content-Type': 'application/json' };
    let body = {};

    console.log(`正在使用 [${provider}] 服务进行AI交互...`);

    try {
        switch (provider) {
            case 'gemini':
                if (!apiKey) throw new Error("请在设置中配置您的 Google Gemini API Key。");
                endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
                body = { contents: [{ parts: [{ text: prompt }] }] };
                break;
            case 'openai':
                if (!apiKey) throw new Error("请在设置中配置您的 OpenAI API Key。");
                endpoint = 'https://api.openai.com/v1/chat/completions';
                headers['Authorization'] = `Bearer ${apiKey}`;
                body = { model: "gpt-3.5-turbo", messages: [{ role: "user", content: prompt }] };
                break;
            case 'deepseek':
                if (!apiKey) throw new Error("请在设置中配置您的 DeepSeek API Key。");
                endpoint = 'https://api.deepseek.com/chat/completions';
                headers['Authorization'] = `Bearer ${apiKey}`;
                body = { model: "deepseek-chat", messages: [{ role: "user", content: prompt }] };
                break;
            case 'ollama':
            case 'custom':
                if (!baseUrl || !modelName) throw new Error("请在设置中配置您的自定义API Base URL和模型名称。");
                const finalBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
                endpoint = `${finalBaseUrl}/chat/completions`;
                body = { model: modelName, messages: [{ role: "user", content: prompt }], stream: false };
                break;
            default:
                throw new Error(`未知的API服务商: ${provider}`);
        }

        const response = await fetch(endpoint, { method: 'POST', headers: headers, body: JSON.stringify(body) });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`API请求失败 (${response.status}): ${errorData.error?.message || response.statusText}`);
        }

        const data = await response.json();
        let content;
        if (provider === 'gemini') {
            content = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (data.candidates?.[0]?.finishReason === 'SAFETY') {
                 throw new Error("Gemini返回内容被安全策略阻止。");
            }
        } else {
            content = data.choices?.[0]?.message?.content;
        }

        if (content === undefined || content === null) throw new Error('未能从API响应中提取有效内容。');
        return content.trim();
    } catch (error) {
        console.error('API 调用失败:', error);
        showNotification(`AI交互失败: ${error.message}`, 'error');
        throw error;
    }
}

// =============================================================
// SECTION 4: PROMPT ENGINEERING
// =============================================================
function getBlueprintPrompt(t,e){const c=`\n# 风格指令 (最高优先级):\n你的回答必须非常精炼、直接，只输出核心内容。\n- **绝对禁止** 在回答中添加任何解释性文字、括号内的补充说明或自我评述。\n- **绝对禁止** 使用任何Markdown格式（如 **加粗** 或 *斜体*）。所有内容都必须是纯文本。\n---\n    `,n=knowledgeBase.narrativeLaws.fullText?.match(/第一律法[\s\S]*?第二律法/)?.[0]||"",o=knowledgeBase.narrativeLaws.fullText?.match(/第二律法[\s\S]*?第三律法/)?.[0]||"",a=(knowledgeBase.fibonacciRhythms.waves||[]).find(t=>t.title===e.情绪节奏),d=a?`名称: ${a.title}\n序列: ${a.sequence}\n解读: ${a.interpretation}`:"无特定理论。",i=`# 上一步生成的内容:\n---\n${e.step_outputs.step2?`## 第二步：\n${e.step_outputs.step2}\n`:""}${e.step_outputs.step1?`## 第一步：\n${e.step_outputs.step1}\n`:""}---`,r={step1:`${c}# 指令：生成【第一步：解析题目核心元素】\n作为顶级网文策划编辑，基于以下信息进行深度解构和市场定位。\n## 输入信息:\n- 标题: ${e.title}\n- 简介: ${e.coreBrief||"无"}\n## 输出要求 (严格按结构，内容精炼):\n1.  核心关键词: (提炼3-5个核心词)\n2.  核心冲突: (一句话概括核心矛盾)\n3.  读者画像: (描述读者偏好)\n4.  市场定位: (明确题材分类)`,step2:`${c}# 指令：生成【第二步：设定故事原型与世界观】\n作为金牌网文作者，基于第一步分析和用户要求，构建核心设定。\n${i}\n## 用户设定:\n- 定位: ${e.story定位}\n- 原型: ${e.角色原型}\n## 理论依据:\n${n}\n## 输出要求 (严格按结构):\n1.  世界观核心: (直接描述世界背景和独特规则)\n2.  主角核心人设:\n    - 姓名/代号: (直接给出一个合适的名字)\n    - 核心驱动力: (直接描述主角的根本动机)\n    - 金手指/能力: (直接描述能力，并体现【${e.角色原型}】原型)\n3.  主要配角/势力: (直接简述1-2个关键配角或对立势力及其关系)`,step3:`# 指令：生成【第三步：规划情绪节奏与开篇】\n作为剧情节奏大师，基于已有设定，规划情感起伏和开篇。\n${i}\n## 用户设定:\n- 情绪模型: ${e.情绪节奏}\n- 开篇模式: ${e.开篇模式||"AI选择"}\n## 理论依据:\n### 情绪心跳:\n${d}\n### 开场模式:\n${o}\n## 输出要求 (严格按结构):\n1.  情绪节奏应用解析: (解释如何运用【${e.情绪节奏}】模型贯穿故事)\n2.  开篇模式选择与阐述:\n    - 选择: (三选一：热、冷、铺垫)\n    - 理由: (解释为何这样选对故事有利)\n3.  开篇情景简述: (直接用2-3句话的纯文本生动描述开篇第一个场景，明确时间、地点、人物和事件。**绝对禁止使用任何Markdown格式**)`};return(r[t]||"# 错误").replace(/undefined/g,"未指定")}

function getSkeletonPrompt(state) {
    const heroJourneyInstruction = knowledgeBase.narrativeLaws.fullText?.match(/第四律法[\s\S]*?第五律法/)?.[0] || '';
    return `# 身份：金牌网文责编
根据【创世蓝图】，为小说撰写一份分为 ${state.chapterCount || 15} 章的详细、结构化的故事大纲。

## 理论框架 (你必须在创作中遵循):
### 1. 宏观结构 - 英雄之旅
${heroJourneyInstruction}
### 2. 情感节奏
严格遵循【${state.情绪节奏}】模型。

## 输入材料：最终创世蓝图
${state.blueprint}

## 强制性输出要求:
1.  **严格遵守格式:** 必须严格遵循下面的格式范例，不得有任何偏差。
2.  **章节化输出:** 严格按照 ${state.chapterCount || 15} 章的数量输出。
3.  **内容详实:** “剧情梗概”部分需要清晰描述本章的主要事件、场景、人物行动和对话关键点。
4.  **忠于设定:** 所有情节必须严格忠于【创世蓝图】。

## 格式范例 (必须严格遵守):
第1章：[章节标题]
剧情梗概：[此处为第一章的详细剧情梗概...]

第2章：[章节标题]
剧情梗概：[此处为第二章的详细剧情梗概...]

(以此类推，直到最后一章)
`.replace(/undefined/g, "未指定");
}

function getSingleChapterPrompt(state, chapterIndex) {
    const chapterNumber = chapterIndex + 1;
    const chapterInfo = getChapterInfoFromSkeleton(state.skeleton, chapterNumber);
    const prevChapterContent = chapterIndex > 0 ? state.storyChapters[chapterIndex - 1] : "这是故事的第一章，你需要营造出强烈的开篇吸引力，牢牢抓住读者。";
    
    const narrativeLawsSummary = knowledgeBase.narrativeLaws.fullText?.match(/第一律法[\s\S]*/)?.[0].substring(0, 800) || "（叙事圣典内容缺失）";
    const dictionarySummary = knowledgeBase.aiDictionary.fullText?.match(/##基本原则[\s\S]*/)?.[0].substring(0, 1000) || "（AI词典内容缺失）";

    return `# 指令：创作单章小说正文（白金作家级）

# 身份
你是一位顶尖的白金级网络小说作家，你深谙“叙事圣典”的法则，精通“AI创作词典”的文风技巧，擅长将设定、节奏和人物情感完美融合，创造出令人沉浸的阅读体验。

# 核心任务
为小说 **《${state.title}》** 创作 **第 ${chapterNumber} 章** 的完整正文。

# 硬性要求
1.  **字数要求**：本章正文内容需在 **1500至2500汉字** 之间。这必须是深度扩写，而非简单复述。
2.  **内容要求**：你必须基于【本章剧情梗概】进行创作，但要添加丰富的场景描写、细腻的心理活动、符合人物性格的对话以及推动情节的动作细节。
3.  **直接输出**：你的回答 **必须且只能** 是章节的正文内容，**绝对禁止** 包含任何诸如“第X章”、“章节标题”之类的前缀，也禁止任何前言、解释性文字或作者评论。

# 创作依据 (你必须将以下所有信息融会贯通):

## 1. 核心设定 (来自创世蓝图)
- **故事标题**: ${state.title}
- **主角原型 (至关重要!)**: ${state.角色原型}  <-- [你必须在主角本章的言行、决策和心理活动中，深刻体现这些原型特征！]
- **核心蓝图概要**: ${state.blueprint.substring(0, 500)}...

## 2. 本章剧本 (来自故事大纲)
- **章节标题**: ${chapterInfo.title}
- **本章剧情梗概 (这是本章创作的核心指令，必须严格遵循)**: 
  \`\`\`
  ${chapterInfo.outline}
  \`\`\`

## 3. 上下文衔接
- **上一章内容概要 (用于确保剧情连贯)**: 
  \`\`\`
  ${prevChapterContent.substring(prevChapterContent.length - 300)}...
  \`\`\`

## 4. 风格与技法 (最高优先级理论指导)
- **【叙事圣典】**: 创作时必须运用其中的叙事法则，尤其是关于“节奏”、“氛围”、“潜台词”和“细节匕首”的技巧。时刻思考如何将理论应用于实践。
  - **理论摘要**: ${narrativeLawsSummary}...
- **【AI创作词典】**: 你的文风必须严格遵循此词典的“去AI味”原则。语言要洗练、灵动、口语化，多用短句和动作神态展现心理，杜绝陈词滥调和生硬比喻。
  - **理论摘要**: ${dictionarySummary}...
- **【情绪心跳】**: 本章的情感起伏必须服务于故事总体的 **“${state.情绪节奏}”** 模型，思考本章处于收缩期还是舒张期，并据此调整写作节奏。

# 开始创作:
`.replace(/undefined/g, "未指定");
}


// =============================================================
// SECTION 5: UTILITIES
// =============================================================
function getChapterInfoFromSkeleton(fullSkeleton, chapterNumber) {
    const chapterChunks = fullSkeleton.split(/(?=^\s*第\s*\d+\s*章)/m).filter(s => s.trim() !== '');
    
    if (chapterNumber > chapterChunks.length || chapterChunks.length === 0) {
        return { title: `第 ${chapterNumber} 章`, outline: `(未能从大纲中找到本章梗概。)` };
    }

    const targetChunk = chapterChunks[chapterNumber - 1];
    
    const lines = targetChunk.trim().split('\n');
    const titleLine = lines.shift() || '';
    const outline = lines.join('\n').replace(/^剧情梗概：\s*/, '').trim();

    return {
        title: titleLine.replace(/\*+/g, '').trim(),
        outline: outline || "(本章梗概为空)"
    };
}
function showNotification(t,e="info"){const c=document.getElementById("notification-container"),n=document.createElement("div");n.className=`notification ${e}`,n.textContent=t,c.appendChild(n),setTimeout(()=>n.remove(),4e3)}
async function streamText(t,e,c=5){t.value="";for(let n=0;n<e.length;n++)t.value+=e[n],t.scrollTop=t.scrollHeight,n%2==0&&await new Promise(t=>setTimeout(t,c))}
function handleExportCombined(){const t=generationState.blueprint,e=generationState.skeleton;if(t&&e){const c=generationState.title||"无标题故事",n=`\n\n========================================\n\n`,o=`《${c}》 - 创世核心文档\n${n}********** 创世蓝图 **********\n\n${t}\n${n}********** 故事大纲 **********\n\n${e}`,a=`${c}_创世核心.txt`;handleExportTxtGeneric(o,a),showNotification("蓝图与大纲已打包导出！","success")}else showNotification("蓝图或大纲尚未生成，无法导出。","error")}
function handleExportTxtGeneric(content, fileName, mimeType = "text/plain;charset=utf-8") {
    if (!content) {
        showNotification("内容为空，无法导出。", "error");
        return;
    }
    try {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (e) {
        console.error("导出失败:", e);
        showNotification("文件导出失败。", "error");
    }
}
function loadSettings(){document.getElementById("api-provider").value=localStorage.getItem("api_provider")||"gemini",document.getElementById("api-key").value=localStorage.getItem("api_key")||"",document.getElementById("api-base-url").value=localStorage.getItem("api_base_url")||"",document.getElementById("api-model-name").value=localStorage.getItem("api_model_name")||"",updateApiSettingsVisibility()}
function saveAndCloseSettings(){localStorage.setItem("api_provider",document.getElementById("api-provider").value),localStorage.setItem("api_key",document.getElementById("api-key").value),localStorage.setItem("api_base_url",document.getElementById("api-base-url").value),localStorage.setItem("api_model_name",document.getElementById("api-model-name").value);const t=document.getElementById("settings-status");t.textContent="设置已保存!",setTimeout(()=>{t.textContent="",document.getElementById("settings-modal").classList.remove("visible")},1e3)}
function updateApiSettingsVisibility(){const t=document.getElementById("api-provider").value;document.getElementById("api-key-group").classList.toggle("hidden","ollama"===t),document.getElementById("api-base-url-group").classList.toggle("hidden",!["ollama","custom"].includes(t)),document.getElementById("api-model-name-group").classList.toggle("hidden",!["ollama","custom","deepseek"].includes(t))}
function autoSaveWrapper(t){return async function(...e){try{const c=await t.apply(this,e);return saveProject(),c}catch(t){throw saveProject(),t}}}


// =============================================================
// SECTION 6: UI INITIALIZATION & EVENT HANDLERS
// =============================================================
function initializeCoreEngine() {
    const storyTitleInput = document.getElementById("story-title");
    const manualBtn = document.getElementById("manual-blueprint-btn");
    const autoBtn = document.getElementById("auto-outline-btn");
    const settingsBtn = document.getElementById("settings-trigger-minimal");

    // This logic replaces the old single 'generate-btn' logic
    const commonStartLogic = () => {
        if (!checkAuth(true)) return false;
        const title = storyTitleInput.value.trim();
        if (!title) {
            showNotification("请输入一个故事标题！", "error");
            storyTitleInput.focus();
            return false;
        }
        const customPanel = document.getElementById("advanced-customization-panel");
        if (customPanel.classList.contains("hidden")) {
            document.querySelector(".choice-card.selected")?.classList.remove("selected");
            generationState = { 
                title: title, 
                coreBrief: "（由手动输入标题生成，请在下方确认或修改核心设定）", 
                story定位: "", 
                情绪节奏: "", 
                角色原型: "" 
            };
            populateCustomizationPanel(generationState);
            customPanel.classList.remove("hidden");
            customPanel.scrollIntoView({ behavior: "smooth", block: "center" });
            showNotification("请先配置下方参数，然后选择生成模式。", "info");
            return false;
        }
        
        updateStateFromCustomizationPanel();
        generationState.title = title;
        if (!generationState.projectId) {
            generationState.projectId = `proj_${Date.now()}`;
        }
        return true;
    };

    manualBtn.addEventListener("click", () => {
        if (commonStartLogic()) {
            startInteractiveBlueprintProcess(); // Trigger manual step-by-step flow
        }
    });

    autoBtn.addEventListener("click", () => {
        if (commonStartLogic()) {
            startAutomaticOutlineProcess(); // Trigger the new one-click flow
        }
    });

    storyTitleInput.addEventListener("keypress", e => {
        if (e.key === 'Enter') {
            e.preventDefault();
            autoBtn.click(); // Default enter action triggers the main button
        }
    });
}

function initializeTabs(){const t=document.querySelectorAll(".main-tab"),e=document.querySelectorAll(".tab-content");t.forEach(c=>{c.addEventListener("click",()=>{t.forEach(t=>t.classList.remove("active")),c.classList.add("active");const n=c.dataset.target;e.forEach(t=>{t.classList.toggle("active",t.id===n)})})})}
function initializeChoiceCards(){const t=document.querySelectorAll(".choice-card"),e=document.getElementById("story-title"),c=document.getElementById("advanced-customization-panel");t.forEach(n=>{n.addEventListener("click",()=>{checkAuth(!1)&&(t.forEach(t=>t.classList.remove("selected")),n.classList.add("selected"),generationState={title:n.dataset.title,coreBrief:n.dataset.coreBrief,story定位:n.dataset.story定位,情绪节奏:n.dataset.情绪节奏,角色原型:n.dataset.角色原型},e.value=generationState.title,populateCustomizationPanel(generationState),c.classList.remove("hidden"),c.scrollIntoView({behavior:"smooth",block:"center"}))})})}
function initializeModals(){document.querySelectorAll(".modal-overlay").forEach(t=>{t.addEventListener("click",e=>{e.target!==t&&!e.target.closest(".close-btn")||t.classList.remove("visible")})}),document.getElementById("settings-trigger-minimal").addEventListener("click",()=>document.getElementById("settings-modal").classList.add("visible")),document.getElementById("save-settings").addEventListener("click",saveAndCloseSettings),document.getElementById("api-provider").addEventListener("change",updateApiSettingsVisibility),loadSettings(),document.getElementById("projects-btn").addEventListener("click",()=>{populateProjectList(),document.getElementById("projects-modal").classList.add("visible")}),document.getElementById("start-new-project-btn").addEventListener("click",()=>{confirm("确定要开始一个新的创作吗？当前未保存的进度将会丢失。")&&(generationState={},resetUI(),document.getElementById("story-title").value="",document.getElementById("projects-modal").classList.remove("visible"))})}
function initializeAuth(){document.getElementById("register-btn").addEventListener("click",handleRegister),document.getElementById("login-btn").addEventListener("click",handleLogin),document.getElementById("logout-btn").addEventListener("click",handleLogout),currentUser=localStorage.getItem("genesis_engine_currentUser"),currentUser?updateUIAfterLogin():updateUIAfterLogout()}
function initializeProjectSystem(){document.getElementById("project-list-container").addEventListener("click",t=>{t.target.closest(".load-project-btn")?handleLoadProject(t):t.target.closest(".delete-project-btn")&&handleDeleteProject(t)})}
function initializeAdvancedCustomization(){const t=document.getElementById("advanced-customization-panel");t.addEventListener("change",t=>{"SELECT"!==t.target.tagName&&"radio"!==t.target.type||updateStateFromCustomizationPanel()}),t.addEventListener("click",e=>{const c=e.target.closest(".tag-selector");if(c)c.classList.toggle("selected"),updateStateFromCustomizationPanel();else{const c=e.target.closest(".opening-mode-card");c&&(t.querySelectorAll(".opening-mode-card").forEach(t=>t.classList.remove("selected")),c.classList.add("selected"),c.querySelector('input[type="radio"]').checked=!0,updateStateFromCustomizationPanel())}})}


// =============================================================
// SECTION 7: AUTH & PROJECT MANAGEMENT
// =============================================================
function checkAuth(t=!0){return!!currentUser||(t&&showNotification("请先登录才能使用此功能！","error"),!1)}
function handleRegister(){const t=prompt("请输入您要注册的用户名:");if(!t||""===t.trim())return;const e=prompt("请输入您的密码:");if(!e)return;let c=JSON.parse(localStorage.getItem("genesis_engine_users"))||{};c[t]?showNotification("用户名已存在！","error"):(c[t]={password:e},localStorage.setItem("genesis_engine_users",JSON.stringify(c)),showNotification("注册成功！现在请登录。","success"))}
function handleLogin(){const t=prompt("请输入用户名:");if(!t)return;const e=prompt("请输入密码:");if(!e)return;let c=JSON.parse(localStorage.getItem("genesis_engine_users"))||{};c[t]&&c[t].password===e?(currentUser=t,localStorage.setItem("genesis_engine_currentUser",currentUser),updateUIAfterLogin(),showNotification(`欢迎回来, ${t}!`,"success")):showNotification("用户名或密码错误！","error")}
function handleLogout(){currentUser=null,localStorage.removeItem("genesis_engine_currentUser"),updateUIAfterLogout(),showNotification("您已成功登出。","info")}
function updateUIAfterLogin(){document.getElementById("welcome-message").textContent=`欢迎, ${currentUser}`,document.getElementById("login-btn").classList.add("hidden"),document.getElementById("register-btn").classList.add("hidden"),document.getElementById("logout-btn").classList.remove("hidden"),document.getElementById("projects-btn").classList.remove("hidden"),toggleEngineUI(!0)}
function updateUIAfterLogout(){document.getElementById("welcome-message").textContent="",document.getElementById("login-btn").classList.remove("hidden"),document.getElementById("register-btn").classList.remove("hidden"),document.getElementById("logout-btn").classList.add("hidden"),document.getElementById("projects-btn").classList.add("hidden"),toggleEngineUI(!1)}
function toggleEngineUI(t){const e=document.getElementById("engine-core-ui"),c=document.getElementById("story-title");t?(e.classList.remove("disabled"),c.placeholder="输入标题或选择下方模板..."):(e.classList.add("disabled"),c.value="",c.placeholder="请先登录以开始创作...",resetUI())}
function populateProjectList(){const t=document.getElementById("project-list-container"),e=JSON.parse(localStorage.getItem(`genesis_projects_${currentUser}`))||{},c=Object.keys(e);0===c.length?t.innerHTML='<div class="empty-projects-placeholder"><i class="fas fa-folder-open fa-3x"></i><p>还没有任何项目。</p></div>':t.innerHTML=c.sort((t,c)=>e[c].lastSaved-e[t].lastSaved).map(t=>{const c=e[t],n=new Date(c.lastSaved).toLocaleString("zh-CN");return `<div class="project-item" data-id="${t}"><div class="project-item-info"><div class="project-item-title">${c.title||"无标题项目"}</div><div class="project-item-date">最后保存: ${n}</div></div><div class="project-item-controls"><button class="action-btn control-btn load-project-btn"><i class="fas fa-folder-open"></i> 加载</button><button class="settings-btn control-btn delete-project-btn" style="color: var(--error-color);"><i class="fas fa-trash-alt"></i> 删除</button></div></div>`}).join("")}
function saveProject(){if(!currentUser||!generationState.projectId)return;let t=JSON.parse(localStorage.getItem(`genesis_projects_${currentUser}`))||{};generationState.lastSaved=Date.now(),t[generationState.projectId]=generationState,localStorage.setItem(`genesis_projects_${currentUser}`,JSON.stringify(t))}
function handleLoadProject(t){const e=t.target.closest(".project-item").dataset.id,c=JSON.parse(localStorage.getItem(`genesis_projects_${currentUser}`))||{},n=c[e];n&&confirm(`确定要加载项目 “${n.title}” 吗？\n当前未保存的进度将会丢失。`)&&(generationState=n,rebuildUIFromState(generationState),document.getElementById("projects-modal").classList.remove("visible"),showNotification(`项目 “${n.title}” 已成功加载。`,"success"))}
function handleDeleteProject(t){const e=t.target.closest(".project-item"),c=e.dataset.id,n=e.querySelector(".project-item-title").textContent;if(confirm(`您确定要永久删除项目 “${n}” 吗？\n此操作不可撤销！`)){let t=JSON.parse(localStorage.getItem(`genesis_projects_${currentUser}`)||{});delete t[c],localStorage.setItem(`genesis_projects_${currentUser}`,JSON.stringify(t)),populateProjectList(),showNotification(`项目 “${n}” 已被删除。`,"info")}}
function rebuildUIFromState(t){resetUI(),document.querySelector('.main-tab[data-target="engine-panel"]').click(),document.getElementById("story-title").value=t.title||"",document.getElementById("engine-core-ui").classList.remove("hidden");const e=document.getElementById("advanced-customization-panel");populateCustomizationPanel(t),e.classList.remove("hidden"),t.finalStory?finishAndDisplayStory():t.storyChapters?(startInteractiveBlueprintProcess(),document.getElementById("blueprint-steps-container").innerHTML=`<div class="blueprint-step finalized"><h3>创世蓝图 (已锁定)</h3><textarea readonly>${t.blueprint}</textarea></div>`,startSkeletonGeneration(),document.getElementById("skeleton-textarea").value=t.skeleton,document.getElementById("skeleton-textarea").readOnly=!0,document.getElementById("skeleton-controls").innerHTML='<button class="action-btn control-btn" id="confirm-skeleton-btn"><i class="fas fa-pen-nib"></i> 继续生成正文</button>',document.getElementById("confirm-skeleton-btn").addEventListener("click",startStoryWriting),startStoryWriting(),loadChapter(t.currentStoryChapterIndex||0)):t.skeleton?(startInteractiveBlueprintProcess(),document.getElementById("blueprint-steps-container").innerHTML=`<div class="blueprint-step finalized"><h3>创世蓝图 (已锁定)</h3><textarea readonly>${t.blueprint}</textarea></div>`,startSkeletonGeneration(),document.getElementById("skeleton-textarea").value=t.skeleton,document.getElementById("skeleton-controls").innerHTML='<button class="settings-btn control-btn" id="skeleton-regenerate-btn"><i class="fas fa-sync-alt"></i> 重生成</button><button class="action-btn control-btn" id="confirm-skeleton-btn"><i class="fas fa-pen-nib"></i> 继续生成正文</button>',document.getElementById("skeleton-regenerate-btn").addEventListener("click",handleGenerateSkeleton),document.getElementById("confirm-skeleton-btn").addEventListener("click",startStoryWriting)):t.step_outputs&&Object.keys(t.step_outputs).length>0&&(startInteractiveBlueprintProcess(),document.getElementById("blueprint-steps-container").innerHTML="",function(){let e=-1;blueprintStepsConfig.forEach((c,n)=>{t.step_outputs[c.id]&&(appendBlueprintStepUI(n),document.getElementById(c.id).querySelector("textarea").value=t.step_outputs[c.id],document.getElementById(c.id).querySelector(".step-status").innerHTML='<i class="fas fa-check-circle"></i>',e=n)}),e>-1&&updateBlueprintControls(document.getElementById(blueprintStepsConfig[e].id).querySelector(".step-controls"),e,"generated")}())}
function populateCustomizationPanel(t){const e=document.getElementById("custom-emotion-rhythm-group"),c=knowledgeBase.fibonacciRhythms.waves||[];e.innerHTML=`<label for="emotion-rhythm-select">情绪节奏</label><select id="emotion-rhythm-select">${c.map(t=>`<option value="${t.title}" title="${t.sequence}\n${t.interpretation}">${t.title}</option>`).join("")}</select>`;const n=c.find(e=>t.情绪节奏?.includes(e.title));document.getElementById("emotion-rhythm-select").value=n?n.title:c[0]?.title||"";const o=document.getElementById("custom-opening-mode-group"),a=knowledgeBase.narrativeLaws.openingModes||[];o.innerHTML=`<label>开篇模式</label><div class="opening-mode-selector">${a.map((t,e)=>`<label class="opening-mode-card ${0===e?"selected":""}" for="${t.id}"><input type="radio" name="opening-mode" id="${t.id}" value="${t.title}" ${0===e?"checked":""}><h5>${t.title}</h5><div class="stars" title="推荐指数: ${t.stars}星">${"★".repeat(t.stars)}${"☆".repeat(5-t.stars)}</div><p>${t.description}</p></label>`).join("")}</div>`;const d=document.getElementById("custom-archetype-group"),i=(t.角色原型||"").split(/ \+ | \/ /).map(t=>t.replace(/\(.*\)/g,"").trim()).filter(Boolean),l=knowledgeBase.inspirationDatabase.archetypes||[];d.innerHTML=`<label>角色原型 (可多选)</label><div class="tag-selector-container">${l.map(t=>`<span class="tag-selector ${i.includes(t)?"selected":""}" data-value="${t}">${t}</span>`).join("")}</div>`,updateStateFromCustomizationPanel()}
function updateStateFromCustomizationPanel(){generationState.情绪节奏=document.getElementById("emotion-rhythm-select")?.value||"";const t=document.querySelector('input[name="opening-mode"]:checked');generationState.开篇模式=t?t.value:"";const e=Array.from(document.querySelectorAll("#custom-archetype-group .tag-selector.selected")).map(t=>t.dataset.value);generationState.角色原型=e.join(" + ")}


// =============================================================
// SECTION 8: CORE STORY GENERATION WORKFLOW
// =============================================================
const blueprintStepsConfig=[{id:"step1",title:"第一步：解析题目核心元素",description:"AI将分析您的标题和简介，提炼关键词、定位题材，并明确核心冲突。"},{id:"step2",title:"第二步：设定故事原型与世界观",description:"基于您的选择和AI的分析，构建故事的核心设定、主角原型和世界观。"},{id:"step3",title:"第三步：规划情绪节奏与开篇",description:"设计故事的整体情感节奏，并根据叙事理论选择合适的开篇模式。"},{id:"step4",title:"第四步：整合为完整创世蓝图",description:"将前面所有步骤的内容整合，形成一份完整的“创世蓝图”，指导后续创作。",isFinal:!0}];

function resetUI(){document.getElementById("engine-core-ui").classList.remove("hidden", "disabled"),["generation-workflow-container","story-writer-container","output-container"].forEach(t=>{const e=document.getElementById(t);e.innerHTML="",e.classList.add("hidden")}),document.getElementById("advanced-customization-panel").classList.add("hidden"),document.querySelector(".choice-card.selected")?.classList.remove("selected")}

function startInteractiveBlueprintProcess(){document.getElementById("engine-core-ui").classList.add("hidden");generationState.step_outputs||(generationState.step_outputs={});const t=document.getElementById("generation-workflow-container");t.innerHTML='<div id="blueprint-steps-container"></div><div id="skeleton-container" class="hidden"></div>',t.classList.remove("hidden"),appendBlueprintStepUI(0)}

function appendBlueprintStepUI(t){const e=document.getElementById("blueprint-steps-container"),c=blueprintStepsConfig[t];if(!c)return;const n=document.createElement("div");n.className="blueprint-step",n.id=c.id,n.dataset.stepIndex=t,n.innerHTML=`<h3><span class="step-status"><i class="fas fa-edit"></i></span> ${c.title}</h3><p>${c.description}</p><textarea placeholder="AI生成的内容将显示在这里...">${generationState.step_outputs[c.id]||""}</textarea><div class="step-controls"><button class="action-btn generate-btn"><i class="fas fa-magic"></i> 生成此步骤</button></div>`,e.appendChild(n),n.querySelector(".generate-btn").addEventListener("click",handleGenerateBlueprintStep),n.scrollIntoView({behavior:"smooth",block:"center"})}

async function handleGenerateBlueprintStep(t){const e=t.currentTarget,c=e.closest(".blueprint-step"),n=parseInt(c.dataset.stepIndex,10),o=blueprintStepsConfig[n],a=c.querySelector("textarea"),d=c.querySelector(".step-status"),i=c.querySelector(".step-controls");document.querySelectorAll(".blueprint-step textarea").forEach((t,e)=>{if(e<n&&t.value)generationState.step_outputs[blueprintStepsConfig[e].id]=t.value}),e.disabled=!0,d.innerHTML='<i class="fas fa-spinner fa-spin"></i>',a.readOnly=!0;try{let t=o.isFinal?`# 创世蓝图：${generationState.title}\n\n${Object.values(generationState.step_outputs).join("\n\n").trim()}`:await callApi(getBlueprintPrompt(o.id,generationState));await streamText(a,t),generationState.step_outputs[o.id]=t,d.innerHTML='<i class="fas fa-check-circle"></i>',a.readOnly=!1,updateBlueprintControls(i,n,"generated")}catch(t){a.value=`生成错误: ${t.message}`,d.innerHTML='<i class="fas fa-times-circle"></i>',updateBlueprintControls(i,n,"error")}}

function updateBlueprintControls(t,e,c){if("error"===c)return t.innerHTML='<button class="action-btn generate-btn"><i class="fas fa-redo"></i> 重试</button>',void t.querySelector(".generate-btn").addEventListener("click",handleGenerateBlueprintStep);const n=blueprintStepsConfig[e].isFinal,o=0<e?`<button class="settings-btn control-btn back-btn"><i class="fas fa-chevron-left"></i> 上一步</button>`:"",a='<button class="settings-btn control-btn regenerate-btn"><i class="fas fa-sync-alt"></i> 重生成</button>',d=n?'<button class="action-btn control-btn" id="confirm-blueprint-btn"><i class="fas fa-bone"></i> 下一步：故事大纲</button>':'<button class="action-btn control-btn next-btn"><i class="fas fa-check"></i> 下一步</button>';t.innerHTML=`${o}${a}${d}`,0<e&&t.querySelector(".back-btn").addEventListener("click",handleBlueprintGoBack),t.querySelector(".regenerate-btn").addEventListener("click",handleGenerateBlueprintStep),n?t.querySelector("#confirm-blueprint-btn").addEventListener("click",startSkeletonGeneration):t.querySelector(".next-btn").addEventListener("click",handleBlueprintNextStep)}

function handleBlueprintNextStep(t){const e=t.currentTarget.closest(".blueprint-step"),c=parseInt(e.dataset.stepIndex,10);generationState.step_outputs[blueprintStepsConfig[c].id]=e.querySelector("textarea").value,e.querySelector("textarea").readOnly=!0,e.querySelector(".step-controls").innerHTML='<span style="color: var(--primary-color);">已确认 ✓</span>',appendBlueprintStepUI(c+1)}

function handleBlueprintGoBack(t){const e=t.currentTarget.closest(".blueprint-step"),c=parseInt(e.dataset.stepIndex,10);document.querySelectorAll(".blueprint-step").forEach(t=>{parseInt(t.dataset.stepIndex,10)>=c&&t.remove()});const n=document.getElementById(blueprintStepsConfig[c-1].id);n&&(n.querySelector("textarea").readOnly=!1,updateBlueprintControls(n.querySelector(".step-controls"),c-1,"generated"))}

function startSkeletonGeneration(){generationState.blueprint=generationState.step_outputs.step4,document.getElementById("blueprint-steps-container").classList.add("finalized");const t=document.getElementById("skeleton-container");t.classList.remove("hidden"),t.innerHTML=`<div class="skeleton-editor"><h3><span class="step-status"><i class="fas fa-edit"></i></span> 第五步：生成故事大纲</h3><p>请设定总章节数...</p><div class="chapter-count-input"><label for="chapter-count">总章节数:</label><input type="number" id="chapter-count" value="${generationState.chapterCount||15}" min="3" max="300"></div><textarea id="skeleton-textarea" placeholder="AI生成的故事大纲将显示在这里...">${generationState.skeleton||""}</textarea><div class="step-controls" id="skeleton-controls"><button class="action-btn" id="generate-skeleton-btn"><i class="fas fa-magic"></i> 生成故事大纲</button></div></div>`,document.getElementById("generate-skeleton-btn").addEventListener("click",handleGenerateSkeleton),t.scrollIntoView({behavior:"smooth",block:"center"})}

async function handleGenerateSkeleton(t){const e=t.currentTarget,c=document.getElementById("skeleton-controls"),n=document.querySelector("#skeleton-container .step-status"),o=document.getElementById("skeleton-textarea");generationState.chapterCount=parseInt(document.getElementById("chapter-count").value,10),e.disabled=!0,n.innerHTML='<i class="fas fa-spinner fa-spin"></i>';try{const t=await callApi(getSkeletonPrompt(generationState));await streamText(o,t),generationState.skeleton=t,n.innerHTML='<i class="fas fa-check-circle"></i>',c.innerHTML='<button class="settings-btn control-btn" id="skeleton-regenerate-btn"><i class="fas fa-sync-alt"></i> 重生成</button><button class="settings-btn control-btn" id="export-combined-btn"><i class="fas fa-file-archive"></i> 导出蓝图与大纲</button><button class="action-btn control-btn" id="confirm-skeleton-btn"><i class="fas fa-pen-nib"></i> 继续生成正文</button>',document.getElementById("skeleton-regenerate-btn").addEventListener("click",handleGenerateSkeleton),document.getElementById("export-combined-btn").addEventListener("click",handleExportCombined),document.getElementById("confirm-skeleton-btn").addEventListener("click",()=>{confirm("确认要进入正文写作流程吗？")&&startStoryWriting()})}catch(t){o.value=`生成大纲错误: ${t.message}`,n.innerHTML='<i class="fas fa-times-circle"></i>',e.disabled=!1,e.innerHTML='<i class="fas fa-redo"></i> 重试生成'}}

async function showProgressNotification(message, duration = 60000) {
    const container = document.getElementById("notification-container");
    const existingProgress = container.querySelector('.notification.progress');
    if (existingProgress) {
        existingProgress.remove();
    }
    const notification = document.createElement("div");
    notification.className = 'notification info progress';
    notification.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${message}`;
    container.appendChild(notification);
    return () => {
        notification.remove();
    };
}

async function startAutomaticOutlineProcess() {
    const closeNotification = await showProgressNotification("已启动自动化流程，正在为您构建故事蓝图...");
    document.getElementById("engine-core-ui").classList.add("disabled");
    
    try {
        generationState.step_outputs = {};
        
        let closeStep1 = await showProgressNotification("第一步：解析题目核心元素...");
        const step1Output = await callApi(getBlueprintPrompt('step1', generationState));
        generationState.step_outputs.step1 = step1Output;
        closeStep1();

        let closeStep2 = await showProgressNotification("第二步：设定故事原型与世界观...");
        const step2Output = await callApi(getBlueprintPrompt('step2', generationState));
        generationState.step_outputs.step2 = step2Output;
        closeStep2();

        let closeStep3 = await showProgressNotification("第三步：规划情绪节奏与开篇...");
        const step3Output = await callApi(getBlueprintPrompt('step3', generationState));
        generationState.step_outputs.step3 = step3Output;
        closeStep3();

        generationState.blueprint = `# 创世蓝图：${generationState.title}\n\n${Object.values(generationState.step_outputs).join("\n\n").trim()}`;
        generationState.step_outputs.step4 = generationState.blueprint;
        showNotification("创世蓝图已构建完成！", "success");

        let closeSkeleton = await showProgressNotification("第四步：生成故事大纲...");
        
        const workflowContainer = document.getElementById("generation-workflow-container");
        workflowContainer.innerHTML = '<div id="blueprint-steps-container"></div><div id="skeleton-container"></div>';
        workflowContainer.classList.remove("hidden");
        const skeletonContainer = document.getElementById("skeleton-container");
        skeletonContainer.innerHTML = `
            <div class="skeleton-editor">
                <h3><span class="step-status"><i class="fas fa-spinner fa-spin"></i></span> 第五步：生成故事大纲</h3>
                <p>已为您自动设定总章节数，AI正在全力生成中...</p>
                <div class="chapter-count-input" style="display:none;">
                    <input type="number" id="chapter-count" value="${generationState.chapterCount || 15}">
                </div>
                <textarea id="skeleton-textarea" placeholder="AI生成的故事大纲将显示在这里..."></textarea>
                <div class="step-controls" id="skeleton-controls"></div>
            </div>
        `;
        skeletonContainer.scrollIntoView({ behavior: "smooth", block: "center" });

        generationState.chapterCount = generationState.chapterCount || 15;
        const skeletonPrompt = getSkeletonPrompt(generationState);
        const skeletonOutput = await callApi(skeletonPrompt);
        generationState.skeleton = skeletonOutput;
        
        const skeletonTextarea = document.getElementById("skeleton-textarea");
        await streamText(skeletonTextarea, skeletonOutput);
        
        document.querySelector("#skeleton-container .step-status").innerHTML = '<i class="fas fa-check-circle"></i>';
        const skeletonControls = document.getElementById("skeleton-controls");
        skeletonControls.innerHTML = `
            <button class="settings-btn control-btn" id="export-combined-btn"><i class="fas fa-file-archive"></i> 导出蓝图与大纲</button>
            <button class="action-btn control-btn" id="confirm-skeleton-btn"><i class="fas fa-pen-nib"></i> 继续生成正文</button>
        `;
        document.getElementById("export-combined-btn").addEventListener("click", handleExportCombined);
        document.getElementById("confirm-skeleton-btn").addEventListener("click", () => {
            if (confirm("确认要进入正文写作流程吗？")) {
                startStoryWriting();
            }
        });
        
        saveProject();
        closeSkeleton();
        showNotification("故事大纲已生成！您可以审阅并进入正文写作。", "success");
        
    } catch (error) {
        showNotification(`自动化流程失败: ${error.message}`, "error");
    } finally {
        closeNotification();
        document.getElementById("engine-core-ui").classList.remove("disabled");
        document.getElementById("engine-core-ui").classList.add("hidden");
    }
}

function startStoryWriting() {
    generationState.skeleton = document.getElementById("skeleton-textarea")?.value || generationState.skeleton;
    document.getElementById("generation-workflow-container").classList.add("hidden");
    
    if (!generationState.storyChapters || generationState.storyChapters.length !== generationState.chapterCount) {
        generationState.storyChapters = new Array(generationState.chapterCount).fill("");
    }

    const writerContainer = document.getElementById("story-writer-container");
    writerContainer.classList.remove("hidden");

    writerContainer.innerHTML = `
        <div class="writer-editor">
            <h3><span id="writer-header"></span></h3>
            
            <h4><i class="fas fa-book-open"></i> 全文大纲 (参考)</h4>
            <textarea id="full-skeleton-display" readonly>${generationState.skeleton || ""}</textarea>

            <h4><i class="fas fa-map-signs"></i> 本章梗概 (核心任务)</h4>
            <p id="writer-skeleton-prompt"></p>

            <h4><i class="fas fa-pen-nib"></i> 章节正文 (创作区)</h4>
            <textarea id="story-writer-textarea" placeholder="AI生成的章节正文将在这里呈现..."></textarea>
            
            <div id="writer-navigation">
                <span id="chapter-indicator"></span>
                <div class="nav-buttons">
                    <button class="settings-btn control-btn" id="prev-chapter-btn"><i class="fas fa-arrow-left"></i> 上一章</button>
                    <button class="action-btn control-btn" id="next-chapter-btn"><i class="fas fa-arrow-right"></i> 下一章</button>
                </div>
            </div>
            
            <div class="step-controls" style="margin-top: 20px;">
                <button class="settings-btn" id="regenerate-chapter-btn"><i class="fas fa-sync-alt"></i> 重生成本章</button>
                <button class="action-btn confirm-btn" id="finish-story-btn"><i class="fas fa-flag-checkered"></i> 完成并展示故事</button>
            </div>
        </div>
    `;

    document.getElementById("prev-chapter-btn").addEventListener("click", handlePrevChapter);
    document.getElementById("next-chapter-btn").addEventListener("click", handleNextChapter);
    document.getElementById("regenerate-chapter-btn").addEventListener("click", () => generateChapter(generationState.currentStoryChapterIndex, true));
    document.getElementById("finish-story-btn").addEventListener("click", finishAndDisplayStory);

    loadChapter(generationState.currentStoryChapterIndex || 0);
    writerContainer.scrollIntoView({ behavior: "smooth", block: "start" });
}

function loadChapter(t){generationState.currentStoryChapterIndex=t;const e=getChapterInfoFromSkeleton(generationState.skeleton,t+1);document.getElementById("writer-header").innerHTML=`<span class="step-status"><i class="fas fa-edit"></i></span> ${e.title}`,document.getElementById("chapter-indicator").textContent=`进度: ${t+1} / ${generationState.chapterCount}`,document.getElementById("story-writer-textarea").value=generationState.storyChapters[t],document.getElementById("writer-skeleton-prompt").textContent=`${e.outline}`,document.getElementById("prev-chapter-btn").disabled=0===t;const c=document.getElementById("next-chapter-btn");c.disabled=t>=generationState.chapterCount-1,c.innerHTML=t>=generationState.chapterCount-1?'<i class="fas fa-check"></i> 最后一章':'<i class="fas fa-arrow-right"></i> 下一章',generationState.storyChapters[t]||generateChapter(t)}

function saveCurrentChapter(){const t=generationState.currentStoryChapterIndex;if(void 0!==t){const e=document.getElementById("story-writer-textarea");e&&(generationState.storyChapters[t]=e.value)}}

function handlePrevChapter(){saveCurrentChapter(),0<generationState.currentStoryChapterIndex&&loadChapter(generationState.currentStoryChapterIndex-1)}

function handleNextChapter(){saveCurrentChapter(),generationState.currentStoryChapterIndex<generationState.chapterCount-1&&loadChapter(generationState.currentStoryChapterIndex+1)}

async function generateChapter(t,e=!1){const c=document.getElementById("story-writer-textarea"),n=document.getElementById("writer-header"),o=getChapterInfoFromSkeleton(generationState.skeleton,t+1);n.innerHTML=`<span class="step-status"><i class="fas fa-spinner fa-spin"></i></span> 正在生成 ${o.title}...`,document.getElementById("regenerate-chapter-btn").disabled=!0;try{const e=await callApi(getSingleChapterPrompt(generationState,t));await streamText(c,e),generationState.storyChapters[t]=e,n.innerHTML=`<span class="step-status"><i class="fas fa-check-circle"></i></span> ${o.title}`}catch(t){c.value=`章节 ${t+1} 生成失败: ${t.message}`,n.innerHTML=`<span class="step-status"><i class="fas fa-times-circle"></i></span> ${o.title}`}finally{document.getElementById("regenerate-chapter-btn").disabled=!1}}

function finishAndDisplayStory(){saveCurrentChapter(),document.getElementById("story-writer-container").classList.add("hidden");let t="";for(let e=0;e<generationState.chapterCount;e++){const c=generationState.storyChapters[e]||"(本章内容为空)",n=getChapterInfoFromSkeleton(generationState.skeleton,e+1),o=c.split("\n").filter(t=>""!==t.trim()).map(t=>`<p>${t.trim()}</p>`).join("");t+=`<div class="chapter-content"><h3>${n.title}</h3>${o}</div>`}generationState.finalStory=t,displayStory(t),resetUI(),document.getElementById("story-title").value = generationState.title, document.getElementById("advanced-customization-panel").classList.remove("hidden"), saveProject()}

function displayStory(storyHtml) {
    const outputContainer = document.getElementById("output-container");
    outputContainer.innerHTML = `
        <div class="story-content copy-target"></div>
        <div id="export-options-container"></div>
    `;
    const storyContentDiv = outputContainer.querySelector(".story-content");
    storyContentDiv.innerHTML = `<h1>${generationState.title}</h1>${storyHtml}`;

    const exportOptionsContainer = outputContainer.querySelector("#export-options-container");
    
    const copyBtn = document.createElement("button");
    copyBtn.className = "settings-btn control-btn";
    copyBtn.title = "复制完整故事";
    copyBtn.innerHTML = '<i class="fas fa-copy"></i> 复制全文';
    copyBtn.addEventListener("click", () => {
        const plainText = convertHtmlToPlainText(storyHtml);
        navigator.clipboard.writeText(`${generationState.title}\n\n${plainText}`)
            .then(() => showNotification("故事已复制到剪贴板！", "success"))
            .catch(err => showNotification("复制失败: " + err, "error"));
    });
    
    const txtBtn = document.createElement("button");
    txtBtn.className = "action-btn control-btn";
    txtBtn.innerHTML = '<i class="fas fa-file-alt"></i> 导出为 TXT';
    txtBtn.addEventListener("click", handleExportTxt);

    const mdBtn = document.createElement("button");
    mdBtn.className = "action-btn control-btn";
    mdBtn.innerHTML = '<i class="fab fa-markdown"></i> 导出为 Markdown';
    mdBtn.addEventListener("click", handleExportMarkdown);

    const docxBtn = document.createElement("button");
    docxBtn.className = "action-btn control-btn";
    docxBtn.innerHTML = '<i class="fas fa-file-word"></i> 导出为 DOCX';
    docxBtn.addEventListener("click", handleExportDocx);

    exportOptionsContainer.append(copyBtn, txtBtn, mdBtn, docxBtn);

    outputContainer.classList.remove("hidden");
    outputContainer.scrollIntoView({ behavior: "smooth" });
}

handleGenerateBlueprintStep=autoSaveWrapper(handleGenerateBlueprintStep),handleGenerateSkeleton=autoSaveWrapper(handleGenerateSkeleton),generateChapter=autoSaveWrapper(generateChapter),handleBlueprintNextStep=(t=>(...e)=>(t.apply(this,e),void saveProject()))(handleBlueprintNextStep),handleBlueprintGoBack=(t=>(...e)=>(t.apply(this,e),void saveProject()))(handleBlueprintGoBack),console.log("创世纪引擎 V16.3 脚本已加载完毕，随时可以开始创作。");

// =============================================================
// SECTION 9: EXPORTING LOGIC
// =============================================================

function convertHtmlToPlainText(html) {
    let tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;
    tempDiv.querySelectorAll('h3').forEach(h3 => {
        h3.textContent = `\n\n${h3.textContent}\n\n`;
    });
    tempDiv.querySelectorAll('p').forEach(p => {
        p.textContent = p.textContent + '\n';
    });
    return tempDiv.textContent || "";
}

function getStoryAsPlainText() {
    let fullText = `${generationState.title}\n\n`;
    for (let i = 0; i < generationState.chapterCount; i++) {
        const chapterInfo = getChapterInfoFromSkeleton(generationState.skeleton, i + 1);
        const chapterContent = generationState.storyChapters[i] || "(本章内容为空)";
        fullText += `${chapterInfo.title}\n\n${chapterContent}\n\n\n`;
    }
    return fullText;
}

function handleExportTxt() {
    const plainText = getStoryAsPlainText();
    const fileName = `${generationState.title || "无标题故事"}.txt`;
    handleExportTxtGeneric(plainText, fileName);
    showNotification("TXT文件已开始下载！", "success");
}

function handleExportMarkdown() {
    let markdownText = `# ${generationState.title}\n\n`;
    for (let i = 0; i < generationState.chapterCount; i++) {
        const chapterInfo = getChapterInfoFromSkeleton(generationState.skeleton, i + 1);
        const chapterContent = generationState.storyChapters[i] || "(本章内容为空)";
        const markdownContent = chapterContent.split('\n').filter(p => p.trim() !== '').join('\n\n');
        markdownText += `## ${chapterInfo.title}\n\n${markdownContent}\n\n`;
    }
    const fileName = `${generationState.title || "无标题故事"}.md`;
    handleExportTxtGeneric(markdownText, fileName, "text/markdown;charset=utf-8");
    showNotification("Markdown文件已开始下载！", "success");
}

function handleExportDocx() {
    showNotification("正在生成DOCX文件，请稍候...", "info");
    let docxHtml = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head><meta charset='utf-8'><title>${generationState.title}</title></head>
        <body>
            <h1>${generationState.title}</h1>
    `;
    for (let i = 0; i < generationState.chapterCount; i++) {
        const chapterInfo = getChapterInfoFromSkeleton(generationState.skeleton, i + 1);
        const chapterContent = generationState.storyChapters[i] || "<p>(本章内容为空)</p>";
        const formattedContent = chapterContent.split('\n').filter(p => p.trim() !== '').map(p => `<p>${p}</p>`).join('');
        docxHtml += `<h2>${chapterInfo.title}</h2>${formattedContent}`;
    }
    docxHtml += `</body></html>`;

    const fileName = `${generationState.title || "无标题故事"}.doc`;
    handleExportTxtGeneric(docxHtml, fileName, "application/msword;charset=utf-8");
    showNotification("DOCX文件已开始下载！", "success");
}