const Modules = {};

Modules.home = {
    render: () => `
        <main class="homeWorkbench" aria-label="创世工作台">
            <section class="workbenchMain">
                <header class="workbenchHeader">
                    <div>
                        <div class="brandLockup">
                            <img src="assets/images/phoenix.png" alt="" aria-hidden="true">
                            <span>创世中心 · 本地库就绪</span>
                        </div>
                        <p class="eyebrow">Command Desk</p>
                        <h1>从继续写作开始</h1>
                    </div>
                    <button class="ghostButton" onclick="App.nav('settings')">
                        <i class="fa-solid fa-sliders"></i>
                        设置
                    </button>
                </header>

                <div class="primaryAction">
                    <div>
                        <span class="actionKicker">当前建议</span>
                        <h2>打开中篇创作台</h2>
                        <p>章节、上下文、风格和 AI 助手放在同一工作流里，适合继续写正文或整理本章细纲。</p>
                    </div>
                    <button class="solidButton" onclick="App.nav('novella_writer')">
                        <i class="fa-solid fa-pen-nib"></i>
                        继续写
                    </button>
                </div>

                <div class="commandList" role="list" aria-label="常用创作命令">
                    ${[
                        {id:'novella_writer', icon:'fa-pen-nib', title:'中篇创作', meta:'正文 / 章节 / AI 助手', state:'主要入口'},
                        {id:'rag_context', icon:'fa-magnifying-glass-chart', title:'RAG 上下文', meta:'文档索引 / 语义检索', state:'资料'},
                        {id:'memory_system', icon:'fa-brain', title:'三层记忆', meta:'短期 / 长期 / 永久记忆', state:'记忆'},
                        {id:'reader_center', icon:'fa-book-open', title:'阅读中心', meta:'导入阅读 / 拆解参考', state:'阅读'}
                    ].map((item, index) => `
                        <button class="commandRow ${index === 0 ? 'isPrimary' : ''}" onclick="App.nav('${item.id}')" role="listitem">
                            <i class="fa-solid ${item.icon}"></i>
                            <span class="commandText">
                                <strong>${item.title}</strong>
                                <small>${item.meta}</small>
                            </span>
                            <span class="commandState">${item.state}</span>
                        </button>
                    `).join('')}
                </div>
            </section>

            <aside class="workbenchAside" aria-label="上下文">
                <div class="asidePanel">
                    <div class="panelTitle">
                        <span>今日案台</span>
                        <i class="fa-solid fa-feather-pointed"></i>
                    </div>
                    <div class="deskNote">
                        <strong>先把材料放进上下文，再进入写作。</strong>
                        <p>这个顺序能减少来回跳转，写作窗口里会更容易拿到设定、人物和参考文本。</p>
                    </div>
                </div>

                <div class="quickStack">
                    <button onclick="App.nav('rag_context')">
                        <span><i class="fa-solid fa-file-import"></i> 导入资料</span>
                        <i class="fa-solid fa-arrow-right"></i>
                    </button>
                    <button onclick="App.nav('memory_system')">
                        <span><i class="fa-solid fa-layer-group"></i> 整理记忆</span>
                        <i class="fa-solid fa-arrow-right"></i>
                    </button>
                    <button onclick="App.nav('reader_center')">
                        <span><i class="fa-solid fa-bookmark"></i> 查看参考</span>
                        <i class="fa-solid fa-arrow-right"></i>
                    </button>
                </div>
            </aside>
        </main>
    `
};
