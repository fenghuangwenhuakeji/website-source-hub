// 文件路径: 网页promax/js/core/chat.js
// 描述: 包含所有与聊天交互、消息发送和接收相关的核心功能。

let abortController = null;
let userInputHistory = [];
let historyIndex = -1;

async function handleSendMessage() {
    const messageInput = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-btn');
    const chatHistory = document.getElementById('chat-history');

    const messageText = messageInput.value.trim();
    if (!messageText || !sendBtn.isConnected) return;

    const config = getUnifiedApiConfig();
    const provider = config.provider || 'gemini';
    if (!config.apiKey && ['gemini', 'openai', 'deepseek', 'siliconflow', 'claude', 'custom'].includes(provider)) {
        showNotification('请先在设置中配置您的API Key！', 'error');
        const modal = document.getElementById('api-settings-modal');
        if (modal) modal.classList.add('visible');
        return;
    }

    addMessageToHistory('user', messageText);

    if (!userInputHistory.includes(messageText)) {
        userInputHistory.unshift(messageText);
    }
    historyIndex = -1;

    messageInput.value = '';
    messageInput.style.height = '40px';
    
    toggleButtons(true);
    abortController = new AbortController();

    const startTime = performance.now();
    const { messageContentElement, cursorElement, footerElement } = createStreamingMessage();
    let fullResponse = "";

    // 构建上下文
    const contextLength = localStorage.getItem('context_length') || '10';
    let historyMessages = Array.from(chatHistory.querySelectorAll('.message'));

    if (contextLength !== 'all') {
        historyMessages = historyMessages.slice(-parseInt(contextLength));
    }
    
    let contextPrompt = "";
    historyMessages.forEach(msgEl => {
        const sender = msgEl.classList.contains('user') ? 'User' : 'Assistant';
        const content = msgEl.querySelector('.content').dataset.rawText || msgEl.querySelector('.content').innerText;
        contextPrompt += `${sender}: ${content}\n\n`;
    });
    
    const finalPrompt = contextPrompt; // The last message is already added to history, so it's part of the context.
    console.log("强化后的完整提示词:", finalPrompt);

    await callApiStream(
        finalPrompt,
        abortController.signal,
        (chunk) => {
            fullResponse += chunk;
            const thinkingEndMarker = "\[THINKING_END\]";
            let thinkingPart = "";
            let mainContentPart = fullResponse;

            if (fullResponse.includes(thinkingEndMarker)) {
                const parts = fullResponse.split(thinkingEndMarker);
                thinkingPart = parts[0];
                mainContentPart = parts.slice(1).join(thinkingEndMarker);
            }

            const thinkingHtml = DOMPurify.sanitize(marked.parse(thinkingPart));
            const mainHtml = DOMPurify.sanitize(marked.parse(mainContentPart + " "));
            
            const thinkingContainer = messageContentElement.parentElement.querySelector('.thinking-process');
            if (thinkingPart.trim() && thinkingContainer && thinkingContainer.style.display !== 'block') {
                thinkingContainer.style.display = 'block';
            }
            if (thinkingContainer) {
                 thinkingContainer.innerHTML = thinkingHtml;
            }
            
            messageContentElement.innerHTML = mainHtml;
            messageContentElement.appendChild(cursorElement);
            chatHistory.scrollTop = chatHistory.scrollHeight;
        },
        (aborted = false) => {
            const endTime = performance.now();
            const duration = ((endTime - startTime) / 1000).toFixed(2);

            if (footerElement) {
                footerElement.textContent = aborted ? `已停止 | 用时 ${duration} 秒` : `生成完毕 | 用时 ${duration} 秒`;
            }

            const thinkingEndMarker = "\[THINKING_END\]";
            let thinkingPart = "";
            let mainContentPart = fullResponse;

            if (fullResponse.includes(thinkingEndMarker)) {
                const parts = fullResponse.split(thinkingEndMarker);
                thinkingPart = parts[0];
                mainContentPart = parts.slice(1).join(thinkingEndMarker);
            }

            const finalThinkingHtml = DOMPurify.sanitize(marked.parse(thinkingPart));
            const finalMainHtml = DOMPurify.sanitize(marked.parse(mainContentPart));

            const thinkingContainer = messageContentElement.parentElement.querySelector('.thinking-process');
            const controlsContainer = messageContentElement.parentElement.querySelector('.message-controls');

            if (thinkingPart.trim() && thinkingContainer) {
                thinkingContainer.innerHTML = finalThinkingHtml;
                thinkingContainer.style.display = 'none';
                
                if (controlsContainer && !controlsContainer.querySelector('.thinking-toggle-btn')) {
                    const thinkingToggleHtml = `<button class="thinking-toggle-btn" title="显示/隐藏思考过程"><i class="fas fa-brain"></i></button>`;
                    const copyButtonHtml = `<button class="copy-message-btn" title="复制内容"><i class="fas fa-copy"></i></button>`;
                    controlsContainer.innerHTML = thinkingToggleHtml + copyButtonHtml;

                    const toggleBtn = controlsContainer.querySelector('.thinking-toggle-btn');
                    toggleBtn.addEventListener('click', () => {
                        const isHidden = thinkingContainer.style.display === 'none';
                        thinkingContainer.style.display = isHidden ? 'block' : 'none';
                        toggleBtn.classList.toggle('active', isHidden);
                    });

                    const copyBtn = controlsContainer.querySelector('.copy-message-btn');
                     copyBtn.addEventListener('click', () => {
                        const contentToCopy = messageContentElement.dataset.rawText || messageContentElement.innerText;
                        navigator.clipboard.writeText(contentToCopy).then(() => {
                            showNotification('原始文本已复制到剪贴板！', 'success');
                        }).catch(() => {
                            showNotification('复制失败！', 'error');
                        });
                    });
                }

            } else if (thinkingContainer) {
                thinkingContainer.style.display = 'none';
                 if (controlsContainer && !controlsContainer.querySelector('.copy-message-btn')) {
                    const copyButtonHtml = `<button class="copy-message-btn" title="复制内容"><i class="fas fa-copy"></i></button>`;
                    controlsContainer.innerHTML = copyButtonHtml;
                     const copyBtn = controlsContainer.querySelector('.copy-message-btn');
                     copyBtn.addEventListener('click', () => {
                        const contentToCopy = messageContentElement.dataset.rawText || messageContentElement.innerText;
                        navigator.clipboard.writeText(contentToCopy).then(() => {
                            showNotification('原始文本已复制到剪贴板！', 'success');
                        }).catch(() => {
                            showNotification('复制失败！', 'error');
                        });
                    });
                 }
            }

            messageContentElement.innerHTML = finalMainHtml;
            messageContentElement.dataset.rawText = mainContentPart;
            
            const codeBlocks = messageContentElement.querySelectorAll('pre');
            codeBlocks.forEach(addCopyButtonToCodeBlock);

            if (aborted && fullResponse.trim() === "") {
                messageContentElement.parentElement.remove();
            }
            toggleButtons(false);
        },
        (error) => {
            const messageContentElement = document.querySelector('.message.gemini:last-child .content');
            const footerElement = document.querySelector('.message.gemini:last-child .message-footer');
            if (footerElement) {
                footerElement.textContent = '生成失败';
                footerElement.style.color = 'var(--error-color)';
            } else if (messageContentElement) {
                messageContentElement.parentElement.remove();
                addMessageToHistory('error', `博士非常抱歉，与AI核心通讯时发生了错误：\n\n\`\`\`\n${error.message}\n\`\`\``);
            }
            toggleButtons(false);
        }
    );
}

/**
 * 切换发送和停止按钮的可见性，并控制输入框的禁用状态。
 * @param {boolean} isGenerating - 是否正在生成内容。
 */
function toggleButtons(isGenerating) {
    const sendBtn = document.getElementById('send-btn');
    const stopBtn = document.getElementById('stop-btn');
    const messageInput = document.getElementById('message-input');

    if (isGenerating) {
        sendBtn.style.display = 'none';
        stopBtn.style.display = 'inline-flex';
        messageInput.disabled = true;
    } else {
        sendBtn.style.display = 'inline-flex';
        stopBtn.style.display = 'none';
        messageInput.disabled = false;
        messageInput.focus();
    }
}

/**
 * 停止当前正在进行的AI生成任务。
 */
function stopGeneration() {
    if (abortController) {
        abortController.abort();
        showNotification("已停止生成。", "info");
    }
}