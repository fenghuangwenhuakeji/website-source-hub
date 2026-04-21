// 文件路径: js/database_panels/创作参考面板.js
// 描述: 渲染“创作参考”资料库面板，主要展示热门灵感模板。

function renderReferencePanel() {
    const panel = document.getElementById('reference-panel-content');
    if (!panel) return;

    let html = `<h3>热门开篇风格范例</h3>`;
    if (typeof HOT_INSPIRATION_TEMPLATES !== 'undefined' && HOT_INSPIRATION_TEMPLATES.length > 0) {
        HOT_INSPIRATION_TEMPLATES.forEach(template => {
            html += `
                <details open style="margin-bottom: 15px;">
                    <summary><h4>${template.title}</h4></summary>
                    <div class="reference-content" style="white-space: pre-wrap;">${template.brief}</div>
                </details>
            `;
        });
    } else {
        html += `<p>未能加载热门灵感模板数据。</p>`;
    }
    
    panel.innerHTML = html;
}

// 由于主JS文件可能在DOM加载后立即调用所有渲染函数，
// 我们需要确保在切换到知识库选项卡时也能正确渲染。
// 因此，在main.js的initializeKnowledgeBaseTabs函数中确保激活时会调用此函数。
// 或者，更简单的方式是，在主初始化流程中就调用它。