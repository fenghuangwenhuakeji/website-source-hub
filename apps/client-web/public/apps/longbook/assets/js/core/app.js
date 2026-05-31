const App = {
    sidebarCollapsed: false,
    _ioCollapsed: false,
    _stopFlag: false,
    _projectRequiredModules: new Set(['writer', 'phoenix', 'world_engine', 'fusion_book', 'fusion_workbench', 'rag_context', 'memory_system']),
    init: async () => {
        // 步骤1：检查是否已登录
        if (!UserManager.isLoggedIn()) {
            App.showAuthOverlay();
            return;
        }
        // 步骤2：检查会员状态
        const check = Membership.checkAsync ? await Membership.checkAsync() : Membership.check();
        if (check.active) {
            App._enterApp();
            App._startExpiryCheck();
        } else if (check.reason === '卡密已过期') {
            App._lockdown('您的创作中心已到期，请充值续费');
        } else {
            const overlay = document.getElementById('licenseOverlay');
            if (overlay) overlay.style.display = 'flex';
        }
    },
    // ===== 登录/注册面板 =====
    showAuthOverlay: () => {
        const overlay = document.getElementById('authOverlay');
        if (overlay) overlay.style.display = 'flex';
    },
    hideAuthOverlay: () => {
        const overlay = document.getElementById('authOverlay');
        if (overlay) overlay.style.display = 'none';
    },
    handleOfficialLogin() {
        if (typeof OfficialAuth === 'undefined') return;
        OfficialAuth.openLogin();
        const err = document.getElementById('authError');
        if (err) {
            err.textContent = '请在打开的官网页面完成登录，登录后回到这里点击“我已登录，刷新授权”。';
            err.classList.add('show');
        }
    },
    handleOfficialRegister() {
        if (typeof OfficialAuth === 'undefined') return;
        OfficialAuth.openRegister();
    },
    openOfficialRecharge() {
        if (typeof OfficialAuth === 'undefined') return;
        OfficialAuth.openRecharge();
    },
    async syncOfficialAuth() {
        if (typeof OfficialAuth === 'undefined') return;
        const err = document.getElementById('authError') || document.getElementById('licenseError');
        const setMessage = (message) => {
            if (err) { err.textContent = message; err.classList.add('show'); }
            else if (typeof UI !== 'undefined') UI.toast(message);
        };
        if (!OfficialAuth.isAuthenticated()) {
            setMessage('当前页面还没有检测到官网登录状态。请先登录官网账号。');
            return;
        }
        const result = await Membership.checkAsync();
        if (result.active) {
            App.hideAuthOverlay();
            const overlay = document.getElementById('licenseOverlay');
            if (overlay) overlay.style.display = 'none';
            if (!App._licenseChecked) await App._enterApp();
            App.updateMemberStatus();
            if (typeof UI !== 'undefined') UI.toast('官网授权已同步', 'success');
        } else {
            setMessage(result.reason || '当前官网账号未开通权益，请前往官网充值。');
        }
    },
    // ===== 用户中心 =====
    showUserCenter: () => {
        const modal = document.getElementById('userCenterModal');
        if (!modal) return;
        modal.style.display = 'flex';
        const currentUser = UserManager.getCurrentUser();
        const status = Membership.getStatus();
        const infoEl = document.getElementById('ucInfo');
        if (infoEl) {
            infoEl.innerHTML = `
                <div style="margin-bottom:8px;"><span style="color:rgba(255,255,255,0.4);">用户:</span> <span style="color:#E2E8F0; font-weight:600;">${currentUser}</span></div>
                <div style="margin-bottom:8px;"><span style="color:rgba(255,255,255,0.4);">状态:</span> <span style="color:${status.isFree ? '#10B981' : '#F59E0B'};">${status.isFree ? '免费体验' : (status.typeName + ' · ' + status.tierName)}</span></div>
                <div><span style="color:rgba(255,255,255,0.4);">剩余:</span> <span style="color:#F59E0B;">${(status.remainingToday || 0).toLocaleString()} Token</span></div>
            `;
        }
        const listEl = document.getElementById('ucUserList');
        if (listEl) {
            const users = UserManager.listUsers();
            if (users.length <= 1) {
                listEl.innerHTML = '<div style="color:rgba(255,255,255,0.2); font-size:12px;">暂无其他账号</div>';
            } else {
                listEl.innerHTML = users.map(u => `
                    <div style="display:flex; align-items:center; justify-content:space-between; padding:8px; border-radius:6px; ${u.isCurrent ? 'background:rgba(99,102,241,0.1); border:1px solid rgba(99,102,241,0.2);' : 'background:rgba(30,30,35,0.4);'}">
                        <span style="font-size:13px; color:${u.isCurrent ? '#818CF8' : '#E2E8F0'};">${u.isCurrent ? '● ' : ''}${u.username}</span>
                        ${u.isCurrent ? '<span style="font-size:11px; color:#818CF8;">当前</span>' : `<button style="font-size:11px; padding:2px 8px; border-radius:4px; background:rgba(99,102,241,0.15); color:#818CF8; border:none; cursor:pointer;" onclick="UserManager.switchUser('${u.username}')">切换</button>`}
                    </div>
                `).join('');
            }
        }
    },
    hideUserCenter: () => {
        const modal = document.getElementById('userCenterModal');
        if (modal) modal.style.display = 'none';
    },
    logout: () => { UserManager.logout(); },
    // ===== 会员/额度状态 =====
    _licenseChecked: false,
    _expiryTimer: null,
    _isLocked: false,
    _startExpiryCheck() {
        if (App._expiryTimer) clearInterval(App._expiryTimer);
        App._expiryTimer = setInterval(() => {
            const status = Membership.getStatus();
            if (!status.isFree && status.expired) {
                App._lockdown('您的创作中心已到期，请充值续费');
                return;
            }
            App._updateCountdown();
        }, 1000);
    },
    _updateCountdown() {
        const cdEl = document.getElementById('topMemberCountdown');
        if (!cdEl) return;
        const cd = Membership.getCountdown ? Membership.getCountdown() : null;
        if (!cd || cd.expired) { cdEl.textContent = ''; cdEl.style.display = 'none'; return; }
        cdEl.textContent = cd.text; cdEl.style.display = 'inline';
        if (cd.seconds <= 60) { cdEl.style.color = '#EF4444'; cdEl.style.animation = 'pulse 1s infinite'; }
        else { cdEl.style.color = '#F59E0B'; cdEl.style.animation = 'none'; }
    },
    _lockdown(message) {
        if (App._isLocked) return;
        App._isLocked = true;
        if (App._expiryTimer) { clearInterval(App._expiryTimer); App._expiryTimer = null; }
        if (typeof Modules !== 'undefined' && Modules.writer) { Modules.writer.stopGeneration && Modules.writer.stopGeneration(); }
        const overlay = document.getElementById('licenseOverlay');
        if (!overlay) return;
        overlay.style.display = 'flex'; overlay.style.zIndex = '99999';
        document.getElementById('licenseTitle').textContent = '⛔ 创作中心已到期';
        document.getElementById('licenseSub').textContent = message || '请充值续费以继续使用';
        const freeBtn = document.getElementById('licenseFreeBtn');
        if (freeBtn) {
            freeBtn.style.display = 'inline-block';
            freeBtn.textContent = '切换到免费体验（50万 Token）';
            freeBtn.onclick = () => {
                const result = Membership.resetToFree();
                if (result.success) {
                    location.reload();
                } else {
                    UI.toast(result.message, 'error');
                }
            };
        }
        const statusEl = document.getElementById('licenseCurrentStatus');
        if (statusEl) {
            statusEl.classList.remove('hidden');
            document.getElementById('licenseCurrentTier').textContent = '已过期';
            document.getElementById('licenseCurrentTier').style.color = '#EF4444';
            document.getElementById('licenseCurrentQuota').textContent = '请前往官网充值或兑换新卡密';
        }
        document.getElementById('licenseInputArea').classList.remove('hidden');
        document.getElementById('licenseSuccessArea').classList.add('hidden');
    },
    _syncBuiltinPlaceholder: async () => {
        const apiStores = ['text_api_pool', 'parse_api_pool', 'fusion_api_pool', 'image_api_pool', 'video_api_pool', 'audio_api_pool'];
        const builtinPlaceholder = {
            ...AI.BUILTIN_CONFIG,
            api_key: '',
            is_active: 0,
            is_master: 0
        };
        let textPlaceholderWritten = false;
        let changed = false;

        for (const store of apiStores) {
            const apis = await DB.getAll(store).catch(() => []) || [];
            const builtins = apis.filter(api => api && (api.id === '_builtin_default' || api._builtin === true));
            for (const api of builtins) {
                if (store === 'text_api_pool' && api.id === '_builtin_default' && !textPlaceholderWritten) {
                    await DB.put(store, {
                        ...api,
                        ...builtinPlaceholder,
                        createdAt: api.createdAt || builtinPlaceholder.createdAt
                    });
                    textPlaceholderWritten = true;
                } else if (api.id) {
                    await DB.del(store, api.id);
                }
                changed = true;
            }
        }

        if (!textPlaceholderWritten) {
            await DB.put('text_api_pool', builtinPlaceholder);
            changed = true;
        }

        if (changed) console.log('✓ 已清理所有内置模型配置，仅保留禁用占位');
    },
    _enterApp: async () => {
        if (App._licenseChecked) return;
        App._licenseChecked = true;
        const overlay = document.getElementById('licenseOverlay');
        if (overlay) overlay.style.display = 'none';
        const topBar = document.getElementById('topBar');
        if (topBar) topBar.style.display = 'flex';
        try {
            const db = await DB.init();
            if (db) { console.log('✓ 数据库初始化完成'); }
            else { UI.toast('数据库初始化失败，请刷新页面重试', 'error'); return; }
        } catch(e) { UI.toast('数据库初始化失败，请刷新页面重试', 'error'); return; }
        // 启动时清理所有旧内置模型，只保留一个禁用占位，避免隐藏 key 或旧默认模型继续生效
        try { await App._syncBuiltinPlaceholder(); }
        catch(e) { console.warn('内置占位模型同步失败:', e); }
        App.updateMemberStatus();
        App.nav('home');
    },
    updateMemberStatus: () => {
        const status = Membership.getStatus();
        const bar = document.getElementById('topMemberBar');
        const text = document.getElementById('topMemberText');
        const quota = document.getElementById('topMemberQuota');
        const badge = document.getElementById('topMemberBadge');
        const cdEl = document.getElementById('topMemberCountdown');
        const userNameEl = document.getElementById('topUserName');
        const userBtn = document.getElementById('topUserBtn');
        if (bar) {
            bar.style.display = 'flex';
            const currentUser = UserManager.getCurrentUser();
            if (userNameEl) userNameEl.textContent = currentUser || '登录';
            if (userBtn) { userBtn.onclick = currentUser ? () => App.showUserCenter() : () => App.showAuthOverlay(); userBtn.style.display = 'flex'; }
            if (text) {
                text.textContent = status.isFree ? '免费体验' : status.typeName;
                text.style.color = status.isFree ? '#10B981' : '#F59E0B';
            }
            if (quota) {
                const low = status.remainingToday < (status.dailyQuota || 50000) * 0.1;
                quota.textContent = `${status.remainingToday.toLocaleString()} Token`;
                quota.style.color = low ? '#EF4444' : '#F59E0B';
            }
            if (badge) {
                badge.textContent = status.isFree ? '体验版' : status.tierName;
                badge.style.background = status.isFree ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)';
                badge.style.color = status.isFree ? '#10B981' : '#F59E0B';
            }
            if (cdEl && !status.isFree) { App._updateCountdown(); } else if (cdEl) { cdEl.style.display = 'none'; }
        }
    },
    showLicenseOverlay: () => {
        const overlay = document.getElementById('licenseOverlay');
        if (!overlay) return;
        overlay.style.display = 'flex';
        document.getElementById('licenseInputArea').classList.remove('hidden');
        document.getElementById('licenseSuccessArea').classList.add('hidden');
        document.getElementById('licenseKeyInput').value = '';
        document.getElementById('licenseError').classList.remove('show');
        const status = Membership.getStatus ? Membership.getStatus() : null;
        const isActivated = status && !status.isFree;
        if (isActivated) {
            document.getElementById('licenseTitle').textContent = '升级您的创作中心';
            document.getElementById('licenseSub').textContent = status.official ? '官网充值后会直接刷新账号权益' : '可前往官网充值，也可兑换卡密';
            const statusEl = document.getElementById('licenseCurrentStatus');
            if (statusEl) {
                statusEl.classList.remove('hidden');
                document.getElementById('licenseCurrentTier').textContent = `${status.typeName || ''} · ${status.tierName || ''}`;
                document.getElementById('licenseCurrentQuota').textContent = `每日配额 ${(status.dailyQuota || 0).toLocaleString()} Token · 剩余 ${(status.remainingToday || 0).toLocaleString()} Token · 有效期 ${status.daysLeft} 天`;
            }
            const freeBtn = document.getElementById('licenseFreeBtn');
            if (freeBtn) freeBtn.style.display = 'none';
        } else {
            document.getElementById('licenseTitle').textContent = '激活您的创作中心';
            document.getElementById('licenseSub').textContent = '推荐使用官网账号充值，支付成功后自动解锁';
            const statusEl = document.getElementById('licenseCurrentStatus');
            if (statusEl) statusEl.classList.add('hidden');
            const freeBtn = document.getElementById('licenseFreeBtn');
            if (freeBtn) freeBtn.style.display = 'inline-block';
        }
    },
    toggleSidebar: () => {
        App.sidebarCollapsed = !App.sidebarCollapsed;
        const sb = document.querySelector('.sidebar');
        const icon = document.getElementById('sidebar-toggle-icon');
        if (sb) sb.classList.toggle('collapsed', App.sidebarCollapsed);
        if (icon) icon.className = App.sidebarCollapsed ? 'fa-solid fa-angles-right' : 'fa-solid fa-angles-left';
        setTimeout(() => window.dispatchEvent(new Event('resize')), 300);
    },
    toggleMobileMenu: () => {
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.getElementById('mobile-overlay');
        if (!sidebar || !overlay) return;
        sidebar.classList.toggle('open');
        sidebar.classList.toggle('mobile-open', sidebar.classList.contains('open'));
        overlay.classList.toggle('active');
        overlay.style.display = overlay.classList.contains('active') ? 'block' : '';
    },
    closeMobileMenu: () => {
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.getElementById('mobile-overlay');
        if (sidebar) sidebar.classList.remove('open', 'mobile-open');
        if (overlay) {
            overlay.classList.remove('active');
            overlay.style.display = '';
        }
    },
    
    // ===== Global IO Panel Controls =====
    toggleIO() {
        App._ioCollapsed = !App._ioCollapsed;
        const content = document.getElementById('io-content');
        const icon = document.getElementById('io-toggle-icon');
        if (content) content.style.display = App._ioCollapsed ? 'none' : 'block';
        if (icon) icon.className = App._ioCollapsed ? 'fa-solid fa-chevron-down text-dim text-xs' : 'fa-solid fa-chevron-up text-dim text-xs';
    },
    
    showProgress(label, current = 0, total = 0, showStop = true) {
        const section = document.getElementById('io-progress-section');
        const labelEl = document.getElementById('io-progress-label');
        const percentEl = document.getElementById('io-progress-percent');
        const barEl = document.getElementById('io-progress-bar');
        const currentEl = document.getElementById('io-progress-current');
        const stopBtn = document.getElementById('io-stop-btn');
        const indicator = document.getElementById('io-status-indicator');
        
        if (section) section.classList.remove('hidden');
        if (labelEl) labelEl.textContent = label;
        
        const percent = total > 0 ? Math.round((current / total) * 100) : 0;
        if (percentEl) percentEl.textContent = percent + '%';
        if (barEl) barEl.style.width = percent + '%';
        if (currentEl) currentEl.textContent = total > 0 ? `${current} / ${total}` : '';
        if (stopBtn) stopBtn.classList.toggle('hidden', !showStop);
        if (indicator) {
            indicator.className = 'w-2 h-2 rounded-full bg-green-400 animate-pulse';
        }
        
        App._stopFlag = false;
    },
    
    hideProgress() {
        const section = document.getElementById('io-progress-section');
        const indicator = document.getElementById('io-status-indicator');
        if (section) section.classList.add('hidden');
        if (indicator) indicator.className = 'w-2 h-2 rounded-full bg-dim';
    },
    
    logIO(message, type = 'info') {
        const logEl = document.getElementById('io-log');
        if (!logEl) return;
        
        const colors = {
            info: 'text-gray-400',
            success: 'text-green-400',
            error: 'text-red-400',
            warning: 'text-amber-400',
            input: 'text-blue-400',
            output: 'text-cyan-400'
        };
        
        const time = new Date().toLocaleTimeString();
        const line = document.createElement('div');
        line.className = colors[type] || 'text-gray-400';
        line.innerHTML = `<span class="text-white/30">[${time}]</span> ${message}`;
        
        if (logEl.children.length === 1 && logEl.children[0].textContent === '等待操作...') {
            logEl.innerHTML = '';
        }
        
        logEl.appendChild(line);
        logEl.scrollTop = logEl.scrollHeight;
    },
    
    clearIOLog() {
        const logEl = document.getElementById('io-log');
        if (logEl) logEl.innerHTML = '<div class="text-dim">等待操作...</div>';
    },
    
    stopOperation() {
        App._stopFlag = true;
        App.logIO('用户请求停止操作...', 'warning');
        const stopBtn = document.getElementById('io-stop-btn');
        if (stopBtn) {
            stopBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1"></i>停止中...';
            stopBtn.disabled = true;
        }
    },
    
    isStopped() {
        return App._stopFlag;
    },
    
    resetStop() {
        App._stopFlag = false;
        const stopBtn = document.getElementById('io-stop-btn');
        if (stopBtn) {
            stopBtn.innerHTML = '<i class="fa-solid fa-stop mr-1"></i>停止';
            stopBtn.disabled = false;
        }
    },
    
    _currentModule: null,
    nav: (mod) => {
        if (App._projectRequiredModules.has(mod) && typeof GenesisCore !== 'undefined' && !GenesisCore._activeProjectId) {
            if (typeof UI !== 'undefined') UI.toast('请先创建或选择一个项目，再进入写作、拆书、图谱和记忆。', 'warning');
            mod = 'project_manager';
        }
        App._currentModule = mod;
        App.closeMobileMenu();
        document.querySelectorAll('.sidebar-item').forEach(e => e.classList.remove('active'));
        const el = document.querySelector(`.sidebar-item[onclick="App.nav('${mod}')"]`);
        if(el) el.classList.add('active');

        // Update mobile title
        const titleMap = {
            home:'创世中心', project_manager:'项目管理', phoenix:'凤凰创作流', writer:'长篇执笔',
            world_engine:'世界引擎', creative_studio:'创意工坊',
            workshop:'万能工坊', tools_center:'工具中心',
            reader_center:'阅读中心', web_chat:'网页对话',
            settings:'系统设置',
            fusion_book:'融合拆书', fusion_workbench:'拆书工作台', rag_context:'RAG 上下文', memory_system:'三层记忆'
        };
        const mt = document.getElementById('mobile-title');
        if(mt) mt.textContent = titleMap[mod] || mod;
        
        const vp = document.getElementById('viewport');
        
        // Keep-Alive Logic: Hide all existing views instead of clearing innerHTML
        if (document.activeElement && document.activeElement.closest?.('[id^="module-view-"]')) {
            try { document.activeElement.blur(); } catch(e) {}
        }
        Array.from(vp.children).forEach(child => {
            if (!child.id || !child.id.startsWith('module-view-')) return;
            child.inert = true;
            child.setAttribute('inert', '');
            child.setAttribute('aria-hidden', 'true');
            child.style.display = 'none';
        });

        let view = document.getElementById(`module-view-${mod}`);
        
        if (!view) {
            // Create new view if it doesn't exist
            view = document.createElement('div');
            view.id = `module-view-${mod}`;
            view.className = 'module-view w-full h-full animate-fade-in';
            view.innerHTML = Modules[mod] ? Modules[mod].render() : `<div class="flex center h-full text-dim font-mono text-lg animate-pulse">Module [${mod}] Initializing...</div>`;
            vp.appendChild(view);
            
            // Initialize module only once
            if(Modules[mod] && Modules[mod].init) {
                try {
                    Modules[mod].init();
                } catch(e) {
                    console.error(`Error initializing module ${mod}:`, e);
                }
            }
        }
        
        // Show the requested view
        view.classList.add('module-view');
        view.style.display = 'block';
        view.setAttribute('aria-hidden', 'false');
        view.inert = false;
        view.removeAttribute('inert');
        if (Modules[mod] && Modules[mod].onShow) {
            setTimeout(() => {
                try {
                    Promise.resolve(Modules[mod].onShow()).catch(e => {
                        console.warn(`Error refreshing module ${mod}:`, e);
                    });
                } catch(e) {
                    console.warn(`Error refreshing module ${mod}:`, e);
                }
            }, 0);
        }
        if (typeof MobileEngine !== 'undefined' && MobileEngine.isMobile && MobileEngine.isMobile()) {
            view.scrollTop = 0;
            if (vp) vp.scrollTop = 0;
        }
        
        // Trigger resize to fix layout issues (charts, canvas)
        setTimeout(() => window.dispatchEvent(new Event('resize')), 50);
        if (typeof MobileEngine !== 'undefined') {
            MobileEngine.updateBottomNavActive(mod);
            MobileEngine._closeSidebar();
        }
    }
};

if (typeof window !== 'undefined') {
    window.Navigation = window.Navigation || {};
    window.Navigation.show = (mod) => App.nav(mod);
}

// ===== 激活相关全局函数 =====
async function handleActivate() {
    const input = document.getElementById('licenseKeyInput');
    const btn = document.getElementById('licenseActivateBtn');
    const err = document.getElementById('licenseError');
    const key = input.value.trim();
    const compactKey = key.replace(/[^A-Z0-9]/gi, '');
    if (!compactKey || compactKey.length < 12 || compactKey.length > 32) {
        err.textContent = '请输入有效的官网兑换码或旧版卡密'; err.classList.add('show'); return;
    }
    btn.disabled = true; btn.textContent = '兑换中...'; err.classList.remove('show');
    try {
        const result = await Membership.activate(key);
        if (result.success) {
            document.getElementById('licenseInputArea').classList.add('hidden');
            const succ = document.getElementById('licenseSuccessArea');
            succ.classList.remove('hidden');
            const info = result.info;
            let html = '';
            if (result.isNew) {
                const expiryText = info.expiryDate ? `有效期至：${new Date(info.expiryDate).toLocaleDateString()}` : '永久有效';
                html = `${info.typeName} · ${info.tierName}<br>每日 ${(info.dailyQuota || 0).toLocaleString()} Token · ${expiryText}`;
            } else if (result.isStacked) {
                html = `叠加成功！<br>当前每日配额：${info.dailyQuota.toLocaleString()} Token<br>有效期至：${new Date(info.expiryDate).toLocaleDateString()}`;
            }
            document.getElementById('licenseSuccessText').innerHTML = html;
            App.updateMemberStatus();
        } else {
            err.textContent = result.message || '卡密无效'; err.classList.add('show');
        }
    } catch (e) {
        err.textContent = '验证失败: ' + e.message; err.classList.add('show');
    } finally {
        btn.disabled = false; btn.textContent = '兑换卡密';
    }
}

function enterApp() {
    const overlay = document.getElementById('licenseOverlay');
    if (overlay) overlay.style.display = 'none';
    if (!App._licenseChecked) { App._enterApp(); }
}

function closeLicenseOverlay() {
    const overlay = document.getElementById('licenseOverlay');
    if (overlay) overlay.style.display = 'none';
}

document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('licenseKeyInput');
    const hint = document.getElementById('licenseKeyHint');
    if (input) {
        input.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleActivate(); });
        input.addEventListener('input', (e) => {
            let val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
            if (val.length > 32) val = val.slice(0, 32);
            let formatted = '';
            for (let i = 0; i < val.length; i++) {
                if (i > 0 && i % 4 === 0) formatted += '-';
                formatted += val[i];
            }
            e.target.value = formatted;
            if (hint) {
                const len = val.length;
                hint.textContent = `${len} 位 · 支持官网兑换码或旧卡密`;
                hint.style.color = len >= 12 ? '#4ade80' : 'rgba(148,163,184,0.4)';
            }
        });
    }
});

window.onload = App.init;
