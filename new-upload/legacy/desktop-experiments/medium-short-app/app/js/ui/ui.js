export const UI = {
    toast: (msg) => {
        const d = document.createElement('div');
        d.className = 'toast'; d.innerHTML = msg;
        document.getElementById('toast-area').appendChild(d);
        setTimeout(()=>d.remove(), 3000);
    }
};
