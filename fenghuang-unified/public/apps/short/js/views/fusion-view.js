/**
 * 短篇拆书视图 v5.0 - 单书深度拆解，面向短篇写作技法提炼
 */
var fusionView = {
    _bookId: null,
    _chapterIdx: null,
    _books: [],
    _generating: false,
    _analysis: '',
    _allAnalysis: '',
    _template: '',
    _dimension: 'full',
    _analysisResults: {}, // 存储各维度的拆解结果
    _currentResultKey: '', // 当前显示的结果key

    _PROMPTS: {
        full: '你是顶级短篇小说技法拆解大师，精通小白文、爽文、网文套路。请深度拆解以下章节的写作技法，只提炼套路和技巧，不要附带原文的角色、情节、地点：\n\n书名：{{book}}\n章节：{{title}}\n\n{{content}}\n\n请从以下维度拆解：\n1. 【开篇钩子】前3句如何制造"不得不看下去"的冲动\n2. 【爽点密度】每300字是否有一个小爽点/小反转/小悬念\n3. 【节奏控制】快慢交替节奏、段落长短变化规律\n4. 【悬念钩子】每段结尾的钩子设计，让读者翻页\n5. 【对话技巧】对话推进效率、潜台词、性格化语言\n6. 【情绪曲线】读者情绪的起伏设计（爽→虐→更爽）\n7. 【短篇收束】如何在有限篇幅内制造高潮和余韵\n8. 【可复用套路】提炼3-5个可直接套用的写作公式',
        hook: '你是短篇开篇设计专家。请拆解以下章节的开篇钩子技法：\n\n书名：{{book}} | 章节：{{title}}\n\n{{content}}\n\n请分析：\n1. 第一句话的钩子类型（悬念/冲突/反差/画面/金句）\n2. 前三句的信息投放策略\n3. 如何在50字内建立阅读期待\n4. 开篇节奏（快切入 vs 氛围铺垫）\n5. 提炼3个可复用的开篇公式',
        rhythm: '你是叙事节奏分析专家。请拆解以下章节的节奏控制技法：\n\n书名：{{book}} | 章节：{{title}}\n\n{{content}}\n\n请分析：\n1. 快节奏段落（动作/对话/冲突）vs 慢节奏段落（描写/内心）的比例\n2. 段落长度变化规律（短句加速、长句减速）\n3. 场景切换的节奏感\n4. 爽点间隔（多少字出现一次小高潮）\n5. 提炼节奏控制公式',
        emotion: '你是情感操控分析专家。请拆解以下章节的情感设计技法：\n\n书名：{{book}} | 章节：{{title}}\n\n{{content}}\n\n请分析：\n1. 情绪曲线走向（标注每个转折点）\n2. 共情触发器（哪些细节让读者代入）\n3. 情感反转手法（先虐后甜/先扬后抑）\n4. 氛围营造的具体词汇和句式\n5. 提炼情感操控模板',
        suspense: '你是悬念布局分析专家。请拆解以下章节的悬念设计技法：\n\n书名：{{book}} | 章节：{{title}}\n\n{{content}}\n\n请分析：\n1. 悬念类型（谜题/威胁/期待/认知差/反转）\n2. 信息差的制造（读者知道vs角色不知道）\n3. 钩子密度（每段结尾是否留悬念）\n4. 伏笔埋设与回收的间距\n5. 提炼悬念布局模板',
        dialogue: '你是对话技巧分析专家。请拆解以下章节的对话设计技法：\n\n书名：{{book}} | 章节：{{title}}\n\n{{content}}\n\n请分析：\n1. 对话信息密度（一句话承载几个功能）\n2. 潜台词运用（表面说A实际表达B）\n3. 性格化语言（不看名字能分辨谁在说话吗）\n4. 对话节奏（短句交锋vs长段独白的切换）\n5. 提炼高效对话写作模板',
        structure: '你是叙事结构分析专家。请拆解以下章节的结构设计技法：\n\n书名：{{book}} | 章节：{{title}}\n\n{{content}}\n\n请分析：\n1. 结构类型（线性/环形/倒叙/双线/碎片拼贴）\n2. 起承转合的比例分配\n3. 高潮点的位置（是否在70%-80%处）\n4. 结尾处理（开放/闭合/反转/余韵）\n5. 提炼短篇结构模板',
        template: '你是短篇小说写作方法论专家。请根据以下拆解分析，提炼一套完整的短篇写作模板：\n\n{{analysis}}\n\n请输出：\n1. 【万能开篇公式】3种不同风格的开篇模板\n2. 【爽点节奏公式】每X字一个小爽点的节奏模板\n3. 【情感曲线模板】标准短篇情感走向\n4. 【悬念钩子清单】必备的悬念元素\n5. 【黄金结尾套路】5种经典短篇结尾\n6. 【写作检查清单】创作时逐项对照的checklist\n\n只输出方法论和套路，不含原书角色情节。'
    },

    _PRESETS: {
        xiaobai: {
            full: '你是网文小白文爽文套路拆解大师。请用"爽文思维"拆解以下章节，重点关注如何让读者"爽到停不下来"：\n\n书名：{{book}}\n章节：{{title}}\n\n{{content}}\n\n请从以下维度拆解：\n1. 【打脸套路】有没有装逼打脸、扮猪吃虎的桥段？怎么设计的？\n2. 【爽点密度】每多少字出现一次爽点？爽点类型是什么（打脸/升级/获宝/美女倒贴/众人震惊）？\n3. 【金手指设计】主角的外挂/金手指是怎么展示的？\n4. 【节奏公式】"压制→反击→震惊→收获"的循环怎么设计的？\n5. 【钩子设计】每段结尾怎么勾着读者往下看？\n6. 【配角工具人】配角怎么当好"震惊脸"和"垫脚石"？\n7. 【可复用爽文公式】提炼出3-5个直接能套用的爽文写作公式',
            hook: '你是小白文开篇专家。请拆解这个开篇如何在3秒内抓住读者：\n\n{{content}}\n\n分析：\n1. 是否用了"反差开局"（废物突然觉醒/重生/穿越）\n2. 是否制造了"不公平感"让读者想看主角翻盘\n3. 前100字的信息密度和钩子数量\n4. 提炼3个小白文万能开篇公式',
            rhythm: '你是爽文节奏大师。请分析这段文字的"爽感节奏"：\n\n{{content}}\n\n分析：\n1. 压制期多长？反击来得够快吗？\n2. 爽点间隔是否控制在300字以内\n3. "打脸→震惊→收获"的循环是否流畅\n4. 提炼爽文节奏公式'
        },
        emotion: {
            full: '你是情感虐恋短篇拆解专家。请拆解以下章节的情感操控技法：\n\n书名：{{book}}\n章节：{{title}}\n\n{{content}}\n\n请分析：\n1. 【虐心设计】如何制造心痛感？用了哪些虐点？\n2. 【甜虐交替】甜和虐的比例和切换节奏\n3. 【共情触发】哪些细节让读者代入角色情感？\n4. 【情感反转】从甜到虐/从虐到甜的转折怎么设计？\n5. 【催泪技巧】有没有"刀子"？怎么捅的？\n6. 【可复用模板】提炼情感虐恋的写作公式'
        },
        suspense: {
            full: '你是悬疑反转短篇拆解专家。请拆解以下章节的悬疑技法：\n\n书名：{{book}}\n章节：{{title}}\n\n{{content}}\n\n请分析：\n1. 【核心谜题】主悬念是什么？怎么抛出的？\n2. 【误导设计】有没有红鲱鱼（误导线索）？\n3. 【信息控制】给读者透露了多少信息？藏了什么？\n4. 【反转层次】有几层反转？每层反转的冲击力如何？\n5. 【线索埋设】伏笔在哪里？回收时读者会有"原来如此"的感觉吗？\n6. 【可复用模板】提炼悬疑反转的写作公式'
        },
        humor: {
            full: '你是轻喜剧短篇拆解专家。请拆解以下章节的幽默技法：\n\n书名：{{book}}\n章节：{{title}}\n\n{{content}}\n\n请分析：\n1. 【笑点类型】用了哪些喜剧手法（反差/谐音/吐槽/夸张/冷幽默）？\n2. 【笑点密度】每多少字出现一个笑点？\n3. 【节奏控制】铺垫和抖包袱的时机\n4. 【角色喜感】角色本身的喜剧属性怎么建立的？\n5. 【正经与搞笑的切换】怎么在搞笑中推进剧情？\n6. 【可复用模板】提炼喜剧写作公式'
        },
        golden3: {
            full: '你是网文"黄金三章"拆解专家。请用黄金三章理论拆解以下内容：\n\n书名：{{book}}\n章节：{{title}}\n\n{{content}}\n\n请分析：\n1. 【第一章·钩子】开篇是否在300字内建立核心冲突？主角处境是否让人同情/好奇？\n2. 【第一章·金手指】主角的外挂/特殊能力是否在第一章暗示或展示？\n3. 【第二章·小高潮】是否有一个让读者"爽到"的小高潮？（打脸/逆袭/获宝）\n4. 【第二章·世界观】世界观设定是否自然融入而非硬塞？\n5. 【第三章·大钩子】是否留下一个让读者"必须看下去"的大悬念？\n6. 【节奏检查】三章的节奏是否越来越快？爽点是否递增？\n7. 【可复用模板】提炼黄金三章的写作公式'
        }
    },

    _customPrompts: {},

    init: async function() {
        await this.loadBookList();
        this._renderChapterList();
        this._syncPromptEditor();
        this._renderResultNav(); // 初始化结果列表
    },

    _syncPromptEditor: function() {
        var editor = document.getElementById('fb-prompt-editor');
        var label = document.getElementById('fb-prompt-dim-label');
        if (!editor) return;
        var dimNames = { full:'全维度', hook:'开篇钩子', rhythm:'节奏控制', emotion:'情感操控', suspense:'悬念布局', dialogue:'对话技巧', structure:'结构拆解', template:'模板提炼' };
        if (label) label.textContent = '当前：' + (dimNames[this._dimension] || this._dimension);
        var prompt = this._customPrompts[this._dimension] || this._PROMPTS[this._dimension] || '';
        editor.value = prompt;
    },

    onPromptEdit: function(el) {
        this._customPrompts[this._dimension] = el.value;
    },

    resetPrompt: function() {
        delete this._customPrompts[this._dimension];
        this._syncPromptEditor();
        showNotification('已重置为默认提示词', 'success');
    },

    loadPreset: function(presetKey) {
        if (!presetKey) return;
        var preset = this._PRESETS[presetKey];
        if (!preset) return;
        // 加载预设到当前维度
        var promptText = preset[this._dimension] || preset.full || '';
        if (promptText) {
            this._customPrompts[this._dimension] = promptText;
            this._syncPromptEditor();
        }
        // 重置select
        var sel = document.getElementById('fb-prompt-preset');
        if (sel) sel.value = '';
        showNotification('已加载预设模板', 'success');
    },

    loadBookList: async function() {
        var books = libraryManager.books || [];
        var self = this;
        this._books = books.map(function(b) {
            return { id: b.id, name: b.title, content: b.content || '', chapters: self._splitChapters(b.title, b.content || '') };
        });
        var sel = document.getElementById('fb-book-select');
        if (sel) {
            var cur = sel.value || '';
            sel.innerHTML = '<option value="">选择书籍</option>' + this._books.map(function(b) { return '<option value="' + b.id + '">' + b.name + ' (' + b.chapters.length + '章)</option>'; }).join('');
            if (cur) sel.value = cur;
        }
        this._updateStats();
    },

    _splitChapters: function(title, content, mode) {
        if (!content) return [];
        var splitMode = mode || this._splitMode || 'auto';
        var lines = content.split('\n');
        var chapters = [], currentTitle = '序章', currentContent = '';

        // 按字数切分
        if (splitMode === 'chars') {
            var chunkSize = this._splitChars || 900;
            var idx = 0;
            while (idx < content.length) {
                var end = Math.min(idx + chunkSize, content.length);
                if (end < content.length) {
                    // 尽量在换行处切
                    var nlPos = content.indexOf('\n', end - 100);
                    if (nlPos > 0 && nlPos < end + 200) end = nlPos + 1;
                }
                var chunk = content.substring(idx, end).trim();
                if (chunk) chapters.push({ title: '第 ' + (chapters.length + 1) + ' 节', content: chunk });
                idx = end;
            }
            if (chapters.length === 0 && content.trim()) chapters.push({ title: title || '全文', content: content.trim() });
            return chapters;
        }

        // 构建匹配函数
        var isChapterLine;
        if (splitMode === 'number') {
            var numberRegex = /^\d{1,4}[\.、\s]?\s*$/;
            isChapterLine = function(line) { return numberRegex.test(line); };
        } else if (splitMode === 'chapter') {
            var traditionalRegex = /^第[一二三四五六七八九十百千万零\d]+[章节回]/;
            isChapterLine = function(line) { return traditionalRegex.test(line); };
        } else {
            // auto: 先扫描判断用哪种模式
            var tReg = /^第[一二三四五六七八九十百千万零\d]+[章节回]/;
            var nReg = /^\d{1,4}[\.、\s]?\s*$/;
            var tCount = 0, nCount = 0;
            for (var s = 0; s < lines.length; s++) {
                var t = lines[s].trim();
                if (tReg.test(t)) tCount++;
                if (nReg.test(t)) nCount++;
            }
            if (tCount >= 2) {
                isChapterLine = function(line) { return tReg.test(line); };
            } else if (nCount >= 2) {
                isChapterLine = function(line) { return nReg.test(line); };
            } else {
                // 都没命中，默认按字数切
                var defSize = this._splitChars || 900;
                var di = 0;
                while (di < content.length) {
                    var de = Math.min(di + defSize, content.length);
                    if (de < content.length) {
                        var dnl = content.indexOf('\n', de - 100);
                        if (dnl > 0 && dnl < de + 200) de = dnl + 1;
                    }
                    var dc = content.substring(di, de).trim();
                    if (dc) chapters.push({ title: '第 ' + (chapters.length + 1) + ' 节', content: dc });
                    di = de;
                }
                if (chapters.length === 0 && content.trim()) chapters.push({ title: title || '全文', content: content.trim() });
                return chapters;
            }
        }

        // 按检测到的模式切分
        for (var i = 0; i < lines.length; i++) {
            var trimmed = lines[i].trim();
            if (trimmed && isChapterLine(trimmed)) {
                if (currentContent.trim()) chapters.push({ title: currentTitle, content: currentContent.trim() });
                currentTitle = trimmed.substring(0, 50);
                currentContent = '';
            } else {
                currentContent += lines[i] + '\n';
            }
        }
        if (currentContent.trim()) chapters.push({ title: currentTitle, content: currentContent.trim() });
        if (chapters.length === 0 && content.trim()) chapters.push({ title: title || '全文', content: content.trim() });
        return chapters;
    },

    selectBook: function(bookId) {
        this._bookId = bookId ? parseInt(bookId) : null;
        this._chapterIdx = null;
        this._renderChapterList();
        var preview = document.getElementById('fb-preview');
        if (preview) preview.innerHTML = '选择章节查看内容';
        this._updateStats();
    },

    _updateStats: function() {
        var book = null;
        for (var i = 0; i < this._books.length; i++) { if (this._books[i].id === this._bookId) { book = this._books[i]; break; } }
        var countEl = document.getElementById('fb-chapter-count');
        var charsEl = document.getElementById('fb-total-chars');
        if (countEl) countEl.textContent = book ? book.chapters.length : '0';
        if (charsEl) {
            if (book) {
                var total = 0; for (var j = 0; j < book.chapters.length; j++) total += book.chapters[j].content.length;
                charsEl.textContent = total > 10000 ? (total / 10000).toFixed(1) + '万' : total;
            } else { charsEl.textContent = '0'; }
        }
    },

    _renderChapterList: function() {
        var el = document.getElementById('fb-chapters');
        if (!el) return;
        var book = null;
        for (var i = 0; i < this._books.length; i++) { if (this._books[i].id === this._bookId) { book = this._books[i]; break; } }
        if (!book || !book.chapters) { el.innerHTML = '<div style="color:var(--text-tertiary);font-size:11px;padding:12px;text-align:center;">请先选择书籍</div>'; return; }
        var html = '', self = this;
        for (var j = 0; j < book.chapters.length; j++) {
            var ch = book.chapters[j];
            html += '<div class="fb-chapter-item ' + (self._chapterIdx === j ? 'active' : '') + '" onclick="fusionView.clickChapter(' + j + ')">' +
                '<span class="fb-ch-num">' + (j + 1) + '.</span><span class="fb-ch-title">' + _escapeHtml(ch.title) + '</span><span class="fb-ch-chars">' + ch.content.length + '字</span></div>';
        }
        el.innerHTML = html;
    },

    clickChapter: function(idx) {
        this._chapterIdx = idx;
        this._renderChapterList();
        var book = null;
        for (var i = 0; i < this._books.length; i++) { if (this._books[i].id === this._bookId) { book = this._books[i]; break; } }
        if (!book) return;
        var ch = book.chapters[idx];
        if (!ch) return;
        var preview = document.getElementById('fb-preview');
        if (preview) {
            var truncated = ch.content.length > 3000 ? ch.content.slice(0, 3000) + '\n\n...(已截断)' : ch.content;
            preview.innerHTML = '<div class="fb-preview-title">' + _escapeHtml(ch.title) + '</div>' + _escapeHtml(truncated);
        }
    },

    deleteSelectedBook: async function() {
        if (!this._bookId) return showNotification('请先选择书籍', 'error');
        if (!confirm('确定删除此书？')) return;
        await libraryManager.deleteBook(this._bookId);
        this._bookId = null; this._chapterIdx = null;
        await this.loadBookList(); this._renderChapterList();
        showNotification('已删除', 'success');
    },

    selectDimension: function(el) {
        var chips = document.querySelectorAll('.fb-dim-chip');
        for (var i = 0; i < chips.length; i++) chips[i].classList.remove('active');
        el.classList.add('active');
        this._dimension = el.dataset.dim;
        this._syncPromptEditor();
    },

    importBook: async function() {
        var input = document.createElement('input');
        input.type = 'file'; input.accept = '.txt,.epub';
        input.onchange = async function(e) {
            var file = e.target.files[0]; if (!file) return;
            showNotification('正在导入...', 'info');
            var text = await file.text();
            var name = file.name.replace(/\.(txt|epub)$/i, '');
            await libraryManager.addBook(name, text, ['导入']);
            await fusionView.loadBookList();
            showNotification('《' + name + '》导入成功 (' + (fusionView._getBookByName(name) || {chapters:[]}).chapters.length + '章)', 'success');
        };
        input.click();
    },

    _getBookByName: function(name) {
        for (var i = 0; i < this._books.length; i++) { if (this._books[i].name === name) return this._books[i]; }
        return null;
    },

    _splitMode: 'auto',
    _splitChars: 900,

    selectSplitMode: function(el) {
        var chips = el.parentElement.querySelectorAll('.fb-dim-chip');
        for (var i = 0; i < chips.length; i++) chips[i].classList.remove('active');
        el.classList.add('active');
        this._splitMode = el.dataset.split;
        var row = document.getElementById('fb-split-chars-row');
        if (row) row.style.display = this._splitMode === 'chars' ? '' : 'none';
    },

    onSplitSlider: function(el) {
        this._splitChars = parseInt(el.value);
        var label = document.getElementById('fb-split-value');
        if (label) label.textContent = el.value + '字/章';
    },

    resplitBook: function() {
        var book = null;
        for (var i = 0; i < this._books.length; i++) { if (this._books[i].id === this._bookId) { book = this._books[i]; break; } }
        if (!book) return showNotification('请先选择书籍', 'error');
        book.chapters = this._splitChapters(book.name, book.content, this._splitMode);
        this._chapterIdx = null;
        this._renderChapterList();
        this._updateStats();
        this._renderBookOptions();
        showNotification('重新切分完成: ' + book.chapters.length + '章', 'success');
    },

    _renderBookOptions: function() {
        var sel = document.getElementById('fb-book-select');
        if (!sel) return;
        var cur = sel.value || '';
        sel.innerHTML = '<option value="">选择书籍</option>' + this._books.map(function(b) {
            return '<option value="' + b.id + '">' + b.name + ' (' + b.chapters.length + '章)</option>';
        }).join('');
        if (cur) sel.value = cur;
    },
    _getChapterContent: function() {
        var book = null;
        for (var i = 0; i < this._books.length; i++) { if (this._books[i].id === this._bookId) { book = this._books[i]; break; } }
        if (!book) { showNotification('请先选择书籍', 'error'); return null; }
        var ch = book.chapters[this._chapterIdx];
        if (!ch) { showNotification('请选择章节', 'error'); return null; }
        return { book: book, ch: ch };
    },

    _setGenerating: function(on) {
        this._generating = on;
        var ind = document.getElementById('fb-gen-indicator');
        if (ind) ind.style.display = on ? '' : 'none';
    },

    analyzeChapter: async function() {
        var data = this._getChapterContent(); if (!data) return;
        if (this._generating) return showNotification('正在生成中', 'info');
        var prompt = this._customPrompts[this._dimension] || this._PROMPTS[this._dimension] || this._PROMPTS.full;
        prompt = prompt.replace('{{book}}', data.book.name).replace('{{title}}', data.ch.title).replace('{{content}}', data.ch.content.slice(0, 6000));
        var status = document.getElementById('fb-status');
        if (status) status.textContent = '正在拆解：' + data.ch.title;
        this._setGenerating(true);
        var outEl = document.getElementById('fb-output');
        if (outEl) outEl.textContent = '正在拆解分析...';
        var result = '';
        try { result = await this._streamGenerate(prompt, outEl); } catch (e) { showNotification('分析出错: ' + e.message, 'error'); }
        
        // 存储结果
        var dimNames = { full:'全维度', hook:'开篇钩子', rhythm:'节奏控制', emotion:'情感操控', suspense:'悬念布局', dialogue:'对话技巧', structure:'结构拆解', template:'模板提炼' };
        var resultKey = this._dimension;
        var resultLabel = dimNames[this._dimension] || this._dimension;
        
        this._analysisResults[resultKey] = {
            label: resultLabel,
            content: result,
            chapter: data.ch.title,
            book: data.book.name,
            timestamp: new Date().toLocaleString('zh-CN')
        };
        this._currentResultKey = resultKey;
        this._analysis = result;
        
        this._setGenerating(false);
        this._renderResultNav();
        if (status) status.textContent = '拆解完成 (' + result.length + '字)';
    },

    batchAnalyze: async function() {
        var book = null;
        for (var i = 0; i < this._books.length; i++) { if (this._books[i].id === this._bookId) { book = this._books[i]; break; } }
        if (!book) return showNotification('请先选择书籍', 'error');
        if (this._generating) return showNotification('正在生成中', 'info');
        var status = document.getElementById('fb-status');
        var outEl = document.getElementById('fb-output');
        var allResults = '';
        for (var i = 0; i < book.chapters.length; i++) {
            var ch = book.chapters[i];
            if (status) status.textContent = '批量拆解 [' + (i+1) + '/' + book.chapters.length + '] ' + ch.title;
            this._setGenerating(true);
            var prompt = this._customPrompts[this._dimension] || this._PROMPTS[this._dimension] || this._PROMPTS.full;
            prompt = prompt.replace('{{book}}', book.name).replace('{{title}}', ch.title).replace('{{content}}', ch.content.slice(0, 6000));
            var result = '';
            try { result = await this._streamGenerate(prompt, outEl, '## ' + ch.title + '\n\n'); } catch (e) { result = '(失败: ' + e.message + ')'; }
            allResults += '## ' + ch.title + '\n\n' + result + '\n\n---\n\n';
        }
        
        // 存储批量拆解结果
        var dimNames = { full:'全维度', hook:'开篇钩子', rhythm:'节奏控制', emotion:'情感操控', suspense:'悬念布局', dialogue:'对话技巧', structure:'结构拆解', template:'模板提炼' };
        var resultKey = 'batch_' + this._dimension;
        var resultLabel = '批量-' + (dimNames[this._dimension] || this._dimension);
        
        this._analysisResults[resultKey] = {
            label: resultLabel,
            content: allResults,
            chapter: '全书 ' + book.chapters.length + ' 章',
            book: book.name,
            timestamp: new Date().toLocaleString('zh-CN')
        };
        this._currentResultKey = resultKey;
        
        this._analysis = allResults; this._allAnalysis = allResults;
        this._setGenerating(false);
        this._renderResultNav();
        if (outEl) outEl.textContent = allResults;
        if (status) status.textContent = '批量拆解完成 (' + book.chapters.length + '章)';
        showNotification('批量拆解完成', 'success');
    },

    extractTemplate: async function() {
        var analysis = this._analysis || this._allAnalysis;
        if (!analysis) return showNotification('请先拆解章节或批量拆解', 'error');
        if (this._generating) return showNotification('正在生成中', 'info');
        var basePrompt = this._customPrompts['template'] || this._PROMPTS.template;
        var prompt = basePrompt.replace('{{analysis}}', analysis.slice(0, 6000));
        var status = document.getElementById('fb-status');
        if (status) status.textContent = '正在提炼写作模板...';
        this._setGenerating(true);
        var outEl = document.getElementById('fb-output');
        if (outEl) outEl.textContent = '正在提炼写作模板...';
        var result = '';
        try { result = await this._streamGenerate(prompt, outEl); } catch (e) { showNotification('提炼出错: ' + e.message, 'error'); }
        
        // 存储模板结果
        this._analysisResults['template'] = {
            label: '写作模板',
            content: result,
            chapter: this._analysisResults[this._currentResultKey]?.chapter || '综合',
            book: this._analysisResults[this._currentResultKey]?.book || '未知',
            timestamp: new Date().toLocaleString('zh-CN')
        };
        this._currentResultKey = 'template';
        
        this._template = result;
        this._setGenerating(false);
        this._renderResultNav();
        if (status) status.textContent = '写作模板提炼完成';
        // 自动将模板转化为提示词存入图书馆提示词库
        if (result) {
            var promptName = '拆书模板_' + new Date().toLocaleTimeString('zh-CN');
            libraryManager.savePrompt(promptName, result);
            showNotification('写作模板已提炼并存为提示词「' + promptName + '」', 'success');
        }
    },

    _streamGenerate: async function(prompt, outputEl, prefix) {
        var config = await apiClient.getActiveConfig();
        if (!config) { showNotification('请先在API设置中添加并激活配置', 'error'); throw new Error('无API配置'); }
        var req = apiClient.buildRequest(config, prompt, true);
        var response = await fetch(req.url, { method: 'POST', headers: req.headers, body: JSON.stringify(req.body) });
        if (!response.ok) {
            var errDetail = 'HTTP ' + response.status;
            try { errDetail += ': ' + (await response.text()).substring(0, 200); } catch (_) {}
            throw new Error(errDetail);
        }
        var reader = response.body.getReader(), decoder = new TextDecoder(), buffer = '', result = '';
        while (true) {
            var chunk = await reader.read(); if (chunk.done) break;
            buffer += decoder.decode(chunk.value, { stream: true });
            var lines = buffer.split('\n'); buffer = lines.pop() || '';
            for (var j = 0; j < lines.length; j++) {
                var trimmed = lines[j].trim();
                if (!trimmed || trimmed === 'data: [DONE]') continue;
                if (trimmed.indexOf('data: ') === 0) {
                    try { var d = JSON.parse(trimmed.slice(6)); var t = apiClient.parseStreamChunk(config.provider, d); if (t) { result += t; if (outputEl) outputEl.textContent = (prefix || '') + result; } } catch (e) {}
                }
            }
        }
        return result;
    },

    // ========== 结果导航 ==========
    _renderResultNav: function() {
        var listEl = document.getElementById('fb-result-list');
        var countEl = document.getElementById('fb-result-count');
        if (!listEl) {
            console.log('Result list element not found');
            return;
        }
        
        var resultCount = Object.keys(this._analysisResults).length;
        console.log('Rendering result list, count:', resultCount, 'results:', this._analysisResults);
        
        // 更新计数
        if (countEl) countEl.textContent = resultCount + ' 个结果';
        
        if (resultCount === 0) {
            listEl.innerHTML = '<div class="fb-result-empty">暂无拆解结果</div>';
            return;
        }
        
        // 渲染结果列表（类似章节列表样式）
        var html = '';
        var self = this;
        var idx = 0;
        
        Object.keys(this._analysisResults).forEach(function(key) {
            var result = self._analysisResults[key];
            var isActive = key === self._currentResultKey;
            var activeClass = isActive ? ' active' : '';
            var shortChapter = result.chapter.length > 20 ? result.chapter.substring(0, 20) + '...' : result.chapter;
            
            html += '<div class="fb-result-item' + activeClass + '" onclick="fusionView.switchResult(\'' + key + '\')">';
            html += '<span class="fb-result-num">' + (idx + 1) + '.</span>';
            html += '<span class="fb-result-label">' + result.label + '</span>';
            html += '<span class="fb-result-chapter">' + shortChapter + '</span>';
            html += '<span class="fb-result-chars">' + result.content.length + '字</span>';
            html += '</div>';
            idx++;
        });
        
        listEl.innerHTML = html;
    },
    
    switchResult: function(key) {
        var result = this._analysisResults[key];
        if (!result) return;
        
        this._currentResultKey = key;
        
        // 更新输出区
        var outEl = document.getElementById('fb-output');
        if (outEl) {
            var header = '## ' + result.label + ' - ' + result.chapter + '\n';
            header += '> 📖 ' + result.book + ' | 🕐 ' + result.timestamp + '\n\n';
            outEl.textContent = header + result.content;
        }
        
        // 更新状态
        var status = document.getElementById('fb-status');
        if (status) status.textContent = '查看：' + result.label + ' (' + result.content.length + '字)';
        
        // 重新渲染导航以更新激活状态
        this._renderResultNav();
    },

    sendToWriter: function() {
        var content = this._template || this._analysis;
        if (!content) return showNotification('请先完成拆解或提炼模板', 'error');
        app.switchView('shortStory');
        // 如果有模板，填入提示词区域；拆解结果填入输入区域
        if (this._template) {
            var promptEl = document.getElementById('writing-prompt');
            if (promptEl) promptEl.value = this._template;
        }
        if (this._analysis) {
            var inputEl = document.getElementById('writing-input');
            if (inputEl) { inputEl.value = this._analysis; writingView._updateCharCount(); }
        }
        showNotification('已导入到短篇写作', 'success');
    },

    sendToPipeline: function() {
        var content = this._template || this._analysis;
        if (!content) return showNotification('请先完成拆解或提炼模板', 'error');
        app.switchView('pipeline');
        // 把拆解/模板结果作为参考书籍添加到流水线
        var book = null;
        for (var i = 0; i < this._books.length; i++) { if (this._books[i].id === this._bookId) { book = this._books[i]; break; } }
        var title = '拆书技法_' + (book ? book.name : '未知');
        // 避免重复添加
        var exists = pipelineView._books.find(function(b) { return b.title === title; });
        if (!exists) {
            pipelineView._books.push({ id: null, title: title, content: content });
        } else {
            exists.content = content;
        }
        pipelineView.render();
        showNotification('已导入到生产流水线参考书籍', 'success');
    },

    copyOutput: function() {
        var outEl = document.getElementById('fb-output');
        if (outEl && outEl.textContent) copyToClipboard(outEl.textContent);
    },

    exportResult: function() {
        var outEl = document.getElementById('fb-output');
        var content = outEl ? outEl.textContent : '';
        if (!content || content.indexOf('拆解结果将显示在这里') === 0) return showNotification('暂无内容', 'info');
        libraryManager.addBook('短篇拆书_' + new Date().toLocaleTimeString('zh-CN'), content, ['拆书', '短篇', '技法']);
        showNotification('已存入图书馆', 'success');
    },

    saveToMemory: function() {
        var outEl = document.getElementById('fb-output');
        var content = outEl ? outEl.textContent : '';
        if (!content || content.indexOf('拆解结果将显示在这里') === 0) return showNotification('暂无内容', 'info');
        memoryView.storeFromModule(content, 'fusion', 'high', 'writing', ['fusion', 'technique']);
        showNotification('已存入记忆系统（工作记忆+长期记忆）', 'success');
    },

    selectMode: function() {},
    startFusion: function() {},
    _updateMemoryPanel: function() {},
    _indexLibraryToRAG: function() {},
    _updateContextStats: function() {},
    renderChat: function() {}
};