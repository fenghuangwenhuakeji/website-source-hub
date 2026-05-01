/*
 * 创世纪引擎 V75.3 - 状态核心重构版
 * 核心JS模块 1: 状态管理器 (State Manager)
 * 职责: 提供一个统一的地方来存储和管理整个应用程序的状态。
 * ✨✨✨ (博士重构 - 状态核心) ✨✨✨
 * 1. 【核心】在 pipeline 状态中新增了 `creativePalette` 数组。
 * 2. 这个数组将作为“创作调色盘”的唯一数据源，用于存储用户拖入的卡牌ID。
 * 3. 这确保了调色盘的状态可以被项目系统持久化保存和加载，解决了切换页面数据丢失的根本问题。
 */

// 全局应用状态
let appState = {};

// 初始状态结构
const initialState = {
    // 当前活动项目信息 (由项目管理器填充)
    currentProject: null, 

    // 创作流水线状态 (现在与每个项目绑定)
    pipeline: {
        isRunning: false,
        currentStep: 1,
        inspiration: '',
        novelTitle: '未命名作品',
        totalChapters: 10,
        wordsPerChapter: 2000,
        outline: '',
        chapters: [],
        // ✨✨✨ 核心新增：创作调色盘的状态记忆核心 ✨✨✨
        creativePalette: [], // 存储放入调色盘的卡牌ID
    },
    
    // 卡牌库 (所有项目共享)
    cardLibrary: [],
};


// 初始化状态
function initializeState() {
    // 关键变更：不再从 localStorage 读取旧的、分散的状态
    // 状态的加载完全由 module-project-manager.js 接管
    appState = JSON.parse(JSON.stringify(initialState)); // 使用深拷贝创建一个干净的初始状态
    console.log("状态管理器初始化完成（项目驱动模式）。");
}

// 获取当前状态 (只读深拷贝)
function getState() {
    return JSON.parse(JSON.stringify(appState)); 
}

// 更新状态 (不再自动保存，由项目管理器在特定时机保存)
function updateState(newState) {
    appState = deepMerge(appState, newState);
    // 移除 saveState() 的调用，交由项目管理器控制
}

// ✨ 全局的 saveCardLibrary 函数，现在由项目管理器调用
function saveCardLibrary() {
    // 这个函数的具体实现被 project-manager 模块覆盖
    // 以确保它使用正确的用户ID进行存储
    console.log("正在调用 saveCardLibrary (具体逻辑由项目管理器实现)...");
}

// 深层合并对象的辅助函数
function deepMerge(target, source) {
    const output = { ...target };
    if (isObject(target) && isObject(source)) {
        Object.keys(source).forEach(key => {
            if (isObject(source[key])) {
                if (!(key in target))
                    Object.assign(output, { [key]: source[key] });
                else
                    output[key] = deepMerge(target[key], source[key]);
            } else {
                Object.assign(output, { [key]: source[key] });
            }
        });
    }
    return output;
}

function isObject(item) {
    return (item && typeof item === 'object' && !Array.isArray(item));
}