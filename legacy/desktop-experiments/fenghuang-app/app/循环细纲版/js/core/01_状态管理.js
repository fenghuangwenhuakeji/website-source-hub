// 文件路径: js/core/01_状态管理.js
// 描述: (V68.1 博士·创作者主宰·视觉升级版)
// 1. 【博士终极创举】: 根据您的天才构想，新增了 `batchOutlineBuffer` 状态。这个“缓冲区”将专门用来存储AI一次性返回的、未经任何程序切割的原始细纲文本。
// 2. 保持了以“第一章”为核心的创作流程，`currentChapterIndex` 默认仍为 0。

// --- 用户与项目状态 ---
let currentUser = null;
let projectLibrary = [];
let currentProjectId = null;

// --- 系统状态 ---
let isGenerating = false;

// --- 永久角色卡组 ---
let characterDeck = [];
let selectedCharacterIds = [];

// --- 工作区状态模板 ---
const initialCreationState = {
    projectId: null,
    novelTitle: "",

    // 灵感阶段
    rawInspiration: "",
    worldBible: null, // 【改造】用于存储世界法典
    storyBlueprint: [], // 【改造】分卷存储施工蓝图
    inspirationConcept: null, // 保留，用于在UI上显示合并后的完整蓝图

    // 全局写作设定
    writingStyle: "show-dont-tell",
    styleExample: "", 
    customStyleGuide: null, 
    customStyleEngine: null,
    narrativePerspective: "第三人称",
    endingType: "he",
    wordsPerChapter: 2000,
    totalChapters: 600,
    totalVolumes: 5,

    // 大纲与写作阶段
    generalOutline: null, // 宏观大纲
    detailedOutlines: [], // 数组，存储每一章的详细细纲
    storyChapters: [], // 数组，分章节存储正文
    characterStates: [], // 【改造】存储每卷的角色状态更新
    batchOutlineBuffer: "", // 【博士终极创举】: 您的专属细纲缓冲区！
    finalProse: null,

    currentChapterIndex: 0,
    currentVolumeIndex: 0, // 【改造】追踪当前卷数

    // 【终极重构】以小循环ID为key，存储各自的细纲和正文
    cycleContent: {},
    activeCycleId: null // 追踪当前在编辑器中激活的小循环
};

// --- 当前工作区状态 ---
let creationState = { ...initialCreationState };

// --- 流程中的临时数据 ---
let tempWorldview = {}; 
let lastValidationResult = {};

// --- 重置函数 ---
function resetCreationState(keepSettings = true) {
    const { writingStyle, styleExample, narrativePerspective, wordsPerChapter, totalChapters, customStyleGuide, customStyleEngine, endingType, totalVolumes } = creationState;

    const { cycleContent, ...restOfState } = creationState; // 保留已有的内容
    creationState = JSON.parse(JSON.stringify(initialCreationState));
    creationState.cycleContent = cycleContent || {}; // 恢复内容

    if (keepSettings) {
        Object.assign(creationState, restOfState);
        creationState.writingStyle = writingStyle;
        creationState.styleExample = styleExample;
        creationState.narrativePerspective = narrativePerspective;
        creationState.wordsPerChapter = wordsPerChapter;
        creationState.totalChapters = totalChapters;
        creationState.customStyleGuide = customStyleGuide;
        creationState.customStyleEngine = customStyleEngine;
        creationState.endingType = endingType;
        creationState.totalVolumes = totalVolumes;
    }

    lastValidationResult = {};
    selectedCharacterIds = [];

    console.log("Creation state has been reset.");
}

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