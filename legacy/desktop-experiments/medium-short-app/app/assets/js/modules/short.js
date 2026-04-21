// 12. SHORT STORY & TOOLS — Shared helpers
Modules.short = {
    openPromptModal: async (type) => {
        Modules.short.currentPromptType = type;
        let stored = null;
        try {
            const record = await DB.get('prompts', type);
            if(record) stored = record.content;
        } catch(e) { console.error(e); }

        let defaultVal = Modules.short.defaultPrompts ? Modules.short.defaultPrompts[type] : '';
        
        if (!defaultVal) {
             if (type === 'writer_ai') defaultVal = "[角色：资深小说家]\n[全局规则]：{{rules}}\n[续写规则]：{{continue_rules}}\n[上下文参考]\n{{context}}\n\n[本章大纲]\n{{outline}}\n\n[前文内容]\n...{{input}}\n\n[任务]\n请无缝衔接前文，继续创作高质量的小说正文。保持文风一致，情节紧凑。";
             else if (type === 'writer_polish') defaultVal = "[任务：文本润色]\n[规则]：{{rules}}\n[原文]：\n{{input}}\n\n请对原文进行润色优化，提升文笔质量，保持原意不变。";
             else if (type.startsWith('ts_')) {
                 const subtype = type.replace('ts_', '');
                 if (Modules.workshop && Modules.workshop.defaultPrompts && Modules.workshop.defaultPrompts['ts_' + subtype]) {
                     defaultVal = Modules.workshop.defaultPrompts['ts_' + subtype];
                 } else { defaultVal = "请分析以下文本：{{input}}"; }
             }
             else if (type === 'fusion') defaultVal = "请将以下所有素材进行有机融合，创造一个新的、有逻辑的设定或情节：\n\n{{input}}";
             else if (type === 'logic') defaultVal = "请严格检查以下文本的逻辑漏洞、前后矛盾之处或不合理的情节，并给出修改建议：\n\n{{input}}";
             else if (type === 'phoenix_outline') defaultVal = "基于创意【{{idea}}】\n类型：{{genre}}\n风格：{{style}}\n\n请生成一份详细的长篇小说分卷细纲。";
             else if (type === 'fusion_analyze') defaultVal = Modules.fusion_book ? Modules.fusion_book._PROMPTS.analyze : "请分析以下章节的写作技法：\n\n书名：{{book}}\n章节：{{title}}\n\n{{content}}";
             else if (type === 'fusion_compare') defaultVal = Modules.fusion_book ? Modules.fusion_book._PROMPTS.compare : "请对比两个章节的写作技法差异";
             else if (type === 'fusion_merge') defaultVal = Modules.fusion_book ? Modules.fusion_book._PROMPTS.fusion : "请融合两书的写作技法精华";
             else if (type === 'fusion_write') defaultVal = Modules.fusion_book ? Modules.fusion_book._PROMPTS.write : "请根据素材编写原创正文";
             else if (type === 'fusion_compare_analysis') defaultVal = Modules.fusion_book ? Modules.fusion_book._PROMPTS.compareAnalysis : "请对比两份分析报告的写作技法差异";
             else if (type.startsWith('read_')) defaultVal = "请分析以下文本：\n\n{{input}}";
             else if (type.startsWith('fanfic_')) defaultVal = "请生成同人内容：{{input}}";
             else if (type.startsWith('media_')) {
                 const map = { media_xhs: "请生成一篇小红书爆款文案，主题：{{input}}，语气：{{tone}}。要求：标题吸睛，正文分段清晰，带emoji，结尾带话题标签。", media_tiktok: "请生成一段抖音短视频脚本，主题：{{input}}，语气：{{tone}}。要求：开头3秒抓眼球，中间有反转，结尾有金句。", media_wx: "请生成一篇公众号深度文章，主题：{{input}}，语气：{{tone}}。要求：标题党但不低俗，开头设悬念，中间有干货，结尾有升华。", media_weibo: "请生成一条微博热搜文案，主题：{{input}}，语气：{{tone}}。要求：140字以内，有情绪点，带话题。" };
                 defaultVal = map[type] || "生成自媒体内容：{{input}}";
             }
        }

        const el = document.getElementById('short-prompt-edit');
        if(el) el.value = stored || defaultVal || '';
        
        const modal = document.getElementById('short-prompt-modal');
        if (modal) {
            modal.classList.remove('hidden');
        } else {
            const body = document.body;
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = `
                <div id="short-prompt-modal" class="fixed inset-0 bg-black/80 z-[100] flex center backdrop-blur-sm animate-fade-in">
                    <div class="bg-white border border-gray-300 rounded-xl w-[500px] flex flex-col shadow-2xl overflow-hidden">
                        <div class="p-4 border-b border-gray-300 bg-gray-100 flex justify-between items-center">
                            <h3 class="font-bold text-white"><i class="fa-solid fa-terminal mr-2 text-accent"></i>提示词配置</h3>
                            <button class="btn btn-sm btn-icon hover:text-gray-800" onclick="document.getElementById('short-prompt-modal').remove()"><i class="fa-solid fa-xmark"></i></button>
                        </div>
                        <div class="p-4 flex-1 flex col gap-3">
                            <textarea id="short-prompt-edit" class="textarea h-64 bg-gray-200 border-gray-300 text-xs font-mono text-green-400 focus:border-accent" placeholder="在此编辑 System Prompt..."></textarea>
                            <div class="text-[10px] text-dim">提示：使用 {{input}} 代表用户输入的内容。</div>
                        </div>
                        <div class="p-4 border-t border-gray-300 flex justify-end gap-2 bg-gray-100">
                            <button class="btn btn-sm hover:bg-gray-200" onclick="document.getElementById('short-prompt-modal').remove()">取消</button>
                            <button class="btn btn-sm btn-primary" onclick="Modules.short.savePrompt()">保存并应用</button>
                        </div>
                    </div>
                </div>
            `;
            body.appendChild(tempDiv.firstElementChild);
            const newEl = document.getElementById('short-prompt-edit');
            if(newEl) newEl.value = stored || defaultVal || '';
        }
    },
    savePrompt: async () => {
        const type = Modules.short.currentPromptType;
        const val = document.getElementById('short-prompt-edit').value;
        try {
            let record = await DB.get('prompts', type);
            if (!record) { record = { id: type, name: type, content: val }; } else { record.content = val; }
            await DB.put('prompts', record);
            localStorage.removeItem(`short_prompt_${type}`);
            if(document.getElementById('tc-pm-list')) Modules.tools_center.loadPromptList();
        } catch (e) {
            console.error('Failed to save prompt to DB', e);
            UI.toast('保存失败: ' + e.message);
        }
        const modal = document.getElementById('short-prompt-modal');
        if(modal) { if(modal.classList.contains('hidden')) { modal.classList.add('hidden'); } else { modal.remove(); } }
        UI.toast('提示词已同步更新');
    },
    getPrompt: async (type) => {
        try {
            const record = await DB.get('prompts', type);
            if(record && record.content) return record.content;
        } catch(e) { console.error(e); }
        if (Modules.short.defaultPrompts && Modules.short.defaultPrompts[type]) return Modules.short.defaultPrompts[type];
        if (type === 'writer_ai') return "[角色：资深小说家]\n[全局规则]：{{rules}}\n[续写规则]：{{continue_rules}}\n[上下文参考]\n{{context}}\n\n[本章大纲]\n{{outline}}\n\n[前文内容]\n...{{input}}\n\n[任务]\n请无缝衔接前文，继续创作高质量的小说正文。保持文风一致，情节紧凑。";
        if (type === 'writer_polish') return "[任务：文本润色]\n[规则]：{{rules}}\n[原文]：\n{{input}}\n\n请对原文进行润色优化，提升文笔质量，保持原意不变。";
        if (type.startsWith('ts_')) { const subtype = type.replace('ts_', ''); if (Modules.workshop && Modules.workshop.defaultPrompts && Modules.workshop.defaultPrompts['ts_' + subtype]) return Modules.workshop.defaultPrompts['ts_' + subtype]; return "请分析以下文本：{{input}}"; }
        if (type === 'fusion') return "请将以下所有素材进行有机融合：\n\n{{input}}";
        if (type === 'logic') return "请严格检查以下文本的逻辑漏洞：\n\n{{input}}";
        if (type === 'phoenix_outline') return "基于创意【{{idea}}】\n类型：{{genre}}\n风格：{{style}}\n\n请生成一份详细的长篇小说分卷细纲。";
        if (type.startsWith('read_')) return "请分析以下文本：\n\n{{input}}";
        if (type === 'fusion_analyze') return Modules.fusion_book ? Modules.fusion_book._PROMPTS.analyze : "请分析以下章节的写作技法";
        if (type === 'fusion_compare') return Modules.fusion_book ? Modules.fusion_book._PROMPTS.compare : "请对比两个章节的写作技法差异";
        if (type === 'fusion_merge') return Modules.fusion_book ? Modules.fusion_book._PROMPTS.fusion : "请融合两书的写作技法精华";
        if (type === 'fusion_write') return Modules.fusion_book ? Modules.fusion_book._PROMPTS.write : "请根据素材编写原创正文";
        if (type === 'fusion_compare_analysis') return Modules.fusion_book ? Modules.fusion_book._PROMPTS.compareAnalysis : "请对比两份分析报告的写作技法差异";
        if (type.startsWith('fanfic_')) return "请生成同人内容：{{input}}";
        if (type.startsWith('media_')) { const map = { media_xhs: "请生成一篇小红书爆款文案，主题：{{input}}，语气：{{tone}}。", media_tiktok: "请生成一段抖音短视频脚本，主题：{{input}}，语气：{{tone}}。", media_wx: "请生成一篇公众号深度文章大纲，主题：{{input}}，语气：{{tone}}。", media_weibo: "请生成一条微博热搜文案，主题：{{input}}，语气：{{tone}}。" }; return map[type] || "生成自媒体内容：{{input}}"; }
        return "";
    },
    defaultPrompts: {
        idea: "生成一个反直觉的小说脑洞：",
        title: "生成5个爆款网文书名：",
        twist: "生成一个意想不到的情节反转：",
        char: "生成一个性格极其矛盾的角色：",
        trope: "深度拆解热梗【{{input}}】的情绪价值、爽点结构和受众心理：",
        write: "基于梗概写一篇短篇小说：{{input}}",
        outline: "根据以下关键词生成一份极速大纲，包含开端、发展、高潮、结局：{{input}}",
        scene: "根据以下关键词生成一段极具画面感的场景描写：{{input}}",
        dialogue: "根据以下情境生成一段精彩的角色对话：{{input}}",
        emotion: "根据以下关键词生成一段情感渲染极强的文字：{{input}}",
        world: "根据以下关键词补全世界观设定：{{input}}",
        ending: "根据以下故事背景生成一个出人意料的结局：{{input}}"
    },
    updateIO: (section, input, output) => {
        const inEl = document.getElementById(`io-${section}-in`);
        const outEl = document.getElementById(`io-${section}-out`);
        if(inEl) inEl.innerText = input;
        if(outEl) outEl.innerText = output;
    }
};
