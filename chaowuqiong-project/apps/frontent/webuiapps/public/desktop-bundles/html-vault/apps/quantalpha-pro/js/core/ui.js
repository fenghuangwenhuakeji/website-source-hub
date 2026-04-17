// ═══════════════════════════════════════════════════════════════
// QuantAlpha Pro - UI 组件库
// ═══════════════════════════════════════════════════════════════

const UI = {
    // ═══ Toast 通知 ═══
    toast: (msg, type = 'success', duration = 3000) => {
        const area = document.getElementById('toast-area');
        if (!area) return;
        
        const t = document.createElement('div');
        t.className = `toast ${type}`;
        
        const icons = { success: 'fa-circle-check', error: 'fa-circle-xmark', warning: 'fa-triangle-exclamation', info: 'fa-circle-info' };
        t.innerHTML = `<i class="fa-solid ${icons[type] || icons.info}"></i><span>${msg}</span>`;
        
        area.appendChild(t);
        setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, duration);
    },

    // ═══ 确认对话框 ═══
    confirm: (msg, title = '确认') => {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center';
            overlay.innerHTML = `
                <div class="bg-[#1a1a2e] rounded-xl border border-white/10 p-6 w-[360px] shadow-2xl animate-fade-in">
                    <div class="text-base font-bold text-white mb-3">${title}</div>
                    <div class="text-sm text-dim mb-6">${msg}</div>
                    <div class="flex gap-3 justify-end">
                        <button class="btn btn-sm bg-white/5 text-white/70 hover:bg-white/10 cancel-btn">取消</button>
                        <button class="btn btn-sm bg-accent text-black font-bold confirm-btn">确认</button>
                    </div>
                </div>`;
            document.body.appendChild(overlay);
            
            overlay.querySelector('.cancel-btn').onclick = () => { overlay.remove(); resolve(false); };
            overlay.querySelector('.confirm-btn').onclick = () => { overlay.remove(); resolve(true); };
            overlay.addEventListener('click', (e) => { if (e.target === overlay) { overlay.remove(); resolve(false); } });
        });
    },

    // ═══ 输入对话框 ═══
    prompt: (msg, defaultValue = '', title = '输入') => {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center';
            overlay.innerHTML = `
                <div class="bg-[#1a1a2e] rounded-xl border border-white/10 p-6 w-[380px] shadow-2xl animate-fade-in">
                    <div class="text-base font-bold text-white mb-3">${title}</div>
                    <div class="text-sm text-dim mb-3">${msg}</div>
                    <input type="text" class="w-full mb-4" value="${defaultValue}" id="prompt-input" placeholder="请输入...">
                    <div class="flex gap-3 justify-end">
                        <button class="btn btn-sm bg-white/5 text-white/70 hover:bg-white/10 cancel-btn">取消</button>
                        <button class="btn btn-sm bg-accent text-black font-bold confirm-btn">确认</button>
                    </div>
                </div>`;
            document.body.appendChild(overlay);
            
            const input = overlay.querySelector('#prompt-input');
            setTimeout(() => input.focus(), 100);
            
            const confirmFn = () => { overlay.remove(); resolve(input.value); };
            overlay.querySelector('.cancel-btn').onclick = () => { overlay.remove(); resolve(null); };
            overlay.querySelector('.confirm-btn').onclick = confirmFn;
            input.addEventListener('keydown', (e) => { if (e.key === 'Enter') confirmFn(); });
            overlay.addEventListener('click', (e) => { if (e.target === overlay) { overlay.remove(); resolve(null); } });
        });
    },

    // ═══ 模态框 ═══
    modal: (content, options = {}) => {
        const { title = '', width = '600px', closable = true, onClose = null } = options;
        const overlay = document.createElement('div');
        overlay.className = 'fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998] flex items-center justify-center p-4';
        overlay.innerHTML = `
            <div class="bg-[#12141a] rounded-xl border border-white/10 w-full shadow-2xl animate-fade-in" style="max-width:${width};max-height:90vh;overflow:hidden;display:flex;flex-direction:column;">
                <div class="flex items-center justify-between px-5 py-4 border-b border-white/10">
                    <div class="text-base font-bold text-white">${title}</div>
                    ${closable ? '<button class="text-white/40 hover:text-white text-lg close-btn"><i class="fa-solid fa-xmark"></i></button>' : ''}
                </div>
                <div class="flex-1 overflow-auto p-5">${content}</div>
            </div>`;
        document.body.appendChild(overlay);
        
        const close = () => { overlay.remove(); if (onClose) onClose(); };
        
        if (closable) {
            overlay.querySelector('.close-btn').onclick = close;
            overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
        }
        
        return { overlay, close };
    },

    // ═══ 加载中 ═══
    loading: {
        show: (msg = '加载中...') => {
            const existing = document.getElementById('global-loading');
            if (existing) existing.remove();
            
            const el = document.createElement('div');
            el.id = 'global-loading';
            el.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-[99999] flex items-center justify-center';
            el.innerHTML = `
                <div class="bg-[#1a1a2e] rounded-xl border border-white/10 px-8 py-6 flex items-center gap-4">
                    <i class="fa-solid fa-spinner fa-spin text-2xl text-accent"></i>
                    <span class="text-white">${msg}</span>
                </div>`;
            document.body.appendChild(el);
        },
        hide: () => {
            const el = document.getElementById('global-loading');
            if (el) el.remove();
        }
    },

    // ═══ 下拉菜单 ═══
    dropdown: (trigger, items) => {
        const rect = trigger.getBoundingClientRect();
        const menu = document.createElement('div');
        menu.className = 'fixed bg-[#1a1a2e] rounded-lg border border-white/10 shadow-xl z-[9999] py-1 min-w-[150px] animate-fade-in';
        menu.style.top = `${rect.bottom + 4}px`;
        menu.style.left = `${rect.left}px`;
        
        menu.innerHTML = items.map(item => 
            item.divider 
                ? '<div class="h-px bg-white/10 my-1"></div>'
                : `<button class="w-full text-left px-4 py-2 text-sm text-white/70 hover:bg-white/5 hover:text-white transition-colors ${item.danger ? 'hover:!text-red-400' : ''}" data-action="${item.action || ''}">
                    ${item.icon ? `<i class="fa-solid ${item.icon} mr-2 text-xs opacity-60"></i>` : ''}${item.label}
                   </button>`
        ).join('');
        
        document.body.appendChild(menu);
        
        const close = () => menu.remove();
        menu.querySelectorAll('button').forEach(btn => {
            btn.onclick = () => { close(); if (btn.dataset.action) eval(btn.dataset.action); };
        });
        
        setTimeout(() => {
            document.addEventListener('click', close, { once: true });
        }, 10);
    },

    // ═══ 选项卡组件 ═══
    tabs: (tabs, activeTab, onChange) => {
        const container = document.createElement('div');
        container.className = 'tabs';
        
        tabs.forEach(tab => {
            const el = document.createElement('div');
            el.className = `tab ${tab.id === activeTab ? 'active' : ''}`;
            el.textContent = tab.label;
            el.onclick = () => {
                container.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                el.classList.add('active');
                if (onChange) onChange(tab.id);
            };
            container.appendChild(el);
        });
        
        return container;
    },

    // ═══ 统计卡片 ═══
    statCard: (label, value, options = {}) => {
        const { icon = '', change = null, changeLabel = '', color = 'accent' } = options;
        const changeHtml = change !== null 
            ? `<div class="stat-change ${change >= 0 ? 'text-profit' : 'text-loss'}">
                <i class="fa-solid fa-${change >= 0 ? 'caret-up' : 'caret-down'}"></i>
                <span>${Utils.formatPercent(Math.abs(change))}</span>
                ${changeLabel ? `<span class="text-dim ml-1">${changeLabel}</span>` : ''}
               </div>` 
            : '';
        
        return `
            <div class="stat-card">
                <div class="stat-label">
                    ${icon ? `<i class="fa-solid ${icon}" style="color:var(--${color})"></i>` : ''}
                    ${label}
                </div>
                <div class="stat-value ${color !== 'accent' ? 'text-' + color : ''}">${value}</div>
                ${changeHtml}
            </div>`;
    },

    // ═══ 数据表格 ═══
    dataTable: (columns, data, options = {}) => {
        const { emptyMsg = '暂无数据', onRowClick = null, className = '' } = options;
        
        if (!data || data.length === 0) {
            return `<div class="text-center py-12 text-dim">${emptyMsg}</div>`;
        }
        
        const headerHtml = columns.map(col => 
            `<th class="${col.className || ''}" style="${col.width ? 'width:' + col.width : ''}">${col.title}</th>`
        ).join('');
        
        const bodyHtml = data.map((row, i) => {
            const cells = columns.map(col => {
                const val = col.render ? col.render(row[col.key], row, i) : (row[col.key] ?? '-');
                return `<td class="${col.cellClass || ''}">${val}</td>`;
            }).join('');
            return `<tr ${onRowClick ? `class="cursor-pointer hover:bg-white/5" onclick="${onRowClick}(${i})"` : ''}>${cells}</tr>`;
        }).join('');
        
        return `<table class="data-table ${className}"><thead><tr>${headerHtml}</tr></thead><tbody>${bodyHtml}</tbody></table>`;
    },

    // ═══ K线图 ═══
    renderKline: (containerId, data, options = {}) => {
        const container = document.getElementById(containerId);
        if (!container || !data || data.length === 0) return;
        
        const chart = echarts.init(container);
        const dates = data.map(d => d.date);
        const ohlc = data.map(d => [d.open, d.close, d.low, d.high]);
        const volumes = data.map(d => d.volume);
        
        const option = {
            backgroundColor: 'transparent',
            animation: false,
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'cross' },
                backgroundColor: 'rgba(15, 20, 30, 0.9)',
                borderColor: 'rgba(255, 255, 255, 0.1)',
                textStyle: { color: '#fff' }
            },
            axisPointer: {
                link: [{ xAxisIndex: 'all' }]
            },
            grid: [
                { left: '8%', right: '3%', top: '5%', height: '55%' },
                { left: '8%', right: '3%', top: '70%', height: '18%' }
            ],
            xAxis: [
                { type: 'category', data: dates, gridIndex: 0, axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } }, axisLabel: { color: '#6b7280', fontSize: 10 } },
                { type: 'category', data: dates, gridIndex: 1, axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } }, axisLabel: { show: false } }
            ],
            yAxis: [
                { scale: true, gridIndex: 0, splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } }, axisLabel: { color: '#6b7280', fontSize: 10 } },
                { scale: true, gridIndex: 1, splitLine: { show: false }, axisLabel: { show: false } }
            ],
            series: [
                {
                    name: 'K线',
                    type: 'candlestick',
                    data: ohlc,
                    itemStyle: {
                        color: '#00d4aa',
                        color0: '#ff4757',
                        borderColor: '#00d4aa',
                        borderColor0: '#ff4757'
                    }
                },
                {
                    name: '成交量',
                    type: 'bar',
                    xAxisIndex: 1,
                    yAxisIndex: 1,
                    data: volumes,
                    itemStyle: {
                        color: function(params) {
                            const idx = params.dataIndex;
                            return data[idx].close >= data[idx].open ? '#00d4aa' : '#ff4757';
                        }
                    }
                }
            ]
        };
        
        chart.setOption(option);
        window.addEventListener('resize', () => chart.resize());
        return chart;
    },

    // ═══ 折线图 ═══
    renderLine: (containerId, series, options = {}) => {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        const { title = '', xData = [], showLegend = true, smooth = true } = options;
        
        const chart = echarts.init(container);
        const colors = ['#00d4aa', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6'];
        
        const seriesConfig = series.map((s, i) => ({
            name: s.name,
            type: 'line',
            data: s.data,
            smooth: smooth,
            symbol: 'none',
            lineStyle: { width: 2 },
            itemStyle: { color: colors[i % colors.length] }
        }));
        
        const option = {
            backgroundColor: 'transparent',
            tooltip: {
                trigger: 'axis',
                backgroundColor: 'rgba(15, 20, 30, 0.9)',
                borderColor: 'rgba(255, 255, 255, 0.1)',
                textStyle: { color: '#fff' }
            },
            legend: showLegend ? {
                data: series.map(s => s.name),
                textStyle: { color: '#6b7280', fontSize: 11 },
                top: 0
            } : null,
            grid: { left: '3%', right: '4%', top: showLegend ? '15%' : '5%', bottom: '3%', containLabel: true },
            xAxis: {
                type: 'category',
                data: xData,
                axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
                axisLabel: { color: '#6b7280', fontSize: 10 }
            },
            yAxis: {
                type: 'value',
                splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
                axisLabel: { color: '#6b7280', fontSize: 10 }
            },
            series: seriesConfig
        };
        
        chart.setOption(option);
        window.addEventListener('resize', () => chart.resize());
        return chart;
    },

    // ═══ 饼图 ═══
    renderPie: (containerId, data, options = {}) => {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        const { title = '', radius = ['40%', '70%'] } = options;
        
        const chart = echarts.init(container);
        const colors = ['#00d4aa', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6', '#f97316'];
        
        const option = {
            backgroundColor: 'transparent',
            tooltip: {
                trigger: 'item',
                backgroundColor: 'rgba(15, 20, 30, 0.9)',
                borderColor: 'rgba(255, 255, 255, 0.1)',
                textStyle: { color: '#fff' },
                formatter: '{b}: {c} ({d}%)'
            },
            legend: {
                orient: 'vertical',
                right: '5%',
                top: 'center',
                textStyle: { color: '#6b7280', fontSize: 11 }
            },
            series: [{
                type: 'pie',
                radius: radius,
                center: ['40%', '50%'],
                avoidLabelOverlap: false,
                itemStyle: {
                    borderRadius: 6,
                    borderColor: '#0a0e17',
                    borderWidth: 2
                },
                label: { show: false },
                emphasis: {
                    label: { show: true, fontSize: 14, fontWeight: 'bold', color: '#fff' }
                },
                data: data.map((d, i) => ({ ...d, itemStyle: { color: colors[i % colors.length] } }))
            }]
        };
        
        chart.setOption(option);
        window.addEventListener('resize', () => chart.resize());
        return chart;
    },

    // ═══ 空状态 ═══
    empty: (msg = '暂无数据', icon = 'fa-inbox') => {
        return `
            <div class="flex flex-col items-center justify-center py-16 text-dim">
                <i class="fa-solid ${icon} text-4xl mb-4 opacity-30"></i>
                <div class="text-sm">${msg}</div>
            </div>`;
    }
};