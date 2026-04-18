export default class Sidebar {
    constructor(app, container) {
        this.app = app;
        this.container = container;
    }

    render() {
        this.container.innerHTML = `
            <div class="h-12 flex items-center px-4 border-b border-border">
                <div class="text-accent font-bold tracking-wider"><i class="fa-solid fa-dragon mr-2"></i>ARCHON</div>
            </div>
            
            <!-- 项目列表 -->
            <div class="flex-1 overflow-y-auto p-2 space-y-1">
                <div class="text-xs text-dim uppercase px-2 py-1 mt-2">Projects</div>
                ${this.renderProjectItem('极乐都市：神血沸腾', true)}
                ${this.renderProjectItem('赛博修仙传')}
                
                <div class="text-xs text-dim uppercase px-2 py-1 mt-4">Resources</div>
                ${this.renderResourceItem('fa-book', '世界观设定')}
                ${this.renderResourceItem('fa-users', '角色档案')}
                ${this.renderResourceItem('fa-map', '地理图谱')}
            </div>

            <!-- 底部工具 -->
            <div class="p-2 border-t border-border">
                <button class="w-full py-2 flex items-center justify-center text-dim hover:text-main transition-colors">
                    <i class="fa-solid fa-gear mr-2"></i> 设置
                </button>
            </div>
        `;
    }

    renderProjectItem(name, active = false) {
        const activeClass = active ? 'bg-white/10 text-accent border-l-2 border-accent' : 'text-dim hover:text-main hover:bg-white/5';
        return `
            <div class="cursor-pointer px-3 py-2 text-sm rounded-sm transition-colors ${activeClass}">
                <i class="fa-solid fa-folder-open mr-2 opacity-70"></i>${name}
            </div>
        `;
    }

    renderResourceItem(icon, name) {
        return `
            <div class="cursor-pointer px-3 py-2 text-sm text-dim hover:text-main hover:bg-white/5 rounded-sm transition-colors">
                <i class="fa-solid ${icon} mr-2 opacity-70 w-4"></i>${name}
            </div>
        `;
    }
}