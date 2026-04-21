// 文件路径: js/core/04_用户认证.js
// 描述: (V40.12 梦想最终版) 保持稳定，负责用户的注册、登录、登出以及UI状态更新。

function initializeAuth(){
    const registerBtn = document.getElementById('register-btn');
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    
    if (registerBtn) registerBtn.addEventListener('click', handleRegister);
    if (loginBtn) loginBtn.addEventListener('click', handleLogin);
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
}

async function checkLoginStatus(){
    currentUser = localStorage.getItem("genesis_engine_currentUser");
    if (currentUser) {
        const welcomeEl = document.getElementById('welcome-message');
        const loginBtn = document.getElementById('login-btn');
        const registerBtn = document.getElementById('register-btn');
        const logoutBtn = document.getElementById('logout-btn');
        const mainContent = document.getElementById('main-content');
        
        if (welcomeEl) welcomeEl.textContent = `欢迎, ${currentUser}`;
        if (loginBtn) loginBtn.classList.add('hidden');
        if (registerBtn) registerBtn.classList.add('hidden');
        if (logoutBtn) logoutBtn.classList.remove('hidden');
        if (mainContent) mainContent.classList.remove('disabled');
    } else {
        updateUIAfterLogout();
    }
}

function handleRegister(){
    const username = prompt("注册用户名:");
    if (!username || username.trim() === '') return;
    const password = prompt("设置密码:");
    if (!password) return;
    let users = JSON.parse(localStorage.getItem("genesis_engine_users")) || {};
    if (users[username]) {
        showNotification("用户名已存在！", "error");
    } else {
        users[username] = { password: password };
        localStorage.setItem("genesis_engine_users", JSON.stringify(users));
        showNotification("注册成功！现在请登录。", "success");
    }
}

function handleLogin(){
    const username = prompt("用户名:");
    if (!username) return;
    const password = prompt("密码:");
    if (!password) return;
    let users = JSON.parse(localStorage.getItem("genesis_engine_users")) || {};
    if (users[username] && users[username].password === password) {
        currentUser = username;
        localStorage.setItem("genesis_engine_currentUser", currentUser);
        updateUIAfterLogin();
    } else {
        showNotification("用户名或密码错误！", "error");
    }
}

function handleLogout(){
    currentUser = null;
    localStorage.removeItem("genesis_engine_currentUser");
    updateUIAfterLogout();
}

function updateUIAfterLogin(){
    const welcomeEl = document.getElementById('welcome-message');
    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const mainContent = document.getElementById('main-content');
    
    if (welcomeEl) welcomeEl.textContent = `欢迎, ${currentUser}`;
    if (loginBtn) loginBtn.classList.add('hidden');
    if (registerBtn) registerBtn.classList.add('hidden');
    if (logoutBtn) logoutBtn.classList.remove('hidden');
    if (mainContent) mainContent.classList.remove('disabled');
    showNotification(`欢迎回来, ${currentUser}!`, "success");
}

function updateUIAfterLogout(){
    const welcomeEl = document.getElementById('welcome-message');
    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const mainContent = document.getElementById('main-content');
    
    if (welcomeEl) welcomeEl.textContent = "请先登录";
    if (loginBtn) loginBtn.classList.remove('hidden');
    if (registerBtn) registerBtn.classList.remove('hidden');
    if (logoutBtn) logoutBtn.classList.add('hidden');
    if (mainContent) mainContent.classList.add('disabled');
    
    if(currentUser !== null) {
      showNotification("您已登出。", "info");
    }

    currentUser = null;
}
