// js/modules/module-project-manager.js

// =================================================================================================
// 项目管理器模块
// 职责：管理和显示项目的整体结构，如章节列表、人物关系图等。
//      这是导航和概览整个创作项目的核心面板。
// =================================================================================================

(function(window) {
    'use strict';

    // 依赖项检查
    if (!window.knowledgeBase) {
        console.error('Error: knowledgeBase is not loaded. project-manager.js must be loaded after data-knowledge-base.js.');
        return;
    }

    const ProjectManager = {
        // 模块初始化
        init: function() {
            console.log('Project Manager Initialized.');
            this.displayProjectTitle();
            this.displayChapters();
        },

        // 显示项目标题
        displayProjectTitle: function() {
            const projectTitleElement = document.getElementById('project-title');
            if (projectTitleElement && window.knowledgeBase.projectMetadata) {
                projectTitleElement.textContent = window.knowledgeBase.projectMetadata.title || '未命名项目';
            }
        },

        // 显示章节列表
        displayChapters: function() {
            const chapterListElement = document.getElementById('chapter-list');
            const chapters = window.knowledgeBase.chapters;

            if (!chapterListElement || !chapters || chapters.length === 0) {
                if(chapterListElement) chapterListElement.innerHTML = '<li>暂无章节数据。</li>';
                return;
            }

            // 清空现有列表
            chapterListElement.innerHTML = '';

            // 遍历章节数据并创建列表项
            chapters.forEach((chapter, index) => {
                const listItem = document.createElement('li');
                listItem.textContent = chapter.title;
                listItem.setAttribute('data-chapter-id', chapter.id); // 设置一个唯一标识符
                listItem.classList.add('chapter-item');

                // 【核心修复】为每个章节列表项添加点击事件监听器
                listItem.addEventListener('click', () => {
                    // 当点击时，调用函数来更新主编辑区的内容
                    this.updateWritingArea(chapter.id);

                    // (可选) 为选中的项添加高亮样式
                    document.querySelectorAll('.chapter-item').forEach(item => {
                        item.classList.remove('active');
                    });
                    listItem.classList.add('active');
                });

                chapterListElement.appendChild(listItem);
            });
        },
        
        // 【核心修复】新增的函数，用于根据章节ID更新写作区域的内容
        updateWritingArea: function(chapterId) {
            // 从知识库中找到对应ID的章节数据
            const chapterData = window.knowledgeBase.chapters.find(c => c.id === chapterId);
            
            if (!chapterData) {
                console.error(`Chapter with ID ${chapterId} not found.`);
                return;
            }
            
            // 获取写作区域的DOM元素
            const writingArea = document.getElementById('writing-area');
            if (!writingArea) {
                console.error('Writing area element not found.');
                return;
            }

            // 【格式化输出】构建要显示的HTML内容，只包含被点击章节的细纲
            // 我们将细纲的每个部分都用合适的标签包裹起来，以便将来进行样式化
            let contentHtml = `
                <div class="chapter-detail-view">
                    <h2>${chapterData.title || '无标题'}</h2>
                    <div class="detail-section">
                        <h3>核心事件</h3>
                        <p>${chapterData.coreEvent || '无'}</p>
                    </div>
                    <div class="detail-section">
                        <h3>场景描写</h3>
                        <p>${chapterData.sceneDescription || '无'}</p>
                    </div>
                    <div class="detail-section">
                        <h3>角色互动</h3>
                        <p>${chapterData.characterInteraction || '无'}</p>
                    </div>
                </div>
            `;
            
            // 将构建好的HTML内容设置到写作区域
            writingArea.innerHTML = contentHtml;
        }
    };

    // 将 ProjectManager 模块暴露到全局作用域
    window.App.modules.ProjectManager = ProjectManager;

})(window);