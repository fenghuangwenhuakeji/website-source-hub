# 市场分析系统规格文档

## 1. 项目概述

### 1.1 目标
将原有的"智能融合"功能全面升级为"市场分析"系统，提供更全面、具体、详细的网文市场洞察，采用固定结构输出，确保分析结果的完整性和一致性。

### 1.2 核心原则
- **固定结构**：所有分析结果遵循统一的数据结构
- **全面详细**：覆盖市场各个维度的深度分析
- **可复用性**：分析结果可保存、对比、追踪
- **实时性**：基于最新市场数据（2025-2026年）

---

## 2. 功能模块设计

### 2.1 模块总览

```
┌─────────────────────────────────────────────────────────────┐
│                    市场分析系统                              │
├─────────────┬─────────────┬─────────────┬─────────────────┤
│  市场仪表盘  │  题材分析   │  竞品分析   │   创作辅助      │
├─────────────┼─────────────┼─────────────┼─────────────────┤
│ •平台热度   │ •生命周期  │ •TOP作品   │ •热点追踪       │
│ •题材趋势   │ •细分方向  │ •成功因素  │ •素材推荐       │
│ •新书表现   │ •竞争评估  │ •差异化    │ •灵感生成       │
│ •读者偏好   │ •入场建议  │ •机会点    │ •趋势预测       │
└─────────────┴─────────────┴─────────────┴─────────────────┘
```

### 2.2 模块一：市场仪表盘

#### 功能描述
提供网文市场整体概况的快速视图，包括多平台数据对比。

#### 固定输出结构
```javascript
{
  overview: {
    reportTitle: "网文市场分析报告",
    reportDate: "2026-01-15",
    dataPeriod: "2025年12月-2026年1月",
    summary: "市场整体概述文本"
  },
  platformRankings: [
    {
      rank: 1,
      platform: "起点中文网",
      icon: "📕",
      heatIndex: 95,
      activeUsers: "1200万",
      newBooks: 5234,
      topGenre: "玄幻",
      trend: "up" // up/down/stable
    }
  ],
  genreDistribution: [
    {
      genre: "玄幻",
      percentage: 28.5,
      bookCount: 15234,
      avgCollection: 8500,
      trend: "stable"
    }
  ],
  newBookPerformance: {
    totalNew: 12580,
    avgCollection: 3200,
    standoutCount: 156,
    standoutRate: "1.24%"
  },
  readerPreferences: {
    ageGroups: [
      { group: "18-24岁", percentage: 35 },
      { group: "25-30岁", percentage: 28 },
      { group: "31-35岁", percentage: 20 },
      { group: "36岁以上", percentage: 17 }
    ],
    readingTime: [
      { period: "早晨", percentage: 15 },
      { period: "午休", percentage: 25 },
      { period: "晚间", percentage: 45 },
      { period: "深夜", percentage: 15 }
    ],
    paymentWillingness: 68.5
  }
}
```

#### 分析维度
1. **平台排行**：热度指数、活跃用户、新书数量
2. **题材分布**：各题材占比、收藏均值、趋势变化
3. **新书表现**：总量、均值、爆款率
4. **读者画像**：年龄、阅读时段、付费意愿

---

### 2.3 模块二：题材深度分析

#### 功能描述
针对特定题材进行全方位深度分析，帮助创作者找准切入点。

#### 固定输出结构
```javascript
{
  genreOverview: {
    genreName: "玄幻",
    lifeCycle: "成熟期", // 导入期/成长期/成熟期/衰退期
    marketSize: "35%",
    growthRate: "+2.3%",
    competitionLevel: "高", // 低/中/高
    saturation: 78
  },
  subGenres: [
    {
      name: "东方玄幻",
      heat: 92,
      bookCount: 5234,
      avgCollection: 12000,
      competition: "极高",
      opportunity: "传统套路仍有市场，但需创新"
    },
    {
      name: "异世大陆",
      heat: 85,
      bookCount: 4123,
      avgCollection: 9800,
      competition: "高",
      opportunity: "系统流、种田流仍有空间"
    }
  ],
  trendAnalysis: {
    risingElements: ["系统流", "签到流", "模拟器流"],
    decliningElements: ["废柴流", "退婚流"],
    emergingTrends: ["克系玄幻", "赛博修仙"],
    prediction: "未来6个月趋势预测文本"
  },
  readerAnalysis: {
    coreDemographics: "18-30岁男性为主",
    preferences: ["升级爽感", "世界观宏大", "战斗描写"],
    painPoints: ["套路重复", "后期崩坏", "注水严重"],
    unmetNeeds: ["女性向玄幻", "轻松搞笑玄幻"]
  },
  competitiveLandscape: {
    topPlayers: ["天蚕土豆", "辰东", "我吃西红柿"],
    marketConcentration: "CR5: 45%",
    barrierToEntry: "中高",
    differentiationOpportunities: ["细分题材", "创新设定", "跨界融合"]
  },
  entryStrategy: {
    recommendedSubGenre: "克系玄幻",
    positioning: "差异化创新",
    estimatedInvestment: "3-6个月",
    successProbability: "中等",
    keySuccessFactors: ["创新设定", "稳定更新", "精准定位"]
  }
}
```

#### 分析维度
1. **生命周期**：判断题材所处阶段
2. **细分方向**：各子题材的热度、竞争、机会
3. **趋势分析**：上升/下降元素、新兴趋势
4. **读者分析**：人群画像、偏好、痛点
5. **竞争格局**：头部玩家、集中度、壁垒
6. **入场策略**：推荐方向、定位、成功要素

---

### 2.4 模块三：竞品分析

#### 功能描述
深度拆解特定作品或竞品，提取成功要素和差异化机会。

#### 固定输出结构
```javascript
{
  workProfile: {
    title: "诡秘之主",
    author: "爱潜水的乌贼",
    platform: "起点中文网",
    genre: "异世大陆",
    wordCount: "446万字",
    status: "已完结",
    rating: 9.2,
    collections: 850000,
    recommendationCount: 1200000,
    rankingHistory: [1, 1, 2, 1, 1, 3, 1]
  },
  structureAnalysis: {
    chapterStructure: "经典三幕式",
    pacingCurve: [
      { stage: "开篇", wordCount: 50000, tension: 85 },
      { stage: "发展", wordCount: 200000, tension: 75 },
      { stage: "高潮", wordCount: 150000, tension: 95 },
      { stage: "结局", wordCount: 46000, tension: 80 }
    ],
    hookDesign: {
      openingHook: "穿越+神秘序列",
      chapterHooks: "每章结尾悬念",
      arcHooks: "大事件驱动"
    }
  },
  characterAnalysis: {
    protagonist: {
      name: "克莱恩",
      archetype: "成长型主角",
      characterArc: "普通人→愚者",
      strengths: ["谨慎", "智慧", "善良"],
      flaws: ["犹豫", "过于谨慎"]
    },
    supportingCast: [
      { name: "阿尔杰", role: "导师", function: "引导主角" },
      { name: "奥黛丽", role: "同伴", function: "情感线" }
    ],
    characterRelationships: "关系图谱描述"
  },
  worldBuilding: {
    settingType: "维多利亚+克苏鲁",
    magicSystem: "22条神之序列",
    uniqueElements: ["魔药体系", "塔罗会", "封印物"],
    consistency: 9.5
  },
  writingTechnique: {
    narrativeStyle: "第三人称限知视角",
    strengths: ["悬念设置", "伏笔回收", "群像刻画"],
    distinctiveFeatures: ["克系氛围", "细节考究", "多线叙事"],
    learnablePoints: ["悬念节奏", "世界观展开", "人物塑造"]
  },
  commercialAnalysis: {
    revenueEstimate: "千万级",
    fanBase: "核心粉丝50万+",
    ipPotential: "极高",
    adaptationValue: "已改编漫画、动画、游戏",
    successFactors: ["创新设定", "稳定更新", "口碑发酵"]
  },
  differentiationOpportunities: [
    "同世界观不同序列",
    "现代背景克系",
    "轻松向克系"
  ]
}
```

#### 分析维度
1. **作品档案**：基本信息、数据表现
2. **结构分析**：节奏、钩子设计
3. **人物分析**：主角弧光、配角功能
4. **世界观**：设定类型、创新点
5. **写作技法**：叙事风格、可学之处
6. **商业分析**：收入、IP潜力
7. **差异化机会**：可借鉴的创新方向

---

### 2.5 模块四：创作辅助

#### 功能描述
基于市场分析结果，提供创作灵感和素材推荐。

#### 固定输出结构
```javascript
{
  hotTopics: [
    {
      topic: "系统流+末日求生",
      heat: 92,
      examples: ["全球高武", "末日乐园"],
      opportunity: "系统与末日的结合仍有空间"
    }
  ],
  recommendedMaterials: [
    {
      type: "场景设定",
      content: "赛博朋克风格的城市描写素材",
      source: "AI生成"
    }
  ],
  inspirationPrompts: [
    "如果修仙者生活在现代都市...",
    "一个只能说谎的系统..."
  ],
  trendForecasts: [
    {
      timeframe: "未来3个月",
      prediction: "轻松向作品需求上升",
      confidence: 75
    }
  ]
}
```

---

## 3. 数据模型设计

### 3.1 核心数据模型

```javascript
// 市场分析报告模型
MarketAnalysisReport {
  id: String,           // 报告ID
  type: Enum,           // dashboard/genre/competitor/assistant
  title: String,        // 报告标题
  createdAt: DateTime,  // 创建时间
  dataPeriod: String,   // 数据周期
  parameters: Object,   // 分析参数
  result: Object,       // 分析结果（固定结构）
  chatHistory: Array,   // 追问历史
  tags: Array,          // 标签
  isFavorite: Boolean   // 是否收藏
}

// 平台数据模型
PlatformData {
  id: String,
  name: String,
  icon: String,
  heatIndex: Number,
  activeUsers: String,
  newBooks: Number,
  topGenre: String,
  trend: Enum,          // up/down/stable
  lastUpdated: DateTime
}

// 题材数据模型
GenreData {
  id: String,
  name: String,
  category: String,     // 主分类
  lifeCycle: Enum,      // 导入期/成长期/成熟期/衰退期
  marketShare: Number,  // 市场份额
  growthRate: Number,   // 增长率
  competitionLevel: Enum, // 低/中/高
  subGenres: Array,     // 子题材
  trends: Object,       // 趋势数据
  lastUpdated: DateTime
}

// 作品数据模型
WorkData {
  id: String,
  title: String,
  author: String,
  platform: String,
  genre: String,
  wordCount: String,
  status: Enum,         // 连载/完结
  rating: Number,
  collections: Number,
  recommendations: Number,
  analysis: Object,     // 分析结果
  lastUpdated: DateTime
}
```

### 3.2 数据关系图

```
┌────────────────────────────────────────────────────────────┐
│                    MarketAnalysisReport                     │
├────────────────────────────────────────────────────────────┤
│ 1:N  PlatformData                                          │
│ 1:N  GenreData                                             │
│ 1:N  WorkData                                              │
│ N:M  Tags                                                  │
└────────────────────────────────────────────────────────────┘
```

---

## 4. API接口设计

### 4.1 核心接口

#### 4.1.1 生成市场仪表盘
```
POST /api/market/dashboard
Request:
{
  platforms: ["qidian", "fanqie"],  // 平台列表
  period: "month",                   // 周期：week/month/quarter
  dimensions: ["ranking", "genre"]   // 分析维度
}

Response:
{
  success: true,
  data: MarketAnalysisReport,
  message: "分析完成"
}
```

#### 4.1.2 题材深度分析
```
POST /api/market/genre-analysis
Request:
{
  genre: "fantasy",                  // 题材
  subGenres: ["xianxia", "xuanhuan"], // 子题材
  depth: "full"                      // 深度：basic/full
}

Response:
{
  success: true,
  data: MarketAnalysisReport,
  message: "分析完成"
}
```

#### 4.1.3 竞品分析
```
POST /api/market/competitor-analysis
Request:
{
  workTitle: "诡秘之主",             // 作品名
  dimensions: ["structure", "character", "worldview"], // 分析维度
  compareWith: ["作品A", "作品B"]    // 对比作品（可选）
}

Response:
{
  success: true,
  data: MarketAnalysisReport,
  message: "分析完成"
}
```

#### 4.1.4 创作辅助
```
POST /api/market/creative-assistant
Request:
{
  genre: "fantasy",                  // 题材
  topic: "系统流",                   // 主题
  type: "inspiration"                // 类型：inspiration/material/trend
}

Response:
{
  success: true,
  data: {
    hotTopics: Array,
    materials: Array,
    inspirations: Array,
    forecasts: Array
  },
  message: "生成完成"
}
```

#### 4.1.5 追问对话
```
POST /api/market/chat
Request:
{
  reportId: "report-123",            // 报告ID
  message: "请详细分析玄幻题材的竞争格局" // 追问内容
}

Response:
{
  success: true,
  data: {
    reply: String,                   // AI回复
    updatedReport: MarketAnalysisReport
  },
  message: "回复完成"
}
```

### 4.2 数据管理接口

#### 4.2.1 保存报告
```
POST /api/market/reports/save
Request:
{
  report: MarketAnalysisReport
}

Response:
{
  success: true,
  data: { id: String },
  message: "保存成功"
}
```

#### 4.2.2 获取报告列表
```
GET /api/market/reports?type=genre&page=1&limit=20

Response:
{
  success: true,
  data: {
    list: [MarketAnalysisReport],
    total: 100,
    page: 1,
    limit: 20
  }
}
```

#### 4.2.3 删除报告
```
DELETE /api/market/reports/:id

Response:
{
  success: true,
  message: "删除成功"
}
```

---

## 5. 图书馆系统改造

### 5.1 新增分类

```
图书馆
├── 📚 书籍（原有）
├── 📝 提示词（原有）
└── 📊 市场报告（新增）
    ├── 市场仪表盘
    ├── 题材分析
    ├── 竞品分析
    └── 创作辅助
```

### 5.2 功能增强

1. **报告管理**
   - 保存市场分析报告
   - 标签分类
   - 收藏功能
   - 导出PDF/Markdown

2. **对比功能**
   - 多报告对比
   - 趋势追踪
   - 数据可视化

3. **关联推荐**
   - 相似报告推荐
   - 相关书籍推荐
   - 关联提示词推荐

---

## 6. 记忆系统改造

### 6.1 记忆类型

```javascript
// 用户偏好记忆
UserPreferenceMemory {
  favoriteGenres: ["fantasy", "scifi"],     // 偏好题材
  preferredPlatforms: ["qidian"],            // 偏好平台
  analysisDepth: "full",                     // 分析深度偏好
  defaultDimensions: ["structure", "character"], // 默认分析维度
  lastUsedFeatures: ["genre-analysis"],      // 最近使用功能
  savedTemplates: ["template-1", "template-2"] // 保存的模板
}

// 分析历史记忆
AnalysisHistoryMemory {
  recentReports: ["report-1", "report-2"],   // 最近报告
  frequentGenres: ["fantasy: 15次", "romance: 8次"], // 频繁分析题材
  searchKeywords: ["系统流", "末日"],        // 搜索关键词
  comparisonPairs: [["作品A", "作品B"]]      // 常对比的作品
}

// 创作洞察记忆
CreativeInsightMemory {
  successfulPatterns: ["pattern-1"],         // 成功模式
  failedAttempts: ["attempt-1"],             // 失败尝试
  preferredStyles: ["轻松", "悬疑"],         // 偏好风格
  inspirationPool: ["灵感1", "灵感2"]        // 灵感池
}
```

### 6.2 记忆应用

1. **个性化推荐**
   - 根据偏好推荐分析维度
   - 推荐相关题材
   - 推荐相似作品

2. **智能填充**
   - 自动填充常用参数
   - 记住上次分析设置
   - 推荐历史搜索

3. **趋势追踪**
   - 追踪关注的题材变化
   - 提醒市场机会
   - 对比历史数据

---

## 7. 用户界面设计

### 7.1 布局结构

```
┌─────────────────────────────────────────────────────────────┐
│  顶部导航栏                                                   │
│  📊 市场分析 | 🚀 生产流水线 | 📖 短篇拆书 | ✍️ 短篇写作      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────┬────────────────────────────────┐ │
│  │                      │                                │ │
│  │   控制面板            │         结果展示区域            │ │
│  │   (Control Panel)    │         (Result Panel)          │ │
│  │                      │                                │ │
│  │  ┌────────────────┐  │  ┌──────────────────────────┐  │ │
│  │  │ 模式选择标签    │  │  │                          │  │ │
│  │  │ •市场仪表盘    │  │  │     分析结果/图表          │  │ │
│  │  │ •题材分析      │  │  │                          │  │ │
│  │  │ •竞品分析      │  │  │                          │  │ │
│  │  │ •创作辅助      │  │  │                          │  │ │
│  │  └────────────────┘  │  └──────────────────────────┘  │ │
│  │                      │                                │ │
│  │  ┌────────────────┐  │  ┌──────────────────────────┐  │ │
│  │  │ 参数配置区      │  │  │      追问对话区           │  │ │
│  │  │ •平台选择      │  │  │                          │  │ │
│  │  │ •维度选择      │  │  │  [用户消息]               │  │ │
│  │  │ •时间范围      │  │  │  [AI回复]                │  │ │
│  │  └────────────────┘  │  │  [输入框] [发送]          │  │ │
│  │                      │  │                          │  │ │
│  │  [开始分析按钮]       │  └──────────────────────────┘  │ │
│  │                      │                                │ │
│  └──────────────────────┴────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 交互流程

1. **选择分析模式**
   - 点击模式标签切换
   - 控制面板动态更新

2. **配置分析参数**
   - 选择平台/题材/维度
   - 自定义标签
   - 编辑提示词（可选）

3. **执行分析**
   - 点击分析按钮
   - 显示加载状态
   - 流式输出结果

4. **查看结果**
   - 结构化展示
   - 表格/图表可视化
   - 支持复制/保存

5. **追问对话**
   - 输入追问内容
   - AI深度解答
   - 保存对话历史

---

## 8. 技术实现要点

### 8.1 数据流

```
用户操作 → 参数收集 → AI请求 → 流式输出 → 结果解析 → 结构化存储 → UI渲染
```

### 8.2 缓存策略

1. **短期缓存**：最近分析报告缓存30分钟
2. **长期缓存**：题材基础数据缓存24小时
3. **用户缓存**：用户偏好和记忆本地存储

### 8.3 性能优化

1. **懒加载**：报告列表分页加载
2. **虚拟滚动**：长报告内容虚拟滚动
3. **增量更新**：只更新变化的部分

---

## 9. 验收标准

### 9.1 功能验收

- [ ] 4个分析模式全部可用
- [ ] 固定数据结构输出
- [ ] 流式输出正常
- [ ] 追问对话可用
- [ ] 报告保存/管理正常
- [ ] 图书馆集成正常
- [ ] 记忆系统工作正常

### 9.2 性能验收

- [ ] 分析响应时间 < 30秒
- [ ] 流式输出延迟 < 500ms
- [ ] 页面加载时间 < 2秒
- [ ] 大数据量渲染流畅

### 9.3 用户体验验收

- [ ] 界面清晰易懂
- [ ] 操作流程顺畅
- [ ] 错误提示明确
- [ ] 数据展示直观

---

## 10. 开发计划

### 第一阶段：核心功能（2周）
- 市场仪表盘模块
- 题材分析模块
- 基础UI框架

### 第二阶段：深度功能（2周）
- 竞品分析模块
- 创作辅助模块
- 追问对话功能

### 第三阶段：系统集成（1周）
- 图书馆改造
- 记忆系统改造
- 数据持久化

### 第四阶段：优化测试（1周）
- 性能优化
- Bug修复
- 用户体验优化

---

**文档版本**: v1.0  
**创建日期**: 2026-01-15  
**最后更新**: 2026-01-15
