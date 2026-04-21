/*
 * 文件路径: /js/main.js
 * V79.1 统一配置版 - 无需登录
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log("创世纪引擎 V114 - 众神殿 正在初始化...");

    try {
        if (typeof APISettings === 'undefined') { throw new Error("核心模块 [API设置] 未能加载。"); }
        if (typeof APIInterface === 'undefined') { throw new Error("核心模块 [API接口] 未能加载。"); }
        if (typeof CardManager === 'undefined') { throw new Error("核心模块 [卡牌管理器] 未能加载。"); }
        if (typeof WorldState === 'undefined') { throw new Error("核心模块 [世界状态] 未能加载。"); }
        if (typeof AIDirector === 'undefined') { throw new Error("引擎模块 [AI总监] 未能加载。"); }
        if (typeof InspirationRoom === 'undefined') { throw new Error("引擎模块 [灵感室] 未能加载。"); }
        if (typeof CardLibrary === 'undefined') { throw new Error("引擎模块 [卡牌库] 未能加载。"); }
        if (typeof DeconstructionRoom === 'undefined') { throw new Error("引擎模块 [拆解室] 未能加载。"); }
        if (typeof CharacterModule === 'undefined') { throw new Error("引擎模块 [角色模块] 未能加载。"); }
        if (typeof MapSystem === 'undefined') { throw new Error("引擎模块 [地图系统] 未能加载。"); }
        if (typeof SociologyEngine === 'undefined') { throw new Error("引擎模块 [派系与社会学] 未能加载。"); }
        if (typeof WorldSimulator === 'undefined') { throw new Error("引擎模块 [世界模拟器] 未能加载。"); }
        if (typeof OutlineModule === 'undefined') { throw new Error("引擎模块 [大纲模块] 未能加载。"); }
        if (typeof DetailedOutlineModule === 'undefined') { throw new Error("引擎模块 [细纲模块] 未能加载。"); }
        if (typeof ProseModule === 'undefined') { throw new Error("引擎模块 [正文模块] 未能加载。"); }
        if (typeof ClueNetwork === 'undefined') { throw new Error("引擎模块 [伏笔网络] 未能加载。"); }
        if (typeof MultimodalSuite === 'undefined') { throw new Error("引擎模块 [多模态创生] 未能加载。"); }
        if (typeof PublishingSuite === 'undefined') { throw new Error("引擎模块 [导出与发布] 未能加载。"); }
        if (typeof CollabMarketplace === 'undefined') { throw new Error("引擎模块 [云协作与市场] 未能加载。"); }

        APISettings.init();
        CardManager.init();
        console.log("核心模块 [API设置] [卡牌管理器] 已唤醒。");

        AIDirector.init();
        InspirationRoom.init();
        CardLibrary.init();
        DeconstructionRoom.init();
        CharacterModule.init(); 
        MapSystem.init();
        SociologyEngine.init();
        WorldSimulator.init();
        OutlineModule.init();
        DetailedOutlineModule.init();
        ProseModule.init();
        ClueNetwork.init();
        MultimodalSuite.init();
        PublishingSuite.init();
        CollabMarketplace.init();
        console.log("所有引擎模块已唤醒。");
        
        CardManager.registerRenderCallback(() => {
            const activeTabId = document.querySelector('.tab-content.active')?.id;
            if (activeTabId === 'card-library') CardLibrary.render();
            if (activeTabId === 'character-module') CharacterModule.renderDeck();
            if (activeTabId === 'map-system') MapSystem.render(); 
            if (activeTabId === 'sociology-engine') SociologyEngine.render();
            if (activeTabId === 'detailed-outline-module') DetailedOutlineModule.render();
            if (activeTabId === 'clue-network') ClueNetwork.render();
            if (activeTabId === 'multimodal-suite') MultimodalSuite.render();
        });
        console.log("[神经连接] 卡牌管理器已连接至所有活动模块渲染器。");

        setupTabNavigation();
        console.log("导航系统已激活。");
        
        console.log("所有核心系统加载完毕。创世纪，始于此刻。");

    } catch (error) {
        console.error("引擎在初始化过程中遭遇致命错误:", error);
        alert(`引擎启动失败！\n\n错误信息: ${error.message}\n\n请检查对应的JS文件是否存在且无误，详情请查看浏览器控制台(F12)。`);
        return;
    }
});

function setupTabNavigation() {
    const navMenu = document.querySelector('.nav-menu');
    if (!navMenu) {
        console.error("致命错误: 未找到导航菜单 .nav-menu");
        return;
    }
    navMenu.addEventListener('click', (event) => {
        const navLink = event.target.closest('a');
        if (!navLink) return;
        const navItem = navLink.parentElement;
        if (navItem.classList.contains('active') || !navItem.dataset.tab) return;
        const tabId = navItem.dataset.tab;
        activateTab(tabId);
    });
}

function activateTab(tabId) {
    const allNavItems = document.querySelectorAll('.nav-menu .nav-item');
    const allTabContents = document.querySelectorAll('.main-content .tab-content');

    allNavItems.forEach(item => {
        if(item.dataset.tab) item.classList.remove('active');
    });
    allTabContents.forEach(content => content.classList.remove('active'));

    const targetNavItem = document.querySelector(`.nav-item[data-tab="${tabId}"]`);
    const targetContent = document.getElementById(tabId);

    if (targetNavItem && targetContent) {
        targetNavItem.classList.add('active');
        targetContent.classList.add('active');
        
        if (tabId === 'card-library') CardLibrary.render();
        if (tabId === 'character-module') CharacterModule.renderDeck();
        if (tabId === 'map-system') MapSystem.render();
        if (tabId === 'sociology-engine') SociologyEngine.render();
        if (tabId === 'world-simulator') WorldSimulator.renderLog();
        if (tabId === 'outline-module') OutlineModule.render(); 
        if (tabId === 'detailed-outline-module') DetailedOutlineModule.render();
        if (tabId === 'prose-module') ProseModule.render();
        if (tabId === 'clue-network') ClueNetwork.render();
        if (tabId === 'multimodal-suite') MultimodalSuite.render();
        if (tabId === 'publishing-suite') PublishingSuite.render();
        if (tabId === 'collab-marketplace') CollabMarketplace.render();

    } else {
        console.error(`错误: 无法找到ID为 "${tabId}" 的导航项或内容区域。`);
    }
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.remove();
    }, 4000);
}
