export const Utils = {
    uuid: () => Date.now().toString(36) + Math.random().toString(36).substr(2),
    copy: (t) => { navigator.clipboard.writeText(t); UI.toast('已复制'); },
    fileToText: async (file) => {
        return new Promise(resolve => {
            const r = new FileReader();
            r.onload = e => resolve(e.target.result);
            r.readAsText(file);
        });
    }
};
