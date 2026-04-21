const Modules = {};

Modules.home = {
    render: () => `
        <div class="h-full flex flex-col items-center relative overflow-y-auto bg-[#F8F9FA] pb-12 pt-8">
            <!-- Dynamic Background -->
            <div class="absolute inset-0 bg-[radial-gradient(circle_at_center,_#F1F3F5_0%,_#E5E7EB_100%)] pointer-events-none"></div>
            <div class="absolute inset-0 opacity-20 pointer-events-none" style="background-image: linear-gradient(rgba(0, 0, 0, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 0, 0, 0.03) 1px, transparent 1px); background-size: 50px 50px;"></div>
            
            <!-- Hero Section -->
            <div class="relative z-10 text-center animate-fade-in flex flex-col items-center gap-8 mb-12">
                <div class="w-40 h-40 rounded-full bg-gradient-to-br from-accent/20 to-transparent border border-accent/30 flex center shadow-[0_0_80px_rgba(99,102,241,0.15)] mb-2 relative group cursor-default">
                    <div class="absolute inset-0 rounded-full border border-gray-300 animate-spin-slow pointer-events-none"></div>
                    <img src="assets/images/phoenix.png" class="w-32 h-32 object-contain group-hover:scale-110 transition-transform duration-500 drop-shadow-[0_0_15px_rgba(255,215,0,0.5)]" alt="创世旗舰版">
                </div>
                
                <div class="flex flex-col gap-2">
                    <h1 class="text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-gray-700 to-gray-500 tracking-tight" style="filter: drop-shadow(0 0 30px rgba(0,0,0,0.1));">创世 <span class="text-accent">旗舰版 2.0</span></h1>
                    <p class="text-xl text-dim font-light tracking-[0.5em] uppercase opacity-80">Genesis Archon Ultimate</p>
                </div>
                
                <p class="text-lg text-gray-400 max-w-2xl leading-relaxed font-light border-t border-gray-300 pt-6">
                    全维度 AI 创作引擎 · 史诗级更新换代<br>
                    <span class="text-sm text-dim">凤凰创作流 / 长篇执笔 / 世界引擎 / 工作流智能体 / RAG记忆</span>
                </p>
            </div>
            
            <!-- Grid Navigation -->
            <div class="relative z-10 w-full max-w-[1400px] px-8">
                <div class="grid grid-cols-4 gap-5 mb-6">
                    ${[
                        {id:'phoenix', icon:'fa-fire-flame-curved', title:'凤凰创作流', sub:'从零构建史诗大纲', color:'orange-500'},
                        {id:'writer', icon:'fa-feather-pointed', title:'长篇执笔', sub:'沉浸式 RAG 写作', color:'yellow-500'},
                        {id:'world_engine', icon:'fa-atom', title:'世界引擎', sub:'宏大设定与知识图谱', color:'blue-500'},
                        {id:'fusion_book', icon:'fa-book-open-reader', title:'融合拆书', sub:'智能拆解与融合分析', color:'emerald-500'}
                    ].map(item => `
                        <div class="epic-card p-5 flex flex-col items-center gap-3 group cursor-pointer hover:bg-gray-100" onclick="App.nav('${item.id}')">
                            <div class="w-14 h-14 rounded-2xl bg-${item.color}/10 flex center group-hover:bg-${item.color}/20 transition-all border border-${item.color}/20 group-hover:border-${item.color}/50">
                                <i class="fa-solid ${item.icon} text-3xl text-${item.color} group-hover:scale-110 transition-transform duration-300"></i>
                            </div>
                            <div class="text-center">
                                <span class="font-bold text-base text-gray-700 block mb-0.5 group-hover:text-gray-800 transition-colors">${item.title}</span>
                                <span class="text-[10px] text-dim group-hover:text-gray-400 transition-colors">${item.sub}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="grid grid-cols-4 gap-5 mb-6">
                    ${[
                        {id:'creative_studio', icon:'fa-wand-magic-sparkles', title:'创意工坊', sub:'灵感激发与创意工具', color:'pink-500'},
                        {id:'workshop', icon:'fa-hammer', title:'万能工坊', sub:'自定义批量工具', color:'indigo-500'},
                        {id:'tools_center', icon:'fa-toolbox', title:'工具中心', sub:'工作流画布与智能体', color:'purple-500'},
                        {id:'web_chat', icon:'fa-comments', title:'网页对话', sub:'多角色AI对话 · 指令调用', color:'cyan-500'}
                    ].map(item => `
                        <div class="epic-card p-5 flex flex-col items-center gap-3 group cursor-pointer hover:bg-gray-100" onclick="App.nav('${item.id}')">
                            <div class="w-14 h-14 rounded-2xl bg-${item.color}/10 flex center group-hover:bg-${item.color}/20 transition-all border border-${item.color}/20 group-hover:border-${item.color}/50">
                                <i class="fa-solid ${item.icon} text-3xl text-${item.color} group-hover:scale-110 transition-transform duration-300"></i>
                            </div>
                            <div class="text-center">
                                <span class="font-bold text-base text-gray-700 block mb-0.5 group-hover:text-gray-800 transition-colors">${item.title}</span>
                                <span class="text-[10px] text-dim group-hover:text-gray-400 transition-colors">${item.sub}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="grid grid-cols-4 gap-5">
                    ${[
                        {id:'rag_context', icon:'fa-magnifying-glass-chart', title:'RAG 上下文', sub:'文档索引与语义检索', color:'teal-500'},
                        {id:'memory_system', icon:'fa-brain', title:'三层记忆', sub:'短期·长期·永久记忆', color:'rose-500'},
                        {id:'reader_center', icon:'fa-book-open', title:'阅读中心', sub:'沉浸阅读与智能排版', color:'amber-500'},
                        {id:'settings', icon:'fa-gear', title:'系统设置', sub:'API配置与数据管理', color:'gray-500'}
                    ].map(item => `
                        <div class="epic-card p-5 flex flex-col items-center gap-3 group cursor-pointer hover:bg-gray-100" onclick="App.nav('${item.id}')">
                            <div class="w-14 h-14 rounded-2xl bg-${item.color}/10 flex center group-hover:bg-${item.color}/20 transition-all border border-${item.color}/20 group-hover:border-${item.color}/50">
                                <i class="fa-solid ${item.icon} text-3xl text-${item.color} group-hover:scale-110 transition-transform duration-300"></i>
                            </div>
                            <div class="text-center">
                                <span class="font-bold text-base text-gray-700 block mb-0.5 group-hover:text-gray-800 transition-colors">${item.title}</span>
                                <span class="text-[10px] text-dim group-hover:text-gray-400 transition-colors">${item.sub}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `
};