// ═══════════════════════════════════════════════════════════════
// QuantAlpha Pro - 模块基座
// ═══════════════════════════════════════════════════════════════

const Modules = {};

// ═══ 首页模块 ═══
Modules.home = {
    render: () => `
        <div class="h-full flex flex-col items-center relative overflow-y-auto bg-[#0a0e17] pb-12 pt-8">
            <!-- Dynamic Background -->
            <div class="absolute inset-0 bg-[radial-gradient(circle_at_center,_#0f1a25_0%,_#0a0e17_100%)] pointer-events-none"></div>
            <div class="absolute inset-0 opacity-20 pointer-events-none" style="background-image: linear-gradient(rgba(0, 212, 170, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 212, 170, 0.03) 1px, transparent 1px); background-size: 50px 50px;"></div>
            
            <!-- Hero Section -->
            <div class="relative z-10 text-center animate-fade-in flex flex-col items-center gap-6 mb-10">
                <div class="w-32 h-32 rounded-full bg-gradient-to-br from-accent/20 to-transparent border border-accent/30 flex center shadow-[0_0_80px_rgba(0,212,170,0.15)] mb-2 relative group cursor-default">
                    <div class="absolute inset-0 rounded-full border border-white/10 animate-spin-slow pointer-events-none"></div>
                    <i class="fa-solid fa-chart-line text-6xl text-accent group-hover:scale-110 transition-transform duration-500 drop-shadow-[0_0_15px_rgba(0,212,170,0.5)]"></i>
                </div>
                
                <div class="flex flex-col gap-2">
                    <h1 class="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-400 tracking-tight" style="filter: drop-shadow(0 0 30px rgba(255,255,255,0.1));">QuantAlpha <span class="text-accent">Pro</span></h1>
                    <p class="text-lg text-dim font-light tracking-[0.3em] uppercase opacity-80">量化金融工作台</p>
                </div>
                
                <p class="text-base text-gray-400 max-w-2xl leading-relaxed font-light border-t border-white/10 pt-5">
                    AI驱动的量化交易开发平台 · 策略研究 · 因子挖掘 · 组合管理<br>
                    <span class="text-sm text-dim">策略工作台 / 回测引擎 / 风控系统 / AI量化助手</span>
                </p>
            </div>
            
            <!-- Grid Navigation -->
            <div class="relative z-10 w-full max-w-[1400px] px-6">
                <div class="grid grid-cols-4 gap-4 mb-4">
                    ${[
                        {id:'strategy', icon:'fa-chess', title:'策略工作台', sub:'开发与管理量化策略', color:'chart1'},
                        {id:'backtest', icon:'fa-clock-rotate-left', title:'回测引擎', sub:'历史数据验证策略', color:'chart2'},
                        {id:'data_analysis', icon:'fa-magnifying-glass-chart', title:'数据分析', sub:'市场数据处理分析', color:'chart3'},
                        {id:'factors', icon:'fa-dna', title:'因子研究', sub:'因子挖掘与测试', color:'chart4'}
                    ].map(item => `
                        <div class="epic-card p-4 flex flex-col items-center gap-3 group cursor-pointer hover:bg-white/5" onclick="App.nav('${item.id}')">
                            <div class="w-12 h-12 rounded-xl bg-${item.color}/10 flex center group-hover:bg-${item.color}/20 transition-all border border-${item.color}/20 group-hover:border-${item.color}/50">
                                <i class="fa-solid ${item.icon} text-2xl text-${item.color} group-hover:scale-110 transition-transform duration-300"></i>
                            </div>
                            <div class="text-center">
                                <span class="font-bold text-sm text-gray-200 block mb-0.5 group-hover:text-white transition-colors">${item.title}</span>
                                <span class="text-[10px] text-dim group-hover:text-gray-400 transition-colors">${item.sub}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="grid grid-cols-4 gap-4 mb-4">
                    ${[
                        {id:'portfolio', icon:'fa-layer-group', title:'组合管理', sub:'投资组合优化', color:'chart5'},
                        {id:'risk', icon:'fa-shield-halved', title:'风控系统', sub:'风险监控与预警', color:'loss'},
                        {id:'ai_assistant', icon:'fa-robot', title:'AI量化助手', sub:'智能策略生成', color:'chart1'},
                        {id:'code_lab', icon:'fa-code', title:'代码实验室', sub:'量化代码片段', color:'chart2'}
                    ].map(item => `
                        <div class="epic-card p-4 flex flex-col items-center gap-3 group cursor-pointer hover:bg-white/5" onclick="App.nav('${item.id}')">
                            <div class="w-12 h-12 rounded-xl bg-${item.color}/10 flex center group-hover:bg-${item.color}/20 transition-all border border-${item.color}/20 group-hover:border-${item.color}/50">
                                <i class="fa-solid ${item.icon} text-2xl text-${item.color} group-hover:scale-110 transition-transform duration-300"></i>
                            </div>
                            <div class="text-center">
                                <span class="font-bold text-sm text-gray-200 block mb-0.5 group-hover:text-white transition-colors">${item.title}</span>
                                <span class="text-[10px] text-dim group-hover:text-gray-400 transition-colors">${item.sub}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="grid grid-cols-4 gap-4">
                    ${[
                        {id:'report', icon:'fa-file-lines', title:'研报中心', sub:'量化研究报告', color:'chart3'},
                        {id:'market_monitor', icon:'fa-tower-broadcast', title:'行情监控', sub:'实时市场行情', color:'chart4'},
                        {id:'news', icon:'fa-newspaper', title:'资讯中心', sub:'市场资讯聚合', color:'chart5'},
                        {id:'settings', icon:'fa-gear', title:'系统设置', sub:'API配置与数据', color:'gray-500'}
                    ].map(item => `
                        <div class="epic-card p-4 flex flex-col items-center gap-3 group cursor-pointer hover:bg-white/5" onclick="App.nav('${item.id}')">
                            <div class="w-12 h-12 rounded-xl bg-${item.color}/10 flex center group-hover:bg-${item.color}/20 transition-all border border-${item.color}/20 group-hover:border-${item.color}/50">
                                <i class="fa-solid ${item.icon} text-2xl text-${item.color} group-hover:scale-110 transition-transform duration-300"></i>
                            </div>
                            <div class="text-center">
                                <span class="font-bold text-sm text-gray-200 block mb-0.5 group-hover:text-white transition-colors">${item.title}</span>
                                <span class="text-[10px] text-dim group-hover:text-gray-400 transition-colors">${item.sub}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <!-- Quick Stats Demo -->
            <div class="relative z-10 w-full max-w-[1400px] px-6 mt-8">
                <div class="grid grid-cols-4 gap-4">
                    <div class="stat-card">
                        <div class="stat-label"><i class="fa-solid fa-chart-pie text-accent"></i> 策略总数</div>
                        <div class="stat-value">12</div>
                        <div class="stat-change text-profit"><i class="fa-solid fa-plus"></i> 本周新增 2</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label"><i class="fa-solid fa-flask text-blue-400"></i> 回测次数</div>
                        <div class="stat-value text-blue-400">48</div>
                        <div class="stat-change text-profit"><i class="fa-solid fa-caret-up"></i> +15% 较上周</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label"><i class="fa-solid fa-dna text-amber-400"></i> 因子库</div>
                        <div class="stat-value text-amber-400">86</div>
                        <div class="stat-change text-dim">已验证因子</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label"><i class="fa-solid fa-robot text-purple-400"></i> AI分析</div>
                        <div class="stat-value text-purple-400">156</div>
                        <div class="stat-change text-dim">累计调用次数</div>
                    </div>
                </div>
            </div>
        </div>
    `
};

// ═══ 策略工作台模块 (占位) ═══
Modules.strategy = {
    render: () => `
        <div class="h-full flex flex-col p-6 animate-fade-in">
            <div class="flex items-center justify-between mb-6">
                <h2 class="text-xl font-bold text-white flex items-center gap-3">
                    <i class="fa-solid fa-chess text-accent"></i>
                    策略工作台
                </h2>
                <div class="flex gap-2">
                    <button class="btn btn-primary" onclick="Modules.strategy.createNew()">
                        <i class="fa-solid fa-plus"></i> 新建策略
                    </button>
                </div>
            </div>
            
            <div class="flex-1 grid grid-cols-3 gap-6">
                <!-- 策略列表 -->
                <div class="panel col-span-1">
                    <div class="panel-header">
                        <div class="panel-title"><i class="fa-solid fa-list"></i> 我的策略</div>
                    </div>
                    <div class="panel-body" id="strategy-list">
                        <div class="text-center py-8 text-dim">
                            <i class="fa-solid fa-folder-open text-2xl mb-3 opacity-30"></i>
                            <div class="text-sm">暂无策略</div>
                            <div class="text-xs mt-1">点击上方按钮创建新策略</div>
                        </div>
                    </div>
                </div>
                
                <!-- 策略详情 -->
                <div class="panel col-span-2">
                    <div class="panel-header">
                        <div class="panel-title"><i class="fa-solid fa-code"></i> 策略编辑器</div>
                    </div>
                    <div class="panel-body" id="strategy-editor">
                        <div class="text-center py-16 text-dim">
                            <i class="fa-solid fa-file-code text-4xl mb-4 opacity-30"></i>
                            <div>选择一个策略进行编辑</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    init: () => {
        Modules.strategy.loadList();
    },
    loadList: async () => {
        const strategies = await DB.getAll('strategies') || [];
        const el = document.getElementById('strategy-list');
        if (!el) return;
        
        if (strategies.length === 0) {
            el.innerHTML = `
                <div class="text-center py-8 text-dim">
                    <i class="fa-solid fa-folder-open text-2xl mb-3 opacity-30"></i>
                    <div class="text-sm">暂无策略</div>
                    <div class="text-xs mt-1">点击上方按钮创建新策略</div>
                </div>`;
            return;
        }
        
        el.innerHTML = strategies.map(s => `
            <div class="p-3 rounded-lg hover:bg-white/5 cursor-pointer transition-colors mb-2 border border-transparent hover:border-white/10" onclick="Modules.strategy.select('${s.id}')">
                <div class="font-bold text-sm text-white mb-1">${s.name}</div>
                <div class="text-xs text-dim">${s.description || '无描述'}</div>
                <div class="flex gap-2 mt-2">
                    <span class="tag tag-${s.status === 'active' ? 'profit' : 'neutral'}">${s.status === 'active' ? '运行中' : '已停止'}</span>
                </div>
            </div>
        `).join('');
    },
    createNew: async () => {
        const name = await UI.prompt('请输入策略名称', '', '新建策略');
        if (!name) return;
        
        const strategy = {
            id: Utils.genId('str'),
            name,
            description: '',
            code: '# 策略代码\n\ndef initialize(context):\n    pass\n\ndef handle_data(context, data):\n    pass',
            status: 'stopped',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        await DB.put('strategies', strategy);
        UI.toast('策略创建成功');
        Modules.strategy.loadList();
        Modules.strategy.select(strategy.id);
    },
    select: async (id) => {
        const strategy = await DB.get('strategies', id);
        if (!strategy) return;
        
        const el = document.getElementById('strategy-editor');
        if (!el) return;
        
        el.innerHTML = `
            <div class="mb-4">
                <input type="text" class="text-lg font-bold bg-transparent border-none p-0 focus:ring-0" value="${strategy.name}" onchange="Modules.strategy.update('${id}', 'name', this.value)">
            </div>
            <div class="mb-4">
                <textarea class="h-24" placeholder="策略描述..." onchange="Modules.strategy.update('${id}', 'description', this.value)">${strategy.description || ''}</textarea>
            </div>
            <div class="mb-4">
                <label>策略代码</label>
                <textarea class="code-block h-80 font-mono text-sm" onchange="Modules.strategy.update('${id}', 'code', this.value)">${strategy.code || ''}</textarea>
            </div>
            <div class="flex gap-2">
                <button class="btn btn-primary" onclick="App.nav('backtest')"><i class="fa-solid fa-play"></i> 运行回测</button>
                <button class="btn btn-gold" onclick="Modules.strategy.analyze('${id}')"><i class="fa-solid fa-robot"></i> AI分析</button>
            </div>
        `;
    },
    update: async (id, field, value) => {
        const strategy = await DB.get('strategies', id);
        if (!strategy) return;
        strategy[field] = value;
        strategy.updatedAt = new Date().toISOString();
        await DB.put('strategies', strategy);
        if (field === 'name') Modules.strategy.loadList();
    },
    analyze: async (id) => {
        const strategy = await DB.get('strategies', id);
        if (!strategy || !strategy.code) {
            UI.toast('请先编写策略代码', 'warning');
            return;
        }
        
        UI.loading.show('AI分析中...');
        const result = await AI.analyzeStrategy(strategy.code);
        UI.loading.hide();
        
        if (result) {
            UI.modal(`<div class="prose prose-invert max-w-none">${typeof marked !== 'undefined' ? marked.parse(result) : result}</div>`, { title: 'AI策略分析', width: '800px' });
        }
    }
};

// ═══ 回测引擎模块 (占位) ═══
Modules.backtest = {
    render: () => `
        <div class="h-full flex flex-col p-6 animate-fade-in">
            <div class="flex items-center justify-between mb-6">
                <h2 class="text-xl font-bold text-white flex items-center gap-3">
                    <i class="fa-solid fa-clock-rotate-left text-blue-400"></i>
                    回测引擎
                </h2>
            </div>
            
            <div class="flex-1 grid grid-cols-4 gap-6">
                <!-- 配置面板 -->
                <div class="panel col-span-1">
                    <div class="panel-header">
                        <div class="panel-title"><i class="fa-solid fa-sliders"></i> 回测配置</div>
                    </div>
                    <div class="panel-body">
                        <div class="space-y-4">
                            <div>
                                <label>选择策略</label>
                                <select id="bt-strategy">
                                    <option value="">请选择策略</option>
                                </select>
                            </div>
                            <div>
                                <label>开始日期</label>
                                <input type="date" id="bt-start" value="${Utils.dateRange(365).start}">
                            </div>
                            <div>
                                <label>结束日期</label>
                                <input type="date" id="bt-end" value="${Utils.dateRange(365).end}">
                            </div>
                            <div>
                                <label>初始资金</label>
                                <input type="number" id="bt-capital" value="1000000">
                            </div>
                            <button class="btn btn-primary w-full" onclick="Modules.backtest.run()">
                                <i class="fa-solid fa-play"></i> 开始回测
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- 结果面板 -->
                <div class="panel col-span-3">
                    <div class="panel-header">
                        <div class="panel-title"><i class="fa-solid fa-chart-area"></i> 回测结果</div>
                    </div>
                    <div class="panel-body" id="backtest-result">
                        <div class="text-center py-16 text-dim">
                            <i class="fa-solid fa-chart-line text-4xl mb-4 opacity-30"></i>
                            <div>配置参数后点击"开始回测"</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    init: () => {
        Modules.backtest.loadStrategies();
    },
    loadStrategies: async () => {
        const strategies = await DB.getAll('strategies') || [];
        const sel = document.getElementById('bt-strategy');
        if (!sel) return;
        sel.innerHTML = '<option value="">请选择策略</option>' + strategies.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
    },
    run: async () => {
        const strategyId = document.getElementById('bt-strategy')?.value;
        const start = document.getElementById('bt-start')?.value;
        const end = document.getElementById('bt-end')?.value;
        const capital = parseFloat(document.getElementById('bt-capital')?.value) || 1000000;
        
        if (!strategyId) {
            UI.toast('请选择策略', 'warning');
            return;
        }
        
        UI.loading.show('回测运行中...');
        
        // 模拟回测
        await new Promise(r => setTimeout(r, 1500));
        
        // 生成模拟数据
        const days = Math.ceil((new Date(end) - new Date(start)) / (24 * 60 * 60 * 1000));
        const klineData = Utils.generateKline(days, 100);
        const equityCurve = [];
        let equity = capital;
        
        for (let i = 0; i < klineData.length; i++) {
            const dailyReturn = (Math.random() - 0.48) * 0.02;
            equity *= (1 + dailyReturn);
            equityCurve.push(equity);
        }
        
        const returns = Utils.calcReturns(equityCurve);
        const finalReturn = (equity - capital) / capital;
        const sharpe = Utils.calcSharpe(returns);
        const maxDD = Utils.calcMaxDrawdown(equityCurve);
        
        UI.loading.hide();
        
        // 显示结果
        const el = document.getElementById('backtest-result');
        if (!el) return;
        
        el.innerHTML = `
            <div class="stats-grid mb-6">
                ${UI.statCard('总收益率', Utils.formatPercent(finalReturn), { change: finalReturn, color: finalReturn >= 0 ? 'profit' : 'loss' })}
                ${UI.statCard('年化收益', Utils.formatPercent(finalReturn * 252 / days), { color: 'accent' })}
                ${UI.statCard('夏普比率', Utils.formatRatio(sharpe), { color: sharpe >= 1 ? 'profit' : 'loss' })}
                ${UI.statCard('最大回撤', Utils.formatPercent(maxDD), { color: 'loss' })}
            </div>
            
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <div class="text-sm text-dim mb-2">资金曲线</div>
                    <div class="chart-container" id="bt-equity-chart"></div>
                </div>
                <div>
                    <div class="text-sm text-dim mb-2">K线图</div>
                    <div class="chart-container" id="bt-kline-chart"></div>
                </div>
            </div>
        `;
        
        // 渲染图表
        setTimeout(() => {
            UI.renderLine('bt-equity-chart', [{ name: '净值', data: equityCurve }], { xData: klineData.map(d => d.date), showLegend: false });
            UI.renderKline('bt-kline-chart', klineData.slice(-60));
        }, 100);
    }
};

// ═══ 数据分析模块 (占位) ═══
Modules.data_analysis = {
    render: () => `
        <div class="h-full flex flex-col p-6 animate-fade-in">
            <div class="flex items-center justify-between mb-6">
                <h2 class="text-xl font-bold text-white flex items-center gap-3">
                    <i class="fa-solid fa-magnifying-glass-chart text-amber-400"></i>
                    数据分析
                </h2>
                <div class="flex gap-2">
                    <button class="btn" onclick="Modules.data_analysis.importData()">
                        <i class="fa-solid fa-file-import"></i> 导入数据
                    </button>
                    <button class="btn btn-primary" onclick="Modules.data_analysis.generateDemo()">
                        <i class="fa-solid fa-flask"></i> 生成演示数据
                    </button>
                </div>
            </div>
            
            <div class="flex-1 panel">
                <div class="panel-header">
                    <div class="panel-title"><i class="fa-solid fa-table"></i> 数据预览</div>
                </div>
                <div class="panel-body overflow-auto" id="data-preview" style="max-height:400px">
                    <div class="text-center py-16 text-dim">
                        <i class="fa-solid fa-database text-4xl mb-4 opacity-30"></i>
                        <div>导入或生成数据进行分析</div>
                    </div>
                </div>
            </div>
            
            <div class="mt-6">
                <div class="chart-container large" id="data-chart"></div>
            </div>
        </div>
    `,
    _data: null,
    importData: () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.csv,.json';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            UI.loading.show('导入中...');
            
            try {
                if (file.name.endsWith('.csv')) {
                    Modules.data_analysis._data = await Utils.readCSV(file);
                } else {
                    const text = await file.text();
                    Modules.data_analysis._data = JSON.parse(text);
                }
                
                UI.loading.hide();
                UI.toast('导入成功，共 ' + Modules.data_analysis._data.length + ' 条数据');
                Modules.data_analysis.renderPreview();
            } catch (err) {
                UI.loading.hide();
                UI.toast('导入失败: ' + err.message, 'error');
            }
        };
        input.click();
    },
    generateDemo: () => {
        Modules.data_analysis._data = Utils.generateKline(100, 50);
        UI.toast('已生成100天演示数据');
        Modules.data_analysis.renderPreview();
    },
    renderPreview: () => {
        const data = Modules.data_analysis._data;
        if (!data || data.length === 0) return;
        
        const el = document.getElementById('data-preview');
        if (!el) return;
        
        const headers = Object.keys(data[0]);
        el.innerHTML = UI.dataTable(
            headers.map(h => ({ title: h, key: h })),
            data.slice(0, 50)
        );
        
        // 渲染图表
        if (headers.includes('close')) {
            setTimeout(() => {
                UI.renderLine('data-chart', [
                    { name: '收盘价', data: data.map(d => d.close) }
                ], { xData: data.map(d => d.date || '') });
            }, 100);
        }
    }
};

// ═══ 因子研究模块 (占位) ═══
Modules.factors = {
    render: () => `
        <div class="h-full flex flex-col p-6 animate-fade-in">
            <div class="flex items-center justify-between mb-6">
                <h2 class="text-xl font-bold text-white flex items-center gap-3">
                    <i class="fa-solid fa-dna text-pink-400"></i>
                    因子研究
                </h2>
            </div>
            
            <div class="flex-1 grid grid-cols-3 gap-6">
                <div class="panel col-span-2">
                    <div class="panel-header">
                        <div class="panel-title"><i class="fa-solid fa-flask"></i> 因子测试</div>
                    </div>
                    <div class="panel-body">
                        <div class="mb-4">
                            <label>因子公式 (Python表达式)</label>
                            <input type="text" id="factor-formula" placeholder="例如: (close - mean(close, 20)) / std(close, 20)" value="(close - mean(close, 20)) / std(close, 20)">
                        </div>
                        <div class="grid grid-cols-3 gap-4 mb-4">
                            <div>
                                <label>回看周期</label>
                                <input type="number" id="factor-lookback" value="20">
                            </div>
                            <div>
                                <label>分组数量</label>
                                <input type="number" id="factor-groups" value="5">
                            </div>
                            <div>
                                <label>持仓周期</label>
                                <input type="number" id="factor-holding" value="5">
                            </div>
                        </div>
                        <button class="btn btn-primary" onclick="Modules.factors.test()">
                            <i class="fa-solid fa-play"></i> 运行因子测试
                        </button>
                    </div>
                </div>
                
                <div class="panel">
                    <div class="panel-header">
                        <div class="panel-title"><i class="fa-solid fa-chart-simple"></i> 测试结果</div>
                    </div>
                    <div class="panel-body" id="factor-result">
                        <div class="text-center py-8 text-dim">
                            <div class="text-sm">运行测试查看结果</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    test: async () => {
        UI.loading.show('因子测试中...');
        await new Promise(r => setTimeout(r, 1000));
        
        // 模拟因子测试结果
        const ic = (Math.random() * 0.1 - 0.02).toFixed(4);
        const ir = (Math.random() * 2).toFixed(4);
        
        UI.loading.hide();
        
        const el = document.getElementById('factor-result');
        if (!el) return;
        
        el.innerHTML = `
            <div class="space-y-4">
                ${UI.statCard('IC均值', ic, { color: ic > 0.02 ? 'profit' : 'loss' })}
                ${UI.statCard('ICIR', ir, { color: ir > 0.5 ? 'profit' : 'loss' })}
                ${UI.statCard('t统计量', (Math.random() * 4).toFixed(2), { color: 'accent' })}
                ${UI.statCard('胜率', Utils.formatPercent(Math.random() * 0.2 + 0.4), { color: 'accent' })}
            </div>
            <button class="btn btn-gold w-full mt-4" onclick="Modules.factors.analyze()">
                <i class="fa-solid fa-robot"></i> AI因子分析
            </button>
        `;
    }
};

// ═══ 其他模块占位 ═══
Modules.portfolio = { render: () => `<div class="h-full flex center text-dim animate-fade-in"><div class="text-center"><i class="fa-solid fa-layer-group text-4xl mb-4 opacity-30"></i><div>组合管理模块</div><div class="text-sm mt-2">开发中...</div></div></div>` };
Modules.risk = { render: () => `<div class="h-full flex center text-dim animate-fade-in"><div class="text-center"><i class="fa-solid fa-shield-halved text-4xl mb-4 opacity-30"></i><div>风控系统模块</div><div class="text-sm mt-2">开发中...</div></div></div>` };
Modules.ai_assistant = { render: () => `<div class="h-full flex flex-col p-6 animate-fade-in"><div class="flex items-center justify-between mb-6"><h2 class="text-xl font-bold text-white flex items-center gap-3"><i class="fa-solid fa-robot text-accent"></i>AI量化助手</h2></div><div class="flex-1 panel"><div class="panel-body"><div class="mb-4"><label>描述你的策略需求</label><textarea id="ai-prompt" class="h-32" placeholder="例如：我想做一个基于均线交叉的趋势跟踪策略，当5日均线上穿20日均线时买入，下穿时卖出..."></textarea></div><div class="grid grid-cols-3 gap-4 mb-4"><div><label>策略风格</label><select id="ai-style"><option value="trend">趋势跟踪</option><option value="meanrev">均值回归</option><option value="arbitrage">套利</option><option value="multi">多因子</option></select></div></div><button class="btn btn-primary" onclick="Modules.ai_assistant.generate()"><i class="fa-solid fa-wand-magic-sparkles"></i> 生成策略</button></div></div><div class="mt-4 panel" id="ai-result" style="display:none"><div class="panel-header"><div class="panel-title">生成结果</div></div><div class="panel-body overflow-auto" style="max-height:400px" id="ai-content"></div></div></div>`, generate: async () => { const prompt = document.getElementById('ai-prompt')?.value; const style = document.getElementById('ai-style')?.value || 'trend'; if(!prompt) { UI.toast('请输入策略描述', 'warning'); return; } UI.loading.show('AI生成中...'); const result = await AI.generateStrategy(prompt, style); UI.loading.hide(); if(result) { document.getElementById('ai-result').style.display = 'block'; document.getElementById('ai-content').innerHTML = typeof marked !== 'undefined' ? marked.parse(result) : '<pre>' + result + '</pre>'; } } };
Modules.code_lab = { render: () => `<div class="h-full flex center text-dim animate-fade-in"><div class="text-center"><i class="fa-solid fa-code text-4xl mb-4 opacity-30"></i><div>代码实验室模块</div><div class="text-sm mt-2">开发中...</div></div></div>` };
Modules.report = { render: () => `<div class="h-full flex center text-dim animate-fade-in"><div class="text-center"><i class="fa-solid fa-file-lines text-4xl mb-4 opacity-30"></i><div>研报中心模块</div><div class="text-sm mt-2">开发中...</div></div></div>` };
Modules.market_monitor = { render: () => `<div class="h-full flex center text-dim animate-fade-in"><div class="text-center"><i class="fa-solid fa-tower-broadcast text-4xl mb-4 opacity-30"></i><div>行情监控模块</div><div class="text-sm mt-2">开发中...</div></div></div>` };
Modules.news = { render: () => `<div class="h-full flex center text-dim animate-fade-in"><div class="text-center"><i class="fa-solid fa-newspaper text-4xl mb-4 opacity-30"></i><div>资讯中心模块</div><div class="text-sm mt-2">开发中...</div></div></div>` };
Modules.settings = { render: () => `<div class="h-full flex flex-col p-6 animate-fade-in"><div class="flex items-center justify-between mb-6"><h2 class="text-xl font-bold text-white flex items-center gap-3"><i class="fa-solid fa-gear text-gray-400"></i>系统设置</h2></div><div class="flex-1 grid grid-cols-2 gap-6"><div class="panel"><div class="panel-header"><div class="panel-title"><i class="fa-solid fa-key"></i> API配置</div></div><div class="panel-body"><div class="space-y-4"><div><label>AI服务商</label><select id="settings-provider" onchange="Modules.settings.updateProvider()"><option value="openai">OpenAI</option><option value="deepseek">DeepSeek</option><option value="anthropic">Anthropic</option><option value="google">Google</option><option value="custom">自定义</option></select></div><div><label>API Base URL</label><input type="text" id="settings-baseurl" placeholder="https://api.openai.com/v1"></div><div><label>API Key</label><input type="password" id="settings-apikey" placeholder="sk-..."></div><div><label>模型</label><input type="text" id="settings-model" placeholder="gpt-4o-mini"></div><button class="btn btn-primary w-full" onclick="Modules.settings.save()"><i class="fa-solid fa-save"></i> 保存配置</button></div></div></div><div class="panel"><div class="panel-header"><div class="panel-title"><i class="fa-solid fa-database"></i> 数据管理</div></div><div class="panel-body"><div id="local-sync-status"></div><div class="mt-4 pt-4 border-t border-white/10"><button class="btn btn-loss w-full" onclick="Modules.settings.clearAll()"><i class="fa-solid fa-trash"></i> 清空所有数据</button></div></div></div></div></div>`, init: () => { const cfg = AI.config; document.getElementById('settings-provider').value = cfg.provider || 'openai'; document.getElementById('settings-baseurl').value = cfg.baseUrl || ''; document.getElementById('settings-apikey').value = cfg.apiKey || ''; document.getElementById('settings-model').value = cfg.model || ''; LocalSync._updateStatusBar(); }, save: async () => { const cfg = { provider: document.getElementById('settings-provider').value, baseUrl: document.getElementById('settings-baseurl').value, apiKey: document.getElementById('settings-apikey').value, model: document.getElementById('settings-model').value }; await AI.saveConfig(cfg); }, clearAll: async () => { if(await UI.confirm('确定要清空所有数据吗？此操作不可恢复！', '危险操作')) { indexedDB.deleteDatabase(DB.name); localStorage.clear(); location.reload(); } } };