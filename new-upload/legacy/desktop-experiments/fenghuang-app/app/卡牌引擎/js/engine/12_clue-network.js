/*
 * 文件路径: /js/engine/12_clue-network.js
 * 版本: V111.0 - 博士构造版 (因果的编织者)
 * 描述: 【伏笔网络】核心逻辑。一个强大的因果关系可视化工具，用于编织和监控故事的深层逻辑。
 */

const ClueNetwork = (() => {
    // --- 模块私有变量 ---
    let _canvas, _sidebar, _entropyMeter, _entropyValueEl;
    let _clueCards = [], _plotCards = [];
    let _nodes = [], _edges = []; // 用于可视化

    // --- 模块初始化 ---
    function init() {
        console.log("引擎模块 [伏笔网络] 开始唤醒...");
        _canvas = document.getElementById('clue-canvas');
        _sidebar = document.getElementById('clue-sidebar');
        _entropyMeter = document.getElementById('entropy-meter-bar');
        _entropyValueEl = document.getElementById('entropy-value');

        if (!_canvas || !_sidebar) {
            console.error("[伏笔网络] 初始化失败: 未找到核心DOM元素。");
            return;
        }

        console.log("引擎模块 [伏笔网络] 已成功唤醒，准备编织因果之网。");
    }

    // --- 核心渲染函数 ---
    function render() {
        if (!_canvas) return;

        // 1. 加载数据
        _clueCards = CardManager.getAllCards().filter(c => c.type === 'clue');
        _plotCards = CardManager.getAllCards().filter(c => c.type === 'plot');

        // 2. 清空画布
        _canvas.innerHTML = '';

        // 3. 检查数据
        if (_clueCards.length === 0) {
            _canvas.innerHTML = '<p class="empty-message">伏笔网络为空。请在【拆解室】中生成您的第一张【线索卡】。</p>';
            _updateEntropy(0, 0); // 更新信息熵显示
            return;
        }

        // 4. 构建并渲染网络
        _buildNetwork();
        _renderNetwork();
        
        // 5. 更新信息熵
        const revealedCount = _clueCards.filter(c => c.data.isRevealed).length;
        _updateEntropy(revealedCount, _clueCards.length);
    }

    // --- 网络构建与渲染 ---

    function _buildNetwork() {
        _nodes = [];
        _edges = [];

        // 创建线索节点
        _clueCards.forEach(clue => {
            _nodes.push({
                id: clue.id,
                type: 'clue',
                label: clue.data.name,
                data: clue.data,
                revealed: clue.data.isRevealed || false
            });
        });

        // 创建场景节点，并建立连接
        _plotCards.forEach(plot => {
            if (plot.data.scenes && plot.data.scenes.length > 0) {
                plot.data.scenes.forEach(scene => {
                    const sceneId = `scene-${scene.id}`;
                    _nodes.push({
                        id: sceneId,
                        type: 'scene',
                        label: scene.name,
                        data: scene
                    });

                    // 检查此场景是否埋藏或揭示了任何线索
                    _clueCards.forEach(clue => {
                        if (clue.data.buriedInScene === scene.id) {
                            _edges.push({ from: sceneId, to: clue.id, type: 'bury' });
                        }
                        if (clue.data.revealedInScene === scene.id) {
                            _edges.push({ from: clue.id, to: sceneId, type: 'reveal' });
                        }
                    });
                });
            }
        });
    }

    function _renderNetwork() {
        // 简单的瀑布流布局
        const columns = {
            scene: [],
            clue: []
        };

        _nodes.forEach(node => {
            const nodeEl = _createNodeElement(node);
            _canvas.appendChild(nodeEl);
            columns[node.type].push(nodeEl);
        });
        
        // 粗略的布局逻辑
        let sceneTop = 50;
        columns.scene.forEach(el => {
            el.style.left = '20%';
            el.style.top = `${sceneTop}px`;
            sceneTop += 100;
        });

        let clueTop = 80;
        columns.clue.forEach(el => {
            el.style.left = '60%';
            el.style.top = `${clueTop}px`;
            clueTop += 120;
        });
        
        // TODO: 使用SVG或Canvas渲染连接线 (_edges)
        // 作为一个简化的实现，我们暂时跳过复杂的划线逻辑
    }

    function _createNodeElement(node) {
        const el = document.createElement('div');
        el.className = `clue-node type-${node.type}`;
        el.id = node.id;
        el.title = `点击查看详情`;

        if (node.type === 'clue') {
            el.classList.toggle('revealed', node.revealed);
            const icon = node.revealed ? 'fa-key' : 'fa-lock';
            el.innerHTML = `
                <i class="fa-solid ${icon}"></i>
                <span>${node.label}</span>
            `;
            el.addEventListener('click', () => _showClueDetails(node));
        } else {
            el.innerHTML = `
                <i class="fa-solid fa-scroll"></i>
                <span>${node.label}</span>
            `;
        }
        return el;
    }

    // --- 侧边栏与信息熵 ---
    
    function _showClueDetails(clueNode) {
        const data = clueNode.data;
        _sidebar.innerHTML = `
            <h3><i class="fa-solid fa-info-circle"></i> 线索详情</h3>
            <div class="sidebar-content">
                <h4>${data.name}</h4>
                <p>${data.description}</p>
                <div class="form-group">
                    <label>状态</label>
                    <input type="text" value="${clueNode.revealed ? '已揭示' : '未揭示'}" readonly>
                </div>
                
                <div class="form-group">
                    <label for="clue-bury-select">埋藏于场景</label>
                    <input type="text" id="clue-bury-select" placeholder="输入场景ID..." value="${data.buriedInScene || ''}">
                </div>
                <div class="form-group">
                    <label for="clue-reveal-select">揭示于场景</label>
                    <input type="text" id="clue-reveal-select" placeholder="输入场景ID..." value="${data.revealedInScene || ''}">
                </div>

                <div class="form-group">
                    <label>动态触发器 (预留)</label>
                    <textarea readonly>当 [角色A] 与 [角色B] 关系达到 [信任] 时</textarea>
                </div>
            </div>
            <div class="sidebar-footer">
                <button id="clue-save-btn" class="glow-button"><i class="fa-solid fa-save"></i> 保存更改</button>
            </div>
        `;

        document.getElementById('clue-save-btn').addEventListener('click', () => {
            // 更新数据
            const clueCard = _clueCards.find(c => c.id === clueNode.id);
            if(clueCard) {
                clueCard.data.buriedInScene = document.getElementById('clue-bury-select').value;
                clueCard.data.revealedInScene = document.getElementById('clue-reveal-select').value;
                // 简单逻辑：如果设置了揭示场景，就认为已揭示
                clueCard.data.isRevealed = !!clueCard.data.revealedInScene;
                showNotification('线索关系已更新!', 'success');
                render(); // 重新渲染整个网络
            }
        });
    }

    function _updateEntropy(revealedCount, totalCount) {
        let entropy = 0;
        let percentage = 0;
        if (totalCount > 0) {
            const unrevealedRatio = (totalCount - revealedCount) / totalCount;
            // 简单模拟信息熵：未揭示的越多，熵值越高
            entropy = unrevealedRatio * 100;
            percentage = (revealedCount / totalCount) * 100;
        }

        _entropyMeter.style.width = `${percentage}%`;
        _entropyValueEl.textContent = `${entropy.toFixed(2)}`;

        if (entropy > 75) {
            _entropyValueEl.className = 'entropy-value error';
        } else if (entropy > 40) {
            _entropyValueEl.className = 'entropy-value warning';
        } else {
            _entropyValueEl.className = 'entropy-value ok';
        }
    }

    // --- 模块接口 ---
    return {
        init,
        render
    };
})();