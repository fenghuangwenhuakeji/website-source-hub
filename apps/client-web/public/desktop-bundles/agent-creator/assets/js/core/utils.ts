declare const UI: { toast: (msg: string, type?: string) => void };

const Utils: UtilsInterface = {
    uuid(): string {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    copy(text: string): void {
        navigator.clipboard.writeText(text);
        UI.toast('已复制', 'success');
    },

    fileToText(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.onerror = (e) => reject(e);
            reader.readAsText(file);
        });
    },

    debounce<T extends (...args: any[]) => any>(fn: T, ms: number): T {
        let timeoutId: ReturnType<typeof setTimeout> | null = null;
        return ((...args: Parameters<T>) => {
            if (timeoutId) clearTimeout(timeoutId);
            timeoutId = setTimeout(() => fn(...args), ms);
        }) as T;
    },

    throttle<T extends (...args: any[]) => any>(fn: T, ms: number): T {
        let lastCall = 0;
        return ((...args: Parameters<T>) => {
            const now = Date.now();
            if (now - lastCall >= ms) {
                lastCall = now;
                return fn(...args);
            }
        }) as T;
    },

    formatDate(date: Date | number | string, format: string = 'YYYY-MM-DD HH:mm:ss'): string {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        const seconds = String(d.getSeconds()).padStart(2, '0');

        return format
            .replace('YYYY', String(year))
            .replace('MM', month)
            .replace('DD', day)
            .replace('HH', hours)
            .replace('mm', minutes)
            .replace('ss', seconds);
    },

    escapeHtml(str: string): string {
        const escapeMap: Record<string, string> = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
            '/': '&#x2F;'
        };
        return str.replace(/[&<>"'\/]/g, (char) => escapeMap[char]);
    }
};

(window as any).Utils = Utils;
