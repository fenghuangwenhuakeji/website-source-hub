/**
 * @file 02_utils.js
 * @description (V71.0 梦想最终修正) 核心-通用工具函数。
 * 包含通知、加载动画、HTML转义、UUID生成和AI流式文本渲染等核心辅助功能。
 * ✨✨✨ (博士重构 - 梦想实现 V1) ✨✨✨
 * 1. 【梦想实现】新增了 `exportTextAsFile` 工具函数，用于将任何文本内容导出为文件，实现代码复用。
 */

/**
 * 在屏幕右上角显示一个短暂的通知消息。
 * @param {string} message - 要显示的消息。
 * @param {string} [type='info'] - 通知的类型 ('info', 'success', 'warning', 'error')。
 */
function showNotification(message, type = 'info') {
    const container = document.getElementById('notification-container');
    if (!container) {
        console.error('Notification container not found!');
        return;
    }
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `<i class="fas fa-info-circle"></i> ${message}`; // 添加图标
    container.appendChild(notification);
    setTimeout(() => {
        notification.remove();
    }, 4000);
}

/**
 * 显示全局加载遮罩。
 * @param {string} text - 要在加载动画下方显示的文本。
 */
function showLoading(text = '处理中...') {
    const overlay = document.getElementById('loading-overlay');
    const loadingText = document.getElementById('loading-text');
    if (overlay) {
        if (loadingText) {
            loadingText.textContent = text;
        }
        overlay.classList.add('active');
    }
}

/**
 * 隐藏全局加载遮罩。
 */
function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.classList.remove('active');
    }
}


const Utils = {
    /**
     * 生成一个符合 v4 规范的 UUID。
     * @returns {string} A UUID string.
     */
    generateUUID: () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    }),

    /**
     * 转义HTML特殊字符以防止XSS攻击。
     * @param {string} str - 需要转义的字符串。
     * @returns {string} The escaped HTML string.
     */
    escapeHTML: (str) => {
        if (typeof str !== 'string') return '';
        const p = document.createElement('p');
        p.textContent = str;
        return p.innerHTML;
    },

    /**
     * ✨ 新增：通用的文本导出函数
     * @param {string} content - 要导出的文本内容.
     * @param {string} filename - 导出的文件名.
     */
    exportTextAsFile: (content, filename) => {
        const blob = new Blob([`\uFEFF${content}`], { type: 'text/plain;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showNotification(`文件“${filename}”已成功导出！`, "success");
    },

    /**
     * 将AI的流式响应（Reader对象）实时渲染到指定的HTML元素中。
     * @param {HTMLElement} targetElement - 用于显示结果的HTML元素。
     * @param {ReadableStreamDefaultReader} reader - API返回的流式Reader对象。
     * @param {boolean} [useMarkdown=false] - 是否将最终文本解析为Markdown。
     * @returns {Promise<string>} A promise that resolves with the full text content.
     */
    streamTextToElement: async (targetElement, reader, useMarkdown = false) => {
        if (!targetElement) return;
        targetElement.innerHTML = '';
        const decoder = new TextDecoder();
        let buffer = '';
        let fullText = '';
        const converter = useMarkdown ? new showdown.Converter({ ghCompatibleHeaderId: true, simpleLineBreaks: true }) : null;

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            
            let lines = buffer.split('\n');
            buffer = lines.pop(); // 保留可能不完整的最后一行

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    try {
                        const json = JSON.parse(line.substring(6));
                        let chunk = json.candidates?.[0]?.content?.parts?.[0]?.text || 
                                    json.choices?.[0]?.delta?.content ||
                                    (json.type === 'content_block_delta' ? json.delta.text : '');
                        if (chunk) {
                            fullText += chunk;
                        }
                    } catch (e) { /* 忽略无法解析的JSON行 */ }
                }
            }
            
            const displayText = fullText + '...';
            if (useMarkdown && converter) {
                targetElement.innerHTML = converter.makeHtml(displayText);
            } else {
                targetElement.textContent = displayText;
            }
            targetElement.scrollTop = targetElement.scrollHeight;
        }
        
        if (useMarkdown && converter) {
            targetElement.innerHTML = converter.makeHtml(fullText);
        } else {
            targetElement.textContent = fullText;
        }
        targetElement.scrollTop = targetElement.scrollHeight;
        return fullText;
    }
};