(() => {
  const Utils = {
    uuid() {
      return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },
    copy(text) {
      navigator.clipboard.writeText(text);
      UI.toast("\u5DF2\u590D\u5236", "success");
    },
    fileToText(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result);
        reader.onerror = (e) => reject(e);
        reader.readAsText(file);
      });
    },
    debounce(fn, ms) {
      let timeoutId = null;
      return ((...args) => {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), ms);
      });
    },
    throttle(fn, ms) {
      let lastCall = 0;
      return ((...args) => {
        const now = Date.now();
        if (now - lastCall >= ms) {
          lastCall = now;
          return fn(...args);
        }
      });
    },
    formatDate(date, format = "YYYY-MM-DD HH:mm:ss") {
      const d = new Date(date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const hours = String(d.getHours()).padStart(2, "0");
      const minutes = String(d.getMinutes()).padStart(2, "0");
      const seconds = String(d.getSeconds()).padStart(2, "0");
      return format.replace("YYYY", String(year)).replace("MM", month).replace("DD", day).replace("HH", hours).replace("mm", minutes).replace("ss", seconds);
    },
    escapeHtml(str) {
      const escapeMap = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
        "/": "&#x2F;"
      };
      return str.replace(/[&<>"'\/]/g, (char) => escapeMap[char]);
    }
  };
  window.Utils = Utils;
})();
