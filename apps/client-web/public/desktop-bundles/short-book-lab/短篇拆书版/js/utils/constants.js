const DEFAULT_PROMPTS = {
    deconstruct: '请深度拆解以下故事的结构、开局公式、情绪链设计、爽点/虐点布局、人物关系网、金句与氛围营造:\n\n',
    fusion: '请融合以下故事元素,创作一个连贯的新故事:\n\n',
    imitate: '请仿写以下故事的风格,创作全新内容:\n\n',
    template: '',
    complete: '请基于以下核心梗创作完整短篇小说(导语+15章,每章1200字以上):\n\n',
    continuation: '请接续以下内容继续创作，保持文风一致:\n\n',
    inspiration: '请将以下灵感片段扩展成完整段落(500-800字):\n\n',
    structure: '请优化以下文本的结构,使其更加连贯和有逻辑:\n\n',
    polish: '请对以下文本进行排版润色,使其更加优美流畅:\n\n',
    rewrite: '请将以下文本进行风格改写:\n\n'
};

const PROMPT_NAMES = {
    deconstruct: '拆解模式',
    fusion: '融合模式',
    imitate: '仿写模式',
    template: '自定义模式',
    complete: '完整创作',
    continuation: '续写扩展',
    inspiration: '灵感编写',
    structure: '结构优化',
    polish: '排版润色',
    rewrite: '风格改写'
};
