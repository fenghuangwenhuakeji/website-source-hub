// 文件路径: js/core/04_用户认证.js
// V79.1 统一配置版 - 无需登录

function initializeAuth(){
    console.log('丐版中长篇: 无需登录，直接启用');
}

function checkLoginStatus(){
    const appContent = document.getElementById('app-content');
    if (appContent) {
        appContent.classList.remove('disabled');
    }
    
    if (typeof loadProjectsFromStorage === 'function') {
        loadProjectsFromStorage();
    }
    if (typeof loadCharacterDeckFromStorage === 'function') {
        loadCharacterDeckFromStorage();
    }
}

function handleRegister(){
    showNotification("请在主窗口进行登录操作", "info");
}

function handleLogin(){
    showNotification("请在主窗口进行登录操作", "info");
}

function handleLogout(){
    showNotification("请在主窗口进行登出操作", "info");
}

function updateUIAfterLogin(){
    const appContent = document.getElementById('app-content');
    if (appContent) {
        appContent.classList.remove('disabled');
    }
}

function updateUIAfterLogout(){
    // 不再禁用应用
}
