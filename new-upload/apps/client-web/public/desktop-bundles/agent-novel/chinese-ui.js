(function enforceAgentNovelChineseUi() {
  const exactText = new Map([
    ['single', '单体'],
    ['compose', '组合'],
    ['harness', '编排'],
    ['No active session', '暂无活动会话'],
    ['No sessions yet', '暂无会话'],
    ['Create a new one or run a prompt.', '新建一个会话，或直接输入任务开始。'],
    ['Create a new one orrun a prompt.', '新建一个会话，或直接输入任务开始。'],
    ['Choose a session or enter a prompt to begin.', '选择一个会话，或输入任务开始。'],
    ['Result will appear here.', '执行结果会显示在这里。'],
    ['Agent Orchestrator', '智能体编排器'],
    ['Spec Agent', '规格智能体'],
    ['Plan Agent', '规划智能体'],
    ['Outline Agent', '大纲智能体'],
    ['Narrative Engine Agent', '叙事引擎智能体'],
    ['Polish Agent', '润色智能体'],
    ['Worldbuilding Agent', '世界观智能体'],
    ['Dialogue Writer Agent', '对白写作智能体'],
    ['Comic Creator Agent', '漫画创作智能体'],
    ['Script Creator Agent', '脚本创作智能体'],
    ['Storyboard Agent', '分镜智能体'],
    ['Character Design Agent', '角色设计智能体'],
    ['Full orchestration control pipeline', '完整任务编排与执行流程'],
    ['Compose multiple agents in sequence', '多个智能体按顺序协同执行'],
    ['Single agent direct output', '单智能体直接输出'],
    ['No active session Create a new one or run a prompt.', '暂无活动会话。新建一个会话，或直接输入任务开始。'],
  ]);

  const replacements = [
    [/\bAgent\s*Orchestrator\b/gu, '智能体编排器'],
    [/\bAgentOrchestrator\b/gu, '智能体编排器'],
    [/\bSpec\s*Agent\b/gu, '规格智能体'],
    [/\bSpecAgent\b/gu, '规格智能体'],
    [/\bPlan\s*Agent\b/gu, '规划智能体'],
    [/\bPlanAgent\b/gu, '规划智能体'],
    [/\bOutline\s*Agent\b/gu, '大纲智能体'],
    [/\bOutlineAgent\b/gu, '大纲智能体'],
    [/\bNarrative\s*Engine\s*Agent\b/gu, '叙事引擎智能体'],
    [/\bNarrativeEngineAgent\b/gu, '叙事引擎智能体'],
    [/\bPolish\s*Agent\b/gu, '润色智能体'],
    [/\bPolishAgent\b/gu, '润色智能体'],
    [/\bWorldbuilding\s*Agent\b/gu, '世界观智能体'],
    [/\bWorldbuildingAgent\b/gu, '世界观智能体'],
    [/\bDialogue\s*Writer\s*Agent\b/gu, '对白写作智能体'],
    [/\bDialogueWriterAgent\b/gu, '对白写作智能体'],
    [/\bComic\s*Creator\s*Agent\b/gu, '漫画创作智能体'],
    [/\bScript\s*Creator\s*Agent\b/gu, '脚本创作智能体'],
    [/\bStoryboard\s*Agent\b/gu, '分镜智能体'],
    [/\bCharacter\s*Design\s*Agent\b/gu, '角色设计智能体'],
    [/\bNo active session\b/gu, '暂无活动会话'],
    [/\bNo sessions yet\b/gu, '暂无会话'],
    [/Create a new one or\s*run a prompt\./gu, '新建一个会话，或直接输入任务开始。'],
    [/Choose a session or enter a prompt to begin\./gu, '选择一个会话，或输入任务开始。'],
    [/Result will appear here\./gu, '执行结果会显示在这里。'],
    [/Single and compose modes let you manually pick participating agents from the right panel\./gu, '单体与组合模式可在右侧手动选择参与智能体。'],
    [/Harness mode auto-completes the execution chain from the prompt, session context, and current domain\./gu, '编排模式会根据提示词、会话上下文和当前领域自动补全执行链路。'],
    [/Full orchestration control pipeline/gu, '完整任务编排与执行流程'],
    [/Compose multiple agents in sequence/gu, '多个智能体按顺序协同执行'],
    [/\bwriting\s*[·/]\s*harness\s*(\d+)\s+agents?\b/giu, '写作·编排 $1 个智能体'],
    [/\bwriting\s*[·/]\s*compose\s*(\d+)\s+agents?\b/giu, '写作·组合 $1 个智能体'],
    [/\bwriting\s*[·/]\s*single\s*(\d+)\s+agents?\b/giu, '写作·单体 $1 个智能体'],
    [/\b(\d+)\s+agents?\b/giu, '$1 个智能体'],
    [/\bmode:\s*harness\b/giu, '模式：编排'],
    [/\bmode:\s*compose\b/giu, '模式：组合'],
    [/\bmode:\s*single\b/giu, '模式：单体'],
    [/\bMode:\s*harness\b/gu, '模式：编排'],
    [/\bMode:\s*compose\b/gu, '模式：组合'],
    [/\bMode:\s*single\b/gu, '模式：单体'],
    [/\bHyper Code IDE\b/gu, '超级代码 IDE'],
    [/\bAgent 写小说\b/gu, '智能体写小说'],
  ];

  const modeWord = /\b(single|compose|harness)\b/gu;
  const modeMap = {
    single: '单体',
    compose: '组合',
    harness: '编排',
  };
  const textAttributes = ['title', 'placeholder', 'aria-label', 'aria-description'];
  const skipTags = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT']);

  function preserveOuterWhitespace(original, replacement) {
    const leading = String(original).match(/^\s*/u)?.[0] || '';
    const trailing = String(original).match(/\s*$/u)?.[0] || '';
    return `${leading}${replacement}${trailing}`;
  }

  function normalizeText(value) {
    let next = String(value || '');
    const trimmed = next.trim();
    if (!trimmed) return next;

    if (exactText.has(trimmed)) {
      next = preserveOuterWhitespace(next, exactText.get(trimmed));
    }

    for (const [pattern, replacement] of replacements) {
      next = next.replace(pattern, replacement);
    }

    next = next.replace(modeWord, (match) => modeMap[match] || match);
    return next;
  }

  function normalizeAttributes(element) {
    for (const attribute of textAttributes) {
      const current = element.getAttribute(attribute);
      if (!current) continue;
      const normalized = normalizeText(current);
      if (normalized !== current) {
        element.setAttribute(attribute, normalized);
      }
    }
  }

  function normalizeTextNode(node) {
    const current = node.nodeValue;
    if (!current || !current.trim()) return;
    const normalized = normalizeText(current);
    if (normalized !== current) {
      node.nodeValue = normalized;
    }
  }

  function normalizeFormHints(root) {
    const scope = root.querySelectorAll ? root : document;
    for (const element of scope.querySelectorAll('input[placeholder], textarea[placeholder]')) {
      normalizeAttributes(element);
    }
  }

  function normalizeTree(root) {
    if (!root) return;

    if (root.nodeType === Node.TEXT_NODE) {
      normalizeTextNode(root);
      return;
    }

    if (root.nodeType !== Node.ELEMENT_NODE || skipTags.has(root.tagName)) {
      return;
    }

    normalizeAttributes(root);

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent || skipTags.has(parent.tagName)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });

    let current = walker.nextNode();
    while (current) {
      normalizeTextNode(current);
      current = walker.nextNode();
    }

    for (const element of root.querySelectorAll('*')) {
      if (!skipTags.has(element.tagName)) {
        normalizeAttributes(element);
      }
    }
    normalizeFormHints(root);
  }

  function normalizeDocumentTitle() {
    if (document.title && /Agent 写小说|Hyper Code IDE/u.test(document.title)) {
      document.title = normalizeText(document.title);
    }
  }

  let scheduled = false;
  function scheduleNormalize(root) {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(() => {
      scheduled = false;
      normalizeDocumentTitle();
      normalizeTree(root || document.body || document.documentElement);
    });
  }

  function start() {
    normalizeDocumentTitle();
    normalizeTree(document.body || document.documentElement);

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'characterData') {
          normalizeTextNode(mutation.target);
          continue;
        }
        if (mutation.type === 'attributes') {
          normalizeAttributes(mutation.target);
          continue;
        }
        for (const node of mutation.addedNodes) {
          scheduleNormalize(node);
        }
      }
    });

    observer.observe(document.documentElement, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: textAttributes,
    });

    window.setTimeout(() => scheduleNormalize(document.body || document.documentElement), 80);
    window.setTimeout(() => scheduleNormalize(document.body || document.documentElement), 400);
    window.setTimeout(() => scheduleNormalize(document.body || document.documentElement), 1200);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
