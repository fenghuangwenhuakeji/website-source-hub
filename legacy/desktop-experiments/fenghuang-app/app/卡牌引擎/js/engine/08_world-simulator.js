/*
 * 文件路径: /js/engine/08_world-simulator.js
 * 版本: V107.0 - 博士构造版 (历史的推演)
 * 描述: 【世界模拟器】核心逻辑。负责驱动世界时间的流逝，处理角色与派系的宏观行为，并记录历史。
 */

const WorldSimulator = (() => {
    // --- 模块私有变量 ---
    let _logCanvas, _startBtn, _pauseBtn, _tickBtn, _speedSelect;
    let _simulationInterval = null; // 存放定时器的ID，用于暂停
    let _isPaused = true;

    // --- 模块初始化 ---
    function init() {
        console.log("引擎模块 [世界模拟器] 开始唤醒...");

        // 缓存DOM元素
        _logCanvas = document.getElementById('simulator-log-canvas');
        _startBtn = document.getElementById('simulator-start-btn');
        _pauseBtn = document.getElementById('simulator-pause-btn');
        _tickBtn = document.getElementById('simulator-tick-btn');
        _speedSelect = document.getElementById('simulator-speed-select');

        if (!_logCanvas) {
            console.error("[世界模拟器] 初始化失败: 未找到核心DOM元素。");
            return;
        }

        // 绑定事件
        _startBtn.addEventListener('click', _startSimulation);
        _pauseBtn.addEventListener('click', _pauseSimulation);
        _tickBtn.addEventListener('click', _manualTick);
        _speedSelect.addEventListener('change', _updateSpeed);

        _updateButtonStates(); // 初始化按钮状态
        console.log("引擎模块 [世界模拟器] 已成功唤醒，准备推演历史。");
    }

    // --- 核心功能 ---

    function _startSimulation() {
        if (!_isPaused) return; // 如果已经在运行，则不执行任何操作
        _isPaused = false;
        _updateButtonStates();
        WorldState.logEvent("世界模拟器已启动。");

        const speed = parseInt(_speedSelect.value);
        _simulationInterval = setInterval(_runSimulationTick, speed);
    }

    function _pauseSimulation() {
        if (_isPaused) return;
        _isPaused = true;
        clearInterval(_simulationInterval);
        _simulationInterval = null;
        _updateButtonStates();
        WorldState.logEvent("世界模拟器已暂停。");
    }

    // 手动步进一次
    function _manualTick() {
        if (!_isPaused) {
            showNotification('请先暂停模拟器再进行手动步进。', 'warning');
            return;
        }
        WorldState.logEvent("执行手动步进...");
        _runSimulationTick();
    }
    
    // 更新模拟速度
    function _updateSpeed() {
        if (!_isPaused) {
            // 如果正在运行，则先暂停，再以新速度重新开始
            _pauseSimulation();
            _startSimulation();
        }
    }

    // 模拟器的一个“心跳”
    function _runSimulationTick() {
        // 1. 时间流逝
        WorldState.tick();

        // 2. 获取所有卡牌数据
        const characters = CardManager.getAllCards().filter(c => c.type === 'character');
        const factions = CardManager.getAllCards().filter(c => c.type === 'faction');

        // 3. 执行简单的模拟逻辑 (未来可以无限扩展)
        
        // 示例逻辑1: 派系影响力变化
        factions.forEach(faction => {
            // 随机让派系影响力发生微小变化
            const change = Math.random() > 0.5 ? 1 : -1;
            // 假设每个派系都有一个叫 'influence' 的属性
            if (!faction.data.influence) faction.data.influence = 100;
            faction.data.influence += change;
            WorldState.logEvent(`派系 [${faction.data.name}] 的影响力发生了变化，当前为 ${faction.data.influence}。`);
        });

        // 示例逻辑2: 随机角色事件
        if (characters.length > 0 && Math.random() < 0.2) { // 20%的概率发生角色事件
            const randomChar = characters[Math.floor(Math.random() * characters.length)];
            const charName = randomChar.data.timeline[0].name;
            WorldState.logEvent(`角色 [${charName}] 遭遇了一次小小的冒险。`);
        }

        // 4. 未来可以在这里添加更复杂的逻辑，如：
        // - 派系间的冲突判定
        // - 角色根据其动机执行任务
        // - 资源变化
        // - 触发动态事件卡
    }
    
    // --- 渲染与UI更新 ---

    // 渲染事件日志
    function renderLog() {
        if (!_logCanvas) return;
        _logCanvas.innerHTML = WorldState.data.eventLog.map(entry => `<p>${entry}</p>`).join('');
    }

    // 更新按钮的可用状态
    function _updateButtonStates() {
        if (_isPaused) {
            _startBtn.disabled = false;
            _pauseBtn.disabled = true;
            _tickBtn.disabled = false;
        } else {
            _startBtn.disabled = true;
            _pauseBtn.disabled = false;
            _tickBtn.disabled = true;
        }
    }


    // --- 模块接口 ---
    return {
        init: init,
        renderLog: renderLog // 暴露给外部，让WorldState可以调用
    };
})();