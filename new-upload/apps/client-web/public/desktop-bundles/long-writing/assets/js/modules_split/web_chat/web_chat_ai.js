// 网页对话 AI 扩展入口
// v3.6 起，网页对话主流程已收敛到 web_chat_core.js。
// 这里保留少量旧接口别名，避免其他模块调用时报错。
Object.assign(Modules.web_chat, {
    quickAction(action) {
        const map = {
            '续写': '请接着写下面内容：\n\n',
            '润色': '请润色下面内容，保留原意：\n\n',
            '扩写': '请扩写下面内容，增加细节：\n\n',
            '翻译': '请翻译下面内容：\n\n',
            '总结': '请总结下面内容：\n\n'
        };
        this.setInput(map[action] || '');
    },

    summarizeContent() {
        this.fillPrompt('总结');
    },

    diagnoseContent() {
        this.setInput('请诊断下面内容的问题，并给出修改建议：\n\n' + (document.getElementById('webchat-input')?.value || ''));
    },

    analyzeOutline() {
        this.setInput('请分析下面大纲的结构、节奏和问题：\n\n');
    },

    analyzeRelations() {
        this.setInput('请分析下面内容里的关系、冲突和潜在线索：\n\n');
    }
});
