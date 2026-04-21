const TavernUI = {
    showNotification(message, type = 'success') {
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
    },

    openModal(id) {
        document.getElementById(id).classList.add('active');
    },

    closeModal(id) {
        document.getElementById(id).classList.remove('active');
    }
};
