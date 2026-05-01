// ═══════════════════════════════════════════════════════════════
// 系统设置 (Settings) — 数据管理、导入导出相关方法
// ═══════════════════════════════════════════════════════════════
Object.assign(Modules.settings, {
    _refreshStorageStats: async () => {
        const counts = {
            entities: (await DB.getAll('entities')).length,
            vectors: (await DB.getAll('vectors')).length,
            prompts: (await DB.getAll('prompts')).length,
            books: (await DB.getAll('library_books')).length,
            volumes: (await DB.getAll('volumes')).length,
            chapters: (await DB.getAll('chapters')).length,
            sessions: (await DB.getAll('chat_sessions')).length,
            outlines: (await DB.getAll('outlines')).length
        };
        for(const [k,v] of Object.entries(counts)) {
            const el = document.getElementById('ss-' + k);
            if(el) el.textContent = v;
        }
    },

    _clearStore: async (store) => {
        const items = await DB.getAll(store);
        for(const item of items) await DB.del(store, item.id);
    },

    // ═══ 数据导入导出 ═══
    exportData: async () => {
        const data = {};
        const stores = [
            'volumes','chapters','outlines','entities','vectors','prompts','tools_custom','assets','library_books',
            'text_api_pool','fusion_api_pool','parse_api_pool','image_api_pool','video_api_pool','audio_api_pool',
            'settings','chat_sessions'
        ];
        for(const s of stores) { try { data[s] = await DB.getAll(s); } catch(e) { data[s] = []; } }
        const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'genesis_backup_' + new Date().toISOString().slice(0,10) + '.json';
        a.click();
        URL.revokeObjectURL(url);
        UI.toast('数据备份已导出');
    },

    importData: async (input) => {
        const file = input.files[0];
        if(!file) return;
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = JSON.parse(e.target.result);
                let count = 0;
                for(const s in data) {
                    for(const item of data[s]) { await DB.put(s, item); count++; }
                }
                UI.toast('恢复成功，共导入 ' + count + ' 条记录。即将刷新...');
                setTimeout(() => location.reload(), 1500);
            } catch(err) { UI.toast('导入失败: ' + err.message); }
        };
        reader.readAsText(file);
    }
});
