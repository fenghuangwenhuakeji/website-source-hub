# 🎮 Godot素材场景生成手册 (Lovart版)
> 专为Godot游戏开发设计的宫格提示词速查表

---

## 📋 快速索引

| 资源类型 | 宫格 | 用途 | 跳转 |
|---------|-----|-----|-----|
| 角色方向 | 2×2 | 4方向移动 | [四宫格角色](#四宫格角色) |
| 角色设定 | 3×3缺中 | 完整角色 | [八宫格角色](#八宫格角色) |
| 动画帧 | 4×4 | 序列帧 | [十六宫格动画](#十六宫格动画) |
| 场景层级 | 3×2 | 视差背景 | [六宫格场景](#六宫格场景) |
| 环境全景 | 3×3 | 大型背景 | [九宫格环境](#九宫格环境) |
| 道具集合 | 3×3 | 物品图标 | [九宫格道具](#九宫格道具) |
| UI按钮 | 2×2 | 按钮状态 | [四宫格UI](#四宫格ui) |
| 地形Tile | 3×3 | TileMap | [九宫格Tile](#九宫格tile) |
| 装饰物 | 4×4 | 场景装饰 | [十六宫格装饰](#十六宫格装饰) |

---

## 四宫格角色

### 📐 布局
```
┌─────────────┬─────────────┐
│ 1.正面Down  │ 2.背面Up    │
├─────────────┼─────────────┤
│ 3.左面Left  │ 4.右面Right │
└─────────────┴─────────────┘
```

### 🎨 提示词
```
4-panel 2x2 grid game character sprite sheet.
Panel 1: Front view facing down. Panel 2: Back view facing up.
Panel 3: Left side view. Panel 4: Right side view.
Style: [STYLE], game asset, clean lines, vibrant colors.
Subject: [CHARACTER]. Transparent background PNG, square panels, character centered, feet aligned.
For Godot AnimatedSprite2D 4-directional movement.
```

---

## 八宫格角色

### 📐 布局
```
┌─────────────┬─────────────┬─────────────┐
│ 1.正面Idle  │ 2.侧面Idle  │ 3.背面Idle  │
├─────────────┼─────────────┼─────────────┤
│ 4.行走帧    │ ★ 标题 ★   │ 5.攻击帧    │
├─────────────┼─────────────┼─────────────┤
│ 6.受伤帧    │ 7.跳跃帧    │ 8.死亡帧    │
└─────────────┴─────────────┴─────────────┘
```

### 🎨 提示词
```
8-panel character sheet, 3x3 grid with center blank for title.
Panel 1: Front idle. Panel 2: Side idle. Panel 3: Back idle.
Panel 4: Walk cycle. Panel 5: Attack pose.
Panel 6: Hurt reaction. Panel 7: Jump pose. Panel 8: Death pose.
Style: [STYLE], game-ready asset, clean design.
Subject: [CHARACTER]. Transparent PNG, uniform size.
For Godot animation state machine.
```

---

## 十六宫格动画

### 📐 布局
```
┌──────────┬──────────┬──────────┬──────────┐
│ 1.走1    │ 2.走2    │ 3.走3    │ 4.走4    │
├──────────┼──────────┼──────────┼──────────┤
│ 5.攻1    │ 6.攻2    │ 7.攻3    │ 8.攻4    │
├──────────┼──────────┼──────────┼──────────┤
│ 9.待1    │ 10.待2   │ 11.待3   │ 12.待4   │
├──────────┼──────────┼──────────┼──────────┤
│ 13.跳1   │ 14.跳2   │ 15.跳3   │ 16.跳4   │
└──────────┴──────────┴──────────┴──────────┘
```

### 🎨 提示词
```
16-panel animation sprite sheet, 4x4 grid.
Row 1: Walk cycle 1-4 (seamless loop).
Row 2: Attack frames 1-4 (prepare, swing, peak, recover).
Row 3: Idle breathing 1-4 (subtle loop).
Row 4: Jump frames 1-4 (crouch, rise, peak, land).
Style: [STYLE], frame-by-frame animation.
Subject: [CHARACTER]. Same frame size, feet aligned, transparent PNG.
For Godot SpriteFrames resource.
```

---

## 六宫格场景

### 📐 布局
```
┌─────────────┬─────────────┬─────────────┐
│ 1.远景层    │ 2.中远景    │ 3.中景层    │
│ 天空/云     │ 建筑/树     │ 背景元素    │
├─────────────┼─────────────┼─────────────┤
│ 4.近景层    │ 5.地面层    │ 6.前景层    │
│ 游戏区域    │ 平台/地板   │ 遮挡装饰    │
└─────────────┴─────────────┴─────────────┘
```

### 🎨 提示词
```
6-panel parallax scene layers, 3x2 grid.
Panel 1: Far background (sky/clouds), slowest scroll.
Panel 2: Mid-far (distant buildings/trees).
Panel 3: Mid layer (main background).
Panel 4: Near layer (gameplay zone).
Panel 5: Ground layer (platforms).
Panel 6: Foreground (overlay), fastest scroll.
Style: [STYLE], game environment art, atmospheric depth.
Environment: [ENVIRONMENT]. Horizontally seamless, transparent PNG.
For Godot ParallaxBackground.
```

---

## 九宫格环境

### 📐 布局
```
┌─────────────┬─────────────┬─────────────┐
│ 1.左上      │ 2.中上      │ 3.右上      │
├─────────────┼─────────────┼─────────────┤
│ 4.左侧      │ 5.中央      │ 6.右侧      │
├─────────────┼─────────────┼─────────────┤
│ 7.左下      │ 8.中下      │ 9.右下      │
└─────────────┴─────────────┴─────────────┘
```

### 🎨 提示词
```
9-panel environment panorama, 3x3 grid.
All panels connect seamlessly into one large scene.
Panel 1-3: Top row (left/center/right).
Panel 4-6: Middle row (left/center/right).
Panel 7-9: Bottom row (left/center/right).
Style: [STYLE], game environment design, atmospheric.
Environment: [ENVIRONMENT]. Consistent lighting and perspective.
For Godot level background.
```

---

## 九宫格道具

### 📐 布局
```
┌─────────────┬─────────────┬─────────────┐
│ 1.武器      │ 2.防具      │ 3.饰品      │
├─────────────┼─────────────┼─────────────┤
│ 4.消耗品    │ 5.材料      │ 6.任务道具  │
├─────────────┼─────────────┼─────────────┤
│ 7.特殊道具  │ 8.货币      │ 9.宝箱      │
└─────────────┴─────────────┴─────────────┘
```

### 🎨 提示词
```
9-panel game item collection, 3x3 grid.
Panel 1: Weapon. Panel 2: Armor. Panel 3: Accessory.
Panel 4: Consumable (potion/food).
Panel 5: Material (ore/herb).
Panel 6: Quest item (scroll/key).
Panel 7: Special item. Panel 8: Currency. Panel 9: Treasure chest.
Style: [STYLE], consistent icon design, game UI ready.
Theme: [THEME]. Transparent PNG, uniform size, clear silhouette.
For Godot inventory system.
```

---

## 四宫格UI

### 📐 布局
```
┌─────────────┬─────────────┐
│ 1.Normal    │ 2.Hover     │
│ 普通状态    │ 悬停高亮    │
├─────────────┼─────────────┤
│ 3.Pressed   │ 4.Disabled  │
│ 按下效果    │ 禁用灰显    │
└─────────────┴─────────────┘
```

### 🎨 提示词
```
4-panel UI button states, 2x2 grid.
Panel 1: Normal state (default).
Panel 2: Hover state (highlighted).
Panel 3: Pressed state (clicked down).
Panel 4: Disabled state (grayed out).
Style: [STYLE], game UI design, clean and readable.
Button: [BUTTON_TYPE]. 9-slice friendly, consistent corners.
For Godot TextureButton.
```

---

## 九宫格Tile

### 📐 布局
```
┌─────────────┬─────────────┬─────────────┐
│ 1.左上角    │ 2.上边缘    │ 3.右上角    │
├─────────────┼─────────────┼─────────────┤
│ 4.左边缘    │ 5.中心填充  │ 6.右边缘    │
├─────────────┼─────────────┼─────────────┤
│ 7.左下角    │ 8.下边缘    │ 9.右下角    │
└─────────────┴─────────────┴─────────────┘
```

### 🎨 提示词
```
9-panel terrain tile set, 3x3 grid for auto-tiling.
Panel 1: Top-left corner. Panel 2: Top edge. Panel 3: Top-right corner.
Panel 4: Left edge. Panel 5: Center fill (repeatable). Panel 6: Right edge.
Panel 7: Bottom-left corner. Panel 8: Bottom edge. Panel 9: Bottom-right corner.
Style: [STYLE], game tile art, top-down or side-view.
Terrain: [TERRAIN_TYPE] (grass/stone/water). Square tiles, seamless edges.
For Godot TileMap auto-tiling.
```

---

## 十六宫格装饰

### 📐 布局
```
┌──────────┬──────────┬──────────┬──────────┐
│ 1.树A    │ 2.树B    │ 3.树C    │ 4.树D    │
├──────────┼──────────┼──────────┼──────────┤
│ 5.草A    │ 6.草B    │ 7.草C    │ 8.草D    │
├──────────┼──────────┼──────────┼──────────┤
│ 9.石A    │ 10.石B   │ 11.石C   │ 12.石D   │
├──────────┼──────────┼──────────┼──────────┤
│ 13.花A   │ 14.花B   │ 15.花C   │ 16.花D   │
└──────────┴──────────┴──────────┴──────────┘
```

### 🎨 提示词
```
16-panel decoration variants, 4x4 grid.
Row 1: Tree variants A-D (base + 3 variations).
Row 2: Grass/bush variants A-D.
Row 3: Rock/stone variants A-D.
Row 4: Flower/plant variants A-D.
Style: [STYLE], environment decorations, varied but unified.
Environment: [ENVIRONMENT_TYPE]. Transparent PNG, consistent scale.
For Godot TileMap decoration layer.
```

---

## 🎨 风格替换表

| 风格 | English | 适用 |
|-----|---------|-----|
| 像素 | Pixel Art, 16-bit, retro | 复古游戏 |
| 卡通 | Cartoon, Toon, vector-like | 休闲游戏 |
| 手绘 | Hand-drawn, watercolor | 艺术游戏 |
| 写实 | Realistic, photorealistic | 3A级 |
| 赛博朋克 | Cyberpunk, neon, sci-fi | 科幻游戏 |
| 国风 | Chinese ink, traditional | 国风游戏 |
| 低多边形 | Low-poly, minimalist 3D | 独立游戏 |
| 暗黑 | Dark fantasy, gothic | RPG游戏 |

---

## 📝 参数占位符

| 占位符 | 说明 | 示例 |
|-------|-----|-----|
| [STYLE] | 美术风格 | Pixel Art, 16-bit |
| [CHARACTER] | 角色描述 | knight in blue armor |
| [ENVIRONMENT] | 环境描述 | forest, sunset, magical |
| [THEME] | 道具主题 | medieval fantasy |
| [TERRAIN_TYPE] | 地形类型 | grass, stone, water |
| [BUTTON_TYPE] | 按钮类型 | fantasy wooden button |
| [ENVIRONMENT_TYPE] | 装饰环境 | forest, desert, cave |

---

## ⚡ 快速使用

1. **复制提示词** - 选择对应宫格的英文提示词
2. **替换占位符** - 将[STYLE]、[CHARACTER]等替换为实际内容
3. **上传参考图** - 在Lovart中上传风格参考图
4. **生成素材** - 执行生成并下载PNG
5. **导入Godot** - 切图后导入项目

---

**版本**: v1.0 精简版 | **引擎**: Godot 4.x