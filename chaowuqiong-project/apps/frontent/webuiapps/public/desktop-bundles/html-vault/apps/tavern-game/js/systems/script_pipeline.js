/**
 * 流水线式剧本创作系统 - AI酒馆增强版
 * 
 * 参考 WriterCenterArchon 的凤凰创作流
 * 
 * 流程:
 * 1. 灵感构思 → 2. 世界观设定 → 3. 角色设计 → 4. 剧情大纲 → 5. 剧本生成
 * 
 * 特性:
 * - 分步骤引导式创作
 * - AI 辅助生成
 * - 模板预设
 * - 实时预览
 */

import { dbManager } from '../core/db_manager.js';
import { eventBus } from '../core/event_bus.js';

class ScriptPipeline {
    constructor() {
        this.currentStep = 0;
        this.data = {
            name: '',
            desc: '',
            genre: '',
            style: '',
            worldSetting: '',
            characters: [],
            outline: '',
            prompt: '',
            tags: []
        };
        
        this.steps = [
            { id: 'inspiration', title: '灵感构思', icon: '💡', desc: '确定剧本类型和核心创意' },
            { id: 'world', title: '世界观设定', icon: '🌍', desc: '构建故事发生的舞台' },
            { id: 'characters', title: '角色设计', icon: '👥', desc: '创建主要角色和NPC' },
            { id: 'outline', title: '剧情大纲', icon: '📋', desc: '规划故事走向和章节' },
            { id: 'generate', title: '剧本生成', icon: '✨', desc: 'AI生成完整剧本提示词' }
        ];
        
        this.presets = {
            fantasy: {
                name: '奇幻冒险',
                genre: '奇幻',
                style: '史诗、冒险、魔法',
                worldTemplate: '一个充满魔法与神秘的大陆，有多个王国和种族共存...',
                characterTemplate: '勇敢的冒险者，拥有神秘的力量'
            },
            cyberpunk: {
                name: '赛博朋克',
                genre: '科幻',
                style: '暗黑、科技、反乌托邦',
                worldTemplate: '2077年的巨型都市，霓虹灯下隐藏着无数秘密...',
                characterTemplate: '赏金猎人，身经百战的街头战士'
            },
            cultivation: {
                name: '修仙世界',
                genre: '仙侠',
                style: '玄幻、修真、热血',
                worldTemplate: '一个修仙者追求长生的世界，宗门林立，强者如云...',
                characterTemplate: '天赋异禀的修仙者，拥有神秘传承'
            },
            detective: {
                name: '侦探悬疑',
                genre: '悬疑',
                style: '推理、烧脑、反转',
                worldTemplate: '现代都市，表面平静实则暗流涌动...',
                characterTemplate: '敏锐的侦探，善于发现蛛丝马迹'
            },
            apocalypse: {
                name: '末日生存',
                genre: '末日',
                style: '生存、人性、紧张',
                worldTemplate: '病毒爆发后的废土世界，文明崩塌...',
                characterTemplate: '幸存者，在废墟中寻找希望'
            },
            romance: {
                name: '都市言情',
                genre: '言情',
                style: '甜蜜、治愈、日常',
                worldTemplate: '繁华的现代都市，机遇与浪漫并存...',
                characterTemplate: '普通的都市青年，期待着美好的邂逅'
            }
        };
        
        this._generating = false;
    }

    render() {
        return `
            <div class="pipeline-container">
                <div class="pipeline-sidebar">
                    <div class="pipeline-header">
                        <span class="pipeline-icon">🎭</span>
                        <span class="pipeline-title">剧本创作流水线</span>
                    </div>
                    <div class="pipeline-steps">
                        ${this.steps.map((step, i) => `
                            <div class="pipeline-step ${i === this.currentStep ? 'active' : i < this.currentStep ? 'completed' : ''}" 
                                 data-step="${i}" onclick="ScriptPipeline.goToStep(${i})">
                                <div class="step-indicator">
                                    ${i < this.currentStep ? '✓' : step.icon}
                                </div>
                                <div class="step-info">
                                    <div class="step-title">${step.title}</div>
                                    <div class="step-desc">${step.desc}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <div class="pipeline-actions">
                        <button class="btn btn-primary" onclick="ScriptPipeline.nextStep()">
                            ${this.currentStep === 4 ? '🎬 完成创作' : '下一步 →'}
                        </button>
                        <button class="btn" onclick="ScriptPipeline.prevStep()" ${this.currentStep === 0 ? 'disabled' : ''}>
                            ← 上一步
                        </button>
                    </div>
                </div>
                <div class="pipeline-content" id="pipeline-content">
                    ${this.renderStep(this.currentStep)}
                </div>
            </div>
        `;
    }

    renderStep(step) {
        switch (step) {
            case 0: return this._renderInspirationStep();
            case 1: return this._renderWorldStep();
            case 2: return this._renderCharactersStep();
            case 3: return this._renderOutlineStep();
            case 4: return this._renderGenerateStep();
            default: return '';
        }
    }

    _renderInspirationStep() {
        return `
            <div class="step-content">
                <h2>💡 灵感构思</h2>
                <p class="step-hint">选择一个预设模板快速开始，或者自由创作</p>
                
                <div class="preset-grid">
                    ${Object.entries(this.presets).map(([key, preset]) => `
                        <div class="preset-card" onclick="ScriptPipeline.applyPreset('${key}')">
                            <div class="preset-icon">${this._getGenreIcon(preset.genre)}</div>
                            <div class="preset-name">${preset.name}</div>
                            <div class="preset-tags">${preset.style}</div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="form-section">
                    <h3>基本信息</h3>
                    <div class="form-group">
                        <label>剧本名称</label>
                        <input type="text" id="sp-name" value="${this.data.name}" 
                               placeholder="给你的剧本起个名字" onchange="ScriptPipeline.updateData('name', this.value)">
                    </div>
                    <div class="form-group">
                        <label>剧本描述</label>
                        <textarea id="sp-desc" placeholder="简单描述你的剧本..." 
                                  onchange="ScriptPipeline.updateData('desc', this.value)">${this.data.desc}</textarea>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>类型</label>
                            <input type="text" id="sp-genre" value="${this.data.genre}" 
                                   placeholder="如：奇幻、科幻、悬疑" onchange="ScriptPipeline.updateData('genre', this.value)">
                        </div>
                        <div class="form-group">
                            <label>风格</label>
                            <input type="text" id="sp-style" value="${this.data.style}" 
                                   placeholder="如：热血、暗黑、治愈" onchange="ScriptPipeline.updateData('style', this.value)">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>标签 (用逗号分隔)</label>
                        <input type="text" id="sp-tags" value="${this.data.tags.join(', ')}" 
                               placeholder="冒险, RPG, 奇幻" onchange="ScriptPipeline.updateTags(this.value)">
                    </div>
                </div>
            </div>
        `;
    }

    _renderWorldStep() {
        return `
            <div class="step-content">
                <h2>🌍 世界观设定</h2>
                <p class="step-hint">构建故事发生的舞台，让玩家沉浸其中</p>
                
                <div class="form-section">
                    <div class="form-group">
                        <label>世界背景</label>
                        <textarea id="sp-world" rows="8" placeholder="描述这个世界的背景、历史、规则..."
                                  onchange="ScriptPipeline.updateData('worldSetting', this.value)">${this.data.worldSetting}</textarea>
                    </div>
                    
                    <div class="ai-assist">
                        <button class="btn" onclick="ScriptPipeline.generateWorld()">
                            🤖 AI 辅助生成世界观
                        </button>
                    </div>
                    
                    <div class="world-aspects">
                        <div class="aspect-card">
                            <h4>🏛️ 政治势力</h4>
                            <textarea id="sp-politics" rows="3" placeholder="王国、组织、势力..."></textarea>
                        </div>
                        <div class="aspect-card">
                            <h4>⚔️ 冲突矛盾</h4>
                            <textarea id="sp-conflicts" rows="3" placeholder="主要矛盾和冲突..."></textarea>
                        </div>
                        <div class="aspect-card">
                            <h4>🌟 特殊设定</h4>
                            <textarea id="sp-special" rows="3" placeholder="魔法系统、科技、规则..."></textarea>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    _renderCharactersStep() {
        const charList = this.data.characters.length > 0 
            ? this.data.characters.map((char, i) => `
                <div class="character-card">
                    <div class="char-avatar">${char.icon || '👤'}</div>
                    <div class="char-info">
                        <div class="char-name">${char.name}</div>
                        <div class="char-role">${char.role}</div>
                    </div>
                    <div class="char-actions">
                        <button onclick="ScriptPipeline.editCharacter(${i})">✏️</button>
                        <button onclick="ScriptPipeline.removeCharacter(${i})">🗑️</button>
                    </div>
                </div>
            `).join('')
            : '<div class="empty-state">暂无角色，点击下方添加</div>';

        return `
            <div class="step-content">
                <h2>👥 角色设计</h2>
                <p class="step-hint">创建故事中的主要角色和NPC</p>
                
                <div class="characters-list">
                    ${charList}
                </div>
                
                <div class="character-form" id="character-form">
                    <h3>${this._editingChar !== undefined ? '编辑角色' : '添加新角色'}</h3>
                    <div class="form-row">
                        <div class="form-group">
                            <label>角色名称</label>
                            <input type="text" id="char-name" placeholder="角色名称">
                        </div>
                        <div class="form-group">
                            <label>角色定位</label>
                            <select id="char-role">
                                <option value="protagonist">主角</option>
                                <option value="companion">同伴</option>
                                <option value="antagonist">反派</option>
                                <option value="npc">NPC</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>角色描述</label>
                        <textarea id="char-desc" rows="4" placeholder="描述角色的外貌、性格、背景..."></textarea>
                    </div>
                    <div class="form-group">
                        <label>角色目标</label>
                        <input type="text" id="char-goal" placeholder="角色的主要目标或动机">
                    </div>
                    <div class="form-actions">
                        <button class="btn btn-primary" onclick="ScriptPipeline.saveCharacter()">保存角色</button>
                        <button class="btn" onclick="ScriptPipeline.generateCharacter()">🤖 AI 生成</button>
                    </div>
                </div>
            </div>
        `;
    }

    _renderOutlineStep() {
        return `
            <div class="step-content">
                <h2>📋 剧情大纲</h2>
                <p class="step-hint">规划故事的主要走向和关键节点</p>
                
                <div class="form-section">
                    <div class="form-group">
                        <label>故事大纲</label>
                        <textarea id="sp-outline" rows="12" placeholder="描述故事的开端、发展、高潮、结局..."
                                  onchange="ScriptPipeline.updateData('outline', this.value)">${this.data.outline}</textarea>
                    </div>
                    
                    <div class="ai-assist">
                        <button class="btn" onclick="ScriptPipeline.generateOutline()">
                            🤖 AI 辅助生成大纲
                        </button>
                    </div>
                    
                    <div class="outline-structure">
                        <h4>三幕式结构参考</h4>
                        <div class="structure-grid">
                            <div class="structure-item">
                                <span class="structure-label">开端 (25%)</span>
                                <textarea id="sp-act1" rows="2" placeholder="引入角色、世界观、初始冲突"></textarea>
                            </div>
                            <div class="structure-item">
                                <span class="structure-label">发展 (50%)</span>
                                <textarea id="sp-act2" rows="2" placeholder="冲突升级、角色成长、转折"></textarea>
                            </div>
                            <div class="structure-item">
                                <span class="structure-label">高潮 (20%)</span>
                                <textarea id="sp-act3" rows="2" placeholder="最终对决、揭示真相"></textarea>
                            </div>
                            <div class="structure-item">
                                <span class="structure-label">结局 (5%)</span>
                                <textarea id="sp-act4" rows="2" placeholder="收尾、伏笔、余韵"></textarea>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    _renderGenerateStep() {
        const previewPrompt = this._generatePreviewPrompt();
        
        return `
            <div class="step-content">
                <h2>✨ 剧本生成</h2>
                <p class="step-hint">AI将根据你的设定生成完整的剧本提示词</p>
                
                <div class="preview-section">
                    <div class="preview-header">
                        <h3>📝 生成的提示词预览</h3>
                        <div class="preview-actions">
                            <button class="btn btn-sm" onclick="ScriptPipeline.copyPrompt()">📋 复制</button>
                            <button class="btn btn-sm" onclick="ScriptPipeline.regeneratePrompt()">🔄 重新生成</button>
                        </div>
                    </div>
                    <div class="prompt-preview">
                        <pre id="prompt-preview">${previewPrompt}</pre>
                    </div>
                </div>
                
                <div class="final-actions">
                    <button class="btn btn-primary btn-lg" onclick="ScriptPipeline.saveScript()">
                        💾 保存到剧本库
                    </button>
                    <button class="btn btn-lg" onclick="ScriptPipeline.saveAndPlay()">
                        🎮 保存并开始游戏
                    </button>
                </div>
                
                <div class="script-summary">
                    <h3>📊 剧本信息摘要</h3>
                    <div class="summary-grid">
                        <div class="summary-item">
                            <span class="summary-label">名称</span>
                            <span class="summary-value">${this.data.name || '未命名'}</span>
                        </div>
                        <div class="summary-item">
                            <span class="summary-label">类型</span>
                            <span class="summary-value">${this.data.genre || '未设置'}</span>
                        </div>
                        <div class="summary-item">
                            <span class="summary-label">角色数</span>
                            <span class="summary-value">${this.data.characters.length}</span>
                        </div>
                        <div class="summary-item">
                            <span class="summary-label">大纲长度</span>
                            <span class="summary-value">${this.data.outline.length} 字</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    _getGenreIcon(genre) {
        const icons = {
            '奇幻': '🐉',
            '科幻': '🚀',
            '仙侠': '☯️',
            '悬疑': '🔍',
            '末日': '☢️',
            '言情': '💕'
        };
        return icons[genre] || '📖';
    }

    _generatePreviewPrompt() {
        const parts = [];
        
        if (this.data.worldSetting) {
            parts.push(`【世界背景】\n${this.data.worldSetting}`);
        }
        
        if (this.data.characters.length > 0) {
            parts.push(`【主要角色】\n${this.data.characters.map(c => 
                `- ${c.name}(${c.role}): ${c.desc}`
            ).join('\n')}`);
        }
        
        if (this.data.outline) {
            parts.push(`【故事大纲】\n${this.data.outline}`);
        }
        
        parts.push(`【游戏规则】
- 你是游戏主持人，负责推进剧情
- 根据玩家的行动做出合理反应
- 保持角色一致性
- 适时引入新的情节和挑战
- 给玩家选择的自由度`);
        
        return parts.join('\n\n');
    }

    applyPreset(presetKey) {
        const preset = this.presets[presetKey];
        if (!preset) return;
        
        this.data.genre = preset.genre;
        this.data.style = preset.style;
        this.data.worldSetting = preset.worldTemplate;
        
        document.getElementById('sp-genre').value = preset.genre;
        document.getElementById('sp-style').value = preset.style;
        document.getElementById('sp-world').value = preset.worldTemplate;
        
        eventBus.emit('pipeline-preset-applied', { preset: presetKey });
    }

    updateData(key, value) {
        this.data[key] = value;
    }

    updateTags(value) {
        this.data.tags = value.split(',').map(t => t.trim()).filter(t => t);
    }

    goToStep(step) {
        if (step <= this.currentStep || this._canProceedToStep(step)) {
            this.currentStep = step;
            this._refreshContent();
        }
    }

    nextStep() {
        if (this.currentStep < 4) {
            this.currentStep++;
            this._refreshContent();
        } else {
            this.saveScript();
        }
    }

    prevStep() {
        if (this.currentStep > 0) {
            this.currentStep--;
            this._refreshContent();
        }
    }

    _canProceedToStep(step) {
        return true;
    }

    _refreshContent() {
        const container = document.getElementById('pipeline-content');
        if (container) {
            container.innerHTML = this.renderStep(this.currentStep);
        }
        
        const sidebar = document.querySelector('.pipeline-sidebar');
        if (sidebar) {
            sidebar.innerHTML = `
                <div class="pipeline-header">
                    <span class="pipeline-icon">🎭</span>
                    <span class="pipeline-title">剧本创作流水线</span>
                </div>
                <div class="pipeline-steps">
                    ${this.steps.map((s, i) => `
                        <div class="pipeline-step ${i === this.currentStep ? 'active' : i < this.currentStep ? 'completed' : ''}" 
                             data-step="${i}" onclick="ScriptPipeline.goToStep(${i})">
                            <div class="step-indicator">${i < this.currentStep ? '✓' : s.icon}</div>
                            <div class="step-info">
                                <div class="step-title">${s.title}</div>
                                <div class="step-desc">${s.desc}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="pipeline-actions">
                    <button class="btn btn-primary" onclick="ScriptPipeline.nextStep()">
                        ${this.currentStep === 4 ? '🎬 完成创作' : '下一步 →'}
                    </button>
                    <button class="btn" onclick="ScriptPipeline.prevStep()" ${this.currentStep === 0 ? 'disabled' : ''}>
                        ← 上一步
                    </button>
                </div>
            `;
        }
    }

    async generateWorld() {
        this._showGenerating();
        
        await new Promise(r => setTimeout(r, 1500));
        
        const genre = this.data.genre || '奇幻';
        const generated = `【${genre}世界设定】
        
这是一个充满神秘与冒险的世界。古老的传说中，隐藏着改变命运的力量...

地理环境：
- 北方是永冻的冰原，传说中沉睡着远古巨龙
- 中央是繁华的人类王国，商业与魔法并存
- 南方是神秘的精灵森林，与世隔绝
- 东方是无尽的沙漠，埋藏着失落文明的遗迹
- 西方是险峻的山脉，矮人的地下王国

政治格局：
多个王国之间维持着脆弱的和平，暗流涌动...

主要势力：
- 光明教会：掌控信仰，势力庞大
- 魔法学院：追求知识，中立存在
- 商人联盟：控制贸易，富可敌国
- 暗影公会：地下势力，神秘莫测`;
        
        this.data.worldSetting = generated;
        document.getElementById('sp-world').value = generated;
        
        this._hideGenerating();
    }

    async generateCharacter() {
        this._showGenerating();
        
        await new Promise(r => setTimeout(r, 1000));
        
        const genre = this.data.genre || '奇幻';
        const names = ['艾琳', '凯尔', '莉娜', '雷恩', '薇拉', '阿瑟'];
        const name = names[Math.floor(Math.random() * names.length)];
        
        document.getElementById('char-name').value = name;
        document.getElementById('char-desc').value = `一位来自${genre}世界的冒险者，拥有独特的才能和神秘的过去。性格坚毅，但也隐藏着柔软的一面。`;
        document.getElementById('char-goal').value = '寻找失落的真相，完成命运的使命';
        
        this._hideGenerating();
    }

    saveCharacter() {
        const char = {
            name: document.getElementById('char-name').value,
            role: document.getElementById('char-role').value,
            desc: document.getElementById('char-desc').value,
            goal: document.getElementById('char-goal').value,
            icon: '👤'
        };
        
        if (!char.name) {
            alert('请输入角色名称');
            return;
        }
        
        this.data.characters.push(char);
        this._refreshContent();
    }

    editCharacter(index) {
        const char = this.data.characters[index];
        if (!char) return;
        
        document.getElementById('char-name').value = char.name;
        document.getElementById('char-role').value = char.role;
        document.getElementById('char-desc').value = char.desc;
        document.getElementById('char-goal').value = char.goal;
        
        this.data.characters.splice(index, 1);
    }

    removeCharacter(index) {
        if (confirm('确定删除这个角色？')) {
            this.data.characters.splice(index, 1);
            this._refreshContent();
        }
    }

    async generateOutline() {
        this._showGenerating();
        
        await new Promise(r => setTimeout(r, 2000));
        
        const genre = this.data.genre || '奇幻';
        const worldContext = this.data.worldSetting?.slice(0, 200) || '';
        
        const generated = `【${genre}故事大纲】

第一章：命运的召唤
主角在平静的生活中收到了神秘的信号，命运的齿轮开始转动...

第二章：踏上旅途
离开熟悉的家园，主角踏上了未知的冒险之路。途中遇到了志同道合的伙伴。

第三章：初次试炼
面对第一个真正的挑战，主角展现出了潜藏的力量。

第四章：暗影浮现
敌人现身，阴谋的冰山一角被揭开。主角发现事情远比想象的复杂。

第五章：深入险境
为了追寻真相，主角深入敌人的领地，危机四伏。

第六章：转折点
一个惊人的真相被揭示，主角的世界观被颠覆。

第七章：最终对决
与宿敌的决战，决定世界的命运。

第八章：新的开始
尘埃落定，但故事并未结束。新的冒险在等待...`;
        
        this.data.outline = generated;
        document.getElementById('sp-outline').value = generated;
        
        this._hideGenerating();
    }

    copyPrompt() {
        const prompt = this._generatePreviewPrompt();
        navigator.clipboard.writeText(prompt).then(() => {
            alert('已复制到剪贴板');
        });
    }

    regeneratePrompt() {
        this._refreshContent();
    }

    async saveScript() {
        const script = {
            id: `script_${Date.now()}`,
            name: this.data.name || '未命名剧本',
            desc: this.data.desc || this.data.outline?.slice(0, 100) || '',
            icon: this._getGenreIcon(this.data.genre),
            tags: this.data.tags.length > 0 ? this.data.tags : [this.data.genre, '原创'],
            prompt: this._generatePreviewPrompt(),
            genre: this.data.genre,
            style: this.data.style,
            worldSetting: this.data.worldSetting,
            characters: this.data.characters,
            outline: this.data.outline,
            createdAt: Date.now()
        };
        
        try {
            await dbManager.put('scripts', script);
            eventBus.emit('script-saved', { script });
            alert('剧本已保存到剧本库！');
        } catch (e) {
            console.error('Save script error:', e);
            alert('保存失败: ' + e.message);
        }
    }

    async saveAndPlay() {
        await this.saveScript();
        eventBus.emit('start-game-from-pipeline', { scriptId: `script_${Date.now()}` });
    }

    _showGenerating() {
        this._generating = true;
        const overlay = document.createElement('div');
        overlay.id = 'generating-overlay';
        overlay.innerHTML = `
            <div class="generating-content">
                <div class="generating-spinner"></div>
                <span>AI 生成中...</span>
            </div>
        `;
        overlay.style.cssText = `
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;
        document.body.appendChild(overlay);
    }

    _hideGenerating() {
        this._generating = false;
        const overlay = document.getElementById('generating-overlay');
        if (overlay) overlay.remove();
    }

    reset() {
        this.currentStep = 0;
        this.data = {
            name: '',
            desc: '',
            genre: '',
            style: '',
            worldSetting: '',
            characters: [],
            outline: '',
            prompt: '',
            tags: []
        };
    }
}

const scriptPipeline = new ScriptPipeline();

window.ScriptPipeline = {
    goToStep: (step) => scriptPipeline.goToStep(step),
    nextStep: () => scriptPipeline.nextStep(),
    prevStep: () => scriptPipeline.prevStep(),
    applyPreset: (key) => scriptPipeline.applyPreset(key),
    updateData: (key, value) => scriptPipeline.updateData(key, value),
    updateTags: (value) => scriptPipeline.updateTags(value),
    generateWorld: () => scriptPipeline.generateWorld(),
    generateCharacter: () => scriptPipeline.generateCharacter(),
    saveCharacter: () => scriptPipeline.saveCharacter(),
    editCharacter: (i) => scriptPipeline.editCharacter(i),
    removeCharacter: (i) => scriptPipeline.removeCharacter(i),
    generateOutline: () => scriptPipeline.generateOutline(),
    copyPrompt: () => scriptPipeline.copyPrompt(),
    regeneratePrompt: () => scriptPipeline.regeneratePrompt(),
    saveScript: () => scriptPipeline.saveScript(),
    saveAndPlay: () => scriptPipeline.saveAndPlay(),
    reset: () => scriptPipeline.reset(),
    render: () => scriptPipeline.render()
};

export { ScriptPipeline, scriptPipeline };
