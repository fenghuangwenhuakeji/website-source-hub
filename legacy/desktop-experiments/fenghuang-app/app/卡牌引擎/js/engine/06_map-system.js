/*
 * 文件路径: /js/engine/06_map-system.js
 * 版本: V105.0 - 博士构造版 (动态地理沙盘)
 * 描述: 【地图系统】核心逻辑。负责地图背景的加载、地点卡的可视化、以及拖拽交互。
 */

const MapSystem = (() => {
    let _canvas, _toolbar, _mapImage, _uploadInput;
    let _locationCards = [];
    let _activeDrag = { element: null, offsetX: 0, offsetY: 0 };

    // --- 模块初始化 ---
    function init() {
        console.log("引擎模块 [地图系统] 开始唤醒...");

        _canvas = document.getElementById('map-canvas');
        _toolbar = document.getElementById('map-toolbar');
        _mapImage = document.getElementById('map-background-image');
        _uploadInput = document.getElementById('map-upload-input');
        
        if (!_canvas || !_toolbar || !_uploadInput) {
            console.error("[地图系统] 初始化失败: 未找到核心DOM元素。");
            return;
        }

        // --- 事件绑定 ---
        document.getElementById('map-upload-btn')?.addEventListener('click', () => _uploadInput.click());
        _uploadInput.addEventListener('change', _handleMapUpload);
        _canvas.addEventListener('dragover', _handleDragOver);
        _canvas.addEventListener('drop', _handleDrop);
        _canvas.addEventListener('mousedown', _handleMouseDown);
        document.addEventListener('mousemove', _handleMouseMove);
        document.addEventListener('mouseup', _handleMouseUp);
        
        console.log("引擎模块 [地图系统] 已成功唤醒。");
    }

    // --- 核心渲染函数 ---
    function render() {
        console.log("[地图系统] 开始渲染...");
        _locationCards = CardManager.getAllCards().filter(card => card.type === 'location');
        _canvas.querySelectorAll('.location-marker').forEach(marker => marker.remove());

        if (_locationCards.length === 0) {
            _displayEmptyMessage();
        } else {
             _removeEmptyMessage();
            _locationCards.forEach(_createMarker);
        }
    }
    
    // --- 功能函数 ---

    function _handleMapUpload(event) {
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                _mapImage.src = e.target.result;
                _mapImage.style.display = 'block';
                 _removeEmptyMessage();
            };
            reader.readAsDataURL(file);
            showNotification('地图背景已成功上传！', 'success');
        } else {
            showNotification('请选择一个有效的图片文件。', 'warning');
        }
    }

    function _createMarker(locationCard) {
        const marker = document.createElement('div');
        marker.className = 'location-marker';
        marker.dataset.cardId = locationCard.id;
        
        // 读取保存的位置，如果没有则随机放置
        const pos = locationCard.data.position || { x: Math.random() * 80 + 10, y: Math.random() * 80 + 10 };
        marker.style.left = `${pos.x}%`;
        marker.style.top = `${pos.y}%`;
        
        const cardData = locationCard.data;
        const iconClass = cardData.icon || 'fa-map-marker-alt';

        marker.innerHTML = `
            <i class="fa-solid ${iconClass}"></i>
            <span>${cardData.name || '未命名地点'}</span>
        `;
        
        marker.title = `地点: ${cardData.name}\n描述: ${cardData.description || '无'}`;
        
        _canvas.appendChild(marker);
    }

    function _displayEmptyMessage() {
        if (_canvas.querySelector('.empty-message')) return;
         _canvas.insertAdjacentHTML('afterbegin', '<p class="empty-message">地图为空。请先上传一张背景图，或在【拆解室】中生成地点卡。</p>');
    }
    
    function _removeEmptyMessage() {
        const msg = _canvas.querySelector('.empty-message');
        if (msg) msg.remove();
    }
    
    // --- 拖拽逻辑 ---
    
    function _handleMouseDown(event) {
        const target = event.target.closest('.location-marker');
        if (target) {
            event.preventDefault();
            const rect = target.getBoundingClientRect();
            const canvasRect = _canvas.getBoundingClientRect();
            _activeDrag.element = target;
            _activeDrag.offsetX = event.clientX - rect.left;
            _activeDrag.offsetY = event.clientY - rect.top;
            target.style.zIndex = 1001; // 提升层级
        }
    }
    
    function _handleMouseMove(event) {
        if (_activeDrag.element) {
            event.preventDefault();
            const canvasRect = _canvas.getBoundingClientRect();
            
            let x = event.clientX - canvasRect.left - _activeDrag.offsetX;
            let y = event.clientY - canvasRect.top - _activeDrag.offsetY;

            // 边界检测
            x = Math.max(0, Math.min(x, canvasRect.width - _activeDrag.element.offsetWidth));
            y = Math.max(0, Math.min(y, canvasRect.height - _activeDrag.element.offsetHeight));
            
            _activeDrag.element.style.left = `${(x / canvasRect.width) * 100}%`;
            _activeDrag.element.style.top = `${(y / canvasRect.height) * 100}%`;
        }
    }
    
    function _handleMouseUp(event) {
        if (_activeDrag.element) {
            const cardId = _activeDrag.element.dataset.cardId;
            const card = _locationCards.find(c => c.id === cardId);
            if (card) {
                const canvasRect = _canvas.getBoundingClientRect();
                const elementRect = _activeDrag.element.getBoundingClientRect();
                // 保存百分比位置
                card.data.position = {
                    x: ((elementRect.left - canvasRect.left) / canvasRect.width) * 100,
                    y: ((elementRect.top - canvasRect.top) / canvasRect.height) * 100
                };
                 console.log(`[地图系统] 已更新地点卡 ${card.data.name} 的位置:`, card.data.position);
                 // 这里可以添加一个 CardManager.updateCard(card) 的调用来持久化保存，暂时省略
            }
            
            _activeDrag.element.style.zIndex = 1000;
            _activeDrag.element = null;
        }
    }

    // 这两个函数目前为空，为未来从卡牌库拖拽到地图上预留
    function _handleDragOver(event) {
        event.preventDefault();
    }
    function _handleDrop(event) {
        event.preventDefault();
    }
    
    return {
        init,
        render
    };
})();