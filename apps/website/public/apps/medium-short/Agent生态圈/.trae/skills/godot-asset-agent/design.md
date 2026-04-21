# Godot Asset Agent - 架构设计文档

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
│                 Godot Asset Agent                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │ 需求分析 │  │ 素材类型 │  │ 技术规范 │              │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘              │
│       │             │             │                     │
│       └─────────────┼─────────────┘                     │
│                     ▼                                   │
│  ┌─────────────────────────────────────┐               │
│  │           素材引擎                   │               │
│  └─────────────────────────────────────┘               │
│                     │                                   │
│       ┌─────────────┼─────────────┐                     │
│       ▼             ▼             ▼                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐              │
│  │ AI生成   │ │ Godot适配│ │ 输出     │              │
│  │ 提示词   │ │ 配置     │ │ 格式化   │              │
│  └──────────┘ └──────────┘ └──────────┘              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 2. 数据模型

```typescript
// 素材定义
interface Asset {
  id: string;
  name: string;
  type: AssetType;
  size: Size;
  style: PixelStyle;
  palette: ColorPalette;
  godotConfig: GodotConfig;
}

// 素材类型
enum AssetType {
  SPRITE = 'sprite',
  TILESET = 'tileset',
  SCENE = 'scene',
  UI = 'ui',
  ANIMATION = 'animation'
}

// 尺寸
interface Size {
  width: number;
  height: number;
}

// 像素风格
enum PixelStyle {
  RETRO_8BIT = 'retro_8bit',
  STANDARD_16BIT = 'standard_16bit',
  DETAILED = 'detailed',
  HD_PIXEL = 'hd_pixel'
}

// 调色板
interface ColorPalette {
  limit: number; // 8, 16, 32
  colors: string[];
}

// Godot配置
interface GodotConfig {
  importSettings: ImportSettings;
  nodeType: string;
  collisionShape?: CollisionShape;
  animationConfig?: AnimationConfig;
}

// 导入设置
interface ImportSettings {
  filter: 'nearest' | 'linear';
  repeat: 'disabled' | 'enabled';
  mipmaps: boolean;
}

// 碰撞体
interface CollisionShape {
  type: 'rectangle' | 'circle' | 'capsule';
  size: Size;
}

// 动画配置
interface AnimationConfig {
  frames: number;
  fps: number;
  animations: Animation[];
}

interface Animation {
  name: string;
  startFrame: number;
  endFrame: number;
}

// 场景定义
interface Scene {
  id: string;
  name: string;
  size: Size;
  layers: SceneLayer[];
  parallaxConfig: ParallaxConfig;
}

// 场景图层
interface SceneLayer {
  id: string;
  name: string;
  type: 'background' | 'midground' | 'foreground';
  speed: number; // 视差速度
  content: string;
}

// 视差配置
interface ParallaxConfig {
  enabled: boolean;
  layers: number;
}

// 输出结果
interface AssetResult {
  asset: Asset | Scene;
  prompt: string;
  godotSetup: string;
  fileName: string;
}
```

---

## 3. 核心流程

```
需求分析 → 素材类型选择 → 技术规范 → AI生成提示词 → Godot适配 → 输出
```

---

## 4. 素材生成引擎

```typescript
interface IAssetEngine {
  // 生成精灵
  generateSprite(config: SpriteConfig): Asset;
  
  // 生成瓦片集
  generateTileset(config: TilesetConfig): Asset;
  
  // 生成场景
  generateScene(config: SceneConfig): Scene;
  
  // 生成UI元素
  generateUI(config: UIConfig): Asset;
}

// 精灵配置
interface SpriteConfig {
  type: 'character' | 'item' | 'effect';
  size: 16 | 32 | 64 | 128;
  style: PixelStyle;
  palette: number;
  animated: boolean;
}

// 精灵生成实现
class SpriteEngine implements IAssetEngine {
  generateSprite(config: SpriteConfig): Asset {
    return {
      id: generateId(),
      name: `${config.type}_sprite`,
      type: AssetType.SPRITE,
      size: { width: config.size, height: config.size },
      style: config.style,
      palette: { limit: config.palette, colors: [] },
      godotConfig: {
        importSettings: {
          filter: 'nearest',
          repeat: 'disabled',
          mipmaps: false
        },
        nodeType: config.animated ? 'AnimatedSprite2D' : 'Sprite2D',
        animationConfig: config.animated ? {
          frames: 4,
          fps: 12,
          animations: [
            { name: 'idle', startFrame: 0, endFrame: 1 },
            { name: 'walk', startFrame: 2, endFrame: 5 }
          ]
        } : undefined
      }
    };
  }
}
```

---

## 5. 场景生成引擎

```typescript
interface ISceneEngine {
  // 生成背景图层
  generateBackgroundLayer(scene: Scene): SceneLayer;
  
  // 生成中景图层
  generateMidgroundLayer(scene: Scene): SceneLayer;
  
  // 生成前景图层
  generateForegroundLayer(scene: Scene): SceneLayer;
  
  // 配置视差效果
  configureParallax(scene: Scene): ParallaxConfig;
}

// 场景生成实现
class SceneEngine implements ISceneEngine {
  generateScene(config: SceneConfig): Scene {
    const scene: Scene = {
      id: generateId(),
      name: config.name,
      size: config.size,
      layers: [],
      parallaxConfig: { enabled: true, layers: 3 }
    };
    
    // 生成各图层
    scene.layers.push(this.generateBackgroundLayer(scene));
    scene.layers.push(this.generateMidgroundLayer(scene));
    scene.layers.push(this.generateForegroundLayer(scene));
    
    return scene;
  }
  
  generateBackgroundLayer(scene: Scene): SceneLayer {
    return {
      id: generateId(),
      name: 'background',
      type: 'background',
      speed: 0.1,
      content: 'sky, mountains, clouds'
    };
  }
  
  generateMidgroundLayer(scene: Scene): SceneLayer {
    return {
      id: generateId(),
      name: 'midground',
      type: 'midground',
      speed: 0.5,
      content: 'trees, buildings, terrain'
    };
  }
  
  generateForegroundLayer(scene: Scene): SceneLayer {
    return {
      id: generateId(),
      name: 'foreground',
      type: 'foreground',
      speed: 1.0,
      content: 'grass, rocks, decorations'
    };
  }
}
```

---

## 6. 提示词生成引擎

```typescript
interface IPromptEngine {
  // 生成精灵提示词
  generateSpritePrompt(asset: Asset): string;
  
  // 生成场景提示词
  generateScenePrompt(scene: Scene): string;
  
  // 生成瓦片集提示词
  generateTilesetPrompt(asset: Asset): string;
  
  // 格式化输出
  formatOutput(result: AssetResult): string;
}

// 提示词生成实现
class PromptEngine implements IPromptEngine {
  generateSpritePrompt(asset: Asset): string {
    const parts = [
      'Pixel art',
      `${asset.size.width}x${asset.size.height} pixels`,
      `${asset.palette.limit} color palette`,
      'no anti-aliasing',
      'crisp pixel edges',
      'transparent background',
      'retro game style'
    ];
    return parts.join(', ');
  }
  
  generateScenePrompt(scene: Scene): string {
    const parts = [
      'Pixel art game scene',
      `${scene.size.width}x${scene.size.height} pixels`,
      'layered composition',
      'parallax background',
      '16 color palette',
      'retro game aesthetic'
    ];
    return parts.join(', ');
  }
  
  generateTilesetPrompt(asset: Asset): string {
    const parts = [
      'Pixel art tileset',
      `${asset.size.width}x${asset.size.height} tiles`,
      'seamless tiles',
      '16 color palette',
      'top-down view',
      'game asset'
    ];
    return parts.join(', ');
  }
}
```

---

## 7. Godot配置引擎

```typescript
interface IGodotEngine {
  // 生成导入配置
  generateImportConfig(asset: Asset): string;
  
  // 生成节点结构
  generateNodeTree(asset: Asset): string;
  
  // 生成场景配置
  generateSceneConfig(scene: Scene): string;
  
  // 生成动画配置
  generateAnimationConfig(config: AnimationConfig): string;
}

// Godot配置实现
class GodotEngine implements IGodotEngine {
  generateImportConfig(asset: Asset): string {
    return `
[params]
compress/mode=0
compress/high_quality=false
compress/lossy_quality=0.7
compress/hdr_compression=1
compress/normal_map=0
compress/channel_pack=0
mipmaps/generate=false
mipmaps/limit=-1
roughness/mode=0
roughness/src_normal=""
process/fix_alpha_border=true
process/premult_alpha=false
process/normal_map_invert_y=false
process/hdr_as_srgb=false
process/hdr_clamp_exposure=false
process/size_limit=0
detect_3d/compress_to=1
    `.trim();
  }
  
  generateNodeTree(asset: Asset): string {
    if (asset.godotConfig.nodeType === 'AnimatedSprite2D') {
      return `
Node2D
└── AnimatedSprite2D
    ├── SpriteFrames
    └── CollisionShape2D
      `.trim();
    }
    return `
Node2D
└── Sprite2D
    └── CollisionShape2D
    `.trim();
  }
  
  generateSceneConfig(scene: Scene): string {
    return `
[scene]
viewport_width=${scene.size.width}
viewport_height=${scene.size.height}
stretch_mode=canvas_items
stretch_aspect=expand
    `.trim();
  }
}
```

---

## 8. 接口设计

```typescript
interface IGodotAssetAgent {
  // 分析需求
  analyzeRequest(request: string): AssetRequest;
  
  // 生成素材
  generateAsset(request: AssetRequest): AssetResult;
  
  // 生成场景
  generateScene(request: SceneRequest): AssetResult;
  
  // 导出配置
  exportConfig(result: AssetResult, format: string): string;
}

interface AssetRequest {
  type: AssetType;
  description: string;
  size?: Size;
  style?: PixelStyle;
  animated?: boolean;
}

interface SceneRequest {
  name: string;
  description: string;
  size: Size;
  layers: number;
  parallax: boolean;
}
```

---

**文档版本**: v1.0
**创建日期**: 2026-03-17
