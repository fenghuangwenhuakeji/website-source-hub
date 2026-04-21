// 文件路径: js/core/02_通用工具.js
// 描述: (V44.1 博士终极梦想简化版 - 导出增强) 
// 1. 【博士梦想实现版】formatTextForExport 函数现在也会自动包含故事蓝图，与手动导出逻辑保持一致。
// 2. downloadFile 函数被微调，确保导出的文件结构更加清晰。

function showNotification(message, type = 'info') {
    const container = document.getElementById('notification-container');
    if (!container) return;
    const notification = document.createElement('div');
    notification.className = `notification`;
    notification.style.borderLeftColor = `var(--${type}-color, var(--border-color))`;
    notification.textContent = message;
    container.appendChild(notification);
    setTimeout(() => notification.remove(), 4000);
}

function parseAiJson(text) {
    let jsonString = text.trim();
    const markdownMatch = jsonString.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (markdownMatch && markdownMatch[1]) {
        jsonString = markdownMatch[1].trim();
    } else {
        const firstBrace = jsonString.indexOf('{');
        const lastBrace = jsonString.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace > firstBrace) {
            jsonString = jsonString.substring(firstBrace, lastBrace + 1);
        }
    }
    try {
        return JSON.parse(jsonString);
    } catch (e) {
        console.error("Failed to parse JSON:", e);
        throw new Error("AI返回的内容不是有效的JSON格式。");
    }
}

function sanitizeForTemplate(htmlString) {
    if (!htmlString || typeof htmlString !== 'string') return "";
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlString;
    tempDiv.querySelectorAll('p, div, h4, h5, li, br, hr').forEach(el => {
        el.insertAdjacentHTML('afterend', '\n');
    });
    return tempDiv.textContent || tempDiv.innerText || "";
}

function downloadFile(content, fileName, format) {
    let blobType;
    switch(format) {
        case 'md': blobType = 'text/markdown;charset=utf-8'; break;
        case 'doc': blobType = 'application/msword;charset=utf-8'; break;
        default: blobType = 'text/plain;charset=utf-8'; break;
    }
    // downloadFile不再添加标题，交由格式化函数处理
    const blob = new Blob([`\uFEFF${content}`], { type: blobType }); 
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${fileName}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
}


async function streamTextToTextarea(textarea, text, delay = 5, clear = true) {
    if (clear) textarea.value = '';
    for (let i = 0; i < text.length; i++) {
        textarea.value += text[i];
        textarea.scrollTop = textarea.scrollHeight;
        if (i % 10 === 0) { // Reduce updates for performance
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

async function streamTextToElement(element, text, delay = 5, clear = true) {
    if (clear) element.innerHTML = '';
    const fragments = text.match(/<[^>]+>|[^<]+/g) || [text];
    for (const fragment of fragments) {
        element.innerHTML += fragment;
        element.scrollTop = element.scrollHeight;
        await new Promise(resolve => setTimeout(resolve, delay));
    }
}

// 博士修改核心：此函数现在也接收蓝图，并构建完整的导出文本
function formatTextForExport(chapters, blueprint = '', novelTitle = '未命名作品') {
    if (!chapters || chapters.length === 0) {
        return "";
    }
    
    // 添加故事蓝图
    let blueprintSection = '';
    if (blueprint && blueprint.trim().length > 0) {
        blueprintSection = `【故事蓝图】\n========================================\n${blueprint.trim()}\n========================================\n\n`;
    }
    
    let rawText = '';
    for (let i = 0; i < chapters.length; i++) {
        const title = `第 ${i + 1} 章\n\n`;
        const content = chapters[i] || "(本章内容为空)";
        rawText += title + content + '\n\n\n';
    }
    
    showNotification("正在准备导出文件...", "info");
    
    // 博士修改：将标题也整合进来，形成最终的完整文本
    const fullContent = `${blueprintSection}《${novelTitle}》\n\n${rawText.trim()}`;
    return fullContent;
}