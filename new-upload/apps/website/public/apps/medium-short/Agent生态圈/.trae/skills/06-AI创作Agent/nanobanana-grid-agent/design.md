# NanoBananaPro Grid Agent - 架构设计文档

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
│              NanoBananaPro Grid Agent                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │ 角色分析 │  │ 宫格选择 │  │ 镜头分配 │              │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘              │
│       │             │             │                     │
│       └─────────────┼─────────────┘                     │
│                     ▼                                   │
│  ┌─────────────────────────────────────┐               │
│  │           宫格引擎                   │               │
│  └─────────────────────────────────────┘               │
│                     │                                   │
│       ┌─────────────┼─────────────┐                     │
│       ▼             ▼             ▼                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐              │
│  │ 一致性   │ │ 提示词   │ │ 输出     │              │
│  │ 检查     │ │ 生成     │ │ 格式化   │              │
│  └──────────┘ └──────────┘ └──────────┘              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 2. 数据模型

```typescript
// 角色定义
interface Character {
  id: string;
  name: string;
  appearance: Appearance;
  outfit: Outfit;
  personality: string;
  reference: string;
}

// 外貌
interface Appearance {
  hair: Hair;
  eyes: Eyes;
  height: number;
  build: string;
  features: string[];
}

// 服装
interface Outfit {
  top: string;
  bottom: string;
  shoes: string;
  accessories: string[];
  colors: string[];
}

// 宫格定义
interface Grid {
  type: 4 | 6 | 8 | 9 | 16;
  layout: Panel[][];
  consistency: ConsistencyRules;
}

// 面板
interface Panel {
  position: number;
  shot: Shot;
  prompt: string;
}

// 镜头
interface Shot {
  framing: Framing;
  angle: Angle;
  pose: string;
  expression: string;
  lighting: Lighting;
}

// 景别
enum Framing {
  ELS = 'extreme_long_shot',
  LS = 'long_shot',
  MLS = 'medium_long_shot',
  MS = 'medium_shot',
  MCU = 'medium_close_up',
  CU = 'close_up',
  ECU = 'extreme_close_up'
}

// 角度
enum Angle {
  EYE_LEVEL = 'eye_level',
  LOW_ANGLE = 'low_angle',
  HIGH_ANGLE = 'high_angle',
  SIDE_VIEW = 'side_view'
}

// 光影
enum Lighting {
  FRONT = 'front_light',
  SIDE = 'side_light',
  BACK = 'back_light',
  TOP = 'top_light',
  BOTTOM = 'bottom_light'
}

// 一致性规则
interface ConsistencyRules {
  appearance: boolean;
  outfit: boolean;
  lighting: boolean;
  style: boolean;
  color: boolean;
}

// 输出结果
interface GridResult {
  character: Character;
  grid: Grid;
  prompt: string;
  negativePrompt: string;
}
```

---

## 3. 核心流程

```
角色设定 → 宫格选择 → 镜头分配 → 一致性检查 → 提示词生成 → 输出
```

---

## 4. 宫格生成引擎

```typescript
interface IGridEngine {
  // 生成四宫格
  generate4Grid(character: Character): Grid;
  
  // 生成六宫格
  generate6Grid(character: Character): Grid;
  
  // 生成九宫格
  generate9Grid(character: Character): Grid;
  
  // 生成十六宫格
  generate16Grid(character: Character): Grid;
  
  // 生成自定义宫格
  generateCustomGrid(character: Character, config: GridConfig): Grid;
}

// 九宫格实现
class NineGridEngine implements IGridEngine {
  generate9Grid(character: Character): Grid {
    const panels: Panel[] = [
      { position: 1, shot: this.createShot(Framing.ELS, Angle.EYE_LEVEL), prompt: '' },
      { position: 2, shot: this.createShot(Framing.LS, Angle.EYE_LEVEL), prompt: '' },
      { position: 3, shot: this.createShot(Framing.MLS, Angle.EYE_LEVEL), prompt: '' },
      { position: 4, shot: this.createShot(Framing.MS, Angle.EYE_LEVEL), prompt: '' },
      { position: 5, shot: this.createShot(Framing.MCU, Angle.EYE_LEVEL), prompt: '' },
      { position: 6, shot: this.createShot(Framing.CU, Angle.EYE_LEVEL), prompt: '' },
      { position: 7, shot: this.createShot(Framing.ECU, Angle.EYE_LEVEL), prompt: '' },
      { position: 8, shot: this.createShot(Framing.LS, Angle.LOW_ANGLE), prompt: '' },
      { position: 9, shot: this.createShot(Framing.LS, Angle.HIGH_ANGLE), prompt: '' }
    ];
    
    return {
      type: 9,
      layout: this.arrangePanels(panels, 3, 3),
      consistency: {
        appearance: true,
        outfit: true,
        lighting: true,
        style: true,
        color: true
      }
    };
  }
  
  private createShot(framing: Framing, angle: Angle): Shot {
    return {
      framing,
      angle,
      pose: 'standing',
      expression: 'neutral',
      lighting: Lighting.SIDE
    };
  }
  
  private arrangePanels(panels: Panel[], rows: number, cols: number): Panel[][] {
    const layout: Panel[][] = [];
    for (let i = 0; i < rows; i++) {
      layout[i] = panels.slice(i * cols, (i + 1) * cols);
    }
    return layout;
  }
}
```

---

## 5. 镜头分配引擎

```typescript
interface IShotEngine {
  // 分配景别
  assignFraming(grid: Grid): Grid;
  
  // 分配角度
  assignAngle(grid: Grid): Grid;
  
  // 设计姿势
  designPose(grid: Grid, character: Character): Grid;
  
  // 设计表情
  designExpression(grid: Grid, character: Character): Grid;
}

// 镜头分配规则
class ShotRules {
  // 景别分配规则
  static framingRules = {
    4: [Framing.LS, Framing.MS, Framing.CU, Framing.LS],
    6: [Framing.LS, Framing.LS, Framing.MS, Framing.CU, Framing.ECU, Framing.ECU],
    9: [Framing.ELS, Framing.LS, Framing.MLS, Framing.MS, Framing.MCU, Framing.CU, Framing.ECU, Framing.LS, Framing.LS],
    16: [Framing.ELS, Framing.LS, Framing.MLS, Framing.MS, Framing.MS, Framing.MCU, Framing.CU, Framing.ECU, Framing.ECU, Framing.ECU, Framing.ECU, Framing.ECU, Framing.LS, Framing.LS, Framing.LS, Framing.LS]
  };
  
  // 角度分配规则
  static angleRules = {
    4: [Angle.EYE_LEVEL, Angle.EYE_LEVEL, Angle.EYE_LEVEL, Angle.SIDE_VIEW],
    6: [Angle.EYE_LEVEL, Angle.EYE_LEVEL, Angle.EYE_LEVEL, Angle.EYE_LEVEL, Angle.EYE_LEVEL, Angle.EYE_LEVEL],
    9: [Angle.EYE_LEVEL, Angle.EYE_LEVEL, Angle.EYE_LEVEL, Angle.EYE_LEVEL, Angle.EYE_LEVEL, Angle.EYE_LEVEL, Angle.EYE_LEVEL, Angle.LOW_ANGLE, Angle.HIGH_ANGLE],
    16: [Angle.EYE_LEVEL, Angle.EYE_LEVEL, Angle.EYE_LEVEL, Angle.EYE_LEVEL, Angle.EYE_LEVEL, Angle.EYE_LEVEL, Angle.EYE_LEVEL, Angle.EYE_LEVEL, Angle.EYE_LEVEL, Angle.EYE_LEVEL, Angle.EYE_LEVEL, Angle.EYE_LEVEL, Angle.LOW_ANGLE, Angle.HIGH_ANGLE, Angle.SIDE_VIEW, Angle.SIDE_VIEW]
  };
}
```

---

## 6. 提示词生成引擎

```typescript
interface IPromptEngine {
  // 生成基础提示词
  generateBasePrompt(character: Character): string;
  
  // 生成宫格提示词
  generateGridPrompt(grid: Grid, character: Character): string;
  
  // 生成负面提示词
  generateNegativePrompt(): string;
  
  // 格式化输出
  formatOutput(result: GridResult): string;
}

// 提示词生成实现
class PromptEngine implements IPromptEngine {
  generateBasePrompt(character: Character): string {
    const parts = [
      this.describeCharacter(character),
      this.describeOutfit(character.outfit),
      'consistent character design'
    ];
    return parts.join(', ');
  }
  
  generateGridPrompt(grid: Grid, character: Character): string {
    const basePrompt = this.generateBasePrompt(character);
    const panels = grid.layout.flat();
    
    let prompt = `Multi-panel character reference sheet, ${basePrompt},\n`;
    
    panels.forEach((panel, index) => {
      prompt += `Panel ${index + 1}: ${this.describeShot(panel.shot)},\n`;
    });
    
    prompt += 'same outfit, same lighting direction, ';
    prompt += 'anime style, 8K, masterpiece, best quality';
    
    return prompt;
  }
  
  generateNegativePrompt(): string {
    return 'low quality, blurry, distorted, inconsistent, multiple views, bad anatomy';
  }
  
  private describeCharacter(character: Character): string {
    return `${character.appearance.hair.color} hair, ${character.appearance.eyes.color} eyes, ${character.appearance.build} build`;
  }
  
  private describeOutfit(outfit: Outfit): string {
    return `wearing ${outfit.top} and ${outfit.bottom}`;
  }
  
  private describeShot(shot: Shot): string {
    return `${shot.framing}, ${shot.angle}, ${shot.pose}, ${shot.expression}`;
  }
}
```

---

## 7. 接口设计

```typescript
interface IGridAgent {
  // 分析角色
  analyzeCharacter(description: string): Character;
  
  // 生成宫格
  generateGrid(character: Character, gridType: number): Grid;
  
  // 生成提示词
  generatePrompt(grid: Grid, character: Character): string;
  
  // 导出结果
  export(result: GridResult, format: string): string;
}
```

---

**文档版本**: v1.0
**创建日期**: 2026-03-17
