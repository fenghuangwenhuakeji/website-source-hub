# Storyboard Agent - 架构设计文档

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
│                   Storyboard Agent                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │ 场景分析 │  │ 镜头选择 │  │ 构图设计 │              │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘              │
│       │             │             │                     │
│       └─────────────┼─────────────┘                     │
│                     ▼                                   │
│  ┌─────────────────────────────────────┐               │
│  │           核心分镜引擎               │               │
│  └─────────────────────────────────────┘               │
│                     │                                   │
│       ┌─────────────┼─────────────┐                     │
│       ▼             ▼             ▼                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐              │
│  │ 宫格生成 │ │ 节奏编排 │ │ 指令输出 │              │
│  └──────────┘ └──────────┘ └──────────┘              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 2. 数据模型

```typescript
// 场景信息
interface SceneInfo {
  id: string;
  type: 'battle' | 'dialogue' | 'showcase' | 'intimate';
  mood: 'tense' | 'calm' | 'intimate' | 'powerful';
  protagonist: Character;
  environment: Environment;
  keyElements: Element[];
}

// 镜头定义
interface Shot {
  id: string;
  type: 'power' | 'oppression' | 'assessment' | 'intimate' | 'relationship';
  movement: 'dolly_in' | 'handheld' | 'pan' | 'static' | 'low_angle';
  framing: 'extreme_long' | 'long' | 'medium' | 'close_up' | 'extreme_close';
  duration: number; // seconds
  description: string;
}

// 宫格布局
interface GridLayout {
  type: 4 | 6 | 8 | 9 | 16;
  panels: Panel[];
  consistency: ConsistencyRules;
}

// 面板
interface Panel {
  position: number;
  shot: Shot;
  prompt: string; // AI绘画提示词
}

// 输出结果
interface StoryboardResult {
  scene: SceneInfo;
  grid: GridLayout;
  prompts: string[];
  cinematography: string;
}
```

---

## 3. 核心流程

```
场景输入 → 类型识别 → 镜头匹配 → 宫格分配 → 提示词生成 → 输出
```

---

## 4. 镜头库

```typescript
interface IShotLibrary {
  // 权力赋予镜头
  powerGranting: Shot;
  
  // 压迫窥视镜头
  oppression: Shot;
  
  // 评估审视镜头
  assessment: Shot;
  
  // 亲密威胁镜头
  intimateThreat: Shot;
  
  // 权力关系镜头
  powerRelationship: Shot;
}

// 镜头匹配算法
function matchShots(scene: SceneInfo): Shot[] {
  const shots: Shot[] = [];
  
  // 根据场景类型匹配
  switch(scene.type) {
    case 'battle':
      shots.push(shotLibrary.oppression);
      shots.push(shotLibrary.powerGranting);
      break;
    case 'dialogue':
      shots.push(shotLibrary.assessment);
      shots.push(shotLibrary.powerRelationship);
      break;
    case 'showcase':
      shots.push(shotLibrary.powerGranting);
      break;
    case 'intimate':
      shots.push(shotLibrary.intimateThreat);
      break;
  }
  
  return shots;
}
```

---

## 5. 宫格生成器

```typescript
interface IGridGenerator {
  // 生成四宫格
  generate4Grid(shots: Shot[]): GridLayout;
  
  // 生成六宫格
  generate6Grid(shots: Shot[]): GridLayout;
  
  // 生成九宫格
  generate9Grid(shots: Shot[]): GridLayout;
  
  // 生成十六宫格
  generate16Grid(shots: Shot[]): GridLayout;
}

// 九宫格生成示例
class NineGridGenerator implements IGridGenerator {
  generate9Grid(shots: Shot[]): GridLayout {
    return {
      type: 9,
      panels: [
        { position: 1, shot: shots[0], prompt: "ELS, environment" },
        { position: 2, shot: shots[1], prompt: "LS, full body" },
        { position: 3, shot: shots[2], prompt: "MLS, 3/4 view" },
        { position: 4, shot: shots[3], prompt: "MS, waist up" },
        { position: 5, shot: shots[4], prompt: "MCU, chest up" },
        { position: 6, shot: shots[5], prompt: "CU, face focus" },
        { position: 7, shot: shots[6], prompt: "ECU, detail" },
        { position: 8, shot: shots[7], prompt: "Low angle" },
        { position: 9, shot: shots[8], prompt: "High angle" }
      ],
      consistency: {
        character: true,
        outfit: true,
        lighting: true,
        environment: true
      }
    };
  }
}
```

---

## 6. 接口设计

```typescript
interface IStoryboardAgent {
  // 分析场景
  analyze(scene: SceneInfo): SceneAnalysis;
  
  // 生成分镜
  generate(scene: SceneInfo, gridType: number): StoryboardResult;
  
  // 获取提示词
  getPrompts(result: StoryboardResult): string[];
  
  // 导出故事板
  export(result: StoryboardResult, format: string): string;
}
```

---

**文档版本**: v1.0
**创建日期**: 2026-03-17
