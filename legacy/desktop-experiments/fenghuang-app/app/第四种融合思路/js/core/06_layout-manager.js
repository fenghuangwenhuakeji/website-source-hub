// 文件路径: js/core/06_layout-manager.js
// 描述: (V71.0 梦想植入版) 全新核心模块，为写作台提供可拖拽、自由伸缩的动态布局功能。

function initializeResizableLayouts() {
    const mainContainer = document.querySelector('.writing-cockpit-container');
    if (!mainContainer) return;

    // 主布局：左右拖拽
    const leftPanel = mainContainer.querySelector('#cockpit-chapter-list');
    const rightArea = mainContainer.querySelector('.cockpit-main-area');
    const horizontalGutter = mainContainer.querySelector('.gutter-horizontal');
    if (leftPanel && rightArea && horizontalGutter) {
        makeResizable(leftPanel.parentElement, rightArea.parentElement, horizontalGutter, 'horizontal');
    }

    // 右侧主区域布局：上下拖拽
    const editorPanel = mainContainer.querySelector('#cockpit-editor');
    const bottomRow = mainContainer.querySelector('.cockpit-bottom-row');
    const verticalGutter = mainContainer.querySelector('.gutter-vertical');
    if (editorPanel && bottomRow && verticalGutter) {
        makeResizable(editorPanel.parentElement, bottomRow.parentElement, verticalGutter, 'vertical');
    }
    
    // 底部子布局：左右拖拽
    const bottomLeft = mainContainer.querySelector('#cockpit-bottom-left');
    const bottomRight = mainContainer.querySelector('#cockpit-bottom-right');
    const horizontalSubGutter = mainContainer.querySelector('.gutter-horizontal-sub');
    if(bottomLeft && bottomRight && horizontalSubGutter){
        makeResizable(bottomLeft, bottomRight, horizontalSubGutter, 'horizontal');
    }
}

function makeResizable(panel1, panel2, gutter, direction) {
    let isDragging = false;

    gutter.addEventListener('mousedown', function (e) {
        e.preventDefault();
        isDragging = true;
        document.body.style.cursor = (direction === 'horizontal') ? 'col-resize' : 'row-resize';
        document.body.style.userSelect = 'none';
    });

    document.addEventListener('mousemove', function (e) {
        if (!isDragging) return;

        const container = gutter.parentElement;
        const containerRect = container.getBoundingClientRect();

        if (direction === 'horizontal') {
            const pos = e.clientX - containerRect.left;
            const totalWidth = container.offsetWidth;
            const gutterWidth = gutter.offsetWidth;
            
            let panel1Percent = (pos - gutterWidth / 2) / totalWidth * 100;
            
            if (panel1Percent < 15) panel1Percent = 15;
            if (panel1Percent > 85) panel1Percent = 85;

            container.style.gridTemplateColumns = `${panel1Percent}% ${gutterWidth}px auto`;

        } else { // vertical
            const pos = e.clientY - containerRect.top;
            const totalHeight = container.offsetHeight;
            const gutterHeight = gutter.offsetHeight;

            let panel1Percent = (pos - gutterHeight / 2) / totalHeight * 100;
            
            if (panel1Percent < 25) panel1Percent = 25;
            if (panel1Percent > 75) panel1Percent = 75;
            
            container.style.gridTemplateRows = `${panel1Percent}% ${gutterHeight}px auto`;
        }
    });

    document.addEventListener('mouseup', function () {
        if (isDragging) {
            isDragging = false;
            document.body.style.cursor = 'default';
            document.body.style.userSelect = 'auto';
        }
    });
}