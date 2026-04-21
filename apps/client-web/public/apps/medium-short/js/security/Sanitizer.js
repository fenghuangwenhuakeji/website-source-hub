/**
 * Security Layer - Sanitizer
 * 负责所有输入输出的清洗，防止 XSS 攻击
 */
export class Sanitizer {
    static escapeHTML(str) {
        if (!str) return '';
        return str.replace(/[&<>'"/]/g, (tag) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;',
            '/': '&#x2F;'
        }[tag]));
    }

    static sanitizeContent(html) {
        // 简单实现，生产环境建议使用 DOMPurify
        // 这里我们主要防止明显的 script 注入
        return html.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "")
                   .replace(/on\w+="[^"]*"/g, "");
    }
}
