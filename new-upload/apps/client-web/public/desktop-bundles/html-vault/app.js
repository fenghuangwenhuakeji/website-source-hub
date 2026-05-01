const PROJECTS = [
  {
    id: "nexus-os-3",
    title: "NEXUS OS 3.0",
    category: "超无穹",
    sourceType: "单文件 HTML",
    status: "可直接接入",
    tone: "ready",
    route: "./apps/nexus-os-3/index.html",
    sourcePath: "D:\\HTML\\超无穹\\NEXUS OS3.0.html",
    description: "超无穹 NEXUS OS 3.0 单页系统入口，适合作为核心操作系统原型展示。",
    notes: ["替换旧内容展柜后保留为第一入口", "适合继续接入桌面核心生产力区"],
  },
  {
    id: "nexus-auto-writing",
    title: "超无穹自动写作 Nexus",
    category: "超无穹",
    sourceType: "单文件 HTML",
    status: "可直接接入",
    tone: "ready",
    route: "./apps/nexus-auto-writing/index.html",
    sourcePath: "D:\\HTML\\超无穹\\超无穹自动写作nexus.html",
    description: "自动写作与 NEXUS 工作流入口，适合作为创作生产力工具。",
    notes: ["单文件部署，打开速度快", "后续可与长篇和中短篇工作台联动"],
  },
  {
    id: "guangyu-tcm-workbench",
    title: "光玉中医健康工作台",
    category: "陪伴与健康",
    sourceType: "目录项目",
    status: "可直接接入",
    tone: "ready",
    route: "./apps/guangyu-tcm-workbench/index.html",
    sourcePath: "D:\\HTML\\04-陪伴与娱乐原型\\光玉中医健康工作台",
    description: "中医健康评估、观察台与档案页组合成的健康陪伴工作台。",
    notes: ["已复制 index、assets、css、dist、pages", "未复制 node_modules，保持发布包轻量"],
  },
  {
    id: "star-whispers-legacy",
    title: "星语心伴旧版备份",
    category: "陪伴与娱乐",
    sourceType: "目录项目",
    status: "待验证",
    tone: "verify",
    route: "./apps/star-whispers-legacy/index.html",
    sourcePath: "D:\\HTML\\04-陪伴与娱乐原型\\星语心伴_旧版备份_20260419_131850",
    description: "星语心伴旧版备份，保留陪伴聊天、测试画像、星座与档案入口。",
    notes: ["已按新版展柜入口接入", "作为旧版备份，建议上线后再做专项回归"],
  },
  {
    id: "dungeonspire-adapted",
    title: "杀戮地牢适配版",
    category: "游戏互动",
    sourceType: "目录项目",
    status: "待验证",
    tone: "verify",
    route: "./apps/dungeonspire-adapted/index.html",
    sourcePath: "D:\\HTML\\05-游戏与互动体验\\杀戮地牢适配版",
    description: "地牢卡牌与角色战斗系统适配版，适合作为桌面游戏实验入口。",
    notes: ["已复制完整目录项目", "上线后建议重点验证战斗、存档和资源加载"],
  },
  {
    id: "new-tavern",
    title: "新酒馆",
    category: "游戏互动",
    sourceType: "构建产物",
    status: "待验证",
    tone: "verify",
    route: "./apps/new-tavern/index.html",
    sourcePath: "D:\\HTML\\05-游戏与互动体验\\新酒馆",
    description: "新版 AI 酒馆 RPG 原型，使用已构建 dist 版本接入展柜。",
    notes: ["已使用 dist 静态产物，避免直接引用 /src/main.ts", "包含酒馆主界面、战斗、设置和资源包"],
  },
  {
    id: "shadowrift-split-ts",
    title: "ShadowRift Split TS",
    category: "游戏互动",
    sourceType: "目录项目",
    status: "待验证",
    tone: "verify",
    route: "./apps/shadowrift-split-ts/index.html",
    sourcePath: "D:\\HTML\\05-游戏与互动体验\\ShadowRift_split_ts",
    description: "ShadowRift 拆分 TypeScript 版本，保留资源、样式和构建脚本入口。",
    notes: ["已复制 index、assets、css、dist", "项目体积较大，建议上线后单独做加载速度回归"],
  },
];

const toneLabelMap = {
  ready: "可直接接入",
  enhance: "待增强",
  verify: "待验证",
  research: "资料型",
};

const state = {
  activeCategory: "全部",
  query: "",
  selectedProjectId: PROJECTS[0].id,
};

const els = {
  categoryFilters: document.getElementById("categoryFilters"),
  heroStats: document.getElementById("heroStats"),
  projectGrid: document.getElementById("projectGrid"),
  previewMeta: document.getElementById("previewMeta"),
  previewFrame: document.getElementById("previewFrame"),
  launchLink: document.getElementById("launchLink"),
  openSelectedButton: document.getElementById("openSelectedButton"),
  copyLinkButton: document.getElementById("copyLinkButton"),
  resultMeta: document.getElementById("resultMeta"),
  searchInput: document.getElementById("searchInput"),
  showAllButton: document.getElementById("showAllButton"),
};

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getCategories() {
  return ["全部", ...new Set(PROJECTS.map((project) => project.category))];
}

function getSelectedProject() {
  return PROJECTS.find((project) => project.id === state.selectedProjectId) || PROJECTS[0];
}

function getFilteredProjects() {
  const query = state.query.trim().toLowerCase();

  return PROJECTS.filter((project) => {
    const matchesCategory =
      state.activeCategory === "全部" || project.category === state.activeCategory;
    const searchable = [
      project.title,
      project.category,
      project.sourceType,
      project.status,
      project.description,
      project.sourcePath,
      ...project.notes,
    ]
      .join(" ")
      .toLowerCase();

    return matchesCategory && (!query || searchable.includes(query));
  });
}

function renderStats() {
  const stats = [
    ["项目总数", PROJECTS.length],
    ["核心生产力", PROJECTS.filter((project) => project.category === "超无穹").length],
    ["可直接接入", PROJECTS.filter((project) => project.tone === "ready").length],
    ["待验证", PROJECTS.filter((project) => project.tone === "verify").length],
  ];

  els.heroStats.innerHTML = stats
    .map(
      ([label, value]) => `
        <div class="stat-card">
          <div class="stat-label">${escapeHtml(label)}</div>
          <div class="stat-value">${escapeHtml(value)}</div>
        </div>
      `,
    )
    .join("");
}

function renderCategoryFilters() {
  els.categoryFilters.innerHTML = getCategories()
    .map(
      (category) => `
        <button
          class="filter-button ${category === state.activeCategory ? "active" : ""}"
          type="button"
          data-category="${escapeHtml(category)}"
        >
          ${escapeHtml(category)}
        </button>
      `,
    )
    .join("");
}

function renderProjects() {
  const filteredProjects = getFilteredProjects();
  els.resultMeta.textContent = `当前显示 ${filteredProjects.length} / ${PROJECTS.length} 个项目`;

  if (!filteredProjects.length) {
    els.projectGrid.innerHTML = `<div class="empty-state">没有匹配的项目，换个关键词试试。</div>`;
    return;
  }

  els.projectGrid.innerHTML = filteredProjects
    .map(
      (project) => `
        <article
          class="project-card ${project.id === state.selectedProjectId ? "active" : ""}"
          data-project-id="${escapeHtml(project.id)}"
          role="button"
          tabindex="0"
          aria-label="预览 ${escapeHtml(project.title)}"
        >
          <div class="project-topline">
            <span class="status ${escapeHtml(project.tone)}">${escapeHtml(project.status)}</span>
            <span class="pill">${escapeHtml(project.sourceType)}</span>
          </div>
          <h3 class="project-title">${escapeHtml(project.title)}</h3>
          <p class="project-desc">${escapeHtml(project.description)}</p>
          <div class="card-meta">
            <span>${escapeHtml(project.category)}</span>
            <span>${escapeHtml(project.sourcePath)}</span>
          </div>
        </article>
      `,
    )
    .join("");
}

function renderPreview() {
  const project = getSelectedProject();
  const notes = project.notes
    .map((note) => `<li>${escapeHtml(note)}</li>`)
    .join("");

  els.previewMeta.innerHTML = `
    <p class="eyebrow">${escapeHtml(project.category)} / ${escapeHtml(project.sourceType)}</p>
    <h2>${escapeHtml(project.title)}</h2>
    <p class="preview-description">${escapeHtml(project.description)}</p>
    <ul class="detail-list">${notes}</ul>
    <p class="detail-path">源路径：${escapeHtml(project.sourcePath)}</p>
  `;

  els.launchLink.href = project.route;
  els.openSelectedButton.href = project.route;
  els.openSelectedButton.classList.remove("disabled");
  els.openSelectedButton.removeAttribute("aria-disabled");

  if (els.previewFrame.getAttribute("src") !== project.route) {
    els.previewFrame.src = project.route;
  }
}

function renderAll() {
  renderStats();
  renderCategoryFilters();
  renderProjects();
  renderPreview();
}

function selectProject(projectId) {
  state.selectedProjectId = projectId;
  renderProjects();
  renderPreview();
}

els.categoryFilters.addEventListener("click", (event) => {
  const button = event.target.closest("[data-category]");
  if (!button) return;

  state.activeCategory = button.dataset.category;
  renderCategoryFilters();
  renderProjects();
});

els.projectGrid.addEventListener("click", (event) => {
  const card = event.target.closest("[data-project-id]");
  if (!card) return;

  selectProject(card.dataset.projectId);
});

els.projectGrid.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;

  const card = event.target.closest("[data-project-id]");
  if (!card) return;

  event.preventDefault();
  selectProject(card.dataset.projectId);
});

els.searchInput.addEventListener("input", (event) => {
  state.query = event.target.value;
  renderProjects();
});

els.showAllButton.addEventListener("click", () => {
  state.activeCategory = "全部";
  state.query = "";
  els.searchInput.value = "";
  renderAll();
});

els.copyLinkButton.addEventListener("click", async () => {
  const project = getSelectedProject();
  const originalText = els.copyLinkButton.textContent;

  try {
    await navigator.clipboard.writeText(project.route);
    els.copyLinkButton.textContent = "已复制";
  } catch {
    els.copyLinkButton.textContent = "复制失败";
  }

  window.setTimeout(() => {
    els.copyLinkButton.textContent = originalText;
  }, 1400);
});

renderAll();
