# Brainstorm Agent - 架构设计文档

## 文档信息

| 项目 | 内容 |
|------|------|
| 文档版本 | v1.0.0 |
| 创建日期 | 2026-03-17 |
| 最后更新 | 2026-03-17 |
| 文档状态 | 初始版本 |

---

## 1. 系统架构

```
┌─────────────────────────────────────────────────────────┐
│                   Brainstorm Agent                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │ 市场分析 │  │ 标签组合 │  │ 标题生成 │              │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘              │
│       │             │             │                     │
│       └─────────────┼─────────────┘                     │
│                     ▼                                   │
│  ┌─────────────────────────────────────┐               │
│  │           创意引擎                   │               │
│  └─────────────────────────────────────┘               │
│                     │                                   │
│       ┌─────────────┼─────────────┐                     │
│       ▼             ▼             ▼                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐              │
│  │ 脑洞拓展 │ │ 情绪设计 │ │ 输出清单 │              │
│  └──────────┘ └──────────┘ └──────────┘              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 2. 数据模型

```typescript
// 标题定义
interface Title {
  id: string;
  text: string;
  category: MainCategory;
  tags: Tag[];
  formula: TitleFormula;
  wordCount: number;
}

// 脑洞定义
interface Brainstorm {
  id: string;
  titleId: string;
  coreIdea: string;        // 核心梗
  category: string;        // 分类标签
  emotionChain: string;    // 情绪链条
  protagonist: string;     // 主角设定
  opening: string;         // 开篇钩子
  climaxPoints: string;    // 爽点设计
  differentiation: string; // 差异化
  totalWords: number;      // 500字
}

// 市场趋势
interface MarketTrend {
  year: number;
  hotTopics: string[];
  popularTags: string[];
  emotionTrends: string[];
}

// 输出结果
interface BrainstormResult {
  titles: Title[];
  brainstorms: Brainstorm[];
  categoryDistribution: Map<MainCategory, number>;
  trendAnalysis: MarketTrend;
}
```

---

## 3. 核心流程

```
市场输入 → 趋势分析 → 标签组合 → 标题生成 → 脑洞拓展 → 清单输出
```

---

## 4. 标题公式引擎

```typescript
interface ITitleFormula {
  // 公式1: 身份反差+行为突变
  identityContrast(params: IdentityParams): string;
  
  // 公式2: 平淡开局+意外转折
  unexpectedTwist(params: TwistParams): string;
  
  // 公式3: 暧昧情景+合理借口
  ambiguousScene(params: AmbiguousParams): string;
}

// 公式实现
class TitleFormulaEngine implements ITitleFormula {
  identityContrast(params: IdentityParams): string {
    return `${params.pastIdentity}，${params.currentIdentity}，${params.conflict}`;
  }
  
  unexpectedTwist(params: TwistParams): string {
    return `${params.dailyScene}，${params.twist}`;
  }
  
  ambiguousScene(params: AmbiguousParams): string {
    return `${params.ambiguousScene}，${params.excuse}`;
  }
}
```

---

## 5. 标签系统

```typescript
interface ITagSystem {
  // 主分类
  mainCategories: MainCategory[];
  
  // 情节标签
  plotTags: PlotTag[];
  
  // 角色标签
  characterTags: CharacterTag[];
  
  // 情绪标签
  emotionTags: EmotionTag[];
  
  // 背景标签
  backgroundTags: BackgroundTag[];
}

// 标签组合算法
function combineTags(
  main: MainCategory,
  plots: PlotTag[],
  characters: CharacterTag[],
  emotions: EmotionTag[],
  backgrounds: BackgroundTag[]
): TagCombination {
  return {
    main,
    secondary: [...plots, ...characters, ...emotions, ...backgrounds].slice(0, 7),
    total: 1 + Math.min(7, plots.length + characters.length + emotions.length + backgrounds.length)
  };
}
```

---

## 6. 脑洞生成器

```typescript
interface IBrainstormGenerator {
  // 生成核心梗
  generateCoreIdea(title: Title): string;
  
  // 生成情绪链条
  generateEmotionChain(tags: Tag[]): string;
  
  // 生成主角设定
  generateProtagonist(category: MainCategory): string;
  
  // 生成开篇钩子
  generateOpening(title: Title): string;
  
  // 生成爽点设计
  generateClimaxPoints(tags: Tag[]): string;
  
  // 生成差异化
  generateDifferentiation(title: Title): string;
}

// 500字脑洞生成
class BrainstormGenerator implements IBrainstormGenerator {
  generate(title: Title): Brainstorm {
    return {
      id: generateId(),
      titleId: title.id,
      coreIdea: this.generateCoreIdea(title),
      category: this.formatCategory(title),
      emotionChain: this.generateEmotionChain(title.tags),
      protagonist: this.generateProtagonist(title.category),
      opening: this.generateOpening(title),
      climaxPoints: this.generateClimaxPoints(title.tags),
      differentiation: this.generateDifferentiation(title),
      totalWords: 500
    };
  }
}
```

---

## 7. 接口设计

```typescript
interface IBrainstormAgent {
  // 分析市场趋势
  analyzeTrends(year: number): MarketTrend;
  
  // 生成标题
  generateTitles(
    count: number,
    categories: MainCategory[],
    tags: Tag[]
  ): Title[];
  
  // 生成脑洞
  generateBrainstorms(titles: Title[]): Brainstorm[];
  
  // 导出结果
  export(results: BrainstormResult, format: string): string;
}
```

---

**文档版本**: v1.0
**创建日期**: 2026-03-17
