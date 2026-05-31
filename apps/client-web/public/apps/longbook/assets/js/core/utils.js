const Utils = {
    uuid: () => Date.now().toString(36) + Math.random().toString(36).substr(2),
    download: (filename, text, mime = 'text/markdown;charset=utf-8') => {
        const blob = new Blob([text || ''], { type: mime });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || ('export_' + Date.now() + '.md');
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 500);
    },
    copy: async (t) => {
        try {
            await navigator.clipboard.writeText(t || '');
            UI.toast('已复制');
        } catch(e) {
            UI.toast('浏览器暂不允许直接复制');
        }
    },
    fileToText: async (file) => {
        return new Promise(resolve => {
            const r = new FileReader();
            r.onload = e => resolve(e.target.result);
            r.readAsText(file);
        });
    }
};
