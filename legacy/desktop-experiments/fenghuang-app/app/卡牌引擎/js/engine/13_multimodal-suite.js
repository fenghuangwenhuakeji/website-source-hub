/*
 * 文件路径: /js/engine/13_multimodal-suite.js
 * 版本: V114.0 - 博士构造版 (想象的具现化)
 * 描述: 【多模态创生套件】核心逻辑。将文本设定转化为视觉与听觉艺术。
 */

const MultimodalSuite = (() => {
    // --- 模块私有变量 ---
    let _artSourceSelect, _generateArtBtn, _artGallery;
    let _musicSourceSelect, _generateMusicBtn, _musicPlayer;

    // --- 模块初始化 ---
    function init() {
        console.log("引擎模块 [多模态创生] 开始唤醒...");
        // 缓存DOM元素的操作将在第一次渲染时进行，因为模块内容是动态添加的
        console.log("引擎模块 [多模态创生] 已成功唤醒，准备连接多维宇宙。");
    }

    // --- 核心渲染函数 ---
    function render() {
        // 缓存DOM元素
        _artSourceSelect = document.getElementById('multimodal-art-source-select');
        _generateArtBtn = document.getElementById('multimodal-generate-art-btn');
        _artGallery = document.getElementById('multimodal-art-gallery');
        _musicSourceSelect = document.getElementById('multimodal-music-source-select');
        _generateMusicBtn = document.getElementById('multimodal-generate-music-btn');
        _musicPlayer = document.getElementById('multimodal-music-player');

        if (!_artSourceSelect) return; // 如果元素还未渲染，则退出

        // --- 绑定事件 ---
        _artSourceSelect.addEventListener('change', () => _updateButtonState(_artSourceSelect, _generateArtBtn));
        _musicSourceSelect.addEventListener('change', () => _updateButtonState(_musicSourceSelect, _generateMusicBtn));
        _generateArtBtn.addEventListener('click', _handleGenerateArt);
        _generateMusicBtn.addEventListener('click', _handleGenerateMusic);

        // --- 填充数据源 ---
        _populateArtSources();
        _populateMusicSources();
    }
    
    // --- 功能函数 ---

    function _populateArtSources() {
        _artSourceSelect.innerHTML = '<option value="">请选择一个角色或地点卡...</option>';
        const characters = CardManager.getAllCards().filter(c => c.type === 'character');
        const locations = CardManager.getAllCards().filter(c => c.type === 'location');

        const charGroup = document.createElement('optgroup');
        charGroup.label = '角色卡';
        characters.forEach(c => {
            const option = document.createElement('option');
            option.value = c.id;
            option.textContent = c.data.timeline[0].name || c.data.name;
            charGroup.appendChild(option);
        });
        _artSourceSelect.appendChild(charGroup);

        const locGroup = document.createElement('optgroup');
        locGroup.label = '地点卡';
        locations.forEach(c => {
            const option = document.createElement('option');
            option.value = c.id;
            option.textContent = c.data.name;
            locGroup.appendChild(option);
        });
        _artSourceSelect.appendChild(locGroup);
    }
    
    function _populateMusicSources() {
        _musicSourceSelect.innerHTML = '<option value="">请选择一个场景...</option>';
         const plotCards = CardManager.getAllCards().filter(c => c.type === 'plot');
         plotCards.forEach(plot => {
             if(plot.data.scenes && plot.data.scenes.length > 0) {
                 const plotGroup = document.createElement('optgroup');
                 plotGroup.label = `情节: ${plot.data.name}`;
                 plot.data.scenes.forEach(scene => {
                     const option = document.createElement('option');
                     option.value = scene.id;
                     option.textContent = scene.name;
                     plotGroup.appendChild(option);
                 });
                 _musicSourceSelect.appendChild(plotGroup);
             }
         });
    }

    function _updateButtonState(selectElement, buttonElement) {
        buttonElement.disabled = !selectElement.value;
    }

    // --- 事件处理 ---

    function _handleGenerateArt() {
        const sourceId = _artSourceSelect.value;
        if (!sourceId) return;

        const card = CardManager.getAllCards().find(c => c.id === sourceId);
        if (!card) return;
        
        showNotification(`正在为 [${card.data.name || card.data.timeline[0].name}] 生成概念图... (模拟)`, 'info');
        
        _setButtonLoading(_generateArtBtn, true, "生成中...");
        _artGallery.innerHTML = '<div class="loader"></div>';

        // 模拟AI生成过程
        setTimeout(() => {
            const artItem = document.createElement('div');
            artItem.className = 'art-item';
            // 使用一个placeholder服务来模拟图片生成
            artItem.style.backgroundImage = `url(https://picsum.photos/200/200?random=${Math.random()})`;
            artItem.dataset.title = card.data.name || card.data.timeline[0].name;
            
            _artGallery.innerHTML = '';
            _artGallery.appendChild(artItem);
             _setButtonLoading(_generateArtBtn, false, "生成美术概念");
        }, 2000);
    }

    function _handleGenerateMusic() {
        const sceneId = _musicSourceSelect.value;
        if (!sceneId) return;
        
        let sceneName = '未知场景';
        const plotCards = CardManager.getAllCards().filter(c => c.type === 'plot');
        for(const plot of plotCards) {
            const scene = plot.data.scenes?.find(s => s.id === sceneId);
            if(scene) {
                sceneName = scene.name;
                break;
            }
        }

        showNotification(`正在为场景 [${sceneName}] 生成配乐... (模拟)`, 'info');
        _setButtonLoading(_generateMusicBtn, true, "生成中...");
        _musicPlayer.innerHTML = '<div class="loader"></div>';

        // 模拟AI生成过程
        setTimeout(() => {
            _musicPlayer.innerHTML = `
                <div class="album-art"><i class="fa-solid fa-music"></i></div>
                <h4>${sceneName} - 主题</h4>
                <p>由创世纪引擎AI生成</p>
                <audio controls style="width: 100%; margin-top: 10px;"></audio>
            `;
             _setButtonLoading(_generateMusicBtn, false, "生成氛围音乐");
        }, 2500);
    }
    
    function _setButtonLoading(button, isLoading, message) {
        const iconClass = button.querySelector('i').className;
        if (isLoading) {
            button.disabled = true;
            button.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${message}`;
        } else {
            button.disabled = false;
            button.innerHTML = `<i class="${iconClass}"></i> ${message}`;
        }
    }


    return {
        init,
        render
    };
})();