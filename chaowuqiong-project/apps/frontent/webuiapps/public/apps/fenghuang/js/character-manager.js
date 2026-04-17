// 文件路径: js/character-manager.js
// 描述: (V5.0 精确关系网络终极版) 已实现“关系大类.具体角色”的精确关系定义与完美的双向绑定功能。
// 此文件内容完全从 5.50完全体/js/modules/03_人物卡生成器.js 迁移而来。

/**
 * 生成一个包含54个扑克牌定义的对象数组，用于UI映射。
 * @returns {Array<Object>} 扑克牌定义数组。
 */
function getPokerDeckMap() {
    const suits = { spades: '♠', hearts: '♥', diams: '♦', clubs: '♣' };
    const ranks = ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2'];
    let deck = [];
    ranks.forEach(rank => deck.push({ rank, suit: suits.spades, suitName: 'spades' }));
    ranks.forEach(rank => deck.push({ rank, suit: suits.hearts, suitName: 'hearts' }));
    ranks.forEach(rank => deck.push({ rank, suit: suits.diams, suitName: 'diams' }));
    ranks.forEach(rank => deck.push({ rank, suit: suits.clubs, suitName: 'clubs' }));
    deck.push({ rank: '大', suit: '🃏', suitName: 'joker', jokerType: 'big' });
    deck.push({ rank: '小', suit: '🃏', suitName: 'joker', jokerType: 'small' });
    return deck;
}

// 内置的、小说创作增强版的非对称关系词典 (核心升级)
const BIDIRECTIONAL_RELATION_PAIRS = {
    // 血缘与家庭
    '父亲': '儿子', '儿子': '父亲',
    '母亲': '儿子', '儿子': '母亲',
    '父亲': '女儿', '女儿': '父亲',
    '母亲': '女儿', '女儿': '母亲',
    '丈夫': '妻子', '妻子': '丈夫',
    '未婚夫': '未婚妻', '未婚妻': '未婚夫',
    '哥哥': '弟弟', '弟弟': '哥哥',
    '哥哥': '妹妹', '妹妹': '哥哥',
    '姐姐': '弟弟', '弟弟': '姐姐',
    '姐姐': '妹妹', '妹妹': '姐姐',
    '祖父': '孙子', '孙子': '祖父',
    '祖父': '孙女', '孙女': '祖父',
    '祖母': '孙子', '孙子': '祖母',
    '祖母': '孙女', '孙女': '祖母',
    '外祖父': '外孙', '外孙': '外祖父',
    '外祖父': '外孙女', '外孙女': '外祖父',
    '外祖母': '外孙', '外孙': '外祖母',
    '外祖母': '外孙女', '外孙女': '外祖母',
    '公公': '儿媳', '儿媳': '公公',
    '婆婆': '儿媳', '儿媳': '婆婆',
    '岳父': '女婿', '女婿': '岳父',
    '岳母': '女婿', '女婿': '岳母',
    '义父': '义子', '义子': '义父',
    '义父': '义女', '义女': '义父',
    '义母': '义子', '义子': '义母',
    '义母': '义女', '义女': '义母',
    '监护人': '被监护人', '被监护人': '监护人',

    // 社会与权力
    '师父': '徒弟', '徒弟': '师父',
    '老师': '学生', '学生': '老师',
    '前辈': '后辈', '后辈': '前辈',
    '引路人': '追随者', '追随者': '引路人',
    '导师': '追随者', '追随者': '导师',
    '君主': '臣子', '臣子': '君主',
    '领主': '封臣', '封臣': '领主',
    '主人': '仆人', '仆人': '主人',
    '主人': '奴隶', '奴隶': '主人',
    '上司': '下属', '下属': '上司',
    '守护者': '被守护者', '被守护者': '守护者',

    // 情感与敌对
    '追求者': '追求对象', '追求对象': '追求者',
    '暗恋者': '暗恋对象', '暗恋对象': '暗恋者',
    '背叛者': '被背叛者', '被背叛者': '背叛者',
    '加害者': '受害者', '受害者': '加害者',

    // 功能与交易
    '医生': '病人', '病人': '医生',
    '律师': '委托人', '委托人': '律师',
    '保镖': '雇主', '雇主': '保镖',
    '债主': '债务人', '债务人': '债主',
    '线人': '联络员', '联络员': '线人',

    // 超自然
    '神祇': '信徒', '信徒': '神祇',
    '创造者': '造物', '造物': '创造者',
    '召唤者': '使魔', '使魔': '召唤者',
    '宿主': '共生体', '共生体': '宿主'
};


function renderCharGeneratorPanel() {
    // This function might be used later if we add a dedicated "character generator" tab.
    // For now, its logic is integrated into the vector panel.
}

function initializeCharacterModal() {
    const modalContainer = document.getElementById('character-editor-modal');
    if (modalContainer) {
        modalContainer.innerHTML = `
        <div class="modal-content extra-large">
<div class="modal-header">
    <h2 id="modal-editor-title">编辑人物信息</h2>
    <select id="more-ai-actions" class="settings-btn" title="更多AI自动化功能" style="margin-left: auto; margin-right: 15px; width: 180px;">
        <option value="">... 更多AI选项</option>
        <option value="fill_current_stage">AI填充当前阶段 (✨)</option>
        <option value="plan_timeline">AI规划完整时间线</option>
        <option value="write_timeline">(实验性)AI代写完整人生</option>
    </select>
    <button class="close-btn">&times;</button>
</div>
            <div class="modal-body">
                <input type="hidden" id="modal-char-id">
                <input type="hidden" id="modal-char-timeline-index" value="0">

                <div id="timeline-nav-wrapper">
                    <button id="timeline-scroll-left" class="timeline-scroll-btn"><</button>
                    <div id="timeline-nav-bar"></div>
                    <button id="timeline-scroll-right" class="timeline-scroll-btn">></button>
                </div>
                
                <div class="modal-char-grid">
                    <div class="modal-char-column">
                        <h4>核心基础</h4>
                        <div class="form-group"><label for="modal-char-name">姓名 (当前阶段)</label><input type="text" id="modal-char-name"></div>
                        <div class="form-group"><label for="modal-char-gender">性别</label><input type="text" id="modal-char-gender"></div>
                        <div class="form-group"><label for="modal-char-age">年龄</label><input type="text" id="modal-char-age"></div>
                        <div class="form-group"><label for="modal-char-bloodtype">血型</label><input type="text" id="modal-char-bloodtype"></div>
                        <div class="form-group"><label for="modal-char-race">种族/物种</label><input type="text" id="modal-char-race"></div>
                        <div class="form-group"><label for="modal-char-occupation">职业/身份</label><input type="text" id="modal-char-occupation"></div>
                        <div class="form-group"><label for="modal-char-role">角色定位 (核心)</label><select id="modal-char-role"></select></div>
                        <div class="form-group"><label for="modal-char-background">出身/阶级</label><input type="text" id="modal-char-background"></div>
                    </div>
                    <div class="modal-char-column">
                        <h4>外貌与体征</h4>
                        <div class="form-group"><label for="modal-char-height">身高/体格</label><input type="text" id="modal-char-height"></div>
                        <div class="form-group"><label for="modal-char-eyecolor">发色/瞳色</label><input type="text" id="modal-char-eyecolor"></div>
                        <div class="form-group"><label for="modal-char-skincolor">肤色/毛色</label><input type="text" id="modal-char-skincolor"></div>
                        <div class="form-group"><label for="modal-char-appearance">五官与外貌详述</label><textarea id="modal-char-appearance" rows="3"></textarea></div>
                        <div class="form-group"><label for="modal-char-attire">标志性服饰</label><textarea id="modal-char-attire" rows="3"></textarea></div>
                    </div>
                    <div class="modal-char-column">
                        <h4>内在与心理</h4>
                        <div class="form-group"><label for="modal-char-personality">性格</label><textarea id="modal-char-personality" rows="4"></textarea></div>
                        <div class="form-group"><label for="modal-char-motivation">人生目标/驱动力</label><textarea id="modal-char-motivation" rows="3"></textarea></div>
                        <div class="form-group"><label for="modal-char-fear">最大的恐惧/弱点</label><textarea id="modal-char-fear" rows="3"></textarea></div>
                        <div class="form-group"><label for="modal-char-flaw">原始缺陷</label><textarea id="modal-char-flaw" rows="3"></textarea></div>
                        <div class="form-group"><label for="modal-char-conflict">核心冲突</label><textarea id="modal-char-conflict" rows="3"></textarea></div>
                    </div>
                </div>
                
                <div class="form-group" style="margin-top: 15px;">
                    <label for="modal-char-physicalState">当前阶段的身体状态与特征</label>
                    <textarea id="modal-char-physicalState" rows="3" placeholder="描述角色在此时间点的身体状况、特殊能力或伤痕等..."></textarea>
                </div>
                
                <div class="form-group" style="margin-top: 20px;">
                    <label for="modal-char-keyEvent">本阶段关键事件 (选填)</label>
                    <textarea id="modal-char-keyEvent" rows="2" placeholder="记录导致角色在此阶段发生变化的关键事件，如“遭遇背叛”、“习得神功”..."></textarea>
                </div>

                <div style="margin-top: 25px; border-top: 1px solid var(--border-color); padding-top: 20px;">
                    <h4><i class="fas fa-users"></i> 人物关系网络 (当前阶段)</h4>
                    <div id="modal-char-relationships-display" style="margin-bottom: 15px; display: flex; flex-wrap: wrap; gap: 10px;"><p style="color: var(--text-muted);">暂无已建立的人物关系。</p></div>
                    <div class="form-group" style="display: flex; gap: 10px; align-items: flex-end;">
                        <div style="flex: 2;"><label for="relationship-target-char">选择关系对象</label><select id="relationship-target-char"></select></div>
                        <div style="flex: 1;"><label for="relationship-group">关系大类</label><input type="text" id="relationship-group" placeholder="例如：师徒关系"></div>
                        <div style="flex: 1;"><label for="relationship-role">TA是我的 (对方的角色)</label><input type="text" id="relationship-role" placeholder="例如：师父"></div>
                        <button id="add-relationship-btn" class="settings-btn" style="flex-shrink: 0;"><i class="fas fa-plus"></i> 添加关系</button>
                    </div>
                </div>
            </div>
            <div class="modal-footer"><button id="save-char-from-modal-btn" class="action-btn">保存人物</button></div>
        </div>`;
        const roleSelect = modalContainer.querySelector('#modal-char-role');
        const roles = ["主角", "反派", "盟友", "导师", "恋人", "陪衬角色", "门槛守卫", "信使", "变形者", "普通人代表", "其他"];
        roleSelect.innerHTML = roles.map(r => `<option value="${r}">${r}</option>`).join('');
    }
}

function initializeCharacterDeckSystem() {
    document.getElementById('generate-cast-btn')?.addEventListener('click', handleGenerateCharacterCast);
    document.getElementById('create-new-char-btn')?.addEventListener('click', () => openCharacterModal());
    document.getElementById('add-selected-to-blueprint-btn')?.addEventListener('click', handleAddSelectedToBlueprint);
    document.getElementById('clear-deck-btn')?.addEventListener('click', handleClearDeck);
    document.getElementById('char-auto-continue-btn')?.addEventListener('click', () => {
        creationState.autoFlowState.isRunning = true;
        handleAddSelectedToBlueprint();
    });
    const modal = document.getElementById('character-editor-modal');
    if (modal) {
        const closeBtn = modal.querySelector('.close-btn');
        if(closeBtn) closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
        
        const saveBtn = document.getElementById('save-char-from-modal-btn');
        if(saveBtn) saveBtn.addEventListener('click', handleSaveCharacterFromModal);

        const addRelBtn = document.getElementById('add-relationship-btn');
        if(addRelBtn) addRelBtn.addEventListener('click', handleAddRelationship);
        
        const aiActions = document.getElementById('more-ai-actions');
        if(aiActions) aiActions.addEventListener('change', (e) => {
            const action = e.target.value;
            if (!action) return;
            const charId = document.getElementById('modal-char-id').value;
            const timelineIndex = parseInt(document.getElementById('modal-char-timeline-index').value, 10);
            
            if(action === 'fill_current_stage') handleAiFillStage(charId, timelineIndex);
            if(action === 'plan_timeline') handleAiPlanTimeline(charId);
            if(action === 'write_timeline') handleAiWriteFullTimeline(charId);
            
            e.target.value = "";
        });

        const scrollLeftBtn = document.getElementById('timeline-scroll-left');
        if(scrollLeftBtn) scrollLeftBtn.addEventListener('click', () => scrollTimeline(-200));

        const scrollRightBtn = document.getElementById('timeline-scroll-right');
        if(scrollRightBtn) scrollRightBtn.addEventListener('click', () => scrollTimeline(200));
    }
    loadCharacterDeckFromStorage();
    renderCharacterDeck();
    initializeDragAndDrop();
}

function updateCharacterPanelSource() {
    const sourceDisplay = document.getElementById('char-gen-source-display');
    const genBtn = document.getElementById('generate-cast-btn');
    if (!sourceDisplay || !genBtn) return;
    const arc = creationState.worldview?.character_arc_expanded;
    if (arc) {
        sourceDisplay.innerHTML = `<p><strong>当前依据的人物弧光:</strong></p><p style="background: var(--bg-color); padding: 10px; border-radius: 5px; max-height: 100px; overflow-y: auto;">${arc}</p>`;
        genBtn.disabled = false;
    } else {
        sourceDisplay.innerHTML = `<p style="color: var(--text-muted);">请先在“世界观设定”模块中，生成并【确认】您的“人物弧光”。</p>`;
        genBtn.disabled = true;
    }
}

async function handleGenerateCharacterCast() {
    const arc = creationState.worldview?.character_arc_expanded;
    if (!arc) {
        showNotification("错误：缺少核心“人物弧光”作为生成依据。", "error");
        return;
    }
    showNotification("AI正在通读人物弧光，为您设计专业角色阵容...", "info");
    const genBtn = document.getElementById('generate-cast-btn');
    genBtn.disabled = true;
    genBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 正在生成角色...';
    
    const ROLE_OPTIONS = ["主角", "反派", "盟友", "导师", "恋人", "陪衬角色", "门槛守卫", "信使", "变形者", "普通人代表"];
    
const prompt = `你是一位顶级的、注重逻辑严谨性的世界观架构师和剧本分析师。你的任务是仔细阅读并分析用户提供的“人物弧光”文本，识别出其中出现的、或对故事发展至关重要的**所有**角色，然后为**每一个**被识别出的角色生成详细的角色卡，并严格按照JSON格式输出。
### 人物弧光 (核心依据):
${arc}
### 【最高优先级铁律】:
1.  **完整性优先**: 你必须分析出故事中**所有**被提及或暗示的关键人物。不要人为限制数量，如果故事里有8个重要人物，就应该生成8个角色对象。
2.  **定位必须选**: 所有角色的"role"字段值，**必须**从以下列表中选择: [${ROLE_OPTIONS.join(", ")}]。
3.  **命名铁律**: 所有角色的姓名("name"字段)，**必须**是符合中文语境的、通俗易懂的**两字或三字姓名**。
### 【终极内容铁律】:
1.  **内容完整性**: **必须为JSON中的每一个字段都生成详细、具体、有深度的中文内容**。**绝对不允许**任何字段为空值或使用英文占位符。
2.  **语言纯净性**: 你的所有输出，都必须完全使用纯粹的简体中文。**绝对禁止出现任何英文字母或单词。**
### JSON输出格式要求:
严格以JSON格式返回一个只包含 "characters" 键的根对象，其值为一个角色对象的数组。
每个角色对象都**必须包含**以下结构：
- "name": "角色的主要姓名"
- "timeline": [
    {
      "stageName": "初始设定",
      "name": "当前阶段的姓名/称号", "gender": "性别", "age": "年龄", "bloodtype": "血型", "race": "种族", "occupation": "职业", "background": "出身", "role": "角色定位",
      "height": "身高/体格", "eyecolor": "发色/瞳色", "skincolor": "肤色/毛色", "appearance": "外貌详述", "attire": "标志性服饰",
      "personality": "性格", "motivation": "驱动力", "fear": "恐惧/弱点", "flaw": "原始缺陷", "conflict": "核心冲突",
      "physicalState": "描述角色此阶段的身体状况、能力或伤痕",
      "keyEvent": "描述此阶段的起因或关键事件"
    }
  ]
**请直接输出JSON代码块。**`;

    try {
        const response = await callApi(prompt, true);
        const result = parseAiJson(response); 
        if (!result.characters || !Array.isArray(result.characters) || result.characters.length === 0) {
            throw new Error("AI未能生成有效的角色阵容数组。");
        }
        
        let newCharacters = [];
        result.characters.forEach(charData => {
            const newChar = {
                id: `char_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                name: charData.name,
                timeline: charData.timeline
            };
            newCharacters.push(newChar);
        });

        await generateAndApplyRelationships(newCharacters);

        newCharacters.forEach(char => {
            if (automationMode === 'full-auto' || creationState.autoFlowState.isRunning) {
                selectedCharacterIds.push(char.id);
            }
            characterDeck.push(char);
        });
        
        saveCharacterDeckToStorage();
        renderCharacterDeck();
        showNotification(`成功生成 ${newCharacters.length} 名角色并已自动构建关系网！`, "success");
        
        if(automationMode === 'full-auto' || creationState.autoFlowState.isRunning){
            handleAddSelectedToBlueprint();
        }

    } catch (error) {
        showNotification(`角色阵容生成失败: ${error.message}`, "error");
    } finally {
        genBtn.disabled = false;
        genBtn.innerHTML = '<i class="fas fa-users-cog"></i> AI根据弧光生成专业角色阵容';
    }
}

async function generateAndApplyRelationships(characters) {
    showNotification("AI总编剧正在分析人物关系...", "info");
    const genBtn = document.getElementById('generate-cast-btn');
    genBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 正在构建关系...';

    const characterProfiles = characters.map(c => {
        const initialStage = c.timeline[0] || {};
        return {
            id: c.id,
            name: c.name,
            role: initialStage.role || '未知',
            personality: initialStage.personality || '未知',
            background: initialStage.background || '未知',
            keyEvent: initialStage.keyEvent || '未知'
        };
    });

    // 【“万能公式”指令】
    // 这个指令的核心是教会AI一个通用的“关系优先级”判断原则，并用一个例子来阐述，而不是限制它。
    const prompt = `你是一位顶级的、拥有深厚文化底蕴和超强逻辑分析能力的总编剧。请根据下面提供的、包含背景故事的角色列表，为他们之间建立一个**最核心、最本质**的人物关系网络。

### 核心角色列表 (包含背景和关键事件):
${JSON.stringify(characterProfiles, null, 2)}

### 【任务核心原则 (万能公式)】:
你的首要任务是找出角色之间**最根本、最无法被替代**的关系，而不是那些表面或临时的关系。你必须理解故事的内在逻辑和文化背景，做出最专业的判断。
1.  **本质优先于表象**: 一个伪装成“狱友”的卧底警察，其与联络员的“上下级关系”才是本质；一个一路保护主人的保镖，如果他们是父子，那么“亲子关系”才是本质。
2.  **设定优先于行为**: 在一个有师徒设定的故事里，“师徒关系”是根本大法，优先于他们在旅途中的“盟友关系”。
3.  **你的任务是应用这个原则去分析用户提供的任何故事，而不是模仿某个特定的例子。**

### 【格式与双向绑定铁律】:
- 你的回答**必须且只能**是一个JSON对象。
- 对象的键是角色的ID，值是这个角色的关系数组。
- 关系必须是**精确且双向**的。如果A是B的“师父”，那么B必须是A的“徒弟”。
- 关系数组中的每个对象都必须包含四个字段: "characterId", "group", "role", "description"。

### 【教学案例】:
为了让你更好地理解“核心原则”，这里有一个《西游记》的案例。**注意：这只是一个教学案例，你不应该在其他故事中强行使用“师徒关系”，除非故事背景真的如此。**
{
  "char_sanzang_id": [ 
    { "characterId": "char_wukong_id", "group": "师徒关系", "role": "徒弟", "description": "从五指山下救出的顽徒，是取经的关键。" } 
  ],
  "char_wukong_id": [ 
    { "characterId": "char_sanzang_id", "group": "师徒关系", "role": "师父", "description": "将自己救出苦海，却又用紧箍咒束缚自己的师父。" }
  ]
}

**现在，请根据上述的【任务核心原则】，为你收到的角色列表建立关系网络。请直接输出JSON代码块。**`;

    try {
        const response = await callApi(prompt, true);
        const relationsMap = parseAiJson(response);
        
        characters.forEach(char => {
            if (relationsMap[char.id]) {
                 if (!char.timeline[0].relationships) {
                    char.timeline[0].relationships = [];
                }
                char.timeline[0].relationships = relationsMap[char.id];
            }
        });

    } catch (error) {
        showNotification("自动构建人物关系失败，请手动添加。", "error");
    }
}

function renderCharacterDeck() {
    const grid = document.getElementById('character-deck-grid');
    if (!grid) return;
    grid.innerHTML = '';
    if (!Array.isArray(characterDeck) || characterDeck.length === 0) {
        grid.innerHTML = `<p style="color: var(--text-muted); text-align: center; grid-column: 1 / -1;">卡组中还没有人物。</p>`;
        return;
    }
    const POKER_DECK_MAP = getPokerDeckMap();
    characterDeck.forEach((char, index) => {
        if (!char || typeof char !== 'object' || !char.id) return; 
        const cardInfo = POKER_DECK_MAP[index % POKER_DECK_MAP.length];
        const isSelected = selectedCharacterIds.includes(char.id);
        const cardEl = document.createElement('div');
        cardEl.className = 'char-profile-card';
        cardEl.dataset.id = char.id;
        if (isSelected) cardEl.classList.add('selected');
        
        const initialStage = char.timeline && char.timeline[0] ? char.timeline[0] : {};
        const displayTrait = initialStage.role || initialStage.occupation || '身份待补充';

        cardEl.innerHTML = `
            <div class="char-card-header"><h5>${cardInfo.rank}</h5><span>${cardInfo.suit}</span></div>
             <div class="char-card-body"><p><strong>${char.name || '未命名'}</strong></p><p>${displayTrait}</p></div>
            <div class="char-card-footer"><h5>${cardInfo.rank}</h5><span>${cardInfo.suit}</span></div>
            <input type="checkbox" class="char-select-checkbox" ${isSelected ? 'checked' : ''} title="勾选以加入蓝图">
            <button class="delete-char-btn" title="删除人物">&times;</button>
        `;

        cardEl.addEventListener('click', (e) => {
            if (e.target.type !== 'checkbox' && !e.target.classList.contains('delete-char-btn')) {
                openCharacterModal(char.id);
            }
        });
        const deleteBtn = cardEl.querySelector('.delete-char-btn');
        deleteBtn.addEventListener('click', (e) => { e.stopPropagation(); handleDeleteCharacter(char.id); });
        const checkbox = cardEl.querySelector('.char-select-checkbox');
        checkbox.addEventListener('click', (e) => { e.stopPropagation(); handleCharacterSelection(char.id, e.currentTarget.checked); });
        
        grid.appendChild(cardEl);
    });
}

function openCharacterModal(charId = null, timelineIndex = 0) {
    const modal = document.getElementById('character-editor-modal');
    const title = document.getElementById('modal-editor-title');
    
    let char;
    const isNewChar = !charId;

    if (isNewChar) {
        title.textContent = "创建新人物";
        const newCharId = `char_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        char = {
            id: newCharId, name: "新人物", timeline: [{ stageName: '初始设定', name: '新人物', role: '主角', keyEvent: '故事的开端', relationships: [] }]
        };
        document.getElementById('modal-char-id').value = newCharId;
    } else {
        char = characterDeck.find(c => c && c.id === charId);
        if (!char) { showNotification("编辑失败：找不到该人物卡。", "error"); return; }
        document.getElementById('modal-char-id').value = char.id;
        title.textContent = `编辑人物: ${char.name}`;
    }

    if (!char.timeline || char.timeline.length === 0) {
        const oldData = { ...char };
        delete oldData.id; delete oldData.name; delete oldData.timeline;
        char.timeline = [{ stageName: '初始设定', keyEvent: '故事的开端', relationships: [], ...oldData }];
    }
    
    char.timeline.forEach(stage => {
        if (!stage.relationships) stage.relationships = [];
    });

    document.getElementById('modal-char-timeline-index').value = timelineIndex;

    renderTimelineNav(char, timelineIndex);
    populateCharacterForm(char.timeline[timelineIndex]);
    renderRelationships(char, timelineIndex);
    
    modal.classList.remove('hidden');
}


function renderTimelineNav(character, activeIndex) {
    const navBar = document.getElementById('timeline-nav-bar');
    navBar.innerHTML = '';
    
    character.timeline.forEach((stage, index) => {
        const stageWrapper = document.createElement('div');
        stageWrapper.className = 'timeline-stage-group';

        const btn = document.createElement('button');
        const btnText = stage.stageName || `阶段 ${index + 1}`;
        btn.className = `settings-btn timeline-stage-btn ${index === activeIndex ? 'active' : ''}`;
        btn.textContent = btnText;
        btn.dataset.index = index;
        btn.title = `点击切换到“${btnText}”阶段`;
        btn.addEventListener('click', (e) => {
            const newIndex = parseInt(e.currentTarget.dataset.index, 10);
            saveCurrentStageTemporary();
            openCharacterModal(character.id, newIndex);
        });
        stageWrapper.appendChild(btn);

        if (index > 0) {
            const fillBtn = document.createElement('button');
            fillBtn.innerHTML = '✨';
            fillBtn.className = 'timeline-action-btn';
            fillBtn.title = 'AI辅助填充此阶段';
            fillBtn.addEventListener('click', () => handleAiFillStage(character.id, index));
            stageWrapper.appendChild(fillBtn);

            const deleteBtn = document.createElement('button');
            deleteBtn.innerHTML = '&times;';
            deleteBtn.className = 'timeline-action-btn delete-btn';
            deleteBtn.title = '删除此阶段';
            deleteBtn.addEventListener('click', () => handleDeleteStage(character.id, index));
            stageWrapper.appendChild(deleteBtn);
        }
        navBar.appendChild(stageWrapper);
    });

    const addBtn = document.createElement('button');
    addBtn.className = 'action-btn';
    addBtn.innerHTML = '<i class="fas fa-plus"></i> 新增阶段';
    addBtn.style.marginLeft = '10px';
    addBtn.addEventListener('click', handleAddTimelineStage);
    navBar.appendChild(addBtn);

    updateTimelineScrollButtons();
}

function populateCharacterForm(stageData = {}) {
    const fields = ['name', 'gender', 'age', 'bloodtype', 'race', 'occupation', 'role', 'background', 'height', 'eyecolor', 'skincolor', 'appearance', 'attire', 'personality', 'motivation', 'fear', 'flaw', 'conflict', 'physicalState', 'keyEvent'];
    fields.forEach(f => {
        const el = document.getElementById(`modal-char-${f}`);
        if(el) {
            el.value = stageData[f] || '';
        }
    });
}

function renderRelationships(character, timelineIndex) {
    const display = document.getElementById('modal-char-relationships-display');
    const select = document.getElementById('relationship-target-char');
    display.innerHTML = '';
    select.innerHTML = '<option value="">-- 选择一个角色 --</option>';

    const currentStageRelationships = character.timeline[timelineIndex].relationships || [];

    if (currentStageRelationships.length === 0) {
        display.innerHTML = '<p style="color: var(--text-muted);">暂无已建立的人物关系。</p>';
    } else {
        currentStageRelationships.forEach(rel => {
            const targetChar = characterDeck.find(c => c && c.id === rel.characterId);
            if (targetChar) {
                const relEl = document.createElement('div');
                relEl.style.cssText = 'background: var(--bg-color); padding: 5px 10px; border-radius: 5px; border: 1px solid var(--border-color); display: flex; align-items: center; gap: 8px;';
                
                const targetStageIndex = Math.min(timelineIndex, targetChar.timeline.length - 1);
                const targetStageName = targetChar.timeline[targetStageIndex]?.name || targetChar.name;

                // 核心升级：显示为“大类.角色: 姓名”
                const displayText = `${rel.group || '未知关系'}.${rel.role || '未知角色'}`;

                relEl.innerHTML = `
                    <span>${displayText}:</span>
                    <button class="settings-btn" style="padding: 2px 8px;" data-char-id="${targetChar.id}" title="${rel.description || ''}">${targetStageName}</button>
                    <button class="delete-relationship-btn" data-target-id="${targetChar.id}" style="background: none; border: none; color: var(--text-muted); cursor: pointer;">&times;</button>
                `;
                relEl.querySelector('.settings-btn').addEventListener('click', (e) => {
                    const modal = document.getElementById('character-editor-modal');
                    modal.classList.add('hidden'); 
                    setTimeout(() => {
                        const targetCharId = e.currentTarget.dataset.charId;
                        const targetCharacter = characterDeck.find(c => c.id === targetCharId);
                        const targetTimelineIndex = Math.min(timelineIndex, targetCharacter.timeline.length - 1);
                        openCharacterModal(targetCharId, targetTimelineIndex);
                    }, 100);
                });
                relEl.querySelector('.delete-relationship-btn').addEventListener('click', (e) => handleDeleteRelationship(character.id, e.target.dataset.targetId));
                display.appendChild(relEl);
            }
        });
    }

    characterDeck.forEach(c => {
        if (c && c.id !== character.id) {
            const option = document.createElement('option');
            option.value = c.id;
            option.textContent = c.name;
            select.appendChild(option);
        }
    });
}

function saveCurrentStageTemporary() {
    const charId = document.getElementById('modal-char-id').value;
    const timelineIndex = parseInt(document.getElementById('modal-char-timeline-index').value, 10);
    
    let char = characterDeck.find(c => c && c.id === charId);
    let isTempNewChar = !char;

    if (isTempNewChar) {
        char = {id: charId, timeline:[], name: "新人物"};
    }

    if (!char.timeline) char.timeline = [];
    const stageData = getFormData();
    
    const currentRelationships = char.timeline[timelineIndex]?.relationships || [];
    stageData.relationships = currentRelationships;

    if (char.timeline[timelineIndex]) {
       char.timeline[timelineIndex] = stageData;
    } else {
       char.timeline.push(stageData);
    }
    return char;
}

function getFormData() {
    const data = {};
    const fields = ['name', 'gender', 'age', 'bloodtype', 'race', 'occupation', 'role', 'background', 'height', 'eyecolor', 'skincolor', 'appearance', 'attire', 'personality', 'motivation', 'fear', 'flaw', 'conflict', 'physicalState', 'keyEvent'];
    const timelineIndex = document.getElementById('modal-char-timeline-index').value;
    const stageNameBtn = document.querySelector(`#timeline-nav-bar .timeline-stage-btn[data-index="${timelineIndex}"]`);
    data['stageName'] = stageNameBtn ? stageNameBtn.textContent : "新阶段";
    fields.forEach(f => {
        const el = document.getElementById(`modal-char-${f}`);
        if (el) data[f] = el.value;
    });
    return data;
}

function handleAddTimelineStage() {
    const charId = document.getElementById('modal-char-id').value;
    let char = characterDeck.find(c => c.id === charId);
    const isNewChar = !char;

    if (isNewChar) {
        char = saveCurrentStageTemporary();
    } else {
        saveCurrentStageTemporary();
    }
    
    const newStageName = prompt("请输入新时间点/阶段的名称:", `阶段 ${char.timeline.length + 1}`);
    if (!newStageName || !newStageName.trim()) return;

    const currentIndex = char.timeline.length - 1;
    const newStageData = JSON.parse(JSON.stringify(char.timeline[currentIndex]));
    newStageData.stageName = newStageName.trim();
    newStageData.keyEvent = "";
    
    char.timeline.push(newStageData);
    
    if (isNewChar) {
        characterDeck.push(char);
    }

    openCharacterModal(charId, char.timeline.length - 1);
    
    if (isNewChar) {
        characterDeck.pop();
    }

    showNotification(`已添加新阶段: ${newStageName}`, "success");
}

function handleDeleteStage(charId, indexToDelete) {
    let char = characterDeck.find(c => c.id === charId);
    if (!char) {
        const modal = document.getElementById('character-editor-modal');
        const tempId = modal.querySelector('#modal-char-id').value;
        if(tempId === charId) {
             showNotification("无法删除新人物的初始阶段。", "warning");
             return;
        }
    }

    const stageName = char.timeline[indexToDelete].stageName || `阶段 ${indexToDelete + 1}`;
    if (confirm(`您确定要永久删除 “${stageName}” 这个阶段吗？`)) {
        char.timeline.splice(indexToDelete, 1);
        const newIndex = Math.max(0, indexToDelete - 1);
        openCharacterModal(charId, newIndex);
        showNotification(`阶段 “${stageName}” 已删除。`, "success");
    }
}

async function handleAiFillStage(charId, indexToFill) {
     let char = characterDeck.find(c => c.id === charId);
    if (!char || indexToFill === 0) return;

    const characterArc = creationState.worldview?.character_arc_expanded;
    if (!characterArc) {
        showNotification("错误：缺少核心“人物弧光”作为生成依据。", "error");
        return;
    }

    const previousStage = char.timeline[indexToFill - 1];
    const currentStage = char.timeline[indexToFill];

    showNotification(`AI正在分析并填充 “${currentStage.stageName}” 阶段...`, "info");

    const prompt = `你是一位顶级的角色设计师。请根据角色的【总体人物弧光】和【上一个人生阶段】的状态，推断并填充【当前阶段】的所有详细信息。

### 总体人物弧光 (角色的命运总纲):
${characterArc}

### 上一个人生阶段 (${previousStage.stageName}):
${JSON.stringify(previousStage, null, 2)}

### 当前阶段名称 (你需要填充的目标):
"${currentStage.stageName}"

### 你的任务:
生成一个JSON对象，包含【当前阶段】所有属性的详细、具体、符合逻辑的中文描述。你的输出必须是一个完整的角色阶段对象。

**请直接输出JSON代码块，不要有任何其他文字。**`;

    try {
        const response = await callApi(prompt, true);
        const newStageData = parseAiJson(response);
        
        newStageData.stageName = currentStage.stageName;
        newStageData.relationships = currentStage.relationships;
        char.timeline[indexToFill] = newStageData;
        
        populateCharacterForm(newStageData);
        showNotification(`阶段 “${currentStage.stageName}” 已由AI填充！`, "success");

    } catch (error) {
        showNotification(`AI填充阶段失败: ${error.message}`, "error");
    }
}

async function handleAiPlanTimeline(charId) {
     let char = characterDeck.find(c => c.id === charId);
    if (!char) return;
    const characterArc = creationState.worldview?.character_arc_expanded;
    if (!characterArc) {
        showNotification("错误：缺少核心“人物弧光”作为生成依据。", "error");
        return;
    }
    if (!confirm("AI将自动规划后续人生阶段，这会覆盖您已创建的后续阶段，确定吗？")) return;

    showNotification("AI正在为您规划完整的时间线...", "info");
    const prompt = `你是一位顶级的叙事规划师。请根据角色的【总体人物弧光】和【初始设定】，为其规划出接下来所有关键的人生阶段名称。
### 总体人物弧光:
${characterArc}
### 初始设定:
${JSON.stringify(char.timeline[0], null, 2)}
### 你的任务:
返回一个JSON对象，其中包含一个名为 "stages" 的数组，数组中包含3到5个字符串，每个字符串都是一个言简意赅的阶段名称。
### 格式范例:
{"stages": ["少年觉醒期", "遭遇背叛", "黑化复仇期", "最终救赎"]}
**请直接输出JSON代码块。**`;

    try {
        const response = await callApi(prompt, true);
        const result = parseAiJson(response);
        if (result.stages && Array.isArray(result.stages)) {
            char.timeline = [char.timeline[0]];
            result.stages.forEach(stageName => {
                const newStage = JSON.parse(JSON.stringify(char.timeline[char.timeline.length - 1]));
                newStage.stageName = stageName;
                newStage.keyEvent = "";
                char.timeline.push(newStage);
            });
            openCharacterModal(charId, 1);
            showNotification("AI已成功规划完整时间线！", "success");
        } else {
            throw new Error("返回格式不正确。");
        }
    } catch(error) {
        showNotification(`AI规划时间线失败: ${error.message}`, "error");
    }
}

async function handleAiWriteFullTimeline(charId) {
    let char = characterDeck.find(c => c.id === charId);
    if (!char) return;
    const characterArc = creationState.worldview?.character_arc_expanded;
    if (!characterArc) {
        showNotification("错误：缺少核心“人物弧光”作为生成依据。", "error");
        return;
    }
    if (!confirm("【实验性功能】AI将尝试自动生成角色的完整人生故事，这会覆盖您已创建的所有后续阶段，并消耗大量Tokens。确定继续吗？")) return;
    
    showNotification("AI正在为您代写角色的完整人生...", "info");
    const prompt = `你是一位顶级的角色传记作家。请根据角色的【总体人物弧光】和【初始设定】，为其创作一个包含多个阶段的完整人生故事。
### 总体人物弧光:
${characterArc}
### 初始设定:
${JSON.stringify(char.timeline[0], null, 2)}
### 你的任务:
返回一个JSON对象，其中包含一个名为 "timeline" 的数组。该数组应包含3到5个完整的角色阶段对象。每个对象都必须包含所有字段。
### 格式要求:
严格遵循角色对象的完整JSON结构，直接输出一个包含 "timeline" 键的根对象。
**请直接输出JSON代码块。**`;

    try {
        const response = await callApi(prompt, true);
        const result = parseAiJson(response);
        if (result.timeline && Array.isArray(result.timeline) && result.timeline.length > 0) {
            char.timeline = [char.timeline[0], ...result.timeline];
            openCharacterModal(charId, 1);
            showNotification("AI已成功代写完整人生！", "success");
        } else {
             throw new Error("返回格式不正确。");
        }
    } catch(error) {
        showNotification(`AI代写人生失败: ${error.message}`, "error");
    }
}

function handleAddRelationship() {
    const charId = document.getElementById('modal-char-id').value;
    const timelineIndex = parseInt(document.getElementById('modal-char-timeline-index').value, 10);
    let char = characterDeck.find(c => c && c.id === charId);
    const isNewChar = !char;

    if (isNewChar) {
        char = saveCurrentStageTemporary();
    }

    const targetId = document.getElementById('relationship-target-char').value;
    const group = document.getElementById('relationship-group').value.trim();
    const theirRoleToMe = document.getElementById('relationship-role').value.trim(); // 直接获取对方的角色

    if (!targetId || !group || !theirRoleToMe) {
        showNotification("请选择关系对象，并填写关系大类和对方的角色。", "warning");
        return;
    }
    
    const currentRelationships = char.timeline[timelineIndex].relationships || [];
    if (currentRelationships.some(r => r.characterId === targetId)) {
        showNotification("与该角色的关系已存在。", "info");
        return;
    }

    // 逻辑修正：在我的卡片上，直接保存对方的角色
    currentRelationships.push({ 
        characterId: targetId, 
        group: group, 
        role: theirRoleToMe, // 直接使用输入框的值
        description: "" 
    });
    char.timeline[timelineIndex].relationships = currentRelationships;
    
    // 逻辑修正：在对方的卡片上，保存我的角色（查找反义词）
    const targetChar = characterDeck.find(c => c.id === targetId);
    if (targetChar) {
        const myRoleToThem = BIDIRECTIONAL_RELATION_PAIRS[theirRoleToMe] || theirRoleToMe; // 在这里计算反义词
        const targetStage = targetChar.timeline[Math.min(timelineIndex, targetChar.timeline.length - 1)];
        if (!targetStage.relationships) targetStage.relationships = [];
        
        if (!targetStage.relationships.some(r => r.characterId === charId)) {
            targetStage.relationships.push({ 
                characterId: charId, 
                group: group, 
                role: myRoleToThem, // 保存我的角色
                description: "" 
            });
        }
    }

    renderRelationships(char, timelineIndex);
    
    document.getElementById('relationship-group').value = '';
    document.getElementById('relationship-role').value = '';
    document.getElementById('relationship-target-char').value = '';
}

function handleDeleteRelationship(charId, targetCharId) {
    const timelineIndex = parseInt(document.getElementById('modal-char-timeline-index').value, 10);
    const char = characterDeck.find(c => c && c.id === charId);
    if (!char) return;
    
    const targetChar = characterDeck.find(c => c && c.id === targetCharId);
    if (confirm(`确定要删除与【${targetChar.name}】的关系吗？这也会删除对方卡片上的对应关系。`)) {
        // 从当前角色关系中删除
        let currentRels = char.timeline[timelineIndex].relationships || [];
        char.timeline[timelineIndex].relationships = currentRels.filter(r => r.characterId !== targetCharId);

        // 从目标角色关系中删除
        if (targetChar) {
            const targetStage = targetChar.timeline[Math.min(timelineIndex, targetChar.timeline.length - 1)];
            if (targetStage && targetStage.relationships) {
                targetStage.relationships = targetStage.relationships.filter(r => r.characterId !== charId);
            }
        }
        renderRelationships(char, timelineIndex);
    }
}

function handleSaveCharacterFromModal() {
    const charId = document.getElementById('modal-char-id').value;
    let char = characterDeck.find(c => c && c.id === charId);
    const isNewChar = !char;

    let charData = saveCurrentStageTemporary();
    
    if (isNewChar) {
        char = charData;
        characterDeck.unshift(char);
    }
    
    char.name = char.timeline[0].name || "未命名";
    
    saveCharacterDeckToStorage();
    renderCharacterDeck();
    document.getElementById('character-editor-modal').classList.add('hidden');
    showNotification(`人物 "${char.name}" 已保存！`, 'success');
}

function handleDeleteCharacter(charId) {
    const charIndex = characterDeck.findIndex(c => c && c.id === charId);
    if (charIndex === -1) return;
    const charName = characterDeck[charIndex].name || '未命名';
    if (confirm(`您确定要永久删除人物 "${charName}" 吗？此操作无法撤销。`)) {
        characterDeck.splice(charIndex, 1);
        const selectedIndex = selectedCharacterIds.indexOf(charId);
        if (selectedIndex > -1) selectedCharacterIds.splice(selectedIndex, 1);
        
        // **重要**：同时清除所有其他角色对该角色的关系记录
        characterDeck.forEach(char => {
            char.timeline.forEach(stage => {
                if (stage.relationships) {
                    stage.relationships = stage.relationships.filter(rel => rel.characterId !== charId);
                }
            });
        });

        saveCharacterDeckToStorage();
        renderCharacterDeck();
        showNotification("人物已删除。", "info");
    }
}

function handleClearDeck() {
    if (characterDeck.length === 0) {
        showNotification("卡组已经是空的了。", "info");
        return;
    }
    if (confirm("您确定要永久删除所有人物吗？此操作无法撤销。")) {
        characterDeck = [];
        selectedCharacterIds = [];
        saveCharacterDeckToStorage();
        renderCharacterDeck();
        showNotification("所有人物卡已清空。", "success");
    }
}

function initializeDragAndDrop() {
    const grid = document.getElementById('character-deck-grid');
    if (grid && typeof Sortable !== 'undefined') {
        new Sortable(grid, {
            animation: 150,
            ghostClass: 'sortable-ghost',
            onEnd: (evt) => {
                const movedItem = characterDeck.splice(evt.oldIndex, 1)[0];
                characterDeck.splice(evt.newIndex, 0, movedItem);
                saveCharacterDeckToStorage();
            }
        });
    }
}

function saveCharacterDeckToStorage() {
    if (currentUser) {
        try {
            const validDeck = characterDeck.filter(c => c);
            localStorage.setItem(`${currentUser}_characterDeck_v1`, JSON.stringify(validDeck));
        } catch (error) {
            showNotification("保存角色卡组失败。", "error");
        }
    }
}

function loadCharacterDeckFromStorage() {
    if (currentUser) {
        const savedDeck = localStorage.getItem(`${currentUser}_characterDeck_v1`);
        characterDeck = savedDeck ? JSON.parse(savedDeck).filter(c => c) : [];
    } else {
        characterDeck = [];
    }
    selectedCharacterIds = [];
}

function handleCharacterSelection(charId, isChecked) {
    const card = document.querySelector(`.char-profile-card[data-id="${charId}"]`);
    if (!card) return;
    const index = selectedCharacterIds.indexOf(charId);
    if (isChecked && index === -1) {
        selectedCharacterIds.push(charId);
    } else if (!isChecked && index > -1) {
        selectedCharacterIds.splice(index, 1);
    }
    card.classList.toggle('selected', isChecked);
}

function handleAddSelectedToBlueprint() {
    if (selectedCharacterIds.length === 0) {
        if (automationMode === 'full-auto' || creationState.autoFlowState.isRunning) {
            showNotification("自动模式下未选中任何角色，将自动采纳全部角色。", "info");
            selectedCharacterIds = characterDeck.map(c => c.id);
            renderCharacterDeck();
        } else {
            showNotification("请先勾选至少一个人物，才能加入蓝图。", "info");
            return;
        }
    }
    const selectedChars = characterDeck.filter(char => char && selectedCharacterIds.includes(char.id));
    creationState.blueprintCharacters = selectedChars;
    
    if(automationMode === 'manual' && !creationState.autoFlowState.isRunning) {
        showNotification(`成功将 ${selectedChars.length} 个人物加入蓝图！即将跳转...`, "success");
         setTimeout(() => {
            switchTab('story-generator-panel');
        }, 800);
    }
   
    if (typeof updateBlueprintButtonState === 'function') {
        updateBlueprintButtonState();
    }

    if (automationMode === 'full-auto' || creationState.autoFlowState.isRunning) {
        proceedToNextStep('characters');
    }
}

function scrollTimeline(amount) {
    const navBar = document.getElementById('timeline-nav-bar');
    navBar.scrollBy({ left: amount, behavior: 'smooth' });
}

function updateTimelineScrollButtons() {
    const navBar = document.getElementById('timeline-nav-bar');
    const leftBtn = document.getElementById('timeline-scroll-left');
    const rightBtn = document.getElementById('timeline-scroll-right');
    
    const maxScrollLeft = navBar.scrollWidth - navBar.clientWidth;
    
    leftBtn.disabled = navBar.scrollLeft <= 0;
    rightBtn.disabled = navBar.scrollLeft >= maxScrollLeft - 1;
}