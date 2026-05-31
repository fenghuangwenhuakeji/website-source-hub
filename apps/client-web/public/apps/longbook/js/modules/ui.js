import { Utils } from '../utils/helpers.js';

export const UI = {
    toast: (msg, type='info') => {
        const t = document.createElement('div');
        t.className = `fixed top-4 right-4 z-50 px-4 py-2 rounded shadow-lg text-white ${type==='error'?'bg-red-500':'bg-green-500'} transition-opacity duration-300`;
        t.innerText = msg;
        document.getElementById('toast-area').appendChild(t);
        setTimeout(() => { t.style.opacity='0'; setTimeout(()=>t.remove(), 300); }, 2000);
    },
    showModal: (id) => {
        const m = document.getElementById(id);
        if(m) { m.classList.remove('hidden'); m.classList.add('flex'); }
    },
    hideModal: (id) => {
        const m = document.getElementById(id);
        if(m) { m.classList.add('hidden'); m.classList.remove('flex'); }
    },
    confirm: (msg) => confirm(msg),
    prompt: (msg, def) => prompt(msg, def),
    
    // Helper to render lists
    renderList: (containerId, items, renderFn) => {
        const c = document.getElementById(containerId);
        if(!c) return;
        c.innerHTML = items.map(renderFn).join('');
    }
};