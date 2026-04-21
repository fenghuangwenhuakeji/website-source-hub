export default class MobileNav {
    constructor(app, container) {
        this.app = app;
        this.container = container;
    }

    render() {
        // 仅在移动端显示
        this.container.classList.remove('hidden');
        this.container.innerHTML = `
            <div class="flex justify-around items-center h-full">
                ${this.renderNavItem('file', 'fa-folder', '文件')}
                ${this.renderNavItem('editor', 'fa-pen-nib', '写作', true)}
                ${this.renderNavItem('outline', 'fa-list-ul', '大纲')}
                ${this.renderNavItem('settings', 'fa-sliders', '设定')}
            </div>
        `;

        // 绑定点击事件
        this.container.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const target = e.currentTarget.dataset.target;
                this.handleNavClick(target);
                
                // 更新激活状态
                this.container.querySelectorAll('.nav-item').forEach(el => el.classList.remove('text-accent', 'scale-110'));
                item.classList.add('text-accent', 'scale-110');
            });
        });
    }

    renderNavItem(id, icon, label, active = false) {
        const activeClass = active ? 'text-accent scale-110' : 'text-dim';
        return `
            <button class="nav-item flex flex-col items-center justify-center w-full h-full transition-all duration-200 ${activeClass}" data-target="${id}">
                <i class="fa-solid ${icon} text-xl mb-1"></i>
                <span class="text-[10px]">${label}</span>
            </button>
        `;
    }

    handleNavClick(target) {
        console.log(`[MobileNav] Switch to ${target}`);
        // 触发 UI 切换事件
        this.app.bus.emit('nav:switch', target);
    }
}