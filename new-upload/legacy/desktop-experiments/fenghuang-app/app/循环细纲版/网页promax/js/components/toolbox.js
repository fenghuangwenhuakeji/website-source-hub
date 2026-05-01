// 文件路径: 网页promax/js/components/toolbox.js
// 描述: 负责初始化和处理所有工具箱内的功能模态框。

/**
 * 初始化所有工具箱功能。
 */
function initializeToolbox() {
    initializeFormatting();
    initializeBatchProcessor();
    initializeCodeAssistant();
    initializeIntroGenerator();
    initializeInspirationGenerator();
    // 其他模态框的初始化现在由 modal-handlers.js 统一处理
}

/**
 * 初始化自动排版和润色功能。
 */
function initializeFormatting() {
    const modal = document.getElementById('format-modal');
    if (!modal) return;
    const openBtn = document.getElementById('format-btn');
    const closeBtn = document.getElementById('close-format-btn');
    const confirmBtn = document.getElementById('confirm-format-btn');

    openBtn.addEventListener('click', () => modal.classList.add('visible'));
    closeBtn.addEventListener('click', () => modal.classList.remove('visible'));
    modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('visible'); });
    confirmBtn.addEventListener('click', () => {
        applyFormattingAndPolishing();
        modal.classList.remove('visible');
    });
}

async function applyFormattingAndPolishing() {
    const formatParagraphs = document.getElementById('format-paragraphs').checked;
    const formatPunctuation = document.getElementById('format-punctuation').checked;
    const formatGrammar = document.getElementById('format-grammar').checked;
    const highlightTerms = document.getElementById('format-highlight-terms').checked;
    const generateSummary = document.getElementById('format-generate-summary').checked;
    const polishStyle = document.getElementById('polish-style').value;
    const polishTarget = document.getElementById('polish-target').value;

    let messagesToProcess = [];
    const allMessages = Array.from(document.getElementById('chat-history').querySelectorAll('.message:not(.error)'));

    if (polishTarget === 'last-message') {
        const lastMsg = allMessages[allMessages.length - 1];
        if (lastMsg) messagesToProcess.push(lastMsg);
    } else if (polishTarget === 'recent-messages') {
        messagesToProcess = allMessages.slice(-5);
    } else {
        messagesToProcess = allMessages;
    }

    if (messagesToProcess.length === 0) {
        showNotification('没有可润色的消息。', 'info');
        return;
    }

    const targetMessageElement = messagesToProcess[messagesToProcess.length - 1];
    const contentElement = targetMessageElement.querySelector('.content');
    const originalText = contentElement.dataset.rawText || contentElement.innerText;

    let prompt = `请根据以下要求，对提供的文本进行处理。\n\n`;
    if (formatParagraphs) prompt += "- 优化段落结构，使其更清晰易读。\n";
    if (formatPunctuation) prompt += "- 修正和优化标点符号。\n";
    if (formatGrammar) prompt += "- 检查并修正语法错误。\n";
    if (highlightTerms) prompt += "- 将文中的关键术语或概念用 \`**\` 符号进行高亮标记。\n";
    if (generateSummary) prompt += "- 在文章末尾，以 '摘要：' 开头，生成一段50-100字的内容摘要。\n";
    prompt += `- 整体风格润色为：${polishStyle}。\n\n`;
    prompt += `请只返回处理后的文本，不要包含任何额外的解释或标题。\n\n`;
    prompt += `待处理文本：\n\`\`\`\n${originalText}\n\`\`\``;

    showNotification('正在请求AI进行润色...', 'info');
    
    document.getElementById('message-input').value = prompt;
    handleSendMessage();
}

/**
 * 初始化批量处理功能。
 */
function initializeBatchProcessor() {
    const modal = document.getElementById('batch-process-modal');
    if (!modal) return;
    const openBtn = document.getElementById('batch-process-btn');
    const closeBtn = document.getElementById('close-batch-process-btn');
    const startBtn = document.getElementById('start-batch-process-btn');
    const templateSelect = document.getElementById('batch-prompt-template');

    openBtn.addEventListener('click', () => {
        templateSelect.innerHTML = '';
        if (typeof customPrompts !== 'undefined' && customPrompts.length > 0) {
            customPrompts.forEach((p, index) => {
                const option = document.createElement('option');
                option.value = index;
                option.textContent = p.title;
                templateSelect.appendChild(option);
            });
        } else {
             templateSelect.innerHTML = '<option value="">无可用模板</option>';
        }
        modal.classList.add('visible');
    });

    closeBtn.addEventListener('click', () => modal.classList.remove('visible'));
    modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('visible'); });
    
    startBtn.addEventListener('click', () => {
        startBatchProcessing();
        modal.classList.remove('visible');
    });
}

async function startBatchProcessing() {
    const promptsInput = document.getElementById('batch-prompts-input');
    const templateSelect = document.getElementById('batch-prompt-template');
    const chatHistory = document.getElementById('chat-history');

    const titles = promptsInput.value.trim().split('\n').filter(p => p.trim() !== '');
    const selectedTemplateIndex = templateSelect.value;

    if (titles.length === 0 || !selectedTemplateIndex || typeof customPrompts === 'undefined' || !customPrompts[selectedTemplateIndex]) {
        showNotification('请输入至少一个题目并选择一个有效的提示词模板！', 'error');
        return;
    }

    showNotification(`批量任务开始，共 ${titles.length} 个题目。`, 'info');

    const startBtn = document.getElementById('start-batch-process-btn');
    startBtn.disabled = true;
    startBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 处理中...';

    const basePromptTemplate = customPrompts[selectedTemplateIndex].prompt;

    for (let i = 0; i < titles.length; i++) {
        const title = titles[i].trim();
        const finalPrompt = `${basePromptTemplate}\n\n---\n\n请基于以上模板，处理以下主题：\n\n${title}`;

        // 1. 在UI中显示用户指令
        addMessageToHistory('user', finalPrompt);
        chatHistory.scrollTop = chatHistory.scrollHeight;
        showNotification(`正在处理第 ${i + 1} / ${titles.length} 个: ${title.substring(0, 20)}...`, 'info');

        // 2. 创建流式消息占位符
        const { messageContentElement, cursorElement, footerElement } = createStreamingMessage();
        let fullResponse = "";
        let hasError = false;

        // 3. 调用API并流式更新UI
        await new Promise((resolve) => {
            const tempAbortController = new AbortController();
            callApiStream(
                finalPrompt,
                tempAbortController.signal,
                (chunk) => { // onChunk
                    fullResponse += chunk;
                    messageContentElement.innerHTML = DOMPurify.sanitize(marked.parse(fullResponse + " "));
                    messageContentElement.appendChild(cursorElement);
                    chatHistory.scrollTop = chatHistory.scrollHeight;
                },
                (aborted = false) => { // onComplete
                    if (footerElement) {
                        footerElement.textContent = aborted ? `已停止` : `生成完毕`;
                    }
                    messageContentElement.innerHTML = DOMPurify.sanitize(marked.parse(fullResponse));
                    messageContentElement.dataset.rawText = fullResponse;
                    messageContentElement.querySelectorAll('pre').forEach(addCopyButtonToCodeBlock);
                    if (aborted) hasError = true;
                    resolve();
                },
                (error) => { // onError
                    addMessageToHistory('error', `处理题目“${title}”时出错: \n\n\`\`\`\n${error.message}\n\`\`\``);
                    hasError = true;
                    resolve();
                }
            );
        });

        // 4. 保存项目
        if (!hasError && fullResponse.trim()) {
            const projectName = title.substring(0, 50).trim() || `批量任务-${i + 1}`;
            const messagesToSave = [
                { sender: 'user', content: finalPrompt, thinking: null },
                { sender: 'gemini', content: messageContentElement.innerHTML, thinking: null }
            ];
            await saveCurrentProject(projectName, `基于模板“${customPrompts[selectedTemplateIndex].title}”自动生成`, '批量处理', messagesToSave);
        } else if (hasError) {
            showNotification(`处理“${title.substring(0, 20)}...”时出错，已跳过。`, 'error');
        } else {
            showNotification(`“${title.substring(0, 20)}...”生成内容为空，已跳过。`, 'info');
        }

        // 任务之间的延迟
        if (i < titles.length - 1) {
            await new Promise(res => setTimeout(res, 2000)); // 增加延迟以便观察
        }
    }

    startBtn.disabled = false;
    startBtn.innerHTML = '<i class="fas fa-play-circle"></i> 开始处理';
    promptsInput.value = '';
    showNotification('所有批量任务已处理完毕！', 'success');
    await renderProjectList();
}


/**
 * 初始化代码助手功能。
 */
function initializeCodeAssistant() {
    const modal = document.getElementById('code-assistant-modal');
    if (!modal) return;
    const openBtn = document.getElementById('code-assistant-btn');
    const closeBtn = modal.querySelector('.close-btn');
    const generateBtn = document.getElementById('generate-code-btn');

    openBtn.addEventListener('click', () => modal.classList.add('visible'));
    closeBtn.addEventListener('click', () => modal.classList.remove('visible'));
    modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('visible'); });
    generateBtn.addEventListener('click', () => {
        handleGenerateCode();
        modal.classList.remove('visible');
    });
}

function handleGenerateCode() {
    const language = document.getElementById('code-language').value;
    const codeType = document.getElementById('code-type').value;
    const description = document.getElementById('code-description').value;
    const includeComments = document.getElementById('code-include-comments').checked;
    const includeTests = document.getElementById('code-include-tests').checked;
    const includeExamples = document.getElementById('code-include-examples').checked;

    if (!description.trim()) {
        showNotification('需求描述不能为空！', 'error');
        return;
    }

    const codePromptTemplate = promptMap['智能代码生成器（结构化）'];
    if (!codePromptTemplate) {
        showNotification('未找到代码生成器模板！', 'error');
        return;
    }

    let additionalRequirements = '请确保代码：\n';
    if (includeComments) additionalRequirements += '- 包含详细注释\n';
    if (includeTests) additionalRequirements += '- 包含测试用例\n';
    if (includeExamples) additionalRequirements += '- 包含使用示例\n';
    if (additionalRequirements === '请确保代码：\n') additionalRequirements = '';

    let finalPrompt = codePromptTemplate
        .replace('{language}', language)
        .replace('{codeType}', codeType)
        .replace('{description}', description)
        .replace('{additionalRequirements}', additionalRequirements);

    document.getElementById('message-input').value = finalPrompt;
    handleSendMessage();
    showNotification('代码助手已启动，正在生成代码...', 'info');
}

/**
 * 初始化导语生成器功能。
 */
function initializeIntroGenerator() {
    const modal = document.getElementById('intro-generator-modal');
    if (!modal) return;
    const openBtn = document.getElementById('intro-generator-btn');
    const closeBtn = modal.querySelector('.close-btn');
    const generateBtn = document.getElementById('generate-intro-btn');

    openBtn.addEventListener('click', () => modal.classList.add('visible'));
    closeBtn.addEventListener('click', () => modal.classList.remove('visible'));
    modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('visible'); });
    generateBtn.addEventListener('click', () => {
        handleGenerateIntro();
        modal.classList.remove('visible');
    });
}

async function handleGenerateIntro() {
    const contentType = document.getElementById('intro-content-type').value;
    const style = document.getElementById('intro-style').value;
    const length = document.getElementById('intro-length').value;
    const coreContent = document.getElementById('intro-core-content').value;
    const customPrompt = document.getElementById('intro-custom-prompt').value;
    const autoLoad = document.getElementById('intro-auto-load').checked;

    if (!coreContent.trim()) {
        showNotification('核心内容不能为空！', 'error');
        return;
    }

    const introPromptTemplate = promptMap['结构化导语生成器'];
    if (!introPromptTemplate) {
        showNotification('未找到导语生成器模板！', 'error');
        return;
    }

    let finalPrompt = introPromptTemplate
        .replace('{contentType}', contentType)
        .replace('{style}', style)
        .replace('{length}', length)
        .replace('{coreContent}', coreContent)
        .replace('{customPrompt}', customPrompt || '无');

    if (autoLoad) {
        document.getElementById('message-input').value = finalPrompt;
        handleSendMessage();
        showNotification('导语生成任务已发送...', 'info');
    } else {
        let fullResponse = "";
        const tempAbortController = new AbortController();
        showNotification('正在生成导语...', 'info');
        await callApiStream(
            finalPrompt,
            tempAbortController.signal,
            (chunk) => { fullResponse += chunk; },
            () => {
                navigator.clipboard.writeText(fullResponse.trim());
                showNotification('导语已生成并复制到剪贴板！', 'success');
            },
            (error) => {
                showNotification(`导语生成失败: ${error.message}`, 'error');
            }
        );
    }
}

/**
 * 初始化灵感生成器功能。
 */
function initializeInspirationGenerator() {
    const modal = document.getElementById('inspiration-generator-modal');
    if (!modal) return;
    const openBtn = document.getElementById('inspiration-generator-btn');
    const closeBtn = modal.querySelector('.close-btn');
    const generateBtn = document.getElementById('generate-inspiration-btn');

    openBtn.addEventListener('click', () => modal.classList.add('visible'));
    closeBtn.addEventListener('click', () => modal.classList.remove('visible'));
    modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('visible'); });
    generateBtn.addEventListener('click', () => {
        handleGenerateInspiration();
        modal.classList.remove('visible');
    });
}

function handleGenerateInspiration() {
    const type = document.getElementById('inspiration-type').value;
    const genre = document.getElementById('inspiration-genre').value;
    const keywords = document.getElementById('inspiration-keywords').value;
    const elements = document.getElementById('inspiration-elements').value;
    const customPrompt = document.getElementById('inspiration-custom-prompt').value;
    const autoLoad = document.getElementById('inspiration-auto-load').checked;
    const multipleIdeas = document.getElementById('inspiration-multiple-ideas').checked;

    if (!keywords.trim() && !elements.trim()) {
        showNotification('关键词和核心元素至少需要填写一项！', 'error');
        return;
    }

    const inspirationPromptTemplate = promptMap['结构化灵感生成器'];
    if (!inspirationPromptTemplate) {
        showNotification('未找到灵感生成器模板！', 'error');
        return;
    }

    let finalPrompt = inspirationPromptTemplate
        .replace('{type}', type)
        .replace('{genre}', genre)
        .replace('{keywords}', keywords || '无')
        .replace('{elements}', elements)
        .replace('{multipleIdeas}', multipleIdeas ? '生成3个不同的创意点子' : '生成1个集中的创意点子')
        .replace('{customPrompt}', customPrompt || '无');

    document.getElementById('message-input').value = finalPrompt;
    if (autoLoad) {
        handleSendMessage();
        showNotification('灵感通道已激活，正在生成灵感...', 'info');
    } else {
        showNotification('灵感提示词已生成并加载到输入框！', 'success');
    }
}