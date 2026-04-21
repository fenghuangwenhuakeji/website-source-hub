export default class AuxPanel {
    constructor(app, container) {
        this.app = app;
        this.container = container;
    }

    render() {
        this.container.innerHTML = `
            <div class="h-12 flex items-center px-4 border-b border-border">
                <div class="text-sm font-bold text-dim">AI 助手 & 大纲</div>
            </div>
            <div class="p-4 text-dim text-sm">
                <div class="bg-white/5 p-3 rounded mb-4">
                    <div class="text-accent mb-2"><i class="fa-solid fa-robot mr-2"></i>Copilot</div>
                    <p>检测到当前场景冲突：主角战力设定为 Level 5，但此处表现过于弱势。</p>
                </div>
                
                <div class="text-xs uppercase tracking-wider mb-2 opacity-50">Outline</div>
                <ul class="space-y-2">
                    <li class="flex items-center space-x-2 cursor-pointer hover:text-accent">
                        <span class="w-1 h-1 rounded-full bg-accent"></span>
                        <span>开篇：神血觉醒</span>
                    </li>
                    <li class="flex items-center space-x-2 cursor-pointer hover:text-accent">
                        <span class="w-1 h-1 rounded-full bg-dim"></span>
                        <span>转折：逃离第9区</span>
                    </li>
                </ul>
            </div>
        `;
    }
}