const PROJECTS = [
  {
    id: "star-whispers",
    title: "星语心伴",
    category: "AI陪伴",
    sourceType: "目录项目",
    status: "可直接接入",
    tone: "ready",
    route: "./apps/star-whispers/index.html",
    sourcePath: "D:\\HTML\\星语心伴",
    description: "AI 心理陪伴、塔罗、八字、测试与对话混合在一起的完整原型，内容密度很高。",
    notes: ["适合作为桌面内容型应用", "后续可接账号体系、会话记录和支付能力"],
  },
  {
    id: "quantalpha-pro",
    title: "量化金融",
    category: "工具研究",
    sourceType: "目录项目",
    status: "可直接接入",
    tone: "ready",
    route: "./apps/quantalpha-pro/index.html",
    sourcePath: "D:\\HTML\\量化金融",
    description: "量化策略、回测、数据分析和 AI 助手都在一页里，适合作为桌面工作台型工具。",
    notes: ["适合后续接入本地数据导入", "建议补真正的策略存储和任务队列"],
  },
  {
    id: "dungeonspire",
    title: "DungeonSpire",
    category: "游戏互动",
    sourceType: "目录项目",
    status: "待增强",
    tone: "enhance",
    route: "./apps/dungeonspire/index.html",
    sourcePath: "D:\\HTML\\杀戮地牢适配版(1)",
    description: "大型地牢卡牌引擎，数据和系统层很完整，适合沉淀成桌面端游戏实验场。",
    notes: ["已经有完整目录结构", "后续适合加存档同步和桌面专属窗口模式"],
  },
  {
    id: "suno-workbench",
    title: "Suno 工作台",
    category: "创作工具",
    sourceType: "压缩包项目",
    status: "可直接接入",
    tone: "ready",
    route: "./apps/suno-workbench/index.html",
    sourcePath: "D:\\HTML\\Suno工作台开发.zip",
    description: "歌词、提示词、创作建议集中在一起，适合作为音乐创作侧边工作台。",
    notes: ["已从 zip 解包纳入展柜", "后续可接本地素材库和导出流程"],
  },
  {
    id: "tavern-game",
    title: "TAVERN GAME",
    category: "游戏互动",
    sourceType: "压缩包项目",
    status: "待验证",
    tone: "verify",
    route: "./apps/tavern-game/index.html",
    sourcePath: "D:\\HTML\\TAVERN_GAME.zip",
    description: "完整项目型酒馆游戏原型，规模比单页大，已经先纳入内容库统一承接。",
    notes: ["已从 zip 解包纳入展柜", "建议后续单独做玩法链路和性能测试"],
  },
  {
    id: "shadow-rift",
    title: "暗影裂隙 v2.0",
    category: "游戏互动",
    sourceType: "单文件 HTML",
    status: "可直接接入",
    tone: "ready",
    route: "./apps/shadow-rift/index.html",
    sourcePath: "D:\\HTML\\ShadowRift_v2.0_Portable_optimized_nomutation_final_v3_riftfix.html",
    description: "超大单文件游戏原型，视觉和内容都比较完整，适合直接作为桌面展柜入口。",
    notes: ["单文件部署简单", "建议后续拆资源和场景，降低维护成本"],
  },
  {
    id: "shadow-expedition",
    title: "暗影征途",
    category: "游戏互动",
    sourceType: "单文件 HTML",
    status: "可直接接入",
    tone: "ready",
    route: "./apps/shadow-expedition/index.html",
    sourcePath: "D:\\HTML\\暗影征途.html",
    description: "卡牌 Roguelike 原型，适合做桌面端轻量游戏入口。",
    notes: ["适合作为快启小游戏", "建议补局内返回和进度记录"],
  },
  {
    id: "ashes-road",
    title: "灰烬之路",
    category: "游戏互动",
    sourceType: "单文件 HTML",
    status: "可直接接入",
    tone: "ready",
    route: "./apps/ashes-road/index.html",
    sourcePath: "D:\\HTML\\灰烬之路.html",
    description: "文字互动型内容，和桌面平台的叙事/创作生态比较契合。",
    notes: ["适合后续接统一阅读器壳层", "可以继续扩充章节与存档"],
  },
  {
    id: "script-studio",
    title: "剧本编写系统",
    category: "创作工具",
    sourceType: "单文件 HTML",
    status: "可直接接入",
    tone: "ready",
    route: "./apps/script-studio/index.html",
    sourcePath: "D:\\HTML\\剧本软件.html",
    description: "剧本创作工具，已经具备独立应用气质，适合做写作工具组的一员。",
    notes: ["适合与主程序写作能力打通", "后续可补云端保存和角色卡"],
  },
  {
    id: "mojuan-writer",
    title: "墨卷",
    category: "创作工具",
    sourceType: "单文件 HTML",
    status: "可直接接入",
    tone: "ready",
    route: "./apps/mojuan-writer/index.html",
    sourcePath: "D:\\HTML\\墨卷.html",
    description: "小说写作工具，适合在桌面平台里做成快速创作入口。",
    notes: ["适合和短篇/长篇工作流联动", "建议后续补目录和草稿版本管理"],
  },
  {
    id: "thesis-writer",
    title: "论文写作待修复",
    category: "创作工具",
    sourceType: "单文件 HTML",
    status: "待增强",
    tone: "enhance",
    route: "./apps/thesis-writer/index.html",
    sourcePath: "D:\\HTML\\论文写作待修复.html",
    description: "学术写作助手雏形已经在，但名字本身就说明还需要专门修复一轮。",
    notes: ["已纳入统一入口", "建议后续单独修排版、导出和引用能力"],
  },
  {
    id: "meta-market-report",
    title: "元叙事市场调研报告",
    category: "工具研究",
    sourceType: "单文件 HTML",
    status: "资料型",
    tone: "research",
    route: "./apps/meta-market-report/index.html",
    sourcePath: "D:\\HTML\\元叙事市场调研报告.html",
    description: "偏阅读展示的研究资料，适合归档到桌面内容中心统一查看。",
    notes: ["资料型内容适合只读浏览", "后续可补检索和书签能力"],
  },
  {
    id: "ml-math-lab",
    title: "机器学习的数学原理",
    category: "工具研究",
    sourceType: "单文件 HTML",
    status: "可直接接入",
    tone: "ready",
    route: "./apps/ml-math-lab/index.html",
    sourcePath: "D:\\HTML\\机器学习的数学原理.html",
    description: "互动学习型页面，适合作为桌面里的学习模块和知识实验页。",
    notes: ["适合放入学习分区", "后续可补进度记录和知识卡片"],
  },
  {
    id: "watermark-tool",
    title: "去水印工具",
    category: "工具研究",
    sourceType: "单文件 HTML",
    status: "可直接接入",
    tone: "ready",
    route: "./apps/watermark-tool/index.html",
    sourcePath: "D:\\HTML\\去水印.html",
    description: "功能明确的小工具，放到桌面平台里最适合做即开即用工具位。",
    notes: ["工具型项目上桌面收益很高", "后续可补批处理与文件拖拽"],
  },
  {
    id: "nuvis-voice",
    title: "AI Voice Call",
    category: "AI陪伴",
    sourceType: "单文件 HTML",
    status: "待增强",
    tone: "enhance",
    route: "./apps/nuvis-voice/index.html",
    sourcePath: "D:\\HTML\\努维斯.HTML",
    description: "实时语音交互型原型，方向适合桌面，但需要继续补稳定性和设备权限流程。",
    notes: ["适合作为语音实验入口", "建议后续补麦克风权限和状态反馈"],
  },
  {
    id: "cyber-girl",
    title: "赛博电子女友",
    category: "AI陪伴",
    sourceType: "单文件 HTML",
    status: "可直接接入",
    tone: "ready",
    route: "./apps/cyber-girl/index.html",
    sourcePath: "D:\\HTML\\赛博电子女友.html",
    description: "角色陪伴型页面，和桌面平台的角色生态方向天然接近。",
    notes: ["适合做陪伴类入口", "后续可接统一角色记忆和登录态"],
  },
  {
    id: "cyber-pet",
    title: "赛博电子宠物",
    category: "AI陪伴",
    sourceType: "单文件 HTML",
    status: "可直接接入",
    tone: "ready",
    route: "./apps/cyber-pet/index.html",
    sourcePath: "D:\\HTML\\赛博电子宠物.html",
    description: "更偏轻娱乐和养成的陪伴页，适合桌面端长期悬挂。",
    notes: ["适合做轻量常驻应用", "可后续接签到、成长和提醒能力"],
  },
  {
    id: "fortune-fusion",
    title: "融合画像",
    category: "AI陪伴",
    sourceType: "单文件 HTML",
    status: "待增强",
    tone: "enhance",
    route: "./apps/fortune-fusion/index.html",
    sourcePath: "D:\\HTML\\赛博算命娱乐向.html",
    description: "MBTI、八字、塔罗混合的娱乐向页面，适合和星语心伴组成同一内容分组。",
    notes: ["适合娱乐向内容位", "建议后续补结果解释和分享样式"],
  },
  {
    id: "snake-modern",
    title: "贪吃蛇",
    category: "游戏互动",
    sourceType: "单文件 HTML",
    status: "可直接接入",
    tone: "ready",
    route: "./apps/snake-modern/index.html",
    sourcePath: "D:\\HTML\\贪吃蛇.html",
    description: "标准小游戏，适合桌面里的快启娱乐模块。",
    notes: ["适合直接上桌面", "后续可补积分榜和键位设置"],
  },
  {
    id: "snake-classic",
    title: "Snake",
    category: "游戏互动",
    sourceType: "单文件 HTML",
    status: "可直接接入",
    tone: "ready",
    route: "./apps/snake-classic/index.html",
    sourcePath: "D:\\HTML\\snake-game.html",
    description: "更轻的英文版贪吃蛇原型，适合作为基础小游戏示例。",
    notes: ["单文件轻量", "适合做多语言小游戏模板"],
  },
  {
    id: "snake-engine-lab",
    title: "SNAKE ENGINE",
    category: "游戏互动",
    sourceType: "单文件 HTML",
    status: "待增强",
    tone: "enhance",
    route: "./apps/snake-engine-lab/index.html",
    sourcePath: "D:\\HTML\\贪吃蛇 .HTML",
    description: "偏逻辑实验器方向，不只是玩，而是适合作为交互逻辑演示页。",
    notes: ["适合作为实验型展示", "后续可补调试面板和速度控制"],
  },
  {
    id: "tetris-classic",
    title: "俄罗斯方块",
    category: "游戏互动",
    sourceType: "单文件 HTML",
    status: "可直接接入",
    tone: "ready",
    route: "./apps/tetris-classic/index.html",
    sourcePath: "D:\\HTML\\俄罗斯方块.html",
    description: "经典小游戏，适合内容展柜中的即开即玩区域。",
    notes: ["桌面承接成本低", "可后续加排行榜和皮肤"],
  },
  {
    id: "pinball-breaker",
    title: "弹球消砖",
    category: "游戏互动",
    sourceType: "单文件 HTML",
    status: "可直接接入",
    tone: "ready",
    route: "./apps/pinball-breaker/index.html",
    sourcePath: "D:\\HTML\\弹球.html",
    description: "轻量街机项目，适合作为桌面娱乐区的补充。",
    notes: ["适合快开快关", "后续可补音效和关卡配置"],
  },
  {
    id: "texas-holdem",
    title: "德州扑克",
    category: "游戏互动",
    sourceType: "单文件 HTML",
    status: "可直接接入",
    tone: "ready",
    route: "./apps/texas-holdem/index.html",
    sourcePath: "D:\\HTML\\德州扑克.html",
    description: "牌类互动原型，适合纳入桌面游戏分区。",
    notes: ["适合作为单机棋牌入口", "后续可补 AI 对手和局内记录"],
  },
  {
    id: "doudizhu-classic",
    title: "经典斗地主",
    category: "游戏互动",
    sourceType: "单文件 HTML",
    status: "可直接接入",
    tone: "ready",
    route: "./apps/doudizhu-classic/index.html",
    sourcePath: "D:\\HTML\\斗地主.html",
    description: "本地棋牌项目，适合桌面端棋牌娱乐区。",
    notes: ["适合统一归档到娱乐分区", "后续可补托管和难度设置"],
  },
];

const state = {
  activeCategory: "全部",
  search: "",
  selectedId: PROJECTS[0]?.id ?? "",
};

const categoryFilters = document.getElementById("categoryFilters");
const heroStats = document.getElementById("heroStats");
const projectGrid = document.getElementById("projectGrid");
const previewMeta = document.getElementById("previewMeta");
const previewFrame = document.getElementById("previewFrame");
const launchLink = document.getElementById("launchLink");
const openSelectedButton = document.getElementById("openSelectedButton");
const copyLinkButton = document.getElementById("copyLinkButton");
const resultMeta = document.getElementById("resultMeta");
const searchInput = document.getElementById("searchInput");
const showAllButton = document.getElementById("showAllButton");

const categories = ["全部", ...new Set(PROJECTS.map((item) => item.category))];

const toneLabelMap = {
  ready: "可直接接入",
  enhance: "待增强",
  verify: "待验证",
  research: "资料型",
};

function getSelectedProject() {
  return PROJECTS.find((item) => item.id === state.selectedId) ?? PROJECTS[0];
}

function getFilteredProjects() {
  return PROJECTS.filter((item) => {
    const byCategory = state.activeCategory === "全部" || item.category === state.activeCategory;
    const keyword = state.search.trim().toLowerCase();
    const text = `${item.title} ${item.category} ${item.description} ${item.notes.join(" ")}`.toLowerCase();
    const bySearch = !keyword || text.includes(keyword);
    return byCategory && bySearch;
  });
}

function renderHeroStats() {
  const readyCount = PROJECTS.filter((item) => item.tone === "ready").length;
  const researchCount = PROJECTS.filter((item) => item.tone === "research").length;
  heroStats.innerHTML = `
    <div class="stat-card">
      <div class="stat-label">项目总数</div>
      <div class="stat-value">${PROJECTS.length}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">可直接接入</div>
      <div class="stat-value">${readyCount}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">资料与研究</div>
      <div class="stat-value">${researchCount}</div>
    </div>
  `;
}

function renderFilters() {
  categoryFilters.innerHTML = categories
    .map(
      (category) => `
        <button
          type="button"
          class="filter-button ${category === state.activeCategory ? "active" : ""}"
          data-category="${category}"
        >
          ${category}
        </button>
      `,
    )
    .join("");

  categoryFilters.querySelectorAll("[data-category]").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeCategory = button.dataset.category ?? "全部";
      render();
    });
  });
}

function renderGrid() {
  const items = getFilteredProjects();

  if (!items.some((item) => item.id === state.selectedId) && items[0]) {
    state.selectedId = items[0].id;
  }

  resultMeta.textContent = `当前显示 ${items.length} / ${PROJECTS.length} 个项目`;

  if (!items.length) {
    projectGrid.innerHTML = `
      <div class="empty-state">
        当前筛选下没有项目，换个关键词或者切回“全部”试试。
      </div>
    `;
    return;
  }

  projectGrid.innerHTML = items
    .map(
      (item) => `
        <article class="project-card ${item.id === state.selectedId ? "active" : ""}" data-project-id="${item.id}">
          <div class="project-topline">
            <span class="status ${item.tone}">${toneLabelMap[item.tone]}</span>
            <span class="pill">${item.sourceType}</span>
          </div>
          <h3 class="project-title">${item.title}</h3>
          <p class="project-desc">${item.description}</p>
          <div class="card-meta">
            <span>${item.category}</span>
            <span>${item.sourcePath}</span>
          </div>
        </article>
      `,
    )
    .join("");

  projectGrid.querySelectorAll("[data-project-id]").forEach((card) => {
    card.addEventListener("click", () => {
      state.selectedId = card.dataset.projectId ?? PROJECTS[0].id;
      render();
    });
  });
}

function renderPreview() {
  const project = getSelectedProject();
  if (!project) {
    return;
  }

  previewMeta.innerHTML = `
    <p class="eyebrow">${project.category} / ${project.sourceType}</p>
    <h2>${project.title}</h2>
    <p class="preview-description">${project.description}</p>
    <ul class="detail-list">
      ${project.notes.map((note) => `<li>${note}</li>`).join("")}
    </ul>
    <p class="detail-path">源路径：<code>${project.sourcePath}</code></p>
  `;

  previewFrame.src = project.route;
  launchLink.href = project.route;
  openSelectedButton.href = project.route;
  openSelectedButton.classList.remove("disabled");
  openSelectedButton.setAttribute("aria-disabled", "false");
}

function render() {
  renderFilters();
  renderGrid();
  renderPreview();
}

copyLinkButton.addEventListener("click", async () => {
  const project = getSelectedProject();
  if (!project) {
    return;
  }

  try {
    await navigator.clipboard.writeText(project.route);
    copyLinkButton.textContent = "已复制";
    window.setTimeout(() => {
      copyLinkButton.textContent = "复制相对路径";
    }, 1500);
  } catch (error) {
    copyLinkButton.textContent = "复制失败";
    window.setTimeout(() => {
      copyLinkButton.textContent = "复制相对路径";
    }, 1500);
    console.error(error);
  }
});

searchInput.addEventListener("input", (event) => {
  state.search = event.target.value;
  render();
});

showAllButton.addEventListener("click", () => {
  state.activeCategory = "全部";
  state.search = "";
  searchInput.value = "";
  render();
});

renderHeroStats();
render();
