/**
 * Simple Router
 * 管理视图切换
 */

export class Router {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.routes = {};
    }

    register(name, renderFn) {
        this.routes[name] = renderFn;
    }

    navigate(name, params = {}) {
        if (this.routes[name]) {
            console.log(`[Router] Navigating to ${name}`);
            this.container.innerHTML = ''; // 清空容器
            const content = this.routes[name](params);
            this.container.appendChild(content);
        } else {
            console.error(`Route ${name} not found`);
        }
    }
}
