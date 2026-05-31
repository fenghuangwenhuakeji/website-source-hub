import { DB } from '../core/db.js';
import { UI } from './ui.js';
import { Utils } from '../utils/helpers.js';

export const Editor = {
    instance: null,
    autosaveTimer: null,
    
    init: () => {
        // Initialize CodeMirror or TextArea
        const el = document.getElementById('editor-area');
        if(!el) return;
        
        el.addEventListener('input', Utils.debounce(() => Editor.save(), 1000));
    },
    
    load: async (chapterId) => {
        const chapter = await DB.get('chapters', chapterId);
        if(chapter) {
            const el = document.getElementById('editor-area');
            if(el) el.value = chapter.content || '';
        }
    },
    
    save: async () => {
        // Save logic here
        console.log('Auto saving...');
    }
};