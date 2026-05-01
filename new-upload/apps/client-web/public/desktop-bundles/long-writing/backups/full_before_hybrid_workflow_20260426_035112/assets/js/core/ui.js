const UI = {
    toast: (msg) => {
        const d = document.createElement('div');
        d.className = 'toast'; d.innerHTML = msg;
        document.getElementById('toast-area').appendChild(d);
        setTimeout(()=>d.remove(), 3000);
    },

    /**
     * 通用模态框
     * @param {string} title - 标题
     * @param {string} html - 内容 HTML
     * @param {object} opts - 选项 { width: '600px' }
     */
    modal: (title, html, opts = {}) => {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay open';
        overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:9998;padding:20px;';
        overlay.innerHTML = `
            <div class="modal-content" style="background:#0e0e12;border:1px solid rgba(255,255,255,0.1);border-radius:12px;max-width:${opts.width||'600px'};width:100%;max-height:85vh;overflow:auto;box-shadow:0 20px 60px rgba(0,0,0,0.5);">
                <div style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid rgba(255,255,255,0.05);">
                    <span style="font-weight:bold;color:#fff;font-size:14px;">${title}</span>
                    <button onclick="this.closest('.modal-overlay').remove()" style="background:none;border:none;color:#888;cursor:pointer;font-size:18px;line-height:1;">&times;</button>
                </div>
                <div style="padding:20px;">${html}</div>
            </div>
        `;
        overlay.addEventListener('click', (e) => { if(e.target === overlay) overlay.remove(); });
        document.body.appendChild(overlay);
        return overlay;
    },

    /**
     * 对话框（带确认/取消按钮）
     * @param {string} title - 标题
     * @param {string} html - 内容 HTML
     * @param {object} opts - { confirm: {text, action}, cancel: {text, action}, width }
     */
    dialog: (title, html, opts = {}) => {
        const confirmText = opts.confirm?.text || '确认';
        const cancelText = opts.cancel?.text || '取消';
        const fullHtml = `
            <div>${html}</div>
            <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:20px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.05);">
                <button class="modal-cancel-btn" style="padding:6px 16px;border-radius:6px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:#888;font-size:12px;cursor:pointer;transition:all 0.2s;">${cancelText}</button>
                <button class="modal-confirm-btn" style="padding:6px 16px;border-radius:6px;background:rgba(6,182,212,0.2);border:1px solid rgba(6,182,212,0.3);color:#06b6d4;font-size:12px;cursor:pointer;transition:all 0.2s;">${confirmText}</button>
            </div>
        `;
        const overlay = UI.modal(title, fullHtml, { width: opts.width || '500px' });
        overlay.querySelector('.modal-confirm-btn')?.addEventListener('click', async () => {
            if(opts.confirm?.action) {
                try { await opts.confirm.action(); } catch(e) { console.error('Dialog confirm error:', e); UI.toast('操作失败: ' + e.message); }
            }
            overlay.remove();
        });
        overlay.querySelector('.modal-cancel-btn')?.addEventListener('click', async () => {
            if(opts.cancel?.action) {
                try { await opts.cancel.action(); } catch(e) { console.error('Dialog cancel error:', e); }
            }
            overlay.remove();
        });
    }
};
