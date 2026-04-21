/*
 * 创世纪引擎 V77.0 - 全局美化版 (博士梦想实现 V11.2 - 界面终极版)
 * UI模板库
 * ✨✨✨ (博士重构 - 界面终极版) ✨✨✨
 * 1. 【核心升级】根据您的指令，已将完整的“终极风格矩阵”（共32种风格）集成到“执笔写作台”的下拉菜单中。
 * 2. 【优化体验】对菜单中的风格进行了逻辑分组和清晰命名，方便您进行选择和测试。
 * 3. 这是根据您提供的原始文件进行的直接修改，请放心替换。
 */

const UITemplates = {
    // ✨ 核心重构：创作流水线面板 (Pipeline) - V3.0 美学重制版
    pipelinePanel: `
        <div class="card-library-layout" style="grid-template-columns: 400px 1fr;">
            <div class="filter-sidebar">
                <div class="card">
                    <div class="card-header"><h4><i class="fas fa-cogs"></i> 灵感队列与全局配置</h4></div>
                    <div class="filter-options">
                        <div class="form-group">
                            <label for="pipeline-inspiration-input">1. 在此输入灵感 (每行一个)</label>
                            <textarea id="pipeline-inspiration-input" rows="6" placeholder="例如：一个表面怂包内心腹黑的凡人..."></textarea>
                            <button id="pipeline-add-to-queue-btn" class="action-btn" style="width: 100%; margin-top: 10px;"><i class="fas fa-plus-circle"></i> 加入队列</button>
                        </div>
                        <div class="form-group">
                            <label>2. 写作任务队列</label>
                            <div id="pipeline-queue-list" class="document-panel" style="min-height: 120px; max-height: 25vh; overflow-y: auto;">
                                <p class="placeholder-text">队列为空...</p>
                            </div>
                            <button id="pipeline-clear-queue-btn" class="settings-btn" style="width: 100%; margin-top: 10px;"><i class="fas fa-trash"></i> 清空队列</button>
                        </div>
                        <h4 class="filter-main-title">3. 统一生成参数</h4>
                        <div class="form-group"><label for="pipeline-novel-title">作品标题</label><input type="text" id="pipeline-novel-title" placeholder="首个任务或单任务"></div>
                        <div class="form-group"><label for="pipeline-total-chapters">总章节数</label><input type="number" id="pipeline-total-chapters" value="10" min="1"></div>
                        <div class="form-group"><label for="pipeline-words-per-chapter">每章字数(约)</label><input type="number" id="pipeline-words-per-chapter" value="2000" step="100"></div>
                    </div>
                    <div class="card-footer" style="margin-top: auto; display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                        <button id="start-pipeline-btn" class="action-btn"><i class="fas fa-play"></i> 启动单个任务</button>
                        <button id="start-queue-btn" class="action-btn" style="background-color: var(--accent-secondary);"><i class="fas fa-robot"></i> 启动队列</button>
                        <button id="stop-pipeline-btn" class="settings-btn" style="grid-column: 1 / -1;" disabled><i class="fas fa-stop"></i> 中止</button>
                    </div>
                </div>
            </div>
            <div>
                <div class="card" style="height: calc(60% - 10px); display: flex; flex-direction: column;">
                     <div class="card-header">
                        <h4><i class="fas fa-file-alt"></i> AI生成：三弧光与故事大纲</h4>
                        <span id="pipeline-state-label" class="text-muted">流水线状态: 空闲</span>
                     </div>
                     <div id="pipeline-output-container" class="document-panel markdown-body" style="flex-grow:1; overflow-y:auto;">
                        <p class="placeholder-text">请在左侧添加灵感，配置参数后点击“启动”按钮。</p>
                     </div>
                </div>
                <div class="card" style="height: 40%;">
                     <div class="card-header"><h4><i class="fas fa-fire"></i> 热门灵感模板 (点击自动填充)</h4></div>
                     <div id="pipeline-template-container" class="card-grid" style="grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); overflow-y:auto; height: 100%; padding-right: 10px;">
                     </div>
                </div>
            </div>
        </div>
    `,

    // ✨ 核心重构：执笔写作台面板 (Writing Desk) - V3.0 美学重制版
    writingDeskPanel: `
        <div class="writing-cockpit-container" style="grid-template-columns: 220px 10px 1fr;">
            <div id="cockpit-chapter-list" class="cockpit-panel card">
                <div class="card-header">
                    <h4><i class="fas fa-bars-staggered"></i> 章节列表</h4>
                    <span id="writing-progress-indicator">0/0</span>
                </div>
                <div id="chapter-list-container" class="chapter-list">
                    <p class="placeholder-text">请先在“创作流水线”中生成大纲并导入...</p>
                </div>
                 <div class="card-footer" style="padding-top: 10px;">
                    <button id="generate-all-chapters-btn" class="action-btn" style="width:100%;"><i class="fas fa-robot"></i> 一键生成全文并导出</button>
                    <button id="export-full-text-btn" class="settings-btn" style="width:100%; margin-top:10px;"><i class="fas fa-copy"></i> 复制当前原文</button>
                </div>
            </div>
            <div class="gutter-horizontal"></div>
            <div class="cockpit-main-area">
                <div id="cockpit-editor" class="cockpit-panel card flex-column-layout">
                    <div class="card-header">
                        <h3 id="chapter-editor-title">请从左侧选择章节</h3>
                    </div>
                    <div class="writing-settings-panel">
                        <div class="form-group"><label>默认每章字数</label><input type="number" id="final-words-per-chapter" value="2000" step="100"></div>
                        <div class="form-group"><label>默认叙事视角</label><select id="final-narrative-perspective"><option value="第一人称">第一人称</option><option value="第三人称">第三人称</option></select></div>
                        <div class="form-group"><label>写作风格</label>
                            <select id="final-writing-style">
                                <optgroup label="核心模式">
                                    <option value="master_mode">大师模式 (极限Show, Don't Tell + 反熵)</option>
                                    <option value="tomato_style">番茄风格 (快节奏)</option>
                                    <option value="zhihu_style">知乎风格 (虐爽)</option>
                                </optgroup>
                                <optgroup label="【终极风格矩阵】">
                                    <option value="style_A0_P12345">真空模式 (禁5/留0)</option>
                                </optgroup>
                                <optgroup label="等级1: 留1 (纯粹单一元素)">
                                    <option value="style_A1_P2345">独白模式 (只允许心理)</option>
                                    <option value="style_A2_P1345">点睛模式 (只允许修饰)</option>
                                    <option value="style_A3_P1245">咏叹模式 (只允许比喻)</option>
                                    <option value="style_A4_P1235">舞台模式 (只允许场景)</option>
                                    <option value="style_A5_P1234">旁白模式 (只允许旁白)</option>
                                </optgroup>
                                <optgroup label="等级2: 留2 (双元素融合)">
                                    <option value="style_A12_P345">内心描摹模式 (心理+修饰)</option>
                                    <option value="style_A13_P245">意识流模式 (心理+比喻)</option>
                                    <option value="style_A14_P235">环境心理模式 (心理+场景)</option>
                                    <option value="style_A15_P234">第一人称叙事 (心理+旁白)</option>
                                    <option value="style_A23_P145">诗意模式 (修饰+比喻)</option>
                                    <option value="style_A24_P135">电影镜头模式 (修饰+场景)</option>
                                    <option value="style_A25_P134">纪录片模式 (修饰+旁白)</option>
                                    <option value="style_A34_P125">幻境模式 (比喻+场景)</option>
                                    <option value="style_A35_P124">寓言模式 (比喻+旁白)</option>
                                    <option value="style_A45_P123">导演剪辑模式 (场景+旁白)</option>
                                </optgroup>
                                <optgroup label="等级3: 留3 (三元素写作)">
                                    <option value="style_A123_P45">感性文学模式 (心理+修饰+比喻)</option>
                                    <option value="style_A124_P35">沉浸模式 (心理+修饰+场景)</option>
                                    <option value="style_A125_P34">角色研究模式 (心理+修饰+旁白)</option>
                                    <option value="style_A134_P25">幻想现实模式 (心理+比喻+场景)</option>
                                    <option value="style_A135_P24">回忆录模式 (心理+比喻+旁白)</option>
                                    <option value="style_A145_P23">全知视角模式 (心理+场景+旁白)</option>
                                    <option value="style_A234_P15">华丽描述模式 (修饰+比喻+场景)</option>
                                    <option value="style_A235_P14">散文诗模式 (修饰+比喻+旁白)</option>
                                    <option value="style_A245_P13">报告文学模式 (修饰+场景+旁白)</option>
                                    <option value="style_A345_P12">史诗模式 (比喻+场景+旁白)</option>
                                </optgroup>
                                <optgroup label="等级4: 留4 (接近完整)">
                                    <option value="style_A1234_P5">纯文学模式 (禁旁白)</option>
                                    <option value="style_A1235_P4">心理分析模式 (禁场景)</option>
                                    <option value="style_A1245_P3">纪实小说模式 (禁比喻)</option>
                                    <option value="style_A1345_P2">神话叙事模式 (禁修饰)</option>
                                    <option value="style_A2345_P1">全景描绘模式 (禁心理)</option>
                                </optgroup>
                                 <optgroup label="等级5: 留5 (无限制)">
                                    <option value="style_A12345_P0">创世模式 (全部允许)</option>
                                </optgroup>
                            </select>
                        </div>
                    </div>
                    <textarea id="chapter-editor-area" class="editable-ai-content" placeholder="在此处挥洒您的才华..."></textarea>
                    <div class="card-footer" style="display: flex; gap: 10px; padding-top:10px;">
                        <button id="generate-chapter-btn" class="action-btn" style="flex-grow: 1;" disabled><i class="fas fa-magic"></i> AI生成本章</button>
                        <button id="regenerate-chapter-btn" class="settings-btn" style="flex-grow: 1;" disabled><i class="fas fa-redo"></i> 强制重新生成</button>
                    </div>
                </div>
                <div class="gutter-vertical"></div>
                <div class="cockpit-bottom-row card">
                    <div id="cockpit-bottom-left" class="cockpit-panel">
                        <div class="card-header"><h5><i class="fas fa-list-ol"></i> 本章细纲</h5></div>
                        <div id="current-chapter-outline" class="document-panel">
                            <p class="placeholder-text">选择章节后显示细纲</p>
                        </div>
                    </div>
                    <div class="gutter-horizontal-sub"></div>
                    <div id="cockpit-bottom-right" class="cockpit-panel">
                        <div class="card-header"><h5 id="polish-output-title"><i class="fas fa-microscope"></i> AI分析/润色结果</h5></div>
                        <div id="polish-output-content" class="document-panel"><p class="placeholder-text">润色建议将显示在此处。</p></div>
                    </div>
                </div>
            </div>
        </div>
    `,

    deconstructionRoomPanel: `
        <div class="deconstruction-layout">
            <div class="deconstruction-input">
                <div class="card">
                    <div class="card-header">
                        <h4><i class="fas fa-magic"></i> 文风鉴赏室</h4>
                    </div>
                    <textarea id="deconstruction-input-area" placeholder="在此粘贴您想鉴赏和学习的优美文字片段..."></textarea>
                    <button id="deconstruct-text-btn" class="action-btn" style="width:100%; margin-top:15px;">
                        <i class="fas fa-cogs"></i> 开始智能分析
                    </button>
                </div>
            </div>
            <div class="deconstruction-output-area">
                <div id="deconstruction-card-grid" class="card-grid">
                    <p class="placeholder-text">智能分析生成的“创作卡牌”将显示在此处...</p>
                </div>
            </div>
        </div>
    `,
    writingAreaPanel: `
        <div class="writing-layout-v2">
            <div class="writing-panel-column">
                <div class="card">
                    <div class="card-header"><h4><i class="fas fa-pencil-alt"></i> 原文草稿</h4></div>
                    <textarea id="writing-input-area" placeholder="在此输入您的草稿..."></textarea>
                </div>
            </div>
            <div class="palette-column">
                <div class="card">
                    <div class="palette-controls">
                        <div class="palette-header"><h4><i class="fas fa-palette"></i> 创作调色盘</h4></div>
                        <button id="select-polish-cards-btn" class="settings-btn" style="width:100%; margin-bottom: 15px;">
                            <i class="fas fa-tasks"></i> 选择润色卡牌
                        </button>
                        <div id="palette-body" class="palette-body">
                            <p class="placeholder-text">请先选择卡牌...</p>
                        </div>
                        <div class="palette-footer">
                            <button id="polish-text-btn" class="action-btn" style="width:100%;">
                                <i class="fas fa-rocket"></i> 开始智能润色
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="writing-panel-column">
                <div class="card">
                    <div class="card-header"><h4><i class="fas fa-sparkles"></i> AI智能润色</h4></div>
                    <div id="writing-output-area"><p class="placeholder-text">润色后的文字将在这里诞生...</p></div>
                    <div id="polished-output-controls-container" class="hidden">
                        <div class="polished-output-controls">
                            <button id="copy-polished-btn" class="settings-btn"><i class="fas fa-copy"></i> 一键复制</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    cardLibraryPanel: `
        <div class="card-library-layout">
            <div class="filter-sidebar">
                <div class="card">
                    <div class="card-header"><h4><i class="fas fa-sitemap"></i> 多维创作矩阵</h4></div>
                    <div class="filter-options">
                        <div class="form-group">
                            <label for="card-search-input">关键词搜索</label>
                            <input type="text" id="card-search-input" placeholder="搜索卡牌...">
                        </div>
                        <div id="unified-filter-container"></div>
                    </div>
                </div>
            </div>
            <div>
                <div class="card-library-toolbar">
                    <button id="sort-cards-btn" class="settings-btn"><i class="fas fa-sort-alpha-down"></i> 一键整理</button>
                </div>
                <div id="card-grid-container" class="card-grid-container">
                    <div id="card-grid" class="card-grid"></div>
                </div>
            </div>
        </div>
    `,
    
    projectManagerPanel: `
        <div class="card">
            <div class="card-header">
                <h2><i class="fas fa-folder-open"></i> 项目管理中心</h2>
            </div>
            <div id="project-list-container" class="project-list" style="max-height: 60vh; overflow-y: auto; margin-bottom: 1.5rem;">
                <p class="placeholder-text">正在加载项目列表...</p>
            </div>
            <div class="card-footer" style="display: flex; justify-content: flex-end; gap: 1rem;">
                <button id="import-data-btn" class="settings-btn"><i class="fas fa-file-import"></i> 导入数据 (JSON)</button>
                <button id="export-data-btn" class="settings-btn"><i class="fas fa-file-export"></i> 导出全部数据 (JSON)</button>
                <button id="save-project-btn" class="settings-btn"><i class="fas fa-save"></i> 保存当前项目</button>
                <button id="new-project-btn" class="action-btn"><i class="fas fa-plus"></i> 新建项目</button>
            </div>
            <input type="file" id="import-file-input" class="hidden" accept=".json">
        </div>
    `,
    toolboxPanel: `
        <div class="card"><h2><i class="fas fa-toolbox"></i> 辅助工具箱</h2><p class="text-muted">这里集成了多种专项分析和生成功能，旨在为您的创作提供全方位的支持。</p></div>
        <div class="dashboard-grid">
            <div class="card" data-panel-target="auxWorldviewArchitect"><h3><i class="fas fa-globe-americas"></i> 世界观架构师</h3><p>深度整合12维度文学架构师工作流程，构建史诗级世界观。</p></div>
            <div class="card" data-panel-target="styleDeconstruction"><h3><i class="fas fa-atom"></i> 文风拆解器</h3><p>深度解析任何文本的“骨架”与“血肉”，生成“完全复刻指南”。</p></div>
            <div class="card" data-panel-target="introGenerator"><h3><i class="fas fa-bullhorn"></i> 多平台导语生成器</h3><p>针对“知乎/小程序/番茄”等平台风格，创作爆款导语。</p></div>
            <div class="card" data-panel-target="scenePlanner"><h3><i class="fas fa-film"></i> “运镜”场景规划器</h3><p>将写作视为电影拍摄，通过镜头列表规划场景。</p></div>
            <div class="card" data-panel-target="dialogueAnalyzer"><h3><i class="fas fa-comments"></i> 对话分析器</h3><p>搭载“思维链”理论，从数据和功能性评估对话质量。</p></div>
            <div class="card" data-panel-target="emotionCurve"><h3><i class="fas fa-wave-square"></i> 斐波那契心跳规划器</h3><p>可视化规划整个故事的情绪起伏曲线。</p></div>
            <div class="card" data-panel-target="logicChecker"><h3><i class="fas fa-check-double"></i> 逻辑纠察器</h3><p>检查文本中的逻辑漏洞、情节矛盾和人物OOC。</p></div>
            <div class="card" data-panel-target="writingEnhancer"><h3><i class="fas fa-wind"></i> “反熵”写作模式</h3><p>实时高亮潜在的“AI味”词汇，帮助作者净化文风。</p></div>
            <div class="card" data-panel-target="tagGenerator"><h3><i class="fas fa-tags"></i> 智能标签生成器</h3><p>自动生成最适合推广的【核心标签】、【流量标签】和【内容标签】。</p></div>
            <div class="card" data-panel-target="structureAnalyzer"><h3><i class="fas fa-network-wired"></i> 章节结构分析器</h3><p>分析章节是否符合“循环四章深化模式”的爽文结构。</p></div>
            <div class="card" data-panel-target="grammarAnalyzer"><h3><i class="fas fa-spell-check"></i> 语法分析与优化器</h3><p>专注于消除翻译腔和“的地得”的滥用。</p></div>
            <div class="card" data-panel-target="styleMigration"><h3><i class="fas fa-random"></i> 文风迁移器</h3><p>将A的风格应用到B的内容上，进行文学实验。</p></div>
            <div class="card" data-panel-target="styleReplication"><h3><i class="fas fa-clone"></i> 文风复刻器(仿写)</h3><p>学习范文风格，创作新主题。</p></div>
            <div class="card" data-panel-target="aiTotalReview"><h3><i class="fas fa-user-tie"></i> AI总编一键审核</h3><p>启用11维度评分体系，生成可视化雷达图与详细文字报告。</p></div>
            <div class="card" data-panel-target="themeTracker"><h3><i class="fas fa-anchor"></i> 主题与象征物追踪器</h3><p>记录核心主题与关键象征物，确保全文表达一致。</p></div>
            <div class="card" data-panel-target="timelineEditor"><h3><i class="fas fa-calendar-alt"></i> 世界观时间线编辑器</h3><p>构建清晰的时间线，记录重大历史事件。</p></div>
        </div>
    `,
    
    aiTotalReviewPanel: `
        <div class="card"><div class="card-header"><h3><i class="fas fa-user-tie"></i> AI总编一键审核</h3><button class="settings-btn back-to-toolbox-btn"><i class="fas fa-arrow-left"></i> 返回</button></div><p class="text-muted">AI总编将启动您设计的“小说质量量化评估模型”，生成包含图表的可视化报告。</p></div>
        <div class="card"><div class="form-group"><label for="review-full-text">待审核全文</label><textarea id="review-full-text" class="large-textarea" placeholder="请在此处粘贴需要审核的完整小说文本..."></textarea></div><button id="start-final-review-btn" class="action-btn" style="width:100%;"><i class="fas fa-gavel"></i> 启动最终审核</button></div>
        <div class="card" id="final-review-output" style="display:none;"><div class="card-header"><h3><i class="fas fa-file-signature"></i> 总编审核报告</h3></div><div id="final-review-content"><div id="review-chart-container" style="width: 100%; height:450px; margin-bottom: 20px;"></div><div id="review-text-report" class="document-panel"></div></div></div>
    `,
    logicCheckerPanel: `
        <div class="card"><div class="card-header"><h3><i class="fas fa-check-double"></i> 逻辑审稿人</h3><button class="settings-btn back-to-toolbox-btn"><i class="fas fa-arrow-left"></i> 返回</button></div><p class="text-muted">粘贴文本，AI将化身最严格的审稿人，检查逻辑漏洞、情节矛盾、人物OOC等。</p></div>
        <div class="card"><textarea id="logic-input-area" class="large-textarea" placeholder="在此处粘贴需要检查逻辑的文本..."></textarea><button id="analyze-logic-btn" class="action-btn" style="width:100%; margin-top: 10px;"><i class="fas fa-search"></i> 开始纠察</button></div>
        <div class="card" id="logic-analysis-output" style="display:none;"><div class="card-header"><h3><i class="fas fa-file-signature"></i> 逻辑诊断报告</h3></div><div id="logic-report-content" class="document-panel"></div></div>
    `,
    structureAnalyzerPanel: `
        <div class="card"><div class="card-header"><h3><i class="fas fa-network-wired"></i> 章节结构分析器</h3><button class="settings-btn back-to-toolbox-btn"><i class="fas fa-arrow-left"></i> 返回</button></div><p class="text-muted">本工具搭载“循环四章深化模式”理论，分析章节是否符合爽文结构。</p></div>
        <div class="card"><textarea id="structure-input-area" class="large-textarea" placeholder="在此处粘贴需要分析的章节文本..."></textarea><button id="analyze-structure-btn" class="action-btn" style="width:100%; margin-top: 10px;"><i class="fas fa-sitemap"></i> 分析章节结构</button></div>
        <div class="card" id="structure-analysis-output" style="display:none;"><div class="card-header"><h3><i class="fas fa-diagnoses"></i> 结构诊断报告</h3></div><div id="structure-report-content" class="document-panel"></div></div>
    `,
    grammarAnalyzerPanel: `
        <div class="card"><div class="card-header"><h3><i class="fas fa-spell-check"></i> 语法分析与优化器</h3><button class="settings-btn back-to-toolbox-btn"><i class="fas fa-arrow-left"></i> 返回</button></div><p class="text-muted">本工具旨在打破AI固有的语法习惯，找出潜在的翻译腔、长难句，并对“的、地、得”的滥用提出优化建议。</p></div>
        <div class="card"><textarea id="grammar-input-area" class="large-textarea" placeholder="在此处粘贴需要进行语法分析的文本..."></textarea><button id="analyze-grammar-btn" class="action-btn" style="width:100%; margin-top: 10px;"><i class="fas fa-search-plus"></i> 分析语法</button></div>
        <div class="card" id="grammar-analysis-output" style="display:none;"><div class="card-header"><h3><i class="fas fa-diagnoses"></i> 语法诊断报告</h3></div><div id="grammar-report-content" class="document-panel"></div></div>
    `,
    dialogueAnalyzerPanel: `
        <div class="card"><div class="card-header"><h3><i class="fas fa-comments"></i> 对话分析器</h3><button class="settings-btn back-to-toolbox-btn"><i class="fas fa-arrow-left"></i> 返回</button></div><p class="text-muted">本工具搭载“思维链”理论。AI将分析对话占比、角色发言频率，并评估对话是否有效推动情节、塑造人物。</p></div>
        <div class="card"><textarea id="dialogue-input-area" class="large-textarea" placeholder="在此处粘贴需要分析的章节文本..."></textarea><button id="analyze-dialogue-btn" class="action-btn" style="width:100%; margin-top: 10px;"><i class="fas fa-chart-bar"></i> 开始分析</button></div>
        <div class="card" id="dialogue-analysis-output" style="display:none;"><div class="card-header"><h3><i class="fas fa-poll"></i> 分析报告</h3></div><div id="dialogue-report-content" class="document-panel"></div></div>
    `,
    writingEnhancerPanel: `
       <div class="card">
         <div class="card-header"><h3><i class="fas fa-wind"></i> “反熵”批量润色工具</h3><button class="settings-btn back-to-toolbox-btn"><i class="fas fa-arrow-left"></i> 返回</button></div>
         <p class="text-muted">在此添加多篇文章，启动队列后，引擎将为您逐一进行深度润色，并将所有结果合并输出。</p>
       </div>
       <div class="pipeline-grid-container">
           <div class="card">
               <div class="form-group">
                   <label for="enhancer-input-area">1. 在此输入待润色文本 (可粘贴多篇)</label>
                   <textarea id="enhancer-input-area" class="large-textarea" style="height: 25vh;" placeholder="每篇文章请用 '---' (三个减号) 分隔..."></textarea>
               </div>
               <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <button id="enhancer-add-to-queue-btn" class="action-btn"><i class="fas fa-plus-circle"></i> 加入队列</button>
                <button id="enhancer-clear-queue-btn" class="settings-btn"><i class="fas fa-trash"></i> 清空队列</button>
               </div>
               <div class="form-group" style="margin-top: 1rem;">
                   <label>2. 润色任务队列 (<span id="enhancer-queue-count">0</span>)</label>
                   <div id="enhancer-queue-list" class="document-panel" style="min-height: 120px; max-height: 25vh; overflow-y: auto;">
                       <p class="placeholder-text">队列为空...</p>
                   </div>
               </div>
               <button id="enhancer-start-queue-btn" class="action-btn" style="width:100%; margin-top: 1rem;"><i class="fas fa-rocket"></i> 启动队列润色</button>
           </div>
           <div class="card">
                <div class="form-group">
                    <label for="enhancer-output-area">3. 润色结果</label>
                    <div id="enhancer-output-area" class="document-panel" style="height: 60vh; white-space: pre-wrap;"><p class="placeholder-text">所有润色完成后的文章将合并显示在此处。</p></div>
                </div>
                <button id="enhancer-copy-results-btn" class="settings-btn" style="width:100%;" disabled><i class="fas fa-copy"></i> 复制全部结果</button>
           </div>
       </div>
    `,
    emotionCurvePanel: `
        <div class="card"><div class="card-header"><h3><i class="fas fa-wave-square"></i> 斐波那契心跳规划器</h3><button class="settings-btn back-to-toolbox-btn"><i class="fas fa-arrow-left"></i> 返回</button></div><p class="text-muted">在此规划故事从开篇到结尾的情绪起伏，一个好的节奏是吸引读者的关键。</p></div>
        <div class="card"><div id="emotion-curve-controls" style="display:flex; gap:1rem; margin-bottom:1rem; flex-wrap:wrap;"><div class="form-group" style="flex:2;"><label>输入大纲/章节</label><input type="text" id="emotion-chapter-input" placeholder="如：第一章 或 主角被背叛"></div><div class="form-group" style="flex:1;"><label>情绪值 (-10 到 10)</label><input type="number" id="emotion-value-input" value="0" min="-10" max="10"></div><div class="form-group" style="flex:3;"><label>关键事件</label><input type="text" id="emotion-event-input" placeholder="如：主角被退婚"></div><button id="add-emotion-point-btn" class="action-btn"><i class="fas fa-plus"></i> 添加</button></div><button id="analyze-outline-emotion-btn" class="settings-btn" style="width:100%; margin-bottom:1rem;"><i class="fas fa-brain"></i> 智能分析大纲生成</button><div id="emotion-curve-chart" style="width: 100%; height: 500px;"></div></div>
    `,
    styleDeconstructionPanel: `
        <div class="card"><div class="card-header"><h3><i class="fas fa-atom"></i> 文风拆解器</h3><button class="settings-btn back-to-toolbox-btn"><i class="fas fa-arrow-left"></i> 返回</button></div><p class="text-muted">将任何你喜欢的文字片段粘贴进来，AI将为你深度解析其内在的风格密码，生成一份“完全复刻指南”。</p></div>
        <div class="card"><textarea id="deconstruction-source-text" class="large-textarea" placeholder="请在此处粘贴你想要分析的任何文本片段..."></textarea><button id="deconstruct-novel-btn" class="action-btn" style="width:100%; margin-top:10px;"><i class="fas fa-cogs"></i> 开始拆解</button></div>
        <div class="card" id="deconstruction-output-card" style="display:none;"><div class="card-header"><h3><i class="fas fa-clipboard-list"></i> 拆解报告</h3></div><div id="deconstruction-output-content" class="document-panel"></div></div>
    `,
    introGeneratorPanel: `
        <div class="card"><div class="card-header"><h3><i class="fas fa-bullhorn"></i> 多平台导语生成器</h3><button class="settings-btn back-to-toolbox-btn"><i class="fas fa-arrow-left"></i> 返回</button></div><p class="text-muted">输入故事核心梗概，选择目标平台，AI将为您创作极具吸引力的爆款导语。</p></div>
        <div class="card"><div class="form-group"><label for="intro-core-story">故事核心梗概</label><input type="text" id="intro-core-story" placeholder="例如：商业联姻的丈夫在我胃癌晚期后才发现真相并追悔莫及"></div><div class="form-group"><label for="intro-platform-style">选择平台风格</label><select id="intro-platform-style"><option value="知乎风格">知乎风格</option><option value="小程序风格">小程序风格</option><option value="番茄风格">番茄风格</option></select></div><button id="generate-intro-btn" class="action-btn" style="width:100%;"><i class="fas fa-magic"></i> 生成导语</button></div>
        <div class="card" id="intro-output-card" style="display:none;"><div class="card-header"><h3><i class="fas fa-file-alt"></i> AI生成的爆款导语</h3></div><div id="intro-output-content" class="document-panel"></div></div>
    `,
    scenePlannerPanel: `
        <div class="card"><div class="card-header"><h3><i class="fas fa-film"></i> “运镜”场景规划器</h3><button class="settings-btn back-to-toolbox-btn"><i class="fas fa-arrow-left"></i> 返回</button></div><p class="text-muted">像电影导演一样设计关键场景！规划镜头的焦距和视角，来精准控制读者的注意力和情感代入感。</p></div>
        <div class="card"><div class="form-group"><label for="scene-description-input">场景核心事件描述</label><input type="text" id="scene-description-input" placeholder="例如：主角与反派在雨夜的屋顶对峙"></div><div id="shot-list-editor" class="document-panel" style="margin-bottom: 20px;"><h4><i class="fas fa-list-ol"></i> 镜头列表</h4><div id="shots-container"><p class="placeholder-text">暂无镜头</p></div><div style="display: flex; gap: 10px; margin-top: 10px; flex-wrap: wrap;"><select id="shot-type-select" style="flex: 1.5;"><option value="远景">远景</option><option value="中景">中景</option><option value="近景">近景</option><option value="特写">特写</option><option value="主观视角">主观视角</option></select><input type="text" id="shot-content-input" placeholder="镜头内容描述" style="flex: 3;"><button id="add-shot-btn" class="action-btn" style="flex: 1;"><i class="fas fa-plus"></i> 添加</button></div></div><button id="generate-scene-script-btn" class="action-btn" style="width:100%;"><i class="fas fa-pen-fancy"></i> 生成场景描写</button></div>
        <div class="card" id="scene-script-output" style="display:none;"><div class="card-header"><h3><i class="fas fa-file-invoice"></i> AI生成的场景片段</h3></div><div id="scene-script-content" class="document-panel"></div></div>
    `,
    tagGeneratorPanel: `
        <div class="card"><div class="card-header"><h3><i class="fas fa-tags"></i> 智能标签生成器</h3><button class="settings-btn back-to-toolbox-btn"><i class="fas fa-arrow-left"></i> 返回</button></div><p class="text-muted">输入小说简介或核心卖点，AI将为您生成一组最适合推广的标签。</p></div>
        <div class="card"><textarea id="tag-input-area" class="large-textarea" rows="8" placeholder="在此处粘贴您的小说简介或核心卖点..."></textarea><button id="analyze-tags-btn" class="action-btn" style="width:100%; margin-top: 10px;"><i class="fas fa-magic"></i> 生成标签</button></div>
        <div class="card" id="tag-analysis-output" style="display:none;"><div class="card-header"><h3><i class="fas fa-clipboard-check"></i> AI推荐标签</h3></div><div id="tag-report-content" class="document-panel"></div></div>
    `,
    styleMigrationPanel: `
        <div class="card"><div class="card-header"><h3><i class="fas fa-random"></i> 文风迁移器</h3><button class="settings-btn back-to-toolbox-btn"><i class="fas fa-arrow-left"></i> 返回</button></div><p class="text-muted">最大胆的文学实验！用A的风格，去写B的故事。</p></div>
        <div class="deconstruction-layout"><div class="deconstruction-input"><div class="card" style="height:100%"><div class="form-group" style="height:45%"><label>第一步：粘贴“风格源文本”</label><textarea id="migra-style-input" class="large-textarea" placeholder="例如：一段古龙的武侠小说片段..."></textarea></div><div class="form-group" style="height:45%"><label>第二步：粘贴“内容源文本”</label><textarea id="migra-content-input" class="large-textarea" placeholder="例如：一段童话故事“小红帽”的情节..."></textarea></div><button id="migra-start-btn" class="action-btn"><i class="fas fa-people-arrows"></i> 开始迁移</button></div></div><div class="deconstruction-output-area"><div id="migra-output" class="document-panel" style="height:100%"><p class="placeholder-text">迁移结果将在此处生成...</p></div></div></div>
    `,
    styleReplicationPanel: `
        <div class="card"><div class="card-header"><h3><i class="fas fa-clone"></i> 文风复刻器 (仿写)</h3><button class="settings-btn back-to-toolbox-btn"><i class="fas fa-arrow-left"></i> 返回</button></div><p class="text-muted">学习范文风格，创作新主题。</p></div>
        <div class="deconstruction-layout"><div class="deconstruction-input"><div class="card" style="height:100%"><div class="form-group" style="height:50%"><label>第一步：粘贴“风格范文”</label><textarea id="repli-style-input" class="large-textarea" placeholder="例如：粘贴一段汪曾祺的散文..."></textarea></div><div class="form-group" style="height:30%"><label>第二步：输入“新创作主题”</label><textarea id="repli-content-input" class="large-textarea" rows="4" placeholder="例如：描写一个程序员在赛博朋克都市中反抗巨型公司的故事..."></textarea></div><button id="repli-start-btn" class="action-btn"><i class="fas fa-feather-alt"></i> 开始仿写</button></div></div><div class="deconstruction-output-area"><div id="repli-output" class="document-panel" style="height:100%"><p class="placeholder-text">仿写结果将在此处生成...</p></div></div></div>
    `,
    themeTrackerPanel: `
        <div class="card"><div class="card-header"><h3><i class="fas fa-anchor"></i> 主题与象征物追踪器</h3><button class="settings-btn back-to-toolbox-btn"><i class="fas fa-arrow-left"></i> 返回</button></div><p class="text-muted">在此记下您故事的核心主题和关键象征物，以确保它们在故事中得到一致的体现。</p></div>
        <div class="tracker-layout"><div class="card"><div class="card-header"><h4><i class="fas fa-lightbulb"></i> 核心主题</h4></div><div class="form-group"><input type="text" id="theme-input" placeholder="输入一个核心主题..."><button id="add-theme-btn" class="action-btn" style="width:100%; margin-top:10px;">添加主题</button></div><ul id="theme-list" class="document-panel"></ul></div><div class="card"><div class="card-header"><h4><i class="fas fa-gem"></i> 关键象征物</h4></div><div class="form-group"><input type="text" id="symbol-input" placeholder="输入一个象征物..."><button id="add-symbol-btn" class="action-btn" style="width:100%; margin-top:10px;">添加象征物</button></div><ul id="symbol-list" class="document-panel"></ul></div></div>
    `,
    timelineEditorPanel: `
        <div class="card"><div class="card-header"><h3><i class="fas fa-calendar-alt"></i> 世界观时间线编辑器</h3><button class="settings-btn back-to-toolbox-btn"><i class="fas fa-arrow-left"></i> 返回</button></div><p class="text-muted">为您的故事世界构建一条清晰的时间线，记录下重大的历史事件。</p></div>
        <div class="card"><div id="timeline-controls" style="display:flex; gap:1rem; margin-bottom:1rem; flex-wrap:wrap;"><input type="text" id="timeline-date-input" placeholder="时间/纪元" style="flex: 2;"><input type="text" id="timeline-event-input" placeholder="关键事件描述" style="flex: 5;"><button id="add-timeline-event-btn" class="action-btn" style="flex: 1;"><i class="fas fa-plus"></i> 添加</button></div><div id="timeline-display"><div class="card-header" style="padding:0.5rem 0; margin-bottom:0.5rem;"><h4><i class="fas fa-stream"></i> 我的时间线</h4></div><ul id="timeline-list" class="document-panel"></ul></div></div>
    `,
    auxWorldviewArchitectPanel: `
        <div class="card"><div class="card-header"><h3><i class="fas fa-globe-americas"></i> 世界观架构师</h3><button class="settings-btn back-to-toolbox-btn"><i class="fas fa-arrow-left"></i> 返回</button></div><p class="text-muted">本工具已搭载您在《世界观设计.docx》中定义的“文学架构师”工作流程。</p></div>
        <div class="card"><div class="form-group"><label for="worldview-input-area">输入世界观核心灵感碎片</label><textarea id="worldview-input-area" class="large-textarea" rows="6" placeholder="例如：东方玄幻、灵气复苏、赛博朋克与神话结合..."></textarea></div><button id="generate-worldview-btn" class="action-btn" style="width:100%"><i class="fas fa-cogs"></i> 构建详细世界观</button></div>
        <div class="card" id="worldview-output-card" style="display:none;"><div class="card-header"><h3>AI架构师生成的世界观设定集</h3></div><div id="worldview-output-content" class="document-panel"></div></div>
    `
};