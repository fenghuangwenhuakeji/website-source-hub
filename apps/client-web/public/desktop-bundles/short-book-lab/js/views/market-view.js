/**
 * 市场分析系统 - Market Analysis System
 * 版本: v2.0 - 全面重构版
 * 特点: 固定数据结构、全面详细分析、可复用报告
 */
var marketView = {
    // ========== 状态管理 ==========
    currentMode: 'dashboard',
    _isLoading: false,
    _isChatLoading: false,
    _currentReport: null,
    _chatHistory: [],
    _chatMessages: [],
    _streamContent: '',
    _aborted: false,
    _currentReader: null,

    // ========== 模式配置 ==========
    MODES: {
        dashboard: { 
            icon: '📊', 
            name: '市场仪表盘', 
            desc: '网文市场整体概况与趋势',
            color: '#3b82f6',
            sections: ['overview', 'platforms', 'genres', 'newbooks', 'readers']
        },
        genre: { 
            icon: '📈', 
            name: '题材深度分析', 
            desc: '特定题材的全方位分析',
            color: '#8b5cf6',
            sections: ['overview', 'subgenres', 'trends', 'readers', 'competition', 'strategy']
        },
        competitor: { 
            icon: '🎯', 
            name: '竞品分析', 
            desc: '深度拆解竞品作品',
            color: '#f59e0b',
            sections: ['profile', 'structure', 'character', 'world', 'technique', 'commercial', 'opportunities']
        },
        creative: { 
            icon: '💡', 
            name: '创作辅助', 
            desc: '热点追踪与灵感生成',
            color: '#10b981',
            sections: ['hottopics', 'materials', 'inspirations', 'forecasts']
        }
    },

    // ========== 数据配置 ==========
    PLATFORMS: [
        { value: 'qidian', label: '起点中文网', icon: '📕', users: '1200万', trend: 'stable' },
        { value: 'jjwxc', label: '晋江文学城', icon: '📘', users: '800万', trend: 'up' },
        { value: 'fanqie', label: '番茄小说', icon: '🍅', users: '2000万', trend: 'up' },
        { value: 'qimao', label: '七猫小说', icon: '🐱', users: '1500万', trend: 'stable' },
        { value: 'zongheng', label: '纵横中文网', icon: '📗', users: '600万', trend: 'down' },
        { value: 'douban', label: '豆瓣读书', icon: '📚', users: '300万', trend: 'stable' }
    ],

    GENRES: [
        { value: 'fantasy', label: '玄幻', icon: '🧙', lifecycle: 'mature', share: 28.5 },
        { value: 'urban', label: '都市', icon: '🏙️', lifecycle: 'mature', share: 22.3 },
        { value: 'romance', label: '言情', icon: '💕', lifecycle: 'mature', share: 18.7 },
        { value: 'mystery', label: '悬疑', icon: '🔍', lifecycle: 'growth', share: 12.4 },
        { value: 'scifi', label: '科幻', icon: '🚀', lifecycle: 'growth', share: 8.9 },
        { value: 'history', label: '历史', icon: '📜', lifecycle: 'stable', share: 5.2 },
        { value: 'wuxia', label: '武侠仙侠', icon: '⚔️', lifecycle: 'decline', share: 2.8 },
        { value: 'horror', label: '恐怖灵异', icon: '👻', lifecycle: 'niche', share: 1.2 }
    ],

    SUBGENRES: {
        fantasy: [
            { name: '东方玄幻', heat: 92, competition: '极高', opportunity: '传统套路仍有市场，但需创新' },
            { name: '异世大陆', heat: 85, competition: '高', opportunity: '系统流、种田流仍有空间' },
            { name: '高武世界', heat: 78, competition: '高', opportunity: '结合现实热点' },
            { name: '克系玄幻', heat: 65, competition: '中', opportunity: '新兴细分，蓝海市场' },
            { name: '赛博修仙', heat: 58, competition: '低', opportunity: '跨界融合，创新空间大' }
        ],
        urban: [
            { name: '都市异能', heat: 88, competition: '极高', opportunity: '需差异化设定' },
            { name: '重生都市', heat: 82, competition: '高', opportunity: '结合时代热点' },
            { name: '职场商战', heat: 71, competition: '中', opportunity: '专业性强，门槛高' },
            { name: '娱乐明星', heat: 68, competition: '高', opportunity: '结合真实娱乐圈' }
        ],
        romance: [
            { name: '现代言情', heat: 90, competition: '极高', opportunity: '甜宠、虐恋仍有市场' },
            { name: '古代言情', heat: 86, competition: '高', opportunity: '宫斗、宅斗细分' },
            { name: '玄幻言情', heat: 74, competition: '中', opportunity: '女性向玄幻增长' },
            { name: '快穿', heat: 69, competition: '高', opportunity: '创新世界观' }
        ],
        mystery: [
            { name: '推理侦探', heat: 79, competition: '中', opportunity: '专业推理需求增长' },
            { name: '悬疑惊悚', heat: 76, competition: '中', opportunity: '氛围营造是关键' },
            { name: '犯罪心理', heat: 72, competition: '低', opportunity: '专业门槛高，竞争小' },
            { name: '无限流', heat: 81, competition: '高', opportunity: '副本设计创新' }
        ]
    },

    ANALYSIS_PERIODS: [
        { value: 'week', label: '近7天' },
        { value: 'month', label: '近30天' },
        { value: 'quarter', label: '近3个月' },
        { value: 'halfyear', label: '近半年' },
        { value: 'year', label: '近一年' }
    ],

    // ========== 选中状态 ==========
    _selectedPlatforms: ['qidian', 'fanqie'],
    _selectedGenre: 'fantasy',
    _selectedPeriod: 'month',
    _competitorTitle: '',
    _creativeTopic: '',

    // ========== 初始化 ==========
    init: function() {
        this.renderControlPanel();
        this.renderResultArea();
        this._updateActionButtons();
    },

    // 停止生成
    abort: function() {
        this._aborted = true;
        this._isLoading = false;
        if (this._currentReader) {
            try {
                this._currentReader.cancel();
            } catch(e) {}
            this._currentReader = null;
        }
        showNotification('已停止生成', 'info');
        this._updateActionButtons();
    },

    // 更新按钮状态
    _updateActionButtons: function() {
        var generateBtn = document.getElementById('market-generate-btn');
        if (this._isLoading) {
            if (generateBtn) {
                generateBtn.innerHTML = '⏹ 停止分析';
                generateBtn.onclick = function() { marketView.abort(); };
                generateBtn.classList.add('btn-danger');
                generateBtn.classList.remove('btn-primary');
            }
        } else {
            if (generateBtn) {
                generateBtn.innerHTML = '📊 生成分析报告';
                generateBtn.onclick = function() { marketView.generateAnalysis(); };
                generateBtn.classList.remove('btn-danger');
                generateBtn.classList.add('btn-primary');
            }
        }
    },

    // ========== 模式切换 ==========
    selectMode: function(mode) {
        this.currentMode = mode;
        this._currentReport = null;
        this._chatHistory = [];
        this._chatMessages = [];
        this.renderControlPanel();
        this.renderResultArea();
    },

    // ========== 渲染控制面板 ==========
    renderControlPanel: function() {
        var panel = document.getElementById('market-control');
        if (!panel) return;

        var self = this;
        var html = '<div class="market-control-inner">';

        // 模式选择标签
        html += '<div class="market-mode-tabs">';
        Object.entries(this.MODES).forEach(function(entry) {
            var key = entry[0], m = entry[1];
            var isActive = self.currentMode === key;
            var activeClass = isActive ? ' active' : '';
            var activeStyle = isActive ? ' style="border-color:' + m.color + ';color:' + m.color + ';"' : '';
            html += '<button class="market-mode-btn' + activeClass + '"' + activeStyle + ' onclick="marketView.selectMode(\'' + key + '\')">' + 
                '<span class="mode-icon">' + m.icon + '</span>' +
                '<span class="mode-name">' + m.name + '</span>' +
                '</button>';
        });
        html += '</div>';

        // 模式专属控件
        html += '<div class="market-form">';
        html += this._renderModeControls();
        html += '</div>';

        // 分析按钮
        html += this._renderActionButton();

        html += '</div>';
        panel.innerHTML = html;
    },

    _renderModeControls: function() {
        var mode = this.currentMode;
        var html = '';

        switch(mode) {
            case 'dashboard':
                html += this._renderPlatformSelector();
                html += this._renderPeriodSelector();
                break;
            case 'genre':
                html += this._renderGenreSelector();
                html += this._renderPeriodSelector();
                break;
            case 'competitor':
                html += this._renderCompetitorInput();
                break;
            case 'creative':
                html += this._renderCreativeInput();
                break;
        }

        return html;
    },

    _renderPlatformSelector: function() {
        var html = '<div class="form-group"><label class="form-label">📱 分析平台</label><div class="market-chip-grid">';
        this.PLATFORMS.forEach(function(p) {
            var isSelected = marketView._selectedPlatforms.indexOf(p.value) >= 0;
            var activeClass = isSelected ? ' active' : '';
            html += '<button class="market-chip' + activeClass + '" onclick="marketView.togglePlatform(\'' + p.value + '\')">' + 
                p.icon + ' ' + p.label + '</button>';
        });
        html += '</div></div>';
        return html;
    },

    _renderGenreSelector: function() {
        var html = '<div class="form-group"><label class="form-label">📚 选择题材</label><div class="market-chip-grid">';
        this.GENRES.forEach(function(g) {
            var isSelected = marketView._selectedGenre === g.value;
            var activeClass = isSelected ? ' active' : '';
            var lifecycleBadge = '';
            switch(g.lifecycle) {
                case 'mature': lifecycleBadge = '<span class="lifecycle-badge mature">成熟</span>'; break;
                case 'growth': lifecycleBadge = '<span class="lifecycle-badge growth">成长</span>'; break;
                case 'decline': lifecycleBadge = '<span class="lifecycle-badge decline">衰退</span>'; break;
                case 'niche': lifecycleBadge = '<span class="lifecycle-badge niche">小众</span>'; break;
            }
            html += '<button class="market-chip' + activeClass + '" onclick="marketView.setGenre(\'' + g.value + '\')">' + 
                g.icon + ' ' + g.label + lifecycleBadge + '</button>';
        });
        html += '</div></div>';
        return html;
    },

    _renderPeriodSelector: function() {
        var html = '<div class="form-group"><label class="form-label">📅 分析周期</label><div class="market-period-btns">';
        this.ANALYSIS_PERIODS.forEach(function(p) {
            var isSelected = marketView._selectedPeriod === p.value;
            var activeClass = isSelected ? ' active' : '';
            html += '<button class="market-period-btn' + activeClass + '" onclick="marketView.setPeriod(\'' + p.value + '\')">' + p.label + '</button>';
        });
        html += '</div></div>';
        return html;
    },

    _renderCompetitorInput: function() {
        var html = '<div class="form-group">';
        html += '<label class="form-label">🎯 竞品作品</label>';
        html += '<input type="text" class="form-input" id="market-competitor-title" placeholder="输入书名（如：诡秘之主、斗破苍穹）" value="' + _escapeHtml(this._competitorTitle) + '">';
        html += '<div class="market-quick-books">';
        html += '<div class="quick-books-label">⚡ 热门作品</div>';
        html += '<div class="quick-books-grid">';
        ['诡秘之主', '斗破苍穹', '全职高手', '盗墓笔记', '庆余年', '凡人修仙传'].forEach(function(book) {
            html += '<button class="quick-book-btn" onclick="marketView.setCompetitorTitle(\'' + book + '\')">' + book + '</button>';
        });
        html += '</div></div>';
        html += '</div>';
        return html;
    },

    _renderCreativeInput: function() {
        var html = '<div class="form-group">';
        html += '<label class="form-label">💡 创作主题</label>';
        html += '<input type="text" class="form-input" id="market-creative-topic" placeholder="输入主题或关键词（如：系统流、末日求生）" value="' + _escapeHtml(this._creativeTopic) + '">';
        html += '<div class="market-quick-topics">';
        html += '<div class="quick-topics-label">🔥 热门主题</div>';
        html += '<div class="quick-topics-grid">';
        ['系统流', '签到流', '末日求生', '克系玄幻', '赛博修仙', '无限流'].forEach(function(topic) {
            html += '<button class="quick-topic-btn" onclick="marketView.setCreativeTopic(\'' + topic + '\')">' + topic + '</button>';
        });
        html += '</div></div>';
        html += '</div>';
        return html;
    },

    _renderActionButton: function() {
        var mode = this.MODES[this.currentMode];
        var btnId = 'id="market-generate-btn"';
        if (this._isLoading) {
            var btnStyle = ' style="background:linear-gradient(135deg,#ef4444,#dc2626);"';
            return '<button ' + btnId + ' class="market-action-btn"' + btnStyle + ' onclick="marketView.abort()">⏹ 停止分析</button>';
        }
        var btnText = mode.icon + ' 开始' + mode.name;
        var btnStyle = ' style="background:linear-gradient(135deg,' + mode.color + ',' + mode.color + 'cc);"';
        return '<button ' + btnId + ' class="market-action-btn"' + btnStyle + ' onclick="marketView.executeAnalysis()">' + btnText + '</button>';
    },

    // ========== 交互处理 ==========
    togglePlatform: function(value) {
        var idx = this._selectedPlatforms.indexOf(value);
        if (idx >= 0) {
            if (this._selectedPlatforms.length > 1) {
                this._selectedPlatforms.splice(idx, 1);
            }
        } else {
            this._selectedPlatforms.push(value);
        }
        this.renderControlPanel();
    },

    setGenre: function(value) {
        this._selectedGenre = value;
        this.renderControlPanel();
    },

    setPeriod: function(value) {
        this._selectedPeriod = value;
        this.renderControlPanel();
    },

    setCompetitorTitle: function(title) {
        this._competitorTitle = title;
        var input = document.getElementById('market-competitor-title');
        if (input) input.value = title;
    },

    setCreativeTopic: function(topic) {
        this._creativeTopic = topic;
        var input = document.getElementById('market-creative-topic');
        if (input) input.value = topic;
    },

    // ========== 执行分析 ==========
    executeAnalysis: async function() {
        if (this._isLoading) return;

        // 同步输入值
        var competitorInput = document.getElementById('market-competitor-title');
        if (competitorInput) this._competitorTitle = competitorInput.value;
        var creativeInput = document.getElementById('market-creative-topic');
        if (creativeInput) this._creativeTopic = creativeInput.value;

        // 验证输入
        if (this.currentMode === 'competitor' && !this._competitorTitle.trim()) {
            showNotification('请输入竞品作品名称', 'error');
            return;
        }

        this._isLoading = true;
        this._aborted = false;
        this._currentReport = null;
        this._streamContent = '';
        this.renderControlPanel();
        this.renderResultArea();
        this._updateActionButtons();

        try {
            var config = await apiClient.getActiveConfig();
            if (!config) {
                throw new Error('请先在API设置中添加并激活API配置');
            }

            var prompt = this._buildPrompt();
            
            // 使用流式输出
            await this._callAIStream(prompt, config);
            
            showNotification('分析完成', 'success');
        } catch (e) {
            showNotification('分析失败: ' + e.message, 'error');
            console.error(e);
        } finally {
            this._isLoading = false;
            this._updateActionButtons();
            this.renderControlPanel();
            this.renderResultArea();
        }
    },

    _buildPrompt: function() {
        var today = new Date().toLocaleDateString('zh-CN');
        var mode = this.currentMode;

        if (mode === 'dashboard') {
            var platforms = this._selectedPlatforms.map(function(v) {
                var p = marketView.PLATFORMS.find(function(x) { return x.value === v; });
                return p ? p.label : v;
            }).join('、');
            var period = this._getPeriodLabel();

            return '当前日期：' + today + '\n\n' +
                '请作为专业的网络文学市场分析师，基于2025-2026年最新数据，对以下平台进行' + period + '的市场分析：\n' +
                '平台：' + platforms + '\n\n' +
                '请严格按照以下JSON格式输出分析结果（确保所有字段都存在）：\n\n' +
                '{\n' +
                '  "overview": {\n' +
                '    "reportTitle": "网文市场分析报告",\n' +
                '    "reportDate": "' + today + '",\n' +
                '    "dataPeriod": "' + period + '",\n' +
                '    "summary": "市场整体概述（200字左右）"\n' +
                '  },\n' +
                '  "platformRankings": [\n' +
                '    {\n' +
                '      "rank": 1,\n' +
                '      "platform": "平台名称",\n' +
                '      "icon": "emoji",\n' +
                '      "heatIndex": 95,\n' +
                '      "activeUsers": "用户数",\n' +
                '      "newBooks": 数字,\n' +
                '      "topGenre": "热门题材",\n' +
                '      "trend": "up/down/stable"\n' +
                '    }\n' +
                '  ],\n' +
                '  "genreDistribution": [\n' +
                '    {\n' +
                '      "genre": "题材名",\n' +
                '      "percentage": 28.5,\n' +
                '      "bookCount": 数字,\n' +
                '      "avgCollection": 数字,\n' +
                '      "trend": "stable/up/down"\n' +
                '    }\n' +
                '  ],\n' +
                '  "newBookPerformance": {\n' +
                '    "totalNew": 数字,\n' +
                '    "avgCollection": 数字,\n' +
                '    "standoutCount": 数字,\n' +
                '    "standoutRate": "百分比"\n' +
                '  },\n' +
                '  "readerPreferences": {\n' +
                '    "ageGroups": [\n' +
                '      {"group": "18-24岁", "percentage": 35},\n' +
                '      {"group": "25-30岁", "percentage": 28}\n' +
                '    ],\n' +
                '    "readingTime": [\n' +
                '      {"period": "早晨", "percentage": 15},\n' +
                '      {"period": "晚间", "percentage": 45}\n' +
                '    ],\n' +
                '    "paymentWillingness": 68.5\n' +
                '  },\n' +
                '  "insights": "市场洞察与建议（300字）"\n' +
                '}\n\n' +
                '注意：\n' +
                '1. 所有数据必须是2025-2026年的最新数据\n' +
                '2. 数据要真实合理，符合当前网文市场现状\n' +
                '3. 必须严格按照JSON格式输出，确保可解析\n' +
                '4. 不要输出任何JSON格式之外的说明文字';

        } else if (mode === 'genre') {
            var genre = this.GENRES.find(function(g) { return g.value === marketView._selectedGenre; });
            var period = this._getPeriodLabel();
            var subgenres = this.SUBGENRES[this._selectedGenre] || [];

            return '当前日期：' + today + '\n\n' +
                '请作为专业的网络文学题材分析师，对"' + genre.label + '"题材进行' + period + '的深度分析。\n\n' +
                '请严格按照以下JSON格式输出分析结果：\n\n' +
                '{\n' +
                '  "genreOverview": {\n' +
                '    "genreName": "' + genre.label + '",\n' +
                '    "lifeCycle": "导入期/成长期/成熟期/衰退期",\n' +
                '    "marketSize": "市场份额百分比",\n' +
                '    "growthRate": "增长率",\n' +
                '    "competitionLevel": "低/中/高",\n' +
                '    "saturation": 数字\n' +
                '  },\n' +
                '  "subGenres": [\n' +
                '    {\n' +
                '      "name": "子题材名",\n' +
                '      "heat": 热度分数,\n' +
                '      "bookCount": 作品数量,\n' +
                '      "avgCollection": 平均收藏,\n' +
                '      "competition": "竞争程度",\n' +
                '      "opportunity": "机会点描述"\n' +
                '    }\n' +
                '  ],\n' +
                '  "trendAnalysis": {\n' +
                '    "risingElements": ["上升元素1", "上升元素2"],\n' +
                '    "decliningElements": ["下降元素1"],\n' +
                '    "emergingTrends": ["新兴趋势1"],\n' +
                '    "prediction": "未来6个月趋势预测"\n' +
                '  },\n' +
                '  "readerAnalysis": {\n' +
                '    "coreDemographics": "核心人群描述",\n' +
                '    "preferences": ["偏好1", "偏好2"],\n' +
                '    "painPoints": ["痛点1", "痛点2"],\n' +
                '    "unmetNeeds": ["未满足需求1"]\n' +
                '  },\n' +
                '  "competitiveLandscape": {\n' +
                '    "topPlayers": ["头部作者1", "头部作者2"],\n' +
                '    "marketConcentration": "CR5: XX%",\n' +
                '    "barrierToEntry": "进入壁垒描述",\n' +
                '    "differentiationOpportunities": ["差异化机会1"]\n' +
                '  },\n' +
                '  "entryStrategy": {\n' +
                '    "recommendedSubGenre": "推荐子题材",\n' +
                '    "positioning": "定位建议",\n' +
                '    "estimatedInvestment": "预计投入时间",\n' +
                '    "successProbability": "成功概率",\n' +
                '    "keySuccessFactors": ["成功要素1", "成功要素2"]\n' +
                '  }\n' +
                '}\n\n' +
                '注意：\n' +
                '1. 子题材分析参考：' + subgenres.map(function(s) { return s.name; }).join('、') + '\n' +
                '2. 数据必须是2025-2026年最新\n' +
                '3. 严格按JSON格式输出';

        } else if (mode === 'competitor') {
            return '当前日期：' + today + '\n\n' +
                '请作为专业的网络文学分析师，对《' + this._competitorTitle + '》进行深度竞品分析。\n\n' +
                '请严格按照以下JSON格式输出分析结果：\n\n' +
                '{\n' +
                '  "workProfile": {\n' +
                '    "title": "作品名",\n' +
                '    "author": "作者",\n' +
                '    "platform": "平台",\n' +
                '    "genre": "题材",\n' +
                '    "wordCount": "字数",\n' +
                '    "status": "连载/完结",\n' +
                '    "rating": 评分,\n' +
                '    "collections": 收藏数,\n' +
                '    "recommendationCount": 推荐数\n' +
                '  },\n' +
                '  "structureAnalysis": {\n' +
                '    "chapterStructure": "结构类型",\n' +
                '    "pacingCurve": [\n' +
                '      {"stage": "开篇", "wordCount": 数字, "tension": 张力值}\n' +
                '    ],\n' +
                '    "hookDesign": {\n' +
                '      "openingHook": "开篇钩子",\n' +
                '      "chapterHooks": "章末钩子",\n' +
                '      "arcHooks": "大钩子"\n' +
                '    }\n' +
                '  },\n' +
                '  "characterAnalysis": {\n' +
                '    "protagonist": {\n' +
                '      "name": "主角名",\n' +
                '      "archetype": "原型",\n' +
                '      "characterArc": "成长轨迹",\n' +
                '      "strengths": ["优点1"],\n' +
                '      "flaws": ["缺点1"]\n' +
                '    },\n' +
                '    "supportingCast": [\n' +
                '      {"name": "配角名", "role": "角色", "function": "功能"}\n' +
                '    ]\n' +
                '  },\n' +
                '  "worldBuilding": {\n' +
                '    "settingType": "世界观类型",\n' +
                '    "magicSystem": "力量体系",\n' +
                '    "uniqueElements": ["创新点1"],\n' +
                '    "consistency": 一致性评分\n' +
                '  },\n' +
                '  "writingTechnique": {\n' +
                '    "narrativeStyle": "叙事风格",\n' +
                '    "strengths": ["优势1"],\n' +
                '    "distinctiveFeatures": ["特色1"],\n' +
                '    "learnablePoints": ["可学点1"]\n' +
                '  },\n' +
                '  "commercialAnalysis": {\n' +
                '    "revenueEstimate": "收入预估",\n' +
                '    "fanBase": "粉丝规模",\n' +
                '    "ipPotential": "IP潜力",\n' +
                '    "adaptationValue": "改编价值",\n' +
                '    "successFactors": ["成功因素1"]\n' +
                '  },\n' +
                '  "differentiationOpportunities": ["差异化机会1", "机会2"]\n' +
                '}\n\n' +
                '注意：\n' +
                '1. 如果该作品是真实存在的，请基于真实信息分析\n' +
                '2. 如果是虚构作品，请基于该类型典型特征进行合理推测\n' +
                '3. 严格按JSON格式输出';

        } else if (mode === 'creative') {
            return '当前日期：' + today + '\n\n' +
                '请作为创意写作助手，围绕"' + this._creativeTopic + '"主题提供创作辅助。\n\n' +
                '请严格按照以下JSON格式输出：\n\n' +
                '{\n' +
                '  "hotTopics": [\n' +
                '    {\n' +
                '      "topic": "热点主题",\n' +
                '      "heat": 热度分数,\n' +
                '      "examples": ["示例作品1"],\n' +
                '      "opportunity": "机会点描述"\n' +
                '    }\n' +
                '  ],\n' +
                '  "recommendedMaterials": [\n' +
                '    {\n' +
                '      "type": "素材类型",\n' +
                '      "content": "素材内容",\n' +
                '      "source": "来源"\n' +
                '    }\n' +
                '  ],\n' +
                '  "inspirationPrompts": [\n' +
                '    "灵感提示1",\n' +
                '    "灵感提示2"\n' +
                '  ],\n' +
                '  "trendForecasts": [\n' +
                '    {\n' +
                '      "timeframe": "时间范围",\n' +
                '      "prediction": "预测内容",\n' +
                '      "confidence": 置信度数字\n' +
                '    }\n' +
                '  ]\n' +
                '}\n\n' +
                '注意：严格按JSON格式输出';        }

        return '';
    },

    _getPeriodLabel: function() {
        var period = this.ANALYSIS_PERIODS.find(function(p) { return p.value === marketView._selectedPeriod; });
        return period ? period.label : '近30天';
    },

    _getReportTitle: function() {
        var mode = this.currentMode;
        if (mode === 'dashboard') return '📊 市场仪表盘分析';
        if (mode === 'genre') {
            var genre = this.GENRES.find(function(g) { return g.value === this._selectedGenre; });
            return '📈 ' + (genre ? genre.label : '') + '题材深度分析';
        }
        if (mode === 'competitor') return '🎯 《' + this._competitorTitle + '》竞品分析';
        if (mode === 'creative') return '💡 ' + this._creativeTopic + '创作辅助';
        return '市场分析报告';
    },

    _getParameters: function() {
        return {
            mode: this.currentMode,
            platforms: this._selectedPlatforms,
            genre: this._selectedGenre,
            period: this._selectedPeriod,
            competitorTitle: this._competitorTitle,
            creativeTopic: this._creativeTopic
        };
    },

    // ========== AI调用（非流式） ==========
    _callAI: async function(prompt, config) {
        var req = apiClient.buildRequest(config, prompt, false);
        
        // 添加系统消息
        if (req.body.messages) {
            req.body.messages.unshift({
                role: 'system',
                content: '你是专业的网络文学市场分析师。请严格按照用户要求的JSON格式输出，确保输出是有效的JSON，不要添加任何JSON格式之外的说明文字。'
            });
        }

        var resp = await fetch(req.url, {
            method: 'POST',
            headers: req.headers,
            body: JSON.stringify(req.body)
        });

        if (!resp.ok) {
            var errText = '';
            try { errText = await resp.text(); } catch(x) {}
            throw new Error('API错误 ' + resp.status + ': ' + errText.substring(0, 200));
        }

        var data = await resp.json();
        var content = apiClient.parseResponse(config.provider, data);
        
        // 尝试解析JSON
        try {
            // 提取JSON部分
            var jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            return JSON.parse(content);
        } catch (e) {
            // 如果不是JSON，返回文本格式
            return { rawContent: content };
        }
    },

    // ========== AI调用（流式） ==========
    _callAIStream: async function(prompt, config) {
        var self = this;
        var req = apiClient.buildRequest(config, prompt, true); // true = stream mode
        
        // 添加系统消息
        if (req.body.messages) {
            req.body.messages.unshift({
                role: 'system',
                content: '你是专业的网络文学市场分析师。请严格按照用户要求的JSON格式输出，确保输出是有效的JSON，不要添加任何JSON格式之外的说明文字。'
            });
        }

        var resp = await fetch(req.url, {
            method: 'POST',
            headers: req.headers,
            body: JSON.stringify(req.body)
        });

        if (!resp.ok) {
            var errText = '';
            try { errText = await resp.text(); } catch(x) {}
            throw new Error('API错误 ' + resp.status + ': ' + errText.substring(0, 200));
        }

        var reader = resp.body.getReader();
        this._currentReader = reader;
        var decoder = new TextDecoder();
        var fullContent = '';

        // 初始化报告对象
        this._currentReport = {
            mode: this.currentMode,
            title: this._getReportTitle(),
            createdAt: new Date().toISOString(),
            period: this._selectedPeriod,
            parameters: this._getParameters(),
            result: { streaming: true },
            chatHistory: []
        };

        while (true) {
            if (this._aborted) {
                reader.cancel();
                this._currentReader = null;
                this._streamContent += '\n\n[已停止]';
                this._currentReport.result = this._tryParseStreamingResult(this._streamContent);
                this._currentReport.result.streaming = false;
                this._currentReport.rawContent = this._streamContent;
                return;
            }
            var chunk = await reader.read();
            if (chunk.done) break;

            var text = decoder.decode(chunk.value, { stream: true });
            var lines = text.split('\n');

            for (var i = 0; i < lines.length; i++) {
                var line = lines[i].trim();
                if (!line || !line.startsWith('data:')) continue;

                var data = line.substring(5).trim();
                if (data === '[DONE]') continue;

                try {
                    var json = JSON.parse(data);
                    // 使用 apiClient.parseStreamChunk 统一处理不同提供商的格式
                    var delta = apiClient.parseStreamChunk(config.provider, json);

                    if (delta) {
                        fullContent += delta;
                        self._streamContent = fullContent;
                        
                        // 尝试实时解析JSON并更新报告
                        self._tryParseStreamingResult(fullContent);
                        
                        // 实时渲染
                        self._renderStreamingResult();
                    }
                } catch (e) {
                    // 忽略解析错误，继续处理下一行
                }
            }
        }

        // 流式输出完成，最终解析
        try {
            var jsonMatch = fullContent.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                this._currentReport.result = JSON.parse(jsonMatch[0]);
            } else {
                this._currentReport.result = { rawContent: fullContent };
            }
        } catch (e) {
            this._currentReport.result = { rawContent: fullContent };
        }
    },

    // 尝试解析流式内容中的JSON
    _tryParseStreamingResult: function(content) {
        try {
            // 尝试提取JSON
            var jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                var parsed = JSON.parse(jsonMatch[0]);
                // 如果解析成功，更新报告结果
                if (this._currentReport) {
                    this._currentReport.result = parsed;
                }
            }
        } catch (e) {
            // JSON还不完整，忽略错误
        }
    },

    // 渲染流式输出结果
    _renderStreamingResult: function() {
        var area = document.getElementById('market-result');
        if (!area) return;

        // 如果已经有完整解析的结果，使用正常渲染
        if (this._currentReport && this._currentReport.result && !this._currentReport.result.streaming) {
            area.innerHTML = this._renderReport();
            return;
        }

        // 检查是否已存在流式输出容器
        var streamingContainer = area.querySelector('.market-streaming-result');
        
        if (!streamingContainer) {
            // 首次创建流式输出容器
            var html = '<div class="market-streaming-result">';
            html += '<div class="streaming-header">';
            html += '<div class="streaming-title">' + this._getReportTitle() + '</div>';
            html += '<div class="streaming-status">🔴 实时生成中...</div>';
            html += '</div>';
            
            // 结构化内容容器
            html += '<div class="streaming-parsed-content" id="streaming-parsed"></div>';
            
            // 显示原始流式内容预览
            html += '<div class="streaming-raw">';
            html += '<div class="streaming-raw-title">📝 实时输出</div>';
            html += '<pre class="streaming-pre" id="streaming-pre"></pre>';
            html += '</div>';
            
            html += '</div>';
            
            area.innerHTML = html;
        }
        
        // 更新结构化内容
        var parsedContainer = document.getElementById('streaming-parsed');
        if (parsedContainer && this._currentReport && this._currentReport.result) {
            var result = this._currentReport.result;
            var parsedHtml = '';
            
            // 根据当前模式渲染对应的部分
            if (this.currentMode === 'dashboard' && result.overview) {
                parsedHtml += '<div class="streaming-section">';
                parsedHtml += '<div class="streaming-section-title">📋 市场概览</div>';
                parsedHtml += '<div class="streaming-content">' + _escapeHtml(typeof result.overview === 'object' ? (result.overview.summary || JSON.stringify(result.overview)) : result.overview) + '</div>';
                parsedHtml += '</div>';
            }
            
            if (this.currentMode === 'genre' && result.genreOverview) {
                parsedHtml += '<div class="streaming-section">';
                parsedHtml += '<div class="streaming-section-title">📋 题材概览</div>';
                parsedHtml += '<div class="streaming-content">' + _escapeHtml(JSON.stringify(result.genreOverview)) + '</div>';
                parsedHtml += '</div>';
            }
            
            if (parsedHtml && parsedContainer.innerHTML !== parsedHtml) {
                parsedContainer.innerHTML = parsedHtml;
            }
        }
        
        // 更新原始流式内容
        var pre = document.getElementById('streaming-pre');
        if (pre) {
            var content = this._streamContent;
            // 只显示最后1000个字符，避免过长
            if (content.length > 1000) {
                content = '...' + content.substring(content.length - 1000);
            }
            var escapedContent = _escapeHtml(content);
            if (pre.innerHTML !== escapedContent) {
                pre.innerHTML = escapedContent;
                pre.scrollTop = pre.scrollHeight;
            }
        }
    },

    // ========== 渲染结果区 ==========
    renderResultArea: function() {
        var area = document.getElementById('market-result');
        if (!area) return;

        if (this._isLoading) {
            // 如果已经有流式内容，显示流式输出
            if (this._streamContent && this._streamContent.length > 0) {
                this._renderStreamingResult();
            } else {
                area.innerHTML = this._renderLoadingState();
            }
            return;
        }

        if (!this._currentReport) {
            area.innerHTML = this._renderPlaceholder();
            return;
        }

        area.innerHTML = this._renderReport();
    },

    _renderLoadingState: function() {
        return '<div class="market-loading-state">' +
            '<div class="market-loading-spinner"></div>' +
            '<div class="market-loading-text">AI正在深度分析市场数据...</div>' +
            '<div class="market-loading-subtext">正在建立连接，准备实时输出...</div>' +
            '</div>';
    },

    _renderPlaceholder: function() {
        var mode = this.MODES[this.currentMode];
        var examples = this._getModeExamples(this.currentMode);
        
        var html = '<div class="market-placeholder">';
        html += '<div class="market-placeholder-icon">' + mode.icon + '</div>';
        html += '<div class="market-placeholder-title">' + mode.name + '</div>';
        html += '<div class="market-placeholder-desc">' + mode.desc + '</div>';
        html += '<div class="market-placeholder-hint">选择参数后点击"开始' + mode.name + '"按钮</div>';
        
        // 添加示例展示
        html += '<div class="market-examples-section">';
        html += '<div class="examples-title">📚 分析示例（供参考）</div>';
        html += '<div class="examples-grid">';
        
        examples.forEach(function(ex, idx) {
            html += '<div class="example-card" onclick="marketView.loadExample(' + idx + ')">';
            html += '<div class="example-header">';
            html += '<span class="example-icon">' + ex.icon + '</span>';
            html += '<span class="example-name">' + ex.name + '</span>';
            html += '</div>';
            html += '<div class="example-preview">' + ex.preview + '</div>';
            html += '<div class="example-tags">';
            ex.tags.forEach(function(tag) {
                html += '<span class="example-tag">' + tag + '</span>';
            });
            html += '</div>';
            html += '</div>';
        });
        
        html += '</div></div>';
        html += '</div>';
        return html;
    },

    _getModeExamples: function(mode) {
        var examples = {
            dashboard: [
                {
                    icon: '📊',
                    name: '2025年Q1网文市场全景分析',
                    preview: '番茄小说领跑市场，玄幻题材占比28.5%，读者年龄结构年轻化趋势明显...',
                    tags: ['全平台', '季度报告', '趋势分析'],
                    data: {
                        overview: { summary: '2025年第一季度，中国网络文学市场呈现稳中有升的态势。番茄小说以2000万日活用户领跑免费市场，起点中文网的付费用户ARPU值持续提升。玄幻、都市、言情三大题材占据市场前三，合计占比超过70%。' },
                        platformRankings: [
                            { rank: 1, platform: '番茄小说', icon: '🍅', heatIndex: 95, activeUsers: '2000万', newBooks: '12.5万', trend: 'up' },
                            { rank: 2, platform: '七猫小说', icon: '🐱', heatIndex: 82, activeUsers: '1500万', newBooks: '8.3万', trend: 'stable' },
                            { rank: 3, platform: '起点中文网', icon: '📕', heatIndex: 78, activeUsers: '1200万', newBooks: '3.2万', trend: 'stable' }
                        ],
                        genreDistribution: [
                            { genre: '玄幻', percentage: 28.5 },
                            { genre: '都市', percentage: 22.3 },
                            { genre: '言情', percentage: 18.7 },
                            { genre: '悬疑', percentage: 12.4 },
                            { genre: '科幻', percentage: 8.9 }
                        ],
                        newBookPerformance: { totalNew: '32.8万', avgCollection: '2,450', standoutCount: '156', standoutRate: '0.05%' },
                        readerPreferences: {
                            ageGroups: [{ group: '18-24岁', percentage: 38 }, { group: '25-30岁', percentage: 29 }],
                            readingTime: [{ period: '晚间20-24点', percentage: 48 }],
                            paymentWillingness: 72.5
                        },
                        insights: '市场洞察：免费阅读模式持续扩张，但付费精品内容的价值正在被重新认识。建议新作者优先选择成长型题材如悬疑、科幻，避开过度饱和的玄幻红海。'
                    }
                },
                {
                    icon: '📈',
                    name: '起点VS番茄：付费与免费模式对比',
                    preview: '付费用户粘性更高但增长放缓，免费模式用户基数大但变现效率待提升...',
                    tags: ['双平台对比', '商业模式', '用户分析'],
                    data: {
                        overview: { summary: '起点中文网与番茄小说代表了网文市场的两种主流商业模式。起点凭借优质内容和社区生态维持着高用户粘性，番茄则通过免费+广告模式快速获取流量。' },
                        platformRankings: [
                            { rank: 1, platform: '番茄小说', icon: '🍅', heatIndex: 95, activeUsers: '2000万', newBooks: '12.5万', trend: 'up' },
                            { rank: 2, platform: '起点中文网', icon: '📕', heatIndex: 78, activeUsers: '1200万', newBooks: '3.2万', trend: 'stable' }
                        ],
                        genreDistribution: [
                            { genre: '都市异能', percentage: 32 },
                            { genre: '东方玄幻', percentage: 28 },
                            { genre: '现代言情', percentage: 18 }
                        ],
                        insights: '核心发现：付费模式下用户LTV（生命周期价值）是免费模式的3-5倍，但获客成本也相应更高。未来趋势可能是"免费引流+付费转化"的混合模式。'
                    }
                }
            ],
            genre: [
                {
                    icon: '🧙',
                    name: '玄幻题材深度拆解：从红海到蓝海',
                    preview: '东方玄幻竞争激烈，但克系玄幻、赛博修仙等细分赛道仍有较大机会...',
                    tags: ['玄幻', '生命周期', '竞争分析'],
                    data: {
                        genreOverview: { genreName: '玄幻', lifeCycle: '成熟期', marketSize: '28.5%', growthRate: '+3.2%', competitionLevel: '极高', saturation: 85 },
                        subGenres: [
                            { name: '东方玄幻', heat: 92, bookCount: '45.2万', avgCollection: '8,500', competition: '极高', opportunity: '传统套路饱和，需要创新世界观设定' },
                            { name: '异世大陆', heat: 85, bookCount: '32.1万', avgCollection: '6,200', competition: '高', opportunity: '系统流、种田流仍有空间' },
                            { name: '克系玄幻', heat: 65, bookCount: '3.8万', avgCollection: '12,000', competition: '中', opportunity: '新兴细分，读者付费意愿强' },
                            { name: '赛博修仙', heat: 58, bookCount: '1.2万', avgCollection: '15,500', competition: '低', opportunity: '跨界融合，差异化明显' }
                        ],
                        trendAnalysis: {
                            risingElements: ['克苏鲁元素', '赛博朋克设定', '多世界穿越'],
                            decliningElements: ['传统打怪升级', '无脑爽文套路'],
                            prediction: '预计未来6个月，融合型玄幻（如克系、赛博）将保持20%以上的增速'
                        },
                        entryStrategy: { recommendedSubGenre: '克系玄幻/赛博修仙', positioning: '精品小众路线', estimatedInvestment: '3-6个月', successProbability: '65%', keySuccessFactors: ['独特的世界观设定', '高质量的悬疑氛围', '稳定更新'] }
                    }
                },
                {
                    icon: '🔍',
                    name: '悬疑题材崛起：推理与惊悚的黄金交叉点',
                    preview: '悬疑题材处于成长期，读者对高质量推理内容的需求快速增长...',
                    tags: ['悬疑', '成长期', '机会分析'],
                    data: {
                        genreOverview: { genreName: '悬疑', lifeCycle: '成长期', marketSize: '12.4%', growthRate: '+18.5%', competitionLevel: '中等', saturation: 45 },
                        subGenres: [
                            { name: '推理侦探', heat: 79, bookCount: '8.5万', avgCollection: '15,000', competition: '中', opportunity: '专业推理需求增长，门槛较高' },
                            { name: '悬疑惊悚', heat: 76, bookCount: '12.3万', avgCollection: '11,000', competition: '中', opportunity: '氛围营造是关键' },
                            { name: '犯罪心理', heat: 72, bookCount: '3.2万', avgCollection: '18,500', competition: '低', opportunity: '专业门槛高，竞争小，精品化空间大' }
                        ],
                        entryStrategy: { recommendedSubGenre: '犯罪心理/社会派推理', positioning: '精品专业化路线', estimatedInvestment: '4-8个月', successProbability: '70%', keySuccessFactors: ['专业的知识储备', '严密的逻辑推理', '社会现实关照'] }
                    }
                }
            ],
            competitor: [
                {
                    icon: '📖',
                    name: '《诡秘之主》深度拆解：克系网文的标杆',
                    preview: '爱潜水的乌贼代表作，克苏鲁+蒸汽朋克的完美融合，开创全新流派...',
                    tags: ['诡秘之主', '克苏鲁', '结构分析'],
                    data: {
                        workProfile: { title: '诡秘之主', author: '爱潜水的乌贼', platform: '起点中文网', genre: '异世大陆/克苏鲁', wordCount: '446万字', status: '已完结', rating: 9.2, collections: 8500000, recommendationCount: 12000000 },
                        structureAnalysis: { chapterStructure: '22条途径+9个序列的升级体系', pacingCurve: [{ stage: '第一卷·小丑', wordCount: 80000, tension: 85 }, { stage: '第二卷·无面人', wordCount: 120000, tension: 90 }], hookDesign: { openingHook: '穿越+自杀开局制造悬念', cliffhanger: '每章结尾的信息差设计', foreshadowing: '草蛇灰线，伏笔回收极佳' } },
                        characterAnalysis: { protagonist: { name: '克莱恩·莫雷蒂', traits: '谨慎、善良、有底线', growthArc: '从普通人到愚者的成神之路', uniqueness: '双重身份设定' }, supporting: [{ name: '阿蒙', role: '反派', impression: '令人印象深刻的反派' }] },
                        commercialAnalysis: { estimatedRevenue: '版税+IP超过5000万', ipValue: '动画、游戏、影视全开发', fanEconomy: '庞大的同人创作生态' },
                        opportunities: ['克系世界观仍有开发空间', '序列升级体系可复制创新', '群像塑造手法值得学习']
                    }
                },
                {
                    icon: '⚔️',
                    name: '《斗破苍穹》经典解构：退流的开山鼻祖',
                    preview: '天蚕土豆代表作，"三十年河东三十年河西"成为经典开篇模板...',
                    tags: ['斗破苍穹', '退婚流', '爽文模板'],
                    data: {
                        workProfile: { title: '斗破苍穹', author: '天蚕土豆', platform: '起点中文网', genre: '东方玄幻', wordCount: '533万字', status: '已完结', rating: 8.5, collections: 12000000, recommendationCount: 15000000 },
                        structureAnalysis: { chapterStructure: '地图流+等级升级', pacingCurve: [{ stage: '开篇退婚', wordCount: 50000, tension: 95 }, { stage: '三年之约', wordCount: 200000, tension: 90 }], hookDesign: { openingHook: '天才陨落+退婚羞辱', rhythm: '压抑-爆发-打脸的经典节奏' } },
                        techniqueAnalysis: { writingStyle: '直白爽快，节奏明快', tension: '冲突密集，高潮迭起', emotionalDesign: '强烈的代入感和情绪宣泄' },
                        opportunities: ['退婚流已过时，但情绪设计仍有价值', '地图流可结合新世界观创新', '爽文节奏把控值得学习']
                    }
                }
            ],
            creative: [
                {
                    icon: '💡',
                    name: '末日求生+种田流：后启示录时代的生存美学',
                    preview: '结合末日危机感与种田成就感，打造独特的生存体验...',
                    tags: ['末日求生', '种田流', '创意融合'],
                    data: {
                        hotTopics: [{ topic: '末日囤货', heat: 88, trend: 'up' }, { topic: '废土重建', heat: 82, trend: 'stable' }],
                        materialLibrary: {
                            settings: ['核冬天后的世界', '丧尸病毒爆发', '极端气候灾难'],
                            characters: ['有空间异能的囤货达人', '前工程师技术宅', '野外生存专家'],
                            conflicts: ['资源争夺', '人性考验', '重建秩序']
                        },
                        inspirationCards: [
                            { title: '《我在末日有座岛》', concept: '主角在末日拥有一座可以自给自足的岛屿', elements: ['海岛种田', '末日避难所', '资源管理'], marketPotential: '高' },
                            { title: '《废土农场主》', concept: '在辐射废土上经营有机农场', elements: ['种田', '废土探索', '交易系统'], marketPotential: '中高' }
                        ],
                        riskAssessment: { marketRisk: '低', competitionRisk: '中', differentiationRisk: '低', overallScore: 82 }
                    }
                },
                {
                    icon: '🤖',
                    name: '赛博修仙：科技与修仙的跨界碰撞',
                    preview: '当修真文明遇到赛博朋克，灵气与数据流的奇妙融合...',
                    tags: ['赛博朋克', '修仙', '跨界融合'],
                    data: {
                        hotTopics: [{ topic: '赛博修仙', heat: 75, trend: 'up' }, { topic: '灵气复苏', heat: 85, trend: 'stable' }],
                        materialLibrary: {
                            settings: ['灵气枯竭后的赛博时代', '修真者与AI共存的世界', '数据化飞升'],
                            characters: ['黑客修仙者', '机械飞升的大能', '灵气走私商'],
                            conflicts: ['传统与科技的碰撞', '灵气资源的争夺', 'AI觉醒的威胁']
                        },
                        inspirationCards: [
                            { title: '《赛博剑仙2125》', concept: '在赛博朋克世界用飞剑对抗 corporations', elements: ['赛博朋克', '剑仙', '反乌托邦'], marketPotential: '高' },
                            { title: '《灵气黑客》', concept: '主角用黑客技术盗取灵气', elements: ['黑客', '灵气', '地下世界'], marketPotential: '中高' }
                        ],
                        riskAssessment: { marketRisk: '中', competitionRisk: '低', differentiationRisk: '低', overallScore: 78 }
                    }
                }
            ]
        };
        
        return examples[mode] || examples.dashboard;
    },

    loadExample: function(index) {
        var examples = this._getModeExamples(this.currentMode);
        var example = examples[index];
        if (!example) return;
        
        // 加载示例数据到当前报告
        this._currentReport = {
            mode: this.currentMode,
            title: example.name,
            createdAt: Date.now(),
            result: example.data
        };
        
        // 根据模式设置相应的参数
        if (this.currentMode === 'genre' && example.data.genreOverview) {
            var genreMap = { '玄幻': 'fantasy', '悬疑': 'mystery', '都市': 'urban', '言情': 'romance', '科幻': 'scifi' };
            var genreName = example.data.genreOverview.genreName;
            if (genreMap[genreName]) {
                this._selectedGenre = genreMap[genreName];
            }
        } else if (this.currentMode === 'competitor' && example.data.workProfile) {
            this._competitorTitle = example.data.workProfile.title;
        } else if (this.currentMode === 'creative') {
            this._creativeTopic = example.tags[0] || '创意主题';
        }
        
        // 重新渲染控制面板以更新选中状态
        this.renderControlPanel();
        this.renderResultArea();
        
        showNotification('已加载示例：' + example.name, 'success');
    },

    _renderReport: function() {
        var report = this._currentReport;
        var result = report.result;
        var mode = this.currentMode;

        var html = '<div class="market-report">';

        // 报告头部
        html += '<div class="market-report-header">';
        html += '<div class="market-report-title">' + report.title + '</div>';
        html += '<div class="market-report-meta">';
        html += '<span class="meta-item">📅 ' + new Date(report.createdAt).toLocaleDateString('zh-CN') + '</span>';
        html += '<span class="meta-item">⏱️ ' + this._getPeriodLabel() + '</span>';
        html += '</div>';
        html += '<div class="market-report-actions">';
        html += '<button class="btn" onclick="marketView.saveReport()">💾 保存报告</button>';
        html += '<button class="btn" onclick="marketView.copyReport()">📋 复制</button>';
        html += '<button class="btn" onclick="marketView.exportReport()">📥 导出</button>';
        html += '</div>';
        html += '</div>';

        // 报告内容
        html += '<div class="market-report-content">';
        
        if (mode === 'dashboard') {
            html += this._renderDashboardResult(result);
        } else if (mode === 'genre') {
            html += this._renderGenreResult(result);
        } else if (mode === 'competitor') {
            html += this._renderCompetitorResult(result);
        } else if (mode === 'creative') {
            html += this._renderCreativeResult(result);
        }

        html += '</div>';

        // 追问对话区
        html += this._renderChatSection();

        html += '</div>';
        return html;
    },

    _renderDashboardResult: function(result) {
        var html = '';

        // 概览
        if (result.overview) {
            html += '<div class="report-section">';
            html += '<div class="section-title">📋 市场概览</div>';
            html += '<div class="overview-card">';
            html += '<div class="overview-summary">' + _escapeHtml(result.overview.summary || result.overview) + '</div>';
            html += '</div>';
            html += '</div>';
        }

        // 平台排行
        if (result.platformRankings && result.platformRankings.length > 0) {
            html += '<div class="report-section">';
            html += '<div class="section-title">🏆 平台热度排行</div>';
            html += '<div class="platform-ranking-table">';
            html += '<table class="data-table">';
            html += '<thead><tr><th>排名</th><th>平台</th><th>热度指数</th><th>活跃用户</th><th>新书数量</th><th>趋势</th></tr></thead>';
            html += '<tbody>';
            result.platformRankings.forEach(function(p) {
                var trendIcon = p.trend === 'up' ? '📈' : (p.trend === 'down' ? '📉' : '➡️');
                html += '<tr>';
                html += '<td class="rank">' + p.rank + '</td>';
                html += '<td>' + (p.icon || '📱') + ' ' + _escapeHtml(p.platform) + '</td>';
                html += '<td class="heat-index"><div class="heat-bar" style="width:' + p.heatIndex + '%">' + p.heatIndex + '</div></td>';
                html += '<td>' + p.activeUsers + '</td>';
                html += '<td>' + p.newBooks + '</td>';
                html += '<td>' + trendIcon + '</td>';
                html += '</tr>';
            });
            html += '</tbody></table>';
            html += '</div></div>';
        }

        // 题材分布
        if (result.genreDistribution && result.genreDistribution.length > 0) {
            html += '<div class="report-section">';
            html += '<div class="section-title">📊 题材热度分布</div>';
            html += '<div class="genre-distribution">';
            result.genreDistribution.forEach(function(g) {
                html += '<div class="genre-bar-item">';
                html += '<div class="genre-bar-label">' + _escapeHtml(g.genre) + '</div>';
                html += '<div class="genre-bar-wrap"><div class="genre-bar" style="width:' + g.percentage + '%"></div></div>';
                html += '<div class="genre-bar-value">' + g.percentage + '%</div>';
                html += '</div>';
            });
            html += '</div></div>';
        }

        // 新书表现
        if (result.newBookPerformance) {
            html += '<div class="report-section">';
            html += '<div class="section-title">🆕 新书表现</div>';
            html += '<div class="metrics-grid">';
            html += '<div class="metric-card"><div class="metric-value">' + result.newBookPerformance.totalNew + '</div><div class="metric-label">新书总量</div></div>';
            html += '<div class="metric-card"><div class="metric-value">' + result.newBookPerformance.avgCollection + '</div><div class="metric-label">平均收藏</div></div>';
            html += '<div class="metric-card"><div class="metric-value">' + result.newBookPerformance.standoutCount + '</div><div class="metric-label"> standout作品</div></div>';
            html += '<div class="metric-card"><div class="metric-value">' + result.newBookPerformance.standoutRate + '</div><div class="metric-label">爆款率</div></div>';
            html += '</div></div>';
        }

        // 读者画像
        if (result.readerPreferences) {
            html += '<div class="report-section">';
            html += '<div class="section-title">👥 读者画像</div>';
            html += '<div class="reader-profile">';
            
            if (result.readerPreferences.ageGroups) {
                html += '<div class="profile-section"><div class="profile-section-title">年龄分布</div>';
                result.readerPreferences.ageGroups.forEach(function(age) {
                    html += '<div class="age-bar-item">';
                    html += '<div class="age-label">' + age.group + '</div>';
                    html += '<div class="age-bar-wrap"><div class="age-bar" style="width:' + age.percentage + '%"></div></div>';
                    html += '<div class="age-value">' + age.percentage + '%</div>';
                    html += '</div>';
                });
                html += '</div>';
            }

            html += '</div>';
            html += '<div class="payment-willingness" style="margin-top:16px;text-align:center;padding:12px;background:var(--bg-dark);border-radius:var(--radius-md);">💰 付费意愿: <strong style="color:var(--accent-purple);font-size:18px;">' + result.readerPreferences.paymentWillingness + '%</strong></div>';
            html += '</div>';
        }

        // 洞察建议
        if (result.insights) {
            html += '<div class="report-section">';
            html += '<div class="section-title">💡 市场洞察</div>';
            html += '<div class="insights-card">' + _escapeHtml(result.insights) + '</div>';
            html += '</div>';
        }

        return html;
    },

    _renderGenreResult: function(result) {
        var html = '';

        // 题材概览
        if (result.genreOverview) {
            html += '<div class="report-section">';
            html += '<div class="section-title">📋 题材概览</div>';
            html += '<div class="genre-overview-card">';
            html += '<div class="overview-grid">';
            html += '<div class="overview-item"><div class="item-label">题材名称</div><div class="item-value">' + _escapeHtml(result.genreOverview.genreName) + '</div></div>';
            html += '<div class="overview-item"><div class="item-label">生命周期</div><div class="item-value lifecycle-' + result.genreOverview.lifeCycle + '">' + result.genreOverview.lifeCycle + '</div></div>';
            html += '<div class="overview-item"><div class="item-label">市场份额</div><div class="item-value">' + result.genreOverview.marketSize + '</div></div>';
            html += '<div class="overview-item"><div class="item-label">增长率</div><div class="item-value">' + result.genreOverview.growthRate + '</div></div>';
            html += '<div class="overview-item"><div class="item-label">竞争程度</div><div class="item-value competition-' + result.genreOverview.competitionLevel + '">' + result.genreOverview.competitionLevel + '</div></div>';
            html += '<div class="overview-item"><div class="item-label">饱和度</div><div class="item-value">' + result.genreOverview.saturation + '%</div></div>';
            html += '</div></div></div>';
        }

        // 子题材分析
        if (result.subGenres && result.subGenres.length > 0) {
            html += '<div class="report-section">';
            html += '<div class="section-title">📈 子题材分析</div>';
            html += '<div class="subgenre-table">';
            html += '<table class="data-table">';
            html += '<thead><tr><th>子题材</th><th>热度</th><th>作品数</th><th>竞争</th><th>机会点</th></tr></thead>';
            html += '<tbody>';
            result.subGenres.forEach(function(s) {
                var competitionClass = s.competition === '低' ? 'competition-低' : (s.competition === '中等' ? 'competition-中等' : (s.competition === '高' ? 'competition-高' : 'competition-极高'));
                html += '<tr>';
                html += '<td>' + _escapeHtml(s.name) + '</td>';
                html += '<td><div class="heat-bar" style="width:' + s.heat + '%">' + s.heat + '</div></td>';
                html += '<td>' + s.bookCount + '</td>';
                html += '<td class="' + competitionClass + '">' + s.competition + '</td>';
                html += '<td class="opportunity">' + _escapeHtml(s.opportunity) + '</td>';
                html += '</tr>';
            });
            html += '</tbody></table>';
            html += '</div></div>';
        }

        // 趋势分析
        if (result.trendAnalysis) {
            html += '<div class="report-section">';
            html += '<div class="section-title">📊 趋势分析</div>';
            html += '<div class="trend-analysis">';
            
            if (result.trendAnalysis.risingElements && result.trendAnalysis.risingElements.length > 0) {
                html += '<div class="trend-subsection"><div class="subsection-title trend-up">📈 上升元素</div>';
                html += '<div class="trend-tags">';
                result.trendAnalysis.risingElements.forEach(function(e) {
                    html += '<span class="trend-tag up">' + _escapeHtml(e) + '</span>';
                });
                html += '</div></div>';
            }

            if (result.trendAnalysis.decliningElements && result.trendAnalysis.decliningElements.length > 0) {
                html += '<div class="trend-subsection"><div class="subsection-title trend-down">📉 下降元素</div>';
                html += '<div class="trend-tags">';
                result.trendAnalysis.decliningElements.forEach(function(e) {
                    html += '<span class="trend-tag down">' + _escapeHtml(e) + '</span>';
                });
                html += '</div></div>';
            }

            if (result.trendAnalysis.prediction) {
                html += '<div class="trend-prediction"><div class="subsection-title">🔮 趋势预测</div>';
                html += '<div class="prediction-content">' + _escapeHtml(result.trendAnalysis.prediction) + '</div></div>';
            }

            html += '</div></div>';
        }

        // 入场策略
        if (result.entryStrategy) {
            html += '<div class="report-section">';
            html += '<div class="section-title">🎯 入场策略</div>';
            html += '<div class="strategy-card">';
            html += '<div class="strategy-item"><span class="strategy-label">推荐子题材：</span><span class="strategy-value highlight">' + _escapeHtml(result.entryStrategy.recommendedSubGenre) + '</span></div>';
            html += '<div class="strategy-item"><span class="strategy-label">定位建议：</span><span class="strategy-value">' + _escapeHtml(result.entryStrategy.positioning) + '</span></div>';
            html += '<div class="strategy-item"><span class="strategy-label">预计投入：</span><span class="strategy-value">' + _escapeHtml(result.entryStrategy.estimatedInvestment) + '</span></div>';
            html += '<div class="strategy-item"><span class="strategy-label">成功概率：</span><span class="strategy-value">' + _escapeHtml(result.entryStrategy.successProbability) + '</span></div>';
            if (result.entryStrategy.keySuccessFactors) {
                html += '<div class="strategy-item"><span class="strategy-label">关键成功因素：</span></div>';
                html += '<div class="success-factors">';
                result.entryStrategy.keySuccessFactors.forEach(function(f) {
                    html += '<span class="factor-tag">' + _escapeHtml(f) + '</span>';
                });
                html += '</div>';
            }
            html += '</div></div>';
        }

        return html;
    },

    _renderCompetitorResult: function(result) {
        var html = '';

        // 作品档案
        if (result.workProfile) {
            html += '<div class="report-section">';
            html += '<div class="section-title">📖 作品档案</div>';
            html += '<div class="work-profile-card">';
            html += '<div class="profile-header">';
            html += '<div class="work-title">' + _escapeHtml(result.workProfile.title) + '</div>';
            html += '<div class="work-author">作者：' + _escapeHtml(result.workProfile.author) + '</div>';
            html += '</div>';
            html += '<div class="profile-grid">';
            html += '<div class="profile-item"><div class="item-label">平台</div><div class="item-value">' + _escapeHtml(result.workProfile.platform) + '</div></div>';
            html += '<div class="profile-item"><div class="item-label">题材</div><div class="item-value">' + _escapeHtml(result.workProfile.genre) + '</div></div>';
            html += '<div class="profile-item"><div class="item-label">字数</div><div class="item-value">' + _escapeHtml(result.workProfile.wordCount) + '</div></div>';
            html += '<div class="profile-item"><div class="item-label">状态</div><div class="item-value">' + _escapeHtml(result.workProfile.status) + '</div></div>';
            html += '<div class="profile-item"><div class="item-label">评分</div><div class="item-value rating">' + result.workProfile.rating + '⭐</div></div>';
            html += '<div class="profile-item"><div class="item-label">收藏</div><div class="item-value">' + result.workProfile.collections + '</div></div>';
            html += '</div></div></div>';
        }

        // 结构分析
        if (result.structureAnalysis) {
            html += '<div class="report-section">';
            html += '<div class="section-title">🏗️ 结构分析</div>';
            html += '<div class="structure-analysis">';
            html += '<div class="structure-type">结构类型：' + _escapeHtml(result.structureAnalysis.chapterStructure || result.structureAnalysis.structureType) + '</div>';
            if (result.structureAnalysis.hookDesign) {
                html += '<div class="hook-design">';
                if (result.structureAnalysis.hookDesign.openingHook) {
                    html += '<div class="hook-item"><span class="hook-label">开篇钩子：</span>' + _escapeHtml(result.structureAnalysis.hookDesign.openingHook) + '</div>';
                }
                if (result.structureAnalysis.hookDesign.chapterHooks) {
                    html += '<div class="hook-item"><span class="hook-label">章末钩子：</span>' + _escapeHtml(result.structureAnalysis.hookDesign.chapterHooks) + '</div>';
                }
                if (result.structureAnalysis.hookDesign.cliffhanger) {
                    html += '<div class="hook-item"><span class="hook-label">悬念设计：</span>' + _escapeHtml(result.structureAnalysis.hookDesign.cliffhanger) + '</div>';
                }
                if (result.structureAnalysis.hookDesign.foreshadowing) {
                    html += '<div class="hook-item"><span class="hook-label">伏笔设计：</span>' + _escapeHtml(result.structureAnalysis.hookDesign.foreshadowing) + '</div>';
                }
                if (result.structureAnalysis.hookDesign.rhythm) {
                    html += '<div class="hook-item"><span class="hook-label">节奏把控：</span>' + _escapeHtml(result.structureAnalysis.hookDesign.rhythm) + '</div>';
                }
                html += '</div>';
            }
            // 节奏曲线
            if (result.structureAnalysis.pacingCurve && result.structureAnalysis.pacingCurve.length > 0) {
                html += '<div class="pacing-curve">';
                html += '<div class="curve-title">节奏曲线</div>';
                result.structureAnalysis.pacingCurve.forEach(function(pc) {
                    html += '<div class="pacing-item">';
                    html += '<div class="pacing-stage">' + _escapeHtml(pc.stage) + '</div>';
                    html += '<div class="pacing-bar-wrap"><div class="pacing-bar" style="width:' + pc.tension + '%"></div></div>';
                    html += '<div class="pacing-value">张力 ' + pc.tension + '</div>';
                    html += '</div>';
                });
                html += '</div>';
            }
            html += '</div></div>';
        }

        // 人物分析
        if (result.characterAnalysis && result.characterAnalysis.protagonist) {
            html += '<div class="report-section">';
            html += '<div class="section-title">👤 人物分析</div>';
            html += '<div class="character-analysis">';
            var p = result.characterAnalysis.protagonist;
            html += '<div class="protagonist-card">';
            html += '<div class="character-name">' + _escapeHtml(p.name) + '</div>';
            if (p.archetype) html += '<div class="character-archetype">' + _escapeHtml(p.archetype) + '</div>';
            if (p.traits) html += '<div class="character-traits">性格：' + _escapeHtml(p.traits) + '</div>';
            if (p.characterArc) html += '<div class="character-arc">成长轨迹：' + _escapeHtml(p.characterArc) + '</div>';
            if (p.growthArc) html += '<div class="character-arc">成长轨迹：' + _escapeHtml(p.growthArc) + '</div>';
            if (p.uniqueness) html += '<div class="character-unique">独特设定：' + _escapeHtml(p.uniqueness) + '</div>';
            if (p.strengths) {
                html += '<div class="character-traits"><span class="trait-label">优点：</span>';
                p.strengths.forEach(function(s) {
                    html += '<span class="trait-tag positive">' + _escapeHtml(s) + '</span>';
                });
                html += '</div>';
            }
            html += '</div>';
            // 配角
            if (result.characterAnalysis.supporting && result.characterAnalysis.supporting.length > 0) {
                html += '<div class="supporting-characters">';
                html += '<div class="supporting-title">关键配角</div>';
                result.characterAnalysis.supporting.forEach(function(s) {
                    html += '<div class="supporting-item">';
                    html += '<span class="supporting-name">' + _escapeHtml(s.name) + '</span>';
                    html += '<span class="supporting-role">' + _escapeHtml(s.role) + '</span>';
                    if (s.impression) html += '<span class="supporting-impression">' + _escapeHtml(s.impression) + '</span>';
                    html += '</div>';
                });
                html += '</div>';
            }
            html += '</div></div>';
        }

        // 技法分析
        if (result.techniqueAnalysis) {
            html += '<div class="report-section">';
            html += '<div class="section-title">✍️ 技法分析</div>';
            html += '<div class="technique-analysis">';
            if (result.techniqueAnalysis.writingStyle) {
                html += '<div class="technique-item"><span class="tech-label">写作风格：</span>' + _escapeHtml(result.techniqueAnalysis.writingStyle) + '</div>';
            }
            if (result.techniqueAnalysis.tension) {
                html += '<div class="technique-item"><span class="tech-label">张力营造：</span>' + _escapeHtml(result.techniqueAnalysis.tension) + '</div>';
            }
            if (result.techniqueAnalysis.emotionalDesign) {
                html += '<div class="technique-item"><span class="tech-label">情绪设计：</span>' + _escapeHtml(result.techniqueAnalysis.emotionalDesign) + '</div>';
            }
            html += '</div></div>';
        }

        // 商业分析
        if (result.commercialAnalysis) {
            html += '<div class="report-section">';
            html += '<div class="section-title">💰 商业分析</div>';
            html += '<div class="commercial-analysis">';
            html += '<div class="commercial-grid">';
            if (result.commercialAnalysis.revenueEstimate || result.commercialAnalysis.estimatedRevenue) {
                html += '<div class="commercial-item"><div class="item-label">收入预估</div><div class="item-value highlight">' + _escapeHtml(result.commercialAnalysis.revenueEstimate || result.commercialAnalysis.estimatedRevenue) + '</div></div>';
            }
            if (result.commercialAnalysis.fanBase) {
                html += '<div class="commercial-item"><div class="item-label">粉丝规模</div><div class="item-value">' + _escapeHtml(result.commercialAnalysis.fanBase) + '</div></div>';
            }
            if (result.commercialAnalysis.ipPotential || result.commercialAnalysis.ipValue) {
                html += '<div class="commercial-item"><div class="item-label">IP潜力</div><div class="item-value">' + _escapeHtml(result.commercialAnalysis.ipPotential || result.commercialAnalysis.ipValue) + '</div></div>';
            }
            if (result.commercialAnalysis.fanEconomy) {
                html += '<div class="commercial-item"><div class="item-label">粉丝经济</div><div class="item-value">' + _escapeHtml(result.commercialAnalysis.fanEconomy) + '</div></div>';
            }
            html += '</div>';
            if (result.commercialAnalysis.successFactors) {
                html += '<div class="success-factors"><div class="factors-title">成功因素</div>';
                result.commercialAnalysis.successFactors.forEach(function(f) {
                    html += '<div class="factor-item">✓ ' + _escapeHtml(f) + '</div>';
                });
                html += '</div>';
            }
            html += '</div></div>';
        }

        // 差异化机会 / 学习机会
        var opportunities = result.differentiationOpportunities || result.opportunities;
        if (opportunities && opportunities.length > 0) {
            html += '<div class="report-section">';
            html += '<div class="section-title">🎯 ' + (result.differentiationOpportunities ? '差异化机会' : '学习机会') + '</div>';
            html += '<div class="opportunities-list">';
            opportunities.forEach(function(o, i) {
                html += '<div class="opportunity-item"><span class="opportunity-num">' + (i + 1) + '</span>' + _escapeHtml(o) + '</div>';
            });
            html += '</div></div>';
        }

        return html;
    },

    _renderCreativeResult: function(result) {
        var html = '';

        // 热点主题
        if (result.hotTopics && result.hotTopics.length > 0) {
            html += '<div class="report-section">';
            html += '<div class="section-title">🔥 热点主题</div>';
            html += '<div class="hot-topics">';
            result.hotTopics.forEach(function(t) {
                html += '<div class="hot-topic-card">';
                html += '<div class="topic-header">';
                html += '<div class="topic-name">' + _escapeHtml(t.topic) + '</div>';
                html += '<div class="topic-heat"><div class="heat-bar" style="width:' + t.heat + '%">热度 ' + t.heat + '</div></div>';
                html += '</div>';
                if (t.examples && t.examples.length > 0) {
                    html += '<div class="topic-examples">示例：' + t.examples.map(function(e) { return _escapeHtml(e); }).join('、') + '</div>';
                }
                if (t.opportunity) {
                    html += '<div class="topic-opportunity">💡 ' + _escapeHtml(t.opportunity) + '</div>';
                }
                if (t.trend) {
                    var trendIcon = t.trend === 'up' ? '📈' : (t.trend === 'down' ? '📉' : '➡️');
                    html += '<div class="topic-trend">趋势：' + trendIcon + '</div>';
                }
                html += '</div>';
            });
            html += '</div></div>';
        }

        // 素材库
        if (result.materialLibrary) {
            html += '<div class="report-section">';
            html += '<div class="section-title">📚 素材库</div>';
            html += '<div class="material-library">';
            if (result.materialLibrary.settings && result.materialLibrary.settings.length > 0) {
                html += '<div class="material-category">';
                html += '<div class="category-title">🌍 世界观设定</div>';
                html += '<div class="category-items">';
                result.materialLibrary.settings.forEach(function(s) {
                    html += '<span class="material-item">' + _escapeHtml(s) + '</span>';
                });
                html += '</div></div>';
            }
            if (result.materialLibrary.characters && result.materialLibrary.characters.length > 0) {
                html += '<div class="material-category">';
                html += '<div class="category-title">👤 人物原型</div>';
                html += '<div class="category-items">';
                result.materialLibrary.characters.forEach(function(c) {
                    html += '<span class="material-item">' + _escapeHtml(c) + '</span>';
                });
                html += '</div></div>';
            }
            if (result.materialLibrary.conflicts && result.materialLibrary.conflicts.length > 0) {
                html += '<div class="material-category">';
                html += '<div class="category-title">⚡ 冲突设计</div>';
                html += '<div class="category-items">';
                result.materialLibrary.conflicts.forEach(function(c) {
                    html += '<span class="material-item">' + _escapeHtml(c) + '</span>';
                });
                html += '</div></div>';
            }
            html += '</div></div>';
        }

        // 推荐素材
        if (result.recommendedMaterials && result.recommendedMaterials.length > 0) {
            html += '<div class="report-section">';
            html += '<div class="section-title">📋 推荐素材</div>';
            html += '<div class="materials-list">';
            result.recommendedMaterials.forEach(function(m) {
                html += '<div class="material-card">';
                html += '<div class="material-type">' + _escapeHtml(m.type) + '</div>';
                html += '<div class="material-content">' + _escapeHtml(m.content) + '</div>';
                html += '</div>';
            });
            html += '</div></div>';
        }

        // 灵感卡片
        if (result.inspirationCards && result.inspirationCards.length > 0) {
            html += '<div class="report-section">';
            html += '<div class="section-title">💡 灵感卡片</div>';
            html += '<div class="inspiration-cards">';
            result.inspirationCards.forEach(function(card) {
                html += '<div class="inspiration-card">';
                html += '<div class="card-title">' + _escapeHtml(card.title) + '</div>';
                html += '<div class="card-concept">' + _escapeHtml(card.concept) + '</div>';
                if (card.elements && card.elements.length > 0) {
                    html += '<div class="card-elements">';
                    card.elements.forEach(function(e) {
                        html += '<span class="element-tag">' + _escapeHtml(e) + '</span>';
                    });
                    html += '</div>';
                }
                if (card.marketPotential) {
                    html += '<div class="card-potential">市场潜力：<span class="potential-' + card.marketPotential + '">' + card.marketPotential + '</span></div>';
                }
                html += '</div>';
            });
            html += '</div></div>';
        }

        // 灵感提示
        if (result.inspirationPrompts && result.inspirationPrompts.length > 0) {
            html += '<div class="report-section">';
            html += '<div class="section-title">💡 灵感提示</div>';
            html += '<div class="inspiration-list">';
            result.inspirationPrompts.forEach(function(p, i) {
                html += '<div class="inspiration-item"><span class="inspiration-num">' + (i + 1) + '</span>' + _escapeHtml(p) + '</div>';
            });
            html += '</div></div>';
        }

        // 趋势预测
        if (result.trendForecasts && result.trendForecasts.length > 0) {
            html += '<div class="report-section">';
            html += '<div class="section-title">🔮 趋势预测</div>';
            html += '<div class="forecast-list">';
            result.trendForecasts.forEach(function(f) {
                html += '<div class="forecast-card">';
                html += '<div class="forecast-timeframe">' + _escapeHtml(f.timeframe) + '</div>';
                html += '<div class="forecast-content">' + _escapeHtml(f.prediction) + '</div>';
                html += '<div class="forecast-confidence">置信度: ' + f.confidence + '%</div>';
                html += '</div>';
            });
            html += '</div></div>';
        }

        // 风险评估
        if (result.riskAssessment) {
            html += '<div class="report-section">';
            html += '<div class="section-title">⚠️ 风险评估</div>';
            html += '<div class="risk-assessment">';
            html += '<div class="risk-grid">';
            if (result.riskAssessment.marketRisk) {
                html += '<div class="risk-item"><div class="risk-label">市场风险</div><div class="risk-value risk-' + result.riskAssessment.marketRisk.toLowerCase() + '">' + result.riskAssessment.marketRisk + '</div></div>';
            }
            if (result.riskAssessment.competitionRisk) {
                html += '<div class="risk-item"><div class="risk-label">竞争风险</div><div class="risk-value risk-' + result.riskAssessment.competitionRisk.toLowerCase() + '">' + result.riskAssessment.competitionRisk + '</div></div>';
            }
            if (result.riskAssessment.differentiationRisk) {
                html += '<div class="risk-item"><div class="risk-label">差异化风险</div><div class="risk-value risk-' + result.riskAssessment.differentiationRisk.toLowerCase() + '">' + result.riskAssessment.differentiationRisk + '</div></div>';
            }
            html += '</div>';
            if (result.riskAssessment.overallScore) {
                html += '<div class="overall-score"><span class="score-label">综合评分：</span><span class="score-value">' + result.riskAssessment.overallScore + '</span></div>';
            }
            html += '</div></div>';
        }

        return html;
    },

    _renderChatSection: function() {
        var html = '<div class="market-chat-section">';
        html += '<div class="chat-section-title">💬 追问对话</div>';
        html += '<div class="market-chat-messages" id="market-chat-messages">';
        
        this._chatMessages.forEach(function(msg) {
            html += '<div class="chat-message ' + msg.role + '">';
            if (msg.role === 'assistant') {
                // AI回复使用Markdown渲染
                html += '<div class="chat-message-content markdown-content">' + marketView._parseMarkdown(msg.content) + '</div>';
            } else {
                // 用户消息使用纯文本
                html += '<div class="chat-message-content">' + _escapeHtml(msg.content) + '</div>';
            }
            html += '</div>';
        });

        if (this._isChatLoading) {
            html += '<div class="chat-typing"><div class="typing-dots"><span></span><span></span><span></span></div></div>';
        }

        html += '</div>';
        html += '<div class="chat-input-area">';
        html += '<textarea id="market-chat-input" class="chat-input" placeholder="追问分析细节，如：请详细分析该题材的竞争格局..." rows="2"></textarea>';
        html += '<button class="btn btn-primary chat-send-btn" onclick="marketView.sendChat()">▶</button>';
        html += '</div>';
        html += '</div>';
        return html;
    },

    // 简单Markdown解析器
    _parseMarkdown: function(text) {
        if (!text) return '';
        
        // 转义HTML特殊字符
        var escaped = _escapeHtml(text);
        
        // 解析 ## 标题
        escaped = escaped.replace(/^##\s+(.+)$/gm, '<h3 class="md-heading">$1</h3>');
        
        // 解析 **粗体**
        escaped = escaped.replace(/\*\*([^\*]+)\*\*/g, '<strong class="md-bold">$1</strong>');
        
        // 解析 *斜体*
        escaped = escaped.replace(/\*([^\*]+)\*/g, '<em class="md-italic">$1</em>');
        
        // 解析有序列表 1. 2. 3.
        escaped = escaped.replace(/^\d+\.\s+(.+)$/gm, '<li class="md-list-item">$1</li>');
        
        // 解析无序列表 - 或 *
        escaped = escaped.replace(/^[-\*]\s+(.+)$/gm, '<li class="md-list-item md-unordered">$1</li>');
        
        // 将连续的列表项包裹在ul/ol中
        escaped = escaped.replace(/(<li class="md-list-item">[^<]+<\/li>\n?)+/g, function(match) {
            if (match.indexOf('md-unordered') > -1) {
                return '<ul class="md-list">' + match + '</ul>';
            }
            return '<ol class="md-list md-ordered">' + match + '</ol>';
        });
        
        // 解析换行
        escaped = escaped.replace(/\n/g, '<br>');
        
        return escaped;
    },

    // ========== 追问对话 ==========
    sendChat: async function() {
        var input = document.getElementById('market-chat-input');
        if (!input || !input.value.trim()) return;

        var content = input.value.trim();
        input.value = '';

        this._chatMessages.push({ role: 'user', content: content });
        this._isChatLoading = true;
        this.renderResultArea();

        try {
            var config = await apiClient.getActiveConfig();
            if (!config) {
                throw new Error('请先配置API');
            }

            // 构建强上下文提示词
            var prompt = this._buildChatPrompt(content);

            var req = apiClient.buildRequest(config, prompt, false);
            var resp = await fetch(req.url, {
                method: 'POST',
                headers: req.headers,
                body: JSON.stringify(req.body)
            });

            if (!resp.ok) throw new Error('API错误 ' + resp.status);

            var data = await resp.json();
            var reply = apiClient.parseResponse(config.provider, data);

            this._chatMessages.push({ role: 'assistant', content: reply });
            this._chatHistory.push({ role: 'user', content: content });
            this._chatHistory.push({ role: 'assistant', content: reply });

            // 限制历史长度
            if (this._chatHistory.length > 10) {
                this._chatHistory = this._chatHistory.slice(-10);
            }

        } catch (e) {
            this._chatMessages.push({ role: 'assistant', content: '❌ 错误: ' + e.message });
        } finally {
            this._isChatLoading = false;
            this.renderResultArea();
        }
    },

    // 构建追问对话的强上下文提示词
    _buildChatPrompt: function(userQuestion) {
        var prompt = '你是专业的网络文学市场分析师。请基于以下分析报告和对话历史，回答用户的追问。\n\n';
        
        // 添加当前分析报告内容作为上下文
        if (this._currentReport && this._currentReport.result) {
            prompt += '=== 当前分析报告 ===\n';
            prompt += '报告类型：' + this.MODES[this._currentReport.mode].name + '\n';
            prompt += '报告标题：' + this._currentReport.title + '\n';
            
            // 根据模式添加关键信息
            var result = this._currentReport.result;
            
            if (this.currentMode === 'competitor' && result.workProfile) {
                prompt += '\n【作品信息】\n';
                prompt += '书名：《' + result.workProfile.title + '》\n';
                prompt += '作者：' + result.workProfile.author + '\n';
                prompt += '平台：' + result.workProfile.platform + '\n';
                prompt += '题材：' + result.workProfile.genre + '\n';
            }
            
            if (result.overview) {
                prompt += '\n【分析概览】\n';
                prompt += (typeof result.overview === 'object' ? (result.overview.summary || JSON.stringify(result.overview)) : result.overview) + '\n';
            }
            
            // 添加关键洞察
            if (result.insights) {
                prompt += '\n【核心洞察】\n' + result.insights + '\n';
            }
            
            // 添加机会点
            var opportunities = result.differentiationOpportunities || result.opportunities;
            if (opportunities && opportunities.length > 0) {
                prompt += '\n【机会点】\n';
                opportunities.forEach(function(o, i) {
                    prompt += (i + 1) + '. ' + o + '\n';
                });
            }
            
            prompt += '\n=== 报告结束 ===\n\n';
        }
        
        // 添加对话历史
        if (this._chatHistory.length > 0) {
            prompt += '=== 对话历史 ===\n';
            this._chatHistory.forEach(function(m) {
                var role = m.role === 'user' ? '用户' : '分析师';
                prompt += role + '：' + m.content + '\n\n';
            });
            prompt += '=== 历史结束 ===\n\n';
        }
        
        // 添加用户当前问题
        prompt += '=== 当前问题 ===\n';
        prompt += '用户追问：' + userQuestion + '\n\n';
        
        // 添加回答要求
        prompt += '=== 回答要求 ===\n';
        prompt += '1. 必须基于上述分析报告的内容回答，保持上下文一致性\n';
        prompt += '2. 回答要结构化，使用清晰的标题和要点\n';
        prompt += '3. 如果是写作建议，要具体可操作，给出明确的执行步骤\n';
        prompt += '4. 如果是数据分析，要引用报告中的具体数据支撑\n';
        prompt += '5. 保持专业、客观、有洞察力的分析师口吻\n';
        prompt += '6. 回答格式要求：\n';
        prompt += '   - 使用 ## 作为小标题\n';
        prompt += '   - 使用 1. 2. 3. 作为有序列表\n';
        prompt += '   - 使用 - 作为无序列表\n';
        prompt += '   - 关键数据用 **粗体** 标注\n\n';
        prompt += '请回答：';
        
        return prompt;
    },

    // ========== 报告操作 ==========
    saveReport: async function() {
        if (!this._currentReport) return;

        try {
            // 生成报告标题
            var modeConfig = this.MODES[this._currentReport.mode];
            var title = modeConfig.name + '_' + new Date().toLocaleString('zh-CN');

            // 保存到图书馆
            var content = this._formatReportForSave(this._currentReport);
            var summary = this._generateReportSummary(this._currentReport);

            await libraryManager.saveMarketReport(
                title,
                this._currentReport.mode,
                this._currentReport.platform || '',
                this._currentReport.genre || '',
                content,
                summary
            );

            showNotification('报告已保存到图书馆', 'success');
        } catch (e) {
            showNotification('保存失败: ' + e.message, 'error');
        }
    },

    _formatReportForSave: function(report) {
        // 将报告格式化为可读的Markdown格式
        var modeConfig = this.MODES[report.mode];
        var content = '# ' + modeConfig.name + '报告\n\n';
        content += '**生成时间**: ' + new Date(report.timestamp).toLocaleString('zh-CN') + '\n\n';

        if (report.platform) {
            var platform = this.PLATFORMS.find(p => p.value === report.platform);
            content += '**分析平台**: ' + (platform ? platform.label : report.platform) + '\n\n';
        }

        if (report.genre) {
            var genre = this.GENRES.find(g => g.value === report.genre);
            content += '**分析题材**: ' + (genre ? genre.label : report.genre) + '\n\n';
        }

        content += '---\n\n';

        // 添加分析结果
        if (report.result) {
            content += this._objectToMarkdown(report.result, 2);
        }

        return content;
    },

    _objectToMarkdown: function(obj, level) {
        var content = '';
        var indent = '  '.repeat(level - 1);

        for (var key in obj) {
            if (!obj.hasOwnProperty(key)) continue;

            var value = obj[key];
            var displayKey = this._translateKey(key);

            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                content += indent + '## ' + displayKey + '\n\n';
                content += this._objectToMarkdown(value, level + 1);
            } else if (Array.isArray(value)) {
                content += indent + '## ' + displayKey + '\n\n';
                value.forEach(function(item, idx) {
                    if (typeof item === 'object') {
                        content += indent + '- **项目 ' + (idx + 1) + '**:\n';
                        content += this._objectToMarkdown(item, level + 1);
                    } else {
                        content += indent + '- ' + item + '\n';
                    }
                }.bind(this));
                content += '\n';
            } else {
                content += indent + '**' + displayKey + '**: ' + value + '\n\n';
            }
        }

        return content;
    },

    _translateKey: function(key) {
        var translations = {
            overview: '市场概况',
            platforms: '平台分析',
            genres: '题材分布',
            newbooks: '新书表现',
            readers: '读者画像',
            trends: '趋势预测',
            subgenres: '细分题材',
            competition: '竞争分析',
            strategy: '策略建议',
            profile: '作品概况',
            structure: '结构分析',
            character: '人物分析',
            world: '世界观',
            technique: '技法分析',
            commercial: '商业分析',
            opportunities: '机会点',
            hottopics: '热点追踪',
            materials: '素材库',
            inspirations: '灵感生成',
            forecasts: '趋势预测'
        };
        return translations[key] || key;
    },

    _generateReportSummary: function(report) {
        // 生成报告摘要
        var modeConfig = this.MODES[report.mode];
        var summary = modeConfig.name;

        if (report.platform) {
            var platform = this.PLATFORMS.find(p => p.value === report.platform);
            summary += ' | ' + (platform ? platform.label : report.platform);
        }

        if (report.genre) {
            var genre = this.GENRES.find(g => g.value === report.genre);
            summary += ' | ' + (genre ? genre.label : report.genre);
        }

        return summary;
    },

    copyReport: function() {
        if (!this._currentReport) return;
        var content = this._formatReportForSave(this._currentReport);
        copyToClipboard(content);
        showNotification('报告内容已复制', 'success');
    },

    exportReport: function() {
        if (!this._currentReport) return;

        var content = this._formatReportForSave(this._currentReport);
        var blob = new Blob([content], { type: 'text/markdown' });
        var url = URL.createObjectURL(blob);

        var link = document.createElement('a');
        link.href = url;
        link.download = 'market_report_' + Date.now() + '.md';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        showNotification('报告已导出为Markdown', 'success');
    },

    // ========== 加载已有报告 ==========
    loadReport: function(report) {
        // 从图书馆加载报告
        this._currentReport = {
            mode: report.mode || 'dashboard',
            platform: report.platform || '',
            genre: report.genre || '',
            timestamp: new Date(report.createdAt).getTime(),
            result: { loadedContent: report.content }
        };

        // 设置当前模式
        this.currentMode = this._currentReport.mode;
        this.selectMode(this.currentMode);

        // 恢复平台选择
        if (report.platform) {
            var platformSelect = document.getElementById('market-platform');
            if (platformSelect) platformSelect.value = report.platform;
        }

        // 恢复题材选择
        if (report.genre) {
            var genreSelect = document.getElementById('market-genre');
            if (genreSelect) genreSelect.value = report.genre;
        }

        // 渲染报告内容
        this.renderResultArea();

        showNotification('报告已加载', 'success');
    }
};
