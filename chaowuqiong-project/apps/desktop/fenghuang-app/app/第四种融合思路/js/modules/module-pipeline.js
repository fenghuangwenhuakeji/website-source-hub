/*
 * 创世纪引擎 V76.4 - 完美解析版 (博士最终修正)
 * 模块: 创作流水线 (Pipeline)
 * ✨✨✨ (博士重构 - 完美解析) ✨✨✨
 * 1. 【核心修复】根据您的反馈，重写了 `prepareChaptersForWritingDesk` 函数中的大纲解析逻辑。
 * 2. 旧的 `split()` 方法已被废弃，现在采用更强大、更精确的 `matchAll()` 方法，通过正则表达式直接提取有效的章节块。
 * 3. 此项修改彻底解决了在特定大纲格式下，章节列表顶部会出现一个多余的、重复的"第 1 章"的问题。
 * 4. 保留了所有V3.0美学重制版的UI适配代码。
 */

let inspirationQueue = []; // 模块级变量，用于存储灵感队列
let isQueueRunning = false; // 队列状态锁

async function callAI(prompt, isJsonMode = false) {
    if (window.App && App.callApi) {
        return await App.callApi(prompt, isJsonMode);
    }
    throw new Error('API 接口未初始化，请确保主窗口已加载');
}

function initializePipeline() {
    document.getElementById('pipeline-add-to-queue-btn')?.addEventListener('click', addToQueue);
    document.getElementById('pipeline-clear-queue-btn')?.addEventListener('click', clearQueue);
    document.getElementById('start-pipeline-btn')?.addEventListener('click', () => startSinglePipeline());
    document.getElementById('start-queue-btn')?.addEventListener('click', startInspirationQueue);
    document.getElementById('stop-pipeline-btn')?.addEventListener('click', stopPipeline);
    
    populateHotTemplates(); // 加载热门灵感模板
    updateQueueDisplay(); // 初始化队列显示
}

// 将输入框中的灵感添加到队列
function addToQueue() {
    const inputArea = document.getElementById('pipeline-inspiration-input');
    if (!inputArea) return;
    const inspirations = inputArea.value.trim().split('\n');
    let addedCount = 0;
    inspirations.forEach(inspirationText => {
        if (inspirationText.trim()) {
            inspirationQueue.push(inspirationText.trim());
            addedCount++;
        }
    });

    if (addedCount > 0) {
        inputArea.value = '';
        updateQueueDisplay();
        showNotification(`已成功将 ${addedCount} 个灵感添加到队列！`, "success");
    } else {
        showNotification("请输入灵感内容！", "warning");
    }
}

// 清空队列
function clearQueue() {
    inspirationQueue = [];
    updateQueueDisplay();
    showNotification("灵感队列已清空。", "info");
}

// 更新队列UI显示
function updateQueueDisplay() {
    const queueListDiv = document.getElementById('pipeline-queue-list');
    if (!queueListDiv) return;

    if (inspirationQueue.length === 0) {
        queueListDiv.innerHTML = '<p class="placeholder-text">队列为空...</p>';
    } else {
        queueListDiv.innerHTML = '<ul style="list-style-position: inside; padding-left: 0;">' + inspirationQueue.map((item, index) => {
            const truncatedItem = item.length > 50 ? Utils.escapeHTML(item.substring(0, 50)) + '...' : Utils.escapeHTML(item);
            return `<li style="margin-bottom: 5px;"><strong>${index + 1}.</strong> ${truncatedItem}</li>`;
        }).join('') + '</ul>';
    }
}

// 加载热门灵感模板
function populateHotTemplates() {
    const container = document.getElementById('pipeline-template-container');
    const input = document.getElementById('pipeline-inspiration-input');
    if (!container || !input || !Knowledge.HOT_INSPIRATION_TEMPLATES) return;
    
    container.innerHTML = '';
    Knowledge.HOT_INSPIRATION_TEMPLATES.forEach(template => {
        const card = document.createElement('div');
        card.className = 'card'; // 使用通用的 card 样式
        card.style.cursor = 'pointer';
        card.style.marginBottom = '10px';
        card.innerHTML = `<h4>${Utils.escapeHTML(template.title)}</h4><p class="text-muted">${Utils.escapeHTML(template.brief.substring(0, 80))}...</p>`;
        card.addEventListener('click', () => {
            input.value += (input.value ? '\n' : '') + template.brief;
            input.scrollTop = input.scrollHeight;
            showNotification("模板已填充，请点击“加入队列”。", "info");
        });
        container.appendChild(card);
    });
}

// 启动灵感队列总控函数
async function startInspirationQueue() {
    if (isQueueRunning) {
        showNotification("灵感队列正在运行中！", "warning");
        return;
    }
    if (inspirationQueue.length === 0) {
        showNotification('灵感队列为空，请先添加灵感！', 'error');
        return;
    }

    isQueueRunning = true;
    const totalTasks = inspirationQueue.length;
    updatePipelineStatus('running', `队列启动 (1/${totalTasks})`);
    showNotification(`灵感队列已启动，共 ${totalTasks} 个任务。`, "success");

    const tasksToRun = [...inspirationQueue]; // 创建队列副本以进行处理
    inspirationQueue = []; // 清空主队列
    updateQueueDisplay();

    for (let i = 0; i < tasksToRun.length; i++) {
        if (!isQueueRunning) {
            showNotification("队列已手动中止。", "info");
            break;
        }
        const currentInspiration = tasksToRun[i];
        const taskNum = i + 1;
        updatePipelineStatus('running', `队列任务 (${taskNum}/${totalTasks}): ${currentInspiration.substring(0,20)}...`);
        showNotification(`正在处理队列任务 (${taskNum}/${totalTasks})...`, "info");
        
        try {
            const newTitle = currentInspiration.substring(0, 20).trim() || `自动任务-${taskNum}`;
            await startSinglePipeline(currentInspiration, newTitle);
            if (i < tasksToRun.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
        } catch (error) {
            showNotification(`队列任务 "${currentInspiration.substring(0, 20)}..." 处理失败: ${error.message}。队列已中止。`, 'error');
            stopPipeline();
            return;
        }
    }
    
    if (isQueueRunning) {
       showNotification("所有灵感队列任务已成功完成！", "success");
    }
    stopPipeline();
}

async function startSinglePipeline(inspirationOverride = null, titleOverride = null) {
    return new Promise(async (resolve, reject) => {
        updatePipelineStatus('running', '正在启动...');
        
        const inspiration = inspirationOverride ?? document.getElementById('pipeline-inspiration-input').value.split('\n')[0].trim();
        let novelTitle = titleOverride ?? document.getElementById('pipeline-novel-title').value;
        if (!novelTitle || !novelTitle.trim()) {
            novelTitle = '无题';
        }
       
        const totalChapters = parseInt(document.getElementById('pipeline-total-chapters').value, 10) || 10;
        const wordsPerChapter = parseInt(document.getElementById('pipeline-words-per-chapter').value, 10) || 2000;

        if (!inspiration.trim()) {
            showNotification('灵感不能为空！', 'error');
            updatePipelineStatus('idle', '空闲');
            return reject(new Error('灵感不能为空'));
        }
        
        updateState({
            pipeline: {
                ...getState().pipeline,
                isRunning: true,
                inspiration, novelTitle, totalChapters, wordsPerChapter,
                outline: '', 
                chapters: [],
            }
        });
        
        document.getElementById('pipeline-inspiration-input').value = inspiration;
        document.getElementById('pipeline-novel-title').value = novelTitle;
        
        try {
            await startOutlineGeneration();
            await prepareChaptersForWritingDesk();
            resolve();
        } catch (error) {
            console.error("单个流水线任务失败:", error);
            stopPipeline(); 
            reject(error);
        }
    });
}

function stopPipeline() {
    updatePipelineStatus('idle', '已中止');
    updateState({ pipeline: { ...getState().pipeline, isRunning: false }});
    isQueueRunning = false;
    hideLoading();
}

function updatePipelineStatus(status, label) {
    const labelEl = document.getElementById('pipeline-state-label');
    if(labelEl) labelEl.textContent = `流水线状态: ${label}`;

    const startBtn = document.getElementById('start-pipeline-btn');
    const startQueueBtn = document.getElementById('start-queue-btn');
    const stopBtn = document.getElementById('stop-pipeline-btn');
    const isRunning = (status === 'running');
    if(startBtn) startBtn.disabled = isRunning;
    if(startQueueBtn) startQueueBtn.disabled = isRunning;
    if(stopBtn) stopBtn.disabled = !isRunning;
}

async function startOutlineGeneration() {
    updatePipelineStatus('running', '构建世界观与大纲...');
    showLoading('AI正在深度思考，生成三弧光与章节大纲...');
    const outputContainer = document.getElementById('pipeline-output-container');
    outputContainer.innerHTML = `<p class="placeholder-text"><i class="fas fa-spinner fa-spin"></i> AI正在深度思考，生成三弧光与章节大纲...</p>`;

    const { inspiration, novelTitle, totalChapters } = getState().pipeline;
    const prompt = Prompts.generateWorldviewAndOutline(inspiration, novelTitle, totalChapters);

    try {
        const response = await callAI(prompt);
        await handleOutlineGenerationResponse(response);
    } catch (error) {
        console.error('Error generating outline:', error);
        showNotification(`大纲生成失败: ${error.message}`, 'error');
        updatePipelineStatus('error', '生成失败');
        outputContainer.innerHTML = `<p class="placeholder-text" style="color:var(--error-color)">大纲生成失败: ${error.message}</p>`;
        hideLoading();
        throw error; 
    }
}

async function handleOutlineGenerationResponse(response, isContinuation = false) {
    const outputContainer = document.getElementById('pipeline-output-container');
    if (!getState().pipeline.isRunning && !isQueueRunning) return;

    const state = getState();
    const continuationMarker = "``";
    
    let fullResponse = isContinuation 
        ? `${state.pipeline.outline.replace(continuationMarker, '').trim()}\n\n${response}`
        : response;

    updateState({ pipeline: { ...state.pipeline, outline: fullResponse } });
    
    const converter = new showdown.Converter({ smartIndentationFix: true, simpleLineBreaks: true });
    outputContainer.innerHTML = converter.makeHtml(fullResponse);

    const generatedChaptersCount = (fullResponse.match(/第\s*[一二三四五六七八九十百千万\d]+\s*章/g) || []).length;
    const totalChapters = getState().pipeline.totalChapters;

    if (fullResponse.includes(continuationMarker) && generatedChaptersCount < totalChapters) {
        showNotification(`已生成部分大纲，正在自动接续...(${generatedChaptersCount}/${totalChapters})`, 'info');
        showLoading(`AI正在接续思考...(${generatedChaptersCount}/${totalChapters})`);
        await continueOutlineGeneration();
    }
}

async function continueOutlineGeneration() {
    if (!getState().pipeline.isRunning && !isQueueRunning) return;
    updatePipelineStatus('running', '自动接续生成...');
    
    const state = getState();
    const continuationMarker = "``";
    const currentOutline = state.pipeline.outline.replace(continuationMarker, '').trim();
    const generatedChapters = (currentOutline.match(/第\s*[一二三四五六七八九十百千万\d]+\s*章/g) || []).length;
    const remainingPlan = `请从第 ${generatedChapters + 1} 章开始，继续生成直到第 ${state.pipeline.totalChapters} 章。`;
    const prompt = Prompts.continueOutline(currentOutline, remainingPlan);

    try {
        const response = await callAI(prompt);
        await handleOutlineGenerationResponse(response, true);
    } catch (error) {
        console.error('Error continuing outline:', error);
        showNotification(`接续生成失败: ${error.message}`, 'error');
        updatePipelineStatus('error', '接续失败');
        hideLoading();
        throw error;
    }
}

async function prepareChaptersForWritingDesk() {
    updatePipelineStatus('running', '正在解析大纲...');
    const state = getState();
    const fullOutlineText = state.pipeline.outline;
    
    const outlineParts = fullOutlineText.split(/###\s*(章节大纲|生生不息大纲)/);
    const outlineText = outlineParts.length > 1 ? outlineParts[outlineParts.length - 1] : fullOutlineText;

    if (!outlineText || !outlineText.trim()) {
        const msg = '未能找到有效的章节大纲内容进行解析。';
        showNotification(msg, 'error');
        throw new Error(msg);
    }

    // ✨✨✨ 博士核心修复：采用更强大的正则表达式，直接提取所有章节块 ✨✨✨
    const chapterRegex = /(第\s*[一二三四五六七八九十百千万\d]+\s*章[\s\S]*?)(?=(?:第\s*[一二三四五六七八九十百千万\d]+\s*章)|$)/g;
    const matches = [...outlineText.matchAll(chapterRegex)];
    const rawChapters = matches.map(match => match[1].trim()).filter(part => part);

    if (rawChapters.length === 0) {
        const msg = '无法从大纲中解析出任何章节！请检查AI生成的内容格式是否包含“第 N 章”。';
        showNotification(msg, 'error');
        throw new Error(msg);
    }

    const chapters = rawChapters.map(rawChapterText => {
        const text = rawChapterText.trim();
        const titleMatch = text.match(/^(.*?)(?:\r\n|\n|$)/);
        const title = titleMatch ? titleMatch[1].replace(/\*|#|：|:/g, '').trim() : "未命名章节";
        return { 
            title: title,      
            outline: text,            
            content: '', 
            status: 'pending'
        };
    }).filter(chap => chap.title);

    updateState({ pipeline: { ...state.pipeline, chapters } });

    showNotification(`大纲解析完毕！共找到 ${chapters.length} 个章节，即将传送至写作台...`, 'success');
    hideLoading();
    switchView('writing-desk-panel');
    if (typeof renderChapterList === 'function') {
        renderChapterList();
    }
}