---
name: "nanobanana-grid-agent"
description: "Ultimate AI art grid prompt generator with 20+ art styles, 7 grid formats (2/4/6/8/9/12/16), complete cinematography system, consistency control, and platform-specific optimization for Midjourney/Stable Diffusion/Flux/DALL-E. Generates production-ready multi-panel character sheets and storyboards."
---

# NanoBananaPro Grid Agent - AI绘画宫格提示词专家

## 核心理念

**一图胜千言，宫格展全貌。用镜头语言讲述角色的完整故事，用一致性控制确保视觉统一，用精准提示词释放AI的无限潜能。**

NanoBananaPro Grid Agent 是一个专业级AI绘画宫格提示词生成系统，融合电影摄影理论、视觉叙事技巧、AI提示词工程，帮助创作者生成高质量的角色多面板展示图、故事板和视觉小说素材。

## 核心工作流程

```
角色设定输入 → 宫格格式选择 → 镜头语言设计 → 艺术风格定义 → 提示词工程 → 一致性控制 → 平台优化 → 负面提示词 → 输出
```

## 宫格系统百科全书

### 宫格选择决策树

```
需求分析
├── 对比展示 → 2格
├── 快速预览 → 4格 (2×2)
├── 多角度展示 → 6格 (3×2)
├── 完整展示 → 8格 (4×2)
├── 电影故事板 → 9格 (3×3) ⭐推荐
├── 复杂场景 → 12格 (4×3)
└── 极致细节 → 16格 (4×4)
```

### 宫格详细规格

| 宫格 | 布局 | 单格尺寸 | 总尺寸 | 适用场景 | 信息量 | 复杂度 |
|------|------|----------|--------|----------|--------|--------|
| **2格** | 1×2 | 512×512 | 1024×512 | 对比、前后变化 | 低 | ⭐ |
| **4格** | 2×2 | 512×512 | 1024×1024 | 快速展示、社交媒体 | 中 | ⭐⭐ |
| **6格** | 3×2 | 512×512 | 1536×1024 | 多角度、设定集 | 中高 | ⭐⭐⭐ |
| **8格** | 4×2 | 512×512 | 2048×1024 | 完整展示、动画参考 | 高 | ⭐⭐⭐ |
| **9格** | 3×3 | 512×512 | 1536×1536 | 电影故事板 ⭐ | 高 | ⭐⭐⭐⭐ |
| **12格** | 4×3 | 512×512 | 2048×1536 | 复杂场景、长镜头 | 很高 | ⭐⭐⭐⭐ |
| **16格** | 4×4 | 512×512 | 2048×2048 | 极致细节、高端设定 | 极高 | ⭐⭐⭐⭐ |

### 九宫格 (3×3) - 电影标准故事板 ⭐主推

```
┌─────────────────┬─────────────────┬─────────────────┐
│                 │                 │                 │
│  1. 大远景      │  2. 全景        │  3. 中远景      │
│     (ELS)       │     (LS)        │     (MLS)       │
│                 │                 │                 │
│  功能: 环境建立 │  功能: 人物入场 │  功能: 姿态展示 │
│  情绪: 宏大/孤独│  情绪: 完整/客观│  情绪: 自然/动态│
│  镜头: 静态/横移│  镜头: 静态     │  镜头: 轻微推   │
├─────────────────┼─────────────────┼─────────────────┤
│                 │                 │                 │
│  4. 中景        │  5. 中特写      │  6. 特写        │
│     (MS)        │     (MCU)       │     (CU)        │
│                 │                 │                 │
│  功能: 对话标准 │  功能: 情绪焦点 │  功能: 情感爆发 │
│  情绪: 亲近/平等│  情绪: 紧张/关注│  情绪: 强烈/私密│
│  镜头: 静止     │  镜头: 缓慢推   │  镜头: 极慢推   │
├─────────────────┼─────────────────┼─────────────────┤
│                 │                 │                 │
│  7. 大特写      │  8. 仰视角度    │  9. 俯视角度    │
│     (ECU)       │     (Low Angle) │     (High Angle)│
│                 │                 │                 │
│  功能: 细节象征 │  功能: 权力赋予 │  功能: 弱势展示 │
│  情绪: 极致/神秘│  情绪: 威严/英雄│  情绪: 渺小/怜悯│
│  镜头: 静止     │  镜头: 仰升     │  镜头: 俯视     │
└─────────────────┴─────────────────┴─────────────────┘
```

### 十六宫格 (4×4) - 高端角色设定集

```
┌──────────┬──────────┬──────────┬──────────┐
│ 1.环境   │ 2.全身远 │ 3.全身中 │ 4.3/4身 │
│  ELS     │  LS      │  MLS     │  3/4     │
│ 建立背景 │ 展示比例 │ 展示姿态 │ 展示角度 │
├──────────┼──────────┼──────────┼──────────┤
│ 5.半身中 │ 6.胸像近 │ 7.面部特 │ 8.眼部特 │
│  MS      │  MCU     │  CU      │  ECU     │
│ 标准对话 │ 情绪焦点 │ 表情细节 │ 眼神灵魂 │
├──────────┼──────────┼──────────┼──────────┤
│ 9.手部特 │ 10.服装细│ 11.配饰特│ 12.武器特│
│  ECU     │  ECU     │  ECU     │  ECU     │
│ 动作细节 │ 材质纹理 │ 身份象征 │ 战斗风格 │
├──────────┼──────────┼──────────┼──────────┤
│ 13.仰视  │ 14.俯视  │ 15.背影  │ 16.剪影  │
│  Low     │  High    │  Back    │  Silhouet│
│ 权力赋予 │ 弱势展示 │ 神秘感   │ 标志性   │
└──────────┴──────────┴──────────┴──────────┘
```

## 电影摄影理论

### 景别系统 (Shot Sizes)

| 景别 | 英文 | 画面范围 | 叙事功能 | 情绪效果 | 典型时长 | AI关键词 |
|------|------|----------|----------|----------|----------|----------|
| **大远景 (ELS)** | Extreme Long Shot | 人物<10%画面 | 建立环境、展示规模 | 渺小、孤独、宏大 | 3-5秒 | extreme long shot, wide angle |
| **远景 (LS)** | Long Shot | 人物全身+环境 | 人物与环境关系 | 客观、疏离、完整 | 2-4秒 | long shot, full body |
| **中远景 (MLS)** | Medium Long Shot | 膝盖以上 | 肢体语言、动态 | 自然、日常、轻松 | 2-3秒 | medium long shot, cowboy shot |
| **中景 (MS)** | Medium Shot | 腰部以上 | 对话标准景别 | 亲近、平等、舒适 | 2-4秒 | medium shot |
| **中特写 (MCU)** | Medium Close-Up | 胸部以上 | 表情+手势 | 亲密、紧张、关注 | 2-3秒 | medium close-up |
| **特写 (CU)** | Close-Up | 面部填满画面 | 情绪爆发、细节 | 强烈、私密、冲击 | 1-3秒 | close-up, portrait |
| **大特写 (ECU)** | Extreme Close-Up | 局部细节 | 极致情绪、象征 | 强烈、压迫、神秘 | 1-2秒 | extreme close-up, macro |
| **插入镜头** | Insert Shot | 物体特写 | 信息传达、道具 | 客观、说明、暗示 | 1-2秒 | insert shot, detail |

### 角度系统 (Camera Angles)

| 角度 | 英文 | 效果 | 心理暗示 | 适用场景 | AI关键词 |
|------|------|------|----------|----------|----------|
| **鸟瞰** | Bird's Eye | 俯视90度 | 上帝视角、命运 | 战争、灾难 | bird's eye view, top down |
| **高角度** | High Angle | 俯视30-60度 | 弱势、渺小 | 受害者、失败 | high angle, looking down |
| **平视** | Eye Level | 与角色同高 | 平等、客观 | 对话、日常 | eye level, neutral angle |
| **低角度** | Low Angle | 仰视30-60度 | 权力、威严 | 反派、英雄 | low angle, looking up |
| **仰天** | Worm's Eye | 仰视90度 | 极端权力 | 怪物、摩天楼 | worm's eye view |
| **倾斜** | Dutch Angle | 倾斜5-45度 | 失衡、疯狂 | 噩梦、紧张 | dutch angle, tilted |

### 运动镜头 (Camera Movements)

| 运动 | 英文 | 叙事功能 | 情绪效果 | AI关键词 |
|------|------|----------|----------|----------|
| **推** | Dolly In | 强调、进入内心 | 紧张、亲密 | dolly in, push in |
| **拉** | Dolly Out | 揭示环境、疏离 | 孤独、宏观 | dolly out, pull back |
| **摇** | Pan | 跟随动作、展示空间 | 流畅、探索 | panning, horizontal movement |
| **移** | Truck | 跟随角色、平行叙事 | 陪伴、对比 | trucking shot, lateral movement |
| **升降** | Crane | 视角转换、史诗感 | 升华、震撼 | crane shot, vertical movement |
| **跟** | Tracking | 跟随主体、沉浸感 | 紧张、参与 | tracking shot, following |
| **手持** | Handheld | 纪实感、混乱 | 紧张、真实 | handheld, shaky cam |
| **变焦** | Zoom | 快速强调、复古 | 突兀、发现 | zoom, rack focus |

## 艺术风格库（20+风格）

### 写实风格

| 风格 | 关键词 | 特点 | 适用 |
|------|--------|------|------|
| **电影写实** | cinematic, photorealistic, 8K, film grain, cinematic lighting | 电影质感、胶片颗粒 | 电影概念、短剧 |
| **摄影写实** | DSLR photography, 85mm lens, f/1.8, professional photography | 摄影效果、景深虚化 | 人像、时尚 |
| **油画写实** | oil painting, classical, Renaissance, chiaroscuro | 古典油画、明暗对比 | 艺术、历史 |
| **数字写实** | digital painting, hyperrealistic, detailed, ArtStation | 数字绘画、超写实 | 游戏概念、插画 |

### 动漫风格

| 风格 | 关键词 | 特点 | 适用 |
|------|--------|------|------|
| **日系赛璐璐** | anime style, cel shaded, vibrant colors, clean lines | 赛璐璐、平涂、鲜艳 | 二次元、轻小说 |
| **吉卜力** | Studio Ghibli, Hayao Miyazaki style, soft colors | 柔和色彩、手绘感 | 治愈、奇幻 |
| **新海诚** | Makoto Shinkai style, detailed backgrounds, sky | 精细背景、天空 | 唯美、青春 |
| **京都动画** | Kyoto Animation style, moe, detailed eyes | 萌系、大眼 | 校园、恋爱 |
| **美式卡通** | cartoon, Disney style, 3D render, Pixar style | 3D卡通、皮克斯 | 儿童、家庭 |
| **美式漫画** | comic book style, Marvel, DC, bold lines, halftone | 粗线条、网点 | 超级英雄 |

### 游戏风格

| 风格 | 关键词 | 特点 | 适用 |
|------|--------|------|------|
| **概念艺术** | concept art, game art, ArtStation trending, design sheet | 设计感、功能性 | 游戏设计 |
| **像素艺术** | pixel art, retro game style, 16-bit, 8-bit | 复古像素 | 独立游戏 |
| **低多边形** | low poly, 3D render, stylized, flat shading | 低面、风格化 | 休闲游戏 |
| **手绘风格** | hand drawn, sketch, watercolor, ink | 手绘质感、水彩 | 独立游戏、艺术 |

### 特殊风格

| 风格 | 关键词 | 特点 | 适用 |
|------|--------|------|------|
| **赛博朋克** | cyberpunk, neon lights, dystopian, futuristic, rain | 霓虹灯、未来都市 | 科幻、未来 |
| **蒸汽朋克** | steampunk, brass gears, Victorian, airships | 黄铜齿轮、维多利亚 | 复古科幻 |
| **柴油朋克** | dieselpunk, industrial, 1940s, military | 工业、军事 | 战争、机械 |
| **原子朋克** | atompunk, 1950s, retro futuristic, nuclear | 50年代、原子能 | 复古未来 |
| **生物朋克** | biopunk, organic, genetic, living technology | 有机、生物技术 | 生物科技 |
| ** solar朋克** | solarpunk, green, sustainable, optimistic future | 绿色、可持续 | 环保、乌托邦 |
| **水墨风** | ink wash painting, Chinese traditional, sumi-e | 水墨、东方美学 | 国风、武侠 |
| **浮世绘** | ukiyo-e, Japanese woodblock print, Hokusai | 浮世绘、木版画 | 日式传统 |
| **装饰艺术** | Art Deco, 1920s, geometric, elegant | 几何、优雅 | 复古、奢华 |
| **波普艺术** | pop art, Andy Warhol, bold colors, comic | 大胆色彩、漫画 | 现代、流行 |

## 光影系统

### 光位类型

| 光位 | 英文 | 效果 | 情绪 | AI关键词 |
|------|------|------|------|----------|
| **正面光** | Front Lighting | 明亮、清晰、展示 | 开放、诚实 | front lighting, flat lighting |
| **侧光** | Side Lighting | 立体、质感、戏剧 | 神秘、严肃 | side lighting, chiaroscuro |
| **逆光** | Back Lighting | 轮廓、神秘、神圣 | 超凡、隔离 | back lighting, rim lighting |
| **顶光** | Top Lighting | 戏剧、压迫、恐怖 | 不安、威胁 | top lighting, overhead light |
| **底光** | Under Lighting | 诡异、恐怖、不安 | 恐惧、疯狂 | under lighting, horror lighting |
| **环境光** | Ambient Lighting | 自然、柔和、真实 | 平静、日常 | ambient lighting, soft lighting |
| **黄金时刻** | Golden Hour | 温暖、浪漫、希望 | 温馨、怀旧 | golden hour, sunset lighting |
| **蓝色时刻** | Blue Hour | 冷静、神秘、忧郁 | 沉思、孤独 | blue hour, twilight |

### 氛围关键词

| 氛围 | 关键词 | 适用场景 |
|------|--------|----------|
| **神秘** | mysterious, enigmatic, foggy, misty | 悬疑、探险 |
| **浪漫** | romantic, dreamy, soft focus, ethereal | 爱情、幻想 |
| **紧张** | tense, dramatic, high contrast, noir | 动作、惊悚 |
| **恐怖** | horror, dark, ominous, eerie | 恐怖、生存 |
| **史诗** | epic, grand, majestic, awe-inspiring | 奇幻、战争 |
| **温馨** | cozy, warm, comfortable, peaceful | 日常、治愈 |
| **未来** | futuristic, sci-fi, high-tech, sleek | 科幻、未来 |
| **复古** | vintage, retro, nostalgic, aged | 怀旧、历史 |

## 提示词工程系统

### 基础结构公式

```
[主体描述] + [服装/造型] + [姿势/动作] + [表情/神态] + 
[场景环境] + [镜头语言] + [光影氛围] + [艺术风格] + [技术规格]
```

### 完整示例

```
A young female warrior with long flowing silver hair and piercing blue eyes,
wearing ornate fantasy armor with intricate gold patterns and a red cape,
dynamic battle pose with sword raised high, fierce determined expression,
standing on a mountain peak at sunset with storm clouds gathering,
low angle shot, dramatic side lighting, golden hour with rim light,
detailed digital painting style, ArtStation trending, concept art,
8K resolution, highly detailed, masterpiece, sharp focus, volumetric lighting
```

### 分镜提示词模板

#### 九宫格分镜提示词

```
Character: [角色名], [外貌描述], [服装描述]
Style: [艺术风格], consistent character design
Grid Layout: 3x3 storyboard

Panel 1 (ELS): [角色名] standing in [环境], extreme long shot, establishing scene
Panel 2 (LS): [角色名] full body, entering the scene
Panel 3 (MLS): [角色名] knee-up shot, dynamic pose
Panel 4 (MS): [角色名] waist-up, neutral expression
Panel 5 (MCU): [角色名] chest-up, emotional focus
Panel 6 (CU): [角色名] face close-up, intense expression
Panel 7 (ECU): [角色名] eye extreme close-up, detail
Panel 8 (Low): [角色名] low angle shot, powerful pose
Panel 9 (High): [角色名] high angle shot, vulnerable pose

Consistent features: [特征列表]
Lighting: [光影方案]
Style: [风格关键词]
Technical: 8K, highly detailed, masterpiece
```

## 一致性控制系统

### 角色一致性清单

| 特征 | 必须一致 | 可变 |
|------|----------|------|
| **发型** | 长度、颜色、样式 | 风吹动效果 |
| **发色** | 主色、高光色 | 光照影响 |
| **瞳色** | 主色、瞳孔样式 | 反光效果 |
| **肤色** | 基调 | 光照影响 |
| **面部特征** | 五官比例、痣/疤 | 表情变化 |
| **体型** | 身高、体型 | 姿势角度 |
| **服装** | 款式、颜色、配饰 | 破损/动态 |
| **标志性物品** | 武器、饰品 | 持握方式 |

### 一致性控制提示词

```
Character consistency reference:
- Hair: [详细描述]
- Eyes: [详细描述]
- Face: [详细描述]
- Body: [详细描述]
- Outfit: [详细描述]
- Accessories: [详细描述]

Maintain consistent character design across all panels.
Same character, different angles and poses.
```

## 平台优化指南

### Midjourney 优化

| 参数 | 说明 | 推荐值 |
|------|------|--------|
| `--ar` | 宽高比 | `--ar 16:9`, `--ar 2:3` |
| `--style raw` | 减少美化 | 写实风格推荐 |
| `--s` | 风格化程度 | `--s 50-250` |
| `--c` | 混沌程度 | `--c 10-50` |
| `--q` | 质量 | `--q 2` |
| `--niji` | 动漫模式 | 二次元推荐 |

### Stable Diffusion 优化

| 设置 | 说明 | 推荐值 |
|------|------|--------|
| **Sampler** | 采样器 | DPM++ 2M Karras |
| **Steps** | 步数 | 20-30 |
| **CFG Scale** | 提示词相关性 | 7-9 |
| **Resolution** | 分辨率 | 512×512, 768×768 |
| **Negative Prompt** | 负面提示词 | 必须使用 |

### 负面提示词库

```
通用负面:
ugly, deformed, noisy, blurry, distorted, out of focus, 
bad anatomy, extra limbs, poorly drawn face, poorly drawn hands, 
missing fingers, extra fingers, mutated hands, fused fingers, 
too many fingers, long neck, cross-eyed, mutated, extra nipples

角色负面:
bad face, duplicate, morbid, mutilated, out of frame, 
extra fingers, mutated hands, poorly drawn hands, poorly drawn face, 
mutation, deformed, ugly, blurry, bad anatomy, bad proportions, 
extra limbs, cloned face, disfigured, gross proportions, malformed limbs, 
missing arms, missing legs, extra arms, extra legs, fused fingers, 
too many fingers, long neck, Photoshop, video game, ugly, tiling, 
poorly drawn hands, poorly drawn feet, poorly drawn face, mutation, 
deformed, extra limbs, extra arms, extra legs, malformed limbs, 
fused fingers, too many fingers, long neck, cross-eyed, 
mutated hands, polar lowres, bad face

质量负面:
lowres, bad anatomy, bad hands, text, error, missing fingers, 
extra digit, fewer digits, cropped, worst quality, low quality, 
normal quality, jpeg artifacts, signature, watermark, username, 
blurry, artist name, bad_prompt, bad-artist, bad-hands-5, 
EasyNegative, ng_deepnegative_v1_75t
```

## 调用触发条件

**立即调用此 Skill 当：**

- 需要生成角色多面板展示图
- 创建角色设定集/角色表
- 制作视觉小说/CG素材
- 生成游戏角色资源
- 需要AI绘画提示词工程
- 需要保持角色一致性
- 需要电影级分镜设计
- 需要特定艺术风格生成

## 执行示例

### 示例1：九宫格角色设定

```
用户: "生成一个女战士的九宫格角色设定，赛博朋克风格"

NanoBananaPro Grid Agent 生成:
┌─────────────────────────────────────────────────────────────────┐
│ [角色设定]                                                       │
│ 姓名: 零 (Zero)                                                  │
│ 身份: 赛博朋克雇佣兵                                             │
│ 外貌: 银白短发，机械义眼，霓虹纹身                               │
│ 服装: 黑色战术装甲，发光线条，机械臂                             │
│ 武器: 等离子武士刀                                               │
├─────────────────────────────────────────────────────────────────┤
│ [九宫格分镜]                                                     │
│                                                                  │
│ 第1行 - 环境建立                                                  │
│ ┌──────────────┬──────────────┬──────────────┐                 │
│ │ 1.大远景      │ 2.全景        │ 3.中远景      │                 │
│ │ 霓虹城市全景   │ 零站在天台    │ 战斗姿态      │                 │
│ │ 雨夜、全息广告 │ 逆光剪影      │ 手持光剑      │                 │
│ │ ELS, bird's   │ LS, backlit   │ MLS, dynamic  │                 │
│ └──────────────┴──────────────┴──────────────┘                 │
│                                                                  │
│ 第2行 - 情绪焦点                                                  │
│ ┌──────────────┬──────────────┬──────────────┐                 │
│ │ 4.中景        │ 5.中特写      │ 6.特写        │                 │
│ │ 标准战斗姿态   │ 机械义眼发光  │ 面部特写      │                 │
│ │ 手持武器      │ 情绪焦点      │ 冷酷表情      │                 │
│ │ MS, neutral   │ MCU, side lit │ CU, intense   │                 │
│ └──────────────┴──────────────┴──────────────┘                 │
│                                                                  │
│ 第3行 - 权力展示                                                  │
│ ┌──────────────┬──────────────┬──────────────┐                 │
│ │ 7.大特写      │ 8.仰视        │ 9.俯视        │                 │
│ │ 机械臂细节    │ 悬浮姿态      │ 战胜后场景    │                 │
│ │ 电路纹理      │ 低角度仰拍    │ 高角度俯视    │                 │
│ │ ECU, detail   │ Low angle     │ High angle    │                 │
│ └──────────────┴──────────────┴──────────────┘                 │
├─────────────────────────────────────────────────────────────────┤
│ [提示词]                                                         │
│                                                                  │
│ 基础描述:                                                        │
│ "Zero, female cyberpunk mercenary, short silver hair,            │
│ cybernetic eye with glowing red iris, neon tattoos,              │
│ black tactical armor with glowing cyan lines,                    │
│ mechanical arm, plasma katana"                                   │
│                                                                  │
│ 风格: cyberpunk, neon lights, rain, dystopian city               │
│ 技术: 8K, highly detailed, masterpiece, ArtStation trending      │
│                                                                  │
│ 一致性控制:                                                      │
│ - Hair: short silver hair, undercut style                        │
│ - Eyes: left eye cybernetic red glow, right eye blue             │
│ - Mechanical arm: right arm, exposed circuits, glowing lines     │
│ - Outfit: black tactical armor, cyan neon accents                │
├─────────────────────────────────────────────────────────────────┤
│ [平台优化]                                                       │
│ Midjourney: --ar 1:1 --style raw --s 250                        │
│ SD: Steps 25, CFG 7, DPM++ 2M Karras                             │
└─────────────────────────────────────────────────────────────────┘
```

## 输出保证

- [ ] 宫格布局合理，符合视觉叙事
- [ ] 镜头语言专业，符合电影理论
- [ ] 艺术风格明确，关键词精准
- [ ] 一致性控制到位，角色统一
- [ ] 提示词可直接用于AI绘画
- [ ] 提供平台优化参数
- [ ] 包含负面提示词
- [ ] 支持2/4/6/8/9/12/16宫格

## 进阶功能

### 1. 风格迁移
支持同角色不同风格转换：
- 写实 → 动漫 → 像素 → 油画

### 2. 动态分镜
为每个镜头添加运动描述，可用于动画制作

### 3. 批量生成
支持多角色批量生成，保持世界观一致性

### 4. 参考图模式
支持使用参考图进行风格迁移和角色一致性

---

**记住：每一格都是角色故事的一部分，保持一致性，展现多样性，用镜头语言讲述完整故事！**
