// 文件路径: 网页promax/js/ui/notifications.js
// 描述: 负责显示全局通知。

/**
 * 在屏幕右上角显示一个通知。
 * @param {string} message - 要显示的消息内容。
 * @param {string} type - 通知类型 ('info', 'success', 'error')。
 */
function showNotification(message, type = 'info') {
    const container = document.getElementById('notification-container');
    if (!container) {
        console.error("Notification container not found!");
        return;
    }

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    container.appendChild(notification);

    // 4秒后自动移除通知
    setTimeout(() => {
        notification.remove();
    }, 4000);
}