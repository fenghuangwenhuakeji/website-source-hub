const UI: UIInterface = {
    toast(msg: string, type: 'info' | 'success' | 'error' | 'warning' = 'info'): void {
        const toastArea = document.getElementById('toast-area');
        if (!toastArea) {
            console.warn('Toast area not found');
            return;
        }
        
        const d = document.createElement('div');
        d.className = `toast toast-${type}`;
        d.innerHTML = msg;
        toastArea.appendChild(d);
        setTimeout(() => d.remove(), 3000);
    },

    confirm(msg: string): Promise<boolean> {
        return new Promise((resolve) => {
            const result = window.confirm(msg);
            resolve(result);
        });
    },

    prompt(msg: string, defaultValue: string = ''): Promise<string | null> {
        return new Promise((resolve) => {
            const result = window.prompt(msg, defaultValue);
            resolve(result);
        });
    },

    showModal(options: ModalOptions): void {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.innerHTML = `
            <div class="modal" style="width: ${options.width || '500px'}">
                ${options.title ? `<div class="modal-header"><h3>${options.title}</h3></div>` : ''}
                <div class="modal-body">${options.content}</div>
                ${options.buttons ? `
                    <div class="modal-footer">
                        ${options.buttons.map((btn, i) => `
                            <button class="btn ${btn.class || 'btn-default'}" data-index="${i}">${btn.text}</button>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;

        if (options.closable !== false) {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    overlay.remove();
                }
            });
        }

        if (options.buttons) {
            options.buttons.forEach((btn, i) => {
                const btnEl = overlay.querySelector(`[data-index="${i}"]`);
                if (btnEl && btn.onClick) {
                    btnEl.addEventListener('click', () => {
                        btn.onClick!();
                        if (options.closable !== false) {
                            overlay.remove();
                        }
                    });
                }
            });
        }

        document.body.appendChild(overlay);
    },

    closeModal(): void {
        const overlay = document.querySelector('.modal-overlay');
        if (overlay) {
            overlay.remove();
        }
    }
};

(window as any).UI = UI;
