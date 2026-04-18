// 文件路径: js/database/情节系统面板.js
// 描述: 渲染“情节系统”资料库面板 (由Gemini重构成可折叠树状结构 - 已修复嵌套错误)。

function renderPlotPanel() {
    const panel = document.getElementById('plot-panel');
    if (!panel) return;

    let html = `
        <h3>《终极版·万能剧情引擎与海量灵感库》</h3>
        <div class="plot-tree-container">
    `;

    // 这是一个四层嵌套循环，用于生成<details>结构
    // 第一层：频道 (女频/男频)
    for (const channel in PLOT_SYSTEM_DATA) {
        html += `<details class="plot-level-1" open><summary>${channel}</summary>`;
        const categories = PLOT_SYSTEM_DATA[channel];

        // 第二层：大类 (都市现言/玄幻仙侠)
        for (const category in categories) {
            html += `<details class="plot-level-2" open><summary>${category}</summary>`;
            const subCategories = categories[category];

            // 第三层：子类 (职场风云/情感纠葛)
            for (const subCategory in subCategories) {
                html += `<details class="plot-level-3"><summary>${subCategory}</summary>`;
                const topics = subCategories[subCategory];

                // 第四层：主题 (新人入职篇/晋升与竞争)
                for (const topic in topics) {
                     html += `<details class="plot-level-4"><summary>${topic}</summary>`;
                     const plots = topics[topic];

                     // 最终的情节点列表
                     html += `<ul class="plot-items-list">`;
                     plots.forEach(plot => {
                         html += `<li>${plot}</li>`;
                     });
                     html += `</ul></details>`;
                }
                html += `</details>`;
            }
            html += `</details>`;
        }
        // *** 错误已在此处修正 ***
        html += `</details>`;
    }

    html += `</div>`;
    panel.innerHTML = html;
}