// 文件路径: js/core/01_状态管理.js
// 描述: (V79.5 博士·最终修复)

// --- 用户与项目状态 ---
let currentUser = null;
let projectLibrary = []; // 用于在内存中缓存项目列表
let currentProjectId = null;

// --- 系统状态 ---
let isGenerating = false;

// --- 数据缓存 ---
let characterDeck = [];
let promptsData = {}; // 存储加载的提示词

/**
 * 返回一个全新的、初始化的创作状态对象。
 * 这是所有新项目和重置操作的基石。
 */
function getInitialCreationState() {
    return {
        // 项目元数据
        id: null,
        title: '',
        lastModified: null,

        // 创作内容
        brief: '',
        blueprint: '',
        hierarchicalOutline: '',
        
        // 写作台状态
        chapters: [],
        currentChapterIndex: -1,

        // 全局设定
        totalChapters: 120,
        narrativePerspective: 'third_person',
        endingType: 'he',
        writingStyle: 'style_A12345_P0', // 默认创世模式
        customStyleGuide: null,

        // 向量化数据
        characters: [],
        worldview: [],
        clues: [],
        maps: [],
    };
}

// --- 当前工作区状态 ---
let creationState = getInitialCreationState();

/**
 * 重置当前工作区的状态。
 * @param {boolean} [keepSettings=true] - 是否保留写作风格等用户设置。
 * @returns {void}
 */
function resetCreationState(keepSettings = true) {
    const settingsToKeep = {
        writingStyle: creationState.writingStyle,
        customStyleGuide: creationState.customStyleGuide,
        narrativePerspective: creationState.narrativePerspective,
    };
    
    creationState = getInitialCreationState();
    
    if (keepSettings) {
        Object.assign(creationState, settingsToKeep);
    }
    
    // 重置写作台状态
    writingDeskState.chapters = [];
    writingDeskState.currentChapterIndex = -1;
    
    currentProjectId = null;

    console.log("创作状态已重置。");
}
