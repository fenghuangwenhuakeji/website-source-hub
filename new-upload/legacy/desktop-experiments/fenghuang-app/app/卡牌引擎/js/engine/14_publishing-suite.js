/*
 * 文件路径: /js/engine/14_publishing-suite.js
 * 版本: V114.0 - 博士构造版 (文明的封装)
 * 描述: 【导出与发布套件】核心逻辑。将创世成果转化为专业作品。
 */

const PublishingSuite = (() => {
    // --- 模块私有变量 ---
    let _exportNovelBtn, _exportWikiBtn, _exportJsonBtn;

    function init() {
        console.log("引擎模块 [导出与发布] 开始唤醒...");
    }

    function render() {
        _exportNovelBtn = document.getElementById('export-novel-btn');
        _exportWikiBtn = document.getElementById('export-wiki-btn');
        _exportJsonBtn = document.getElementById('export-json-btn');

        if (!_exportNovelBtn) return;

        _exportNovelBtn.addEventListener('click', _handleExportNovel);
        _exportWikiBtn.addEventListener('click', _handleExportWiki);
        _exportJsonBtn.addEventListener('click', _handleExportJson);
    }

    // --- 导出处理函数 ---

    function _handleExportNovel() {
        let content = "创世纪引擎 - 小说手稿\n========================\n\n";
        const plotCards = CardManager.getAllCards().filter(c => c.type === 'plot').sort((a, b) => a.timestamp - b.timestamp);
        
        if (plotCards.length === 0) {
            showNotification('没有可导出的情节内容。', 'warning');
            return;
        }

        plotCards.forEach((plot, index) => {
            content += `第 ${index + 1} 章: ${plot.data.name}\n------------------------\n\n`;
            if (plot.data.scenes && plot.data.scenes.length > 0) {
                plot.data.scenes.forEach(scene => {
                    content += `场景: ${scene.name}\n\n`;
                    if (scene.prose) {
                        const tempDiv = document.createElement('div');
                        tempDiv.innerHTML = scene.prose;
                        content += tempDiv.textContent || tempDiv.innerText || "";
                    } else {
                        content += "（此场景无正文内容）";
                    }
                    content += "\n\n---\n\n";
                });
            } else {
                content += "（本章无场景）\n\n";
            }
        });

        _triggerDownload('world-novel.txt', content, 'text/plain');
        showNotification('小说手稿已成功导出！', 'success');
    }

    function _handleExportWiki() {
        const allCards = CardManager.getAllCards();
        if (allCards.length === 0) {
            showNotification('没有任何卡牌可用于生成维基。', 'warning');
            return;
        }

        let html = `
            <!DOCTYPE html>
            <html lang="zh-CN">
            <head>
                <meta charset="UTF-8">
                <title>创世纪维基</title>
                <style>
                    body { font-family: sans-serif; background: #1a1a2e; color: #e0e0e0; line-height: 1.6; padding: 20px; }
                    h1, h2 { color: #00ffff; border-bottom: 1px solid #0f3460; padding-bottom: 10px; }
                    .card { background: #16213e; border: 1px solid #0f3460; border-radius: 8px; padding: 15px; margin-bottom: 20px; }
                    .card h3 { margin-top: 0; color: #00ffff; }
                </style>
            </head>
            <body>
                <h1>创世纪维基</h1>
        `;

        const types = ['character', 'location', 'faction', 'plot', 'clue'];
        types.forEach(type => {
            const cardsOfType = allCards.filter(c => c.type === type);
            if(cardsOfType.length > 0) {
                html += `<h2>${type.charAt(0).toUpperCase() + type.slice(1)} Cards</h2>`;
                cardsOfType.forEach(card => {
                     html += `<div class="card"><h3>${card.data.name || card.data.title || (card.data.timeline && card.data.timeline[0].name)}</h3><pre>${JSON.stringify(card.data, null, 2)}</pre></div>`;
                });
            }
        });

        html += `</body></html>`;
        _triggerDownload('world-wiki.html', html, 'text/html');
        showNotification('世界维基已成功生成！', 'success');
    }

    function _handleExportJson() {
        const allCards = CardManager.getAllCards();
        if (allCards.length === 0) {
            showNotification('没有任何卡牌可以导出。', 'warning');
            return;
        }
        const jsonData = JSON.stringify(allCards, null, 2);
        _triggerDownload('genesis-engine-export.json', jsonData, 'application/json');
        showNotification('完整的JSON数据已导出！', 'success');
    }

    // --- 辅助函数：触发文件下载 ---
    function _triggerDownload(filename, content, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    return {
        init,
        render
    };
})();