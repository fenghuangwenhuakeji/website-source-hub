/*
 * 文件路径: /js/engine/01_ai-director.js
 * 版本: V102 - 博士重构版 (历史记录仪)
 * 描述: AI总监模块的核心逻辑。WorldState已升级，增加了事件日志系统，为世界模拟器提供历史记录支持。
 */

// --- 升级：世界状态管理器 ---
// 这是我们为引擎创建的一个“全局大脑”，用于跟踪世界的核心数据和历史事件。
const WorldState = {
    // 默认初始状态
    data: {
        time: { era: '初始纪元', day: 1 },
        characterCount: 0,
        logicConflicts: 0,
        informationEntropy: '低',
        blueprintCharacters: [], // 蓝图中的角色
        eventLog: [] // 新增：用于记录历史事件的日志
    },

    // 更新世界状态的方法
    update(stateUpdate) {
        Object.assign(this.data, stateUpdate);
        this.render();
    },

    // 新增：记录一条历史事件
    logEvent(eventMessage) {
        const timestamp = `D${String(this.data.time.day).padStart(3, '0')}`;
        const logEntry = `[${timestamp}] ${eventMessage}`;
        this.data.eventLog.unshift(logEntry); // 将最新事件放在最前面
        
        // 保持日志最多只有100条，防止内存溢出
        if (this.data.eventLog.length > 100) {
            this.data.eventLog.pop();
        }

        // 通知关心日志更新的模块（比如世界模拟器UI）
        if (typeof WorldSimulator !== 'undefined' && WorldSimulator.renderLog) {
            WorldSimulator.renderLog();
        }
    },

    // 将数据渲染到“世界状态仪表盘”
    render() {
        const timeString = `${this.data.time.era} D${String(this.data.day).padStart(3, '0')}`;
        document.getElementById('status-time').textContent = timeString;
        document.getElementById('status-chars').textContent = this.data.characterCount;
        const conflictsElement = document.getElementById('status-conflicts');
        conflictsElement.textContent = this.data.logicConflicts;
        conflictsElement.className = this.data.logicConflicts > 0 ? 'error' : 'ok';
        const entropyElement = document.getElementById('status-entropy');
        entropyElement.textContent = this.data.informationEntropy;
        entropyElement.className = this.data.informationEntropy === '低' ? 'ok' : 'warning';
    },
    
    // 让时间前进一天
    tick() {
        this.data.time.day++;
        this.logEvent(`新的一天开始了。`);
        this.render();
    }
};


const AIDirector = (() => {
    let _chatWindow, _inputArea, _sendButton, _personalitySelector;

    function init() {
        _chatWindow = document.getElementById('director-chat-window');
        _inputArea = document.getElementById('director-input');
        _sendButton = document.getElementById('director-send-btn');
        _personalitySelector = document.getElementById('director-personality');

        _sendButton.addEventListener('click', _handleSendMessage);
        _inputArea.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                _handleSendMessage();
            }
        });

        WorldState.render();

        _addMessage('ai', '创世纪引擎 V102 已上线。我是您的AI总监，历史记录仪已激活。请下达您的指令。');
    }

    async function _handleSendMessage() {
        const message = _inputArea.value.trim();
        if (!message || _sendButton.disabled) return;
        
        _checkForConflicts(message);

        _addMessage('user', message);
        _inputArea.value = '';
        _sendButton.disabled = true;

        _addMessage('ai', '正在连接奇点，请稍候...', true);

        const personality = _personalitySelector.value;
        const aiResponse = await APIInterface.sendMessage(message, personality);

        const thinkingMessage = _chatWindow.querySelector('.thinking');
        if (thinkingMessage) {
            thinkingMessage.remove();
        }

        if (typeof aiResponse === 'string') {
            _addMessage('ai', aiResponse);
        } else if (aiResponse.error) {
            _addMessage('ai', `[错误] ${aiResponse.error}`);
        }
        
        _sendButton.disabled = false;
        _inputArea.focus();
    }

    function _addMessage(sender, text, isThinking = false) {
        const messageContainer = document.createElement('div');
        messageContainer.className = `chat-message-container ${sender}-message-container`;
        if (isThinking) {
            messageContainer.classList.add('thinking');
        }
        
        const messageElement = document.createElement('div');
        messageElement.classList.add('chat-message', `${sender}-message`);
        
        const icon = document.createElement('i');
        icon.className = `fa-solid ${sender === 'user' ? 'fa-user-astronaut' : 'fa-robot'}`;
        
        const textElement = document.createElement('p');
        textElement.innerHTML = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, '<br>');

        messageElement.appendChild(icon);
        messageElement.appendChild(textElement);
        messageContainer.appendChild(messageElement);

        _chatWindow.appendChild(messageContainer);
        _chatWindow.scrollTop = _chatWindow.scrollHeight;
    }
    
    function _checkForConflicts(userMessage) {
        const conflictKeywords = ['复活', '死而复生', '时间倒流', '起死回生'];
        const foundConflict = conflictKeywords.some(keyword => userMessage.includes(keyword));
        
        if (foundConflict) {
            WorldState.update({ logicConflicts: WorldState.data.logicConflicts + 1 });
            _addMessage('ai', '[系统警告] AI总监检测到潜在的逻辑冲突！已在仪表盘上标记。请谨慎处理相关设定。');
        }
    }
    
    return { init };
})();