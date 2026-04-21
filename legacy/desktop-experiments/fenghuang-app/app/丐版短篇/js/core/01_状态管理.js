// 文件路径: js/core/01_状态管理.js
// 描述: (V41.1 梦想实现版) 
// 1. 【博士终极梦想版】根据您的最新指示，移除了与大纲和中间环节相关的状态变量（如 worldView, storyChain, finalOutline 等），使状态管理完全服务于“蓝图直达写作”的新流程。
// 2. 新增了全局写作设定，并补全了角色卡组的本地存储函数以修复启动错误。

// --- 用户与项目状态 ---
let currentUser = null;
let projectLibrary = [];
let currentProjectId = null;

// --- 自动化与系统状态 ---
let automationMode = 'manual';
let isGenerating = false;
let lastPolishSuggestions = "";

// --- 永久角色卡组 ---
let characterDeck = [];
let selectedCharacterIds = [];

// --- 工作区状态模板 ---
const initialCreationState = {
    // 灵感阶段
    rawInspiration: "",
    inspirationConcept: null, // 故事蓝图将存储在这里
    novelTitle: "未命名作品",

    // 全局写作设定 (从灵感模块提前)
    writingStyle: "show-dont-tell",
    styleExample: "", // 用于存储导入的风格示例
    customStyleGuide: null, // ✨ 新增：用于存储自定义风格指南
    customStyleEngine: null, // ✨ 新增：记录生成指南的引擎
    narrativePerspective: "第一人称",
    endingType: "he", // ✨ 博士新增：结局基调，默认为好结局(HE)
    wordsPerChapter: 1500,
    totalChapters: 15,

    // 写作与后期阶段
    storyChapters: [], // 用于分章节存储正文
    finalProse: null,

    // 自动化流程控制
    inspirationQueue: [],
    autoFlowState: {
        isRunning: false,
        currentStep: '',
    }
};

// --- 当前工作区状态 ---
let creationState = { ...initialCreationState };

// --- 流程中的临时数据 ---
let tempWorldview = {}; // 保留以防未来扩展，但当前流程不使用
let lastValidationResult = {};

// --- 重置函数 ---
function resetCreationState(keepQueueAndSettings = false) {
    const queue = keepQueueAndSettings ? [...creationState.inspirationQueue] : [];
    // 保留全局设定
    const { writingStyle, styleExample, narrativePerspective, wordsPerChapter, totalChapters, customStyleGuide, customStyleEngine, endingType } = creationState;

    // 完全重置
    creationState = JSON.parse(JSON.stringify(initialCreationState));

    // 如果需要，恢复队列和设定
    if (keepQueueAndSettings) {
        creationState.inspirationQueue = queue;
        creationState.writingStyle = writingStyle;
        creationState.styleExample = styleExample;
        creationState.narrativePerspective = narrativePerspective;
        creationState.wordsPerChapter = wordsPerChapter;
        creationState.totalChapters = totalChapters;
        creationState.customStyleGuide = customStyleGuide;
        creationState.customStyleEngine = customStyleEngine;
        creationState.endingType = endingType;
    }

    lastValidationResult = {};
    lastPolishSuggestions = "";
    selectedCharacterIds = [];

    console.log("Creation state has been reset.", "保留队列和设定:", keepQueueAndSettings);
}

// ✨ 博士，这是为您补全的角色卡组存储函数，以修复启动错误
function saveCharacterDeckToStorage() {
    if (currentUser) {
        try {
            const validDeck = characterDeck.filter(c => c);
            localStorage.setItem(`${currentUser}_characterDeck_v1`, JSON.stringify(validDeck));
        } catch (error) {
            console.error("保存角色卡组失败:", error);
            showNotification("保存角色卡组失败。", "error");
        }
    }
}

function loadCharacterDeckFromStorage() {
    if (currentUser) {
        const savedDeck = localStorage.getItem(`${currentUser}_characterDeck_v1`);
        characterDeck = savedDeck ? JSON.parse(savedDeck).filter(c => c) : [];
    } else {
        characterDeck = [];
    }
    selectedCharacterIds = [];
}