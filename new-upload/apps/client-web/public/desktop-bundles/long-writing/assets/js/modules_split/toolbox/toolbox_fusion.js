// ============================================
// 万能工坊 - 融合模块
// 融合输入槽初始化与管理
// ============================================
Object.assign(Modules.workshop, {
    _initFusion: () => { Modules.workshop.fusionInputs = 0; Modules.workshop.addFusionInput(); Modules.workshop.addFusionInput(); },
    addFusionInput: () => {
        Modules.workshop.fusionInputs++;
        const container = document.getElementById('ws-fusion-inputs');
        if (!container) return;
        const div = document.createElement('div');
        div.className = "bg-[#111113] min-w-[260px] flex-1 flex flex-col border border-white/5 rounded-xl overflow-hidden hover:border-purple-500/30 transition-all";
        div.innerHTML = `<div class="px-2 py-1.5 border-b border-white/5 bg-white/5 flex justify-between items-center"><span class="text-[10px] font-bold text-dim px-1">素材 ${String.fromCharCode(64 + Modules.workshop.fusionInputs)}</span><i class="fa-solid fa-xmark text-dim cursor-pointer hover:text-white px-1" onclick="this.closest('div[class*=min-w]').remove()"></i></div><textarea class="flex-1 bg-transparent border-none p-3 resize-none text-sm focus:outline-none ws-fusion-in text-gray-300 placeholder-white/20" placeholder="在此输入素材..."></textarea>`;
        container.appendChild(div);
    }
});
