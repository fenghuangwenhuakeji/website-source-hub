// 通知系统
function showNotification(message, type = 'success') {
    const notif = document.createElement('div');
    notif.className = `notification ${type}`;
    const lines = message.split('\n');
    if (lines.length > 1) {
        notif.innerHTML = `<div class="notification-title">${lines[0]}</div><div class="notification-message">${lines.slice(1).join('<br>')}</div>`;
    } else {
        notif.innerHTML = `<div class="notification-title">${message}</div>`;
    }
    document.body.appendChild(notif);
    setTimeout(() => notif.remove(), 3000);
}

// 模态框
function closeModal(id) {
    document.getElementById(id).classList.remove('active');
}

// 游戏计时器
function startGameTimer() {
    setInterval(() => {
        if (window.gameStartTime) {
            const elapsed = Math.floor((Date.now() - window.gameStartTime) / 1000);
            const h = Math.floor(elapsed / 3600).toString().padStart(2, '0');
            const m = Math.floor((elapsed % 3600) / 60).toString().padStart(2, '0');
            const s = (elapsed % 60).toString().padStart(2, '0');
            const timeEl = document.getElementById('game-time');
            if(timeEl) timeEl.textContent = `${h}:${m}:${s}`;
        }
    }, 1000);
}

// 导出功能
function exportStory(history) {
    const text = history.map(h => `${h.role === 'user' ? '玩家' : 'AI'}: ${h.content}`).join('\n\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `故事_${Date.now()}.txt`;
    a.click();
    showNotification('故事已导出', 'success');
}

function exportData(data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `游戏数据_${Date.now()}.json`;
    a.click();
    showNotification('数据已导出', 'success');
}